import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Task, Priority } from '../types';

const STORAGE_PREFIX = 'cloud_todo_tasks_';
const QUEUE_PREFIX = 'cloud_todo_sync_queue_';

interface QueuedAction {
  id: string;
  type: 'set' | 'delete';
  task?: Task;
  timestamp: number;
}

// Helper to sanitize task object for Firestore payload to strictly match blueprint
export function sanitizeTaskForFirestore(task: Task): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: String(task.id).slice(0, 128),
    userId: String(task.userId).slice(0, 128),
    title: String(task.title || '').trim().slice(0, 500),
    completed: Boolean(task.completed),
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (task.description && task.description.trim()) {
    payload.description = task.description.trim().slice(0, 2000);
  }
  if (task.priority && ['low', 'medium', 'high'].includes(task.priority)) {
    payload.priority = task.priority;
  }
  if (task.category && task.category.trim()) {
    payload.category = task.category.trim().slice(0, 50);
  }
  if (task.dueDate && task.dueDate.trim()) {
    payload.dueDate = task.dueDate.trim().slice(0, 50);
  }
  if (task.dueTime && task.dueTime.trim()) {
    payload.dueTime = task.dueTime.trim().slice(0, 20);
  }
  if (task.reminderMinutes !== undefined && typeof task.reminderMinutes === 'number') {
    payload.reminderMinutes = task.reminderMinutes;
  }
  if (task.googleEventId && task.googleEventId.trim()) {
    payload.googleEventId = task.googleEventId.trim().slice(0, 256);
  }
  if (task.googleEventLink && task.googleEventLink.trim()) {
    payload.googleEventLink = task.googleEventLink.trim().slice(0, 1024);
  }

  return payload;
}

// Local storage helpers
export function getLocalTasks(userId: string): Task[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read local tasks:', err);
    return [];
  }
}

export function saveLocalTasks(userId: string, tasks: Task[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save local tasks:', err);
  }
}

export function getSyncQueue(userId: string): QueuedAction[] {
  try {
    const raw = localStorage.getItem(`${QUEUE_PREFIX}${userId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSyncQueue(userId: string, queue: QueuedAction[]): void {
  try {
    localStorage.setItem(`${QUEUE_PREFIX}${userId}`, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to save sync queue:', err);
  }
}

export function enqueueAction(userId: string, action: QueuedAction): void {
  const queue = getSyncQueue(userId);
  // Remove duplicate queued actions for the same task
  const filtered = queue.filter(q => q.id !== action.id);
  filtered.push(action);
  saveSyncQueue(userId, filtered);
}

// Synchronize pending queue to Firestore
export async function flushSyncQueue(
  userId: string,
  onStatusChange?: (pendingCount: number) => void
): Promise<void> {
  if (!userId || userId === 'guest') return;
  const queue = getSyncQueue(userId);
  if (queue.length === 0) {
    onStatusChange?.(0);
    return;
  }

  const remaining: QueuedAction[] = [];
  for (const action of queue) {
    try {
      const taskDocRef = doc(db, 'users', userId, 'tasks', action.id);
      if (action.type === 'delete') {
        await deleteDoc(taskDocRef);
      } else if (action.type === 'set' && action.task) {
        const payload = sanitizeTaskForFirestore(action.task);
        await setDoc(taskDocRef, payload);
      }
    } catch (err) {
      console.warn(`Error syncing queued action for ${action.id}:`, err);
      remaining.push(action);
    }
  }

  saveSyncQueue(userId, remaining);
  onStatusChange?.(remaining.length);
}

// Subscribe to real-time updates from Firestore
export function subscribeToUserTasks(
  userId: string,
  onTasksUpdated: (tasks: Task[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe | null {
  if (!userId || userId === 'guest') return null;

  const collectionPath = `users/${userId}/tasks`;
  const tasksCol = collection(db, 'users', userId, 'tasks');

  const unsubscribe = onSnapshot(
    tasksCol,
    (snapshot) => {
      const remoteTasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        remoteTasks.push({
          id: docSnap.id,
          userId: data.userId || userId,
          title: data.title || '',
          description: data.description || '',
          completed: Boolean(data.completed),
          priority: (data.priority as Priority) || 'medium',
          category: data.category || '一般',
          dueDate: data.dueDate || '',
          dueTime: data.dueTime || '',
          reminderMinutes: typeof data.reminderMinutes === 'number' ? data.reminderMinutes : undefined,
          googleEventId: data.googleEventId || undefined,
          googleEventLink: data.googleEventLink || undefined,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });

      // Sort by creation date descending by default
      remoteTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Merge with any locally pending items if not yet committed
      const queue = getSyncQueue(userId);
      const pendingIds = new Set(queue.map(q => q.id));

      const merged = remoteTasks.map(t => ({
        ...t,
        _pendingSync: pendingIds.has(t.id),
      }));

      // Cache locally
      saveLocalTasks(userId, merged);
      onTasksUpdated(merged);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, collectionPath);
      onError?.(err);
    }
  );

  return unsubscribe;
}

// Direct save task
export async function persistTask(
  userId: string,
  task: Task,
  isEffectivelyOnline: boolean
): Promise<void> {
  const localTasks = getLocalTasks(userId);
  const existingIdx = localTasks.findIndex(t => t.id === task.id);
  const updatedTask = {
    ...task,
    updatedAt: new Date().toISOString(),
    _pendingSync: !isEffectivelyOnline,
  };

  let nextTasks: Task[];
  if (existingIdx >= 0) {
    nextTasks = [...localTasks];
    nextTasks[existingIdx] = updatedTask;
  } else {
    nextTasks = [updatedTask, ...localTasks];
  }
  saveLocalTasks(userId, nextTasks);

  if (userId === 'guest') return;

  if (isEffectivelyOnline) {
    const taskPath = `users/${userId}/tasks/${task.id}`;
    try {
      const payload = sanitizeTaskForFirestore(updatedTask);
      await setDoc(doc(db, 'users', userId, 'tasks', task.id), payload);
    } catch (err) {
      console.warn('Network error persisting task to Firestore, enqueuing:', err);
      enqueueAction(userId, {
        id: task.id,
        type: 'set',
        task: updatedTask,
        timestamp: Date.now(),
      });
      handleFirestoreError(err, OperationType.WRITE, taskPath);
    }
  } else {
    // Queued for offline sync
    enqueueAction(userId, {
      id: task.id,
      type: 'set',
      task: updatedTask,
      timestamp: Date.now(),
    });
  }
}

// Direct delete task
export async function removeTask(
  userId: string,
  taskId: string,
  isEffectivelyOnline: boolean
): Promise<void> {
  const localTasks = getLocalTasks(userId);
  const nextTasks = localTasks.filter(t => t.id !== taskId);
  saveLocalTasks(userId, nextTasks);

  if (userId === 'guest') return;

  if (isEffectivelyOnline) {
    const taskPath = `users/${userId}/tasks/${taskId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
    } catch (err) {
      console.warn('Network error deleting task from Firestore, enqueuing:', err);
      enqueueAction(userId, {
        id: taskId,
        type: 'delete',
        timestamp: Date.now(),
      });
      handleFirestoreError(err, OperationType.DELETE, taskPath);
    }
  } else {
    enqueueAction(userId, {
      id: taskId,
      type: 'delete',
      timestamp: Date.now(),
    });
  }
}
