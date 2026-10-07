export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: Priority;
  category?: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  reminderMinutes?: number; // e.g. 0 (at due), 15, 30, 60
  googleEventId?: string;
  googleEventLink?: string;
  createdAt: string;
  updatedAt: string;
  _pendingSync?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  updatedAt?: string;
}

export type TaskFilter = 'all' | 'active' | 'completed' | 'overdue' | 'high_priority' | 'today';

export interface SyncStats {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
  isSyncing: boolean;
}
