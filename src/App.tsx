/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  ListTodo,
  Sparkles,
  Shield,
  CloudOff,
  CloudCheck,
  LogIn,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { TaskInput } from './components/TaskInput';
import { TaskItem } from './components/TaskItem';
import { FilterBar } from './components/FilterBar';
import { EditTaskModal } from './components/EditTaskModal';
import { PrivacyAndShareModal } from './components/PrivacyAndShareModal';
import {
  getLocalTasks,
  persistTask,
  removeTask,
  subscribeToUserTasks,
  saveLocalTasks
} from './services/taskService';
import { Task, TaskFilter, Priority } from './types';
import { isTaskOverdue } from './utils/dateUtils';
import {
  syncTaskToGoogleCalendar,
  deleteTaskFromGoogleCalendar
} from './services/calendarService';

const DEFAULT_CATEGORIES = ['工作', '生活', '學習', '購物', '健康', '個人'];

function TodoApp() {
  const {
    user,
    loading: authLoading,
    isEffectivelyOnline,
    signInWithGoogle,
    pendingSyncCount,
    syncNow,
    getValidAccessToken
  } = useAuth();

  const activeUserId = user ? user.uid : 'guest';

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>(() => getLocalTasks(activeUserId));
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type?: 'info' | 'success' | 'warn' } | null>(null);
  const [, setTick] = useState(0);

  // Periodically refresh every 30 seconds to re-evaluate due times and trigger red dot
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const showNotification = (message: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 3000);
  };

  // Sync / Subscribe to tasks when userId changes or on mount
  useEffect(() => {
    // 1. Immediately load local tasks for instant zero-latency rendering
    const local = getLocalTasks(activeUserId);
    setTasks(local);

    // 2. If user is signed in, subscribe to Firestore real-time updates
    if (user) {
      const unsubscribe = subscribeToUserTasks(
        user.uid,
        (updatedTasks) => {
          setTasks(updatedTasks);
        },
        (error) => {
          console.warn('Firestore subscription notice:', error);
        }
      );

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user, activeUserId]);

  // Check if guest has existing tasks when user signs in, prompt migration
  useEffect(() => {
    if (user) {
      const guestTasks = getLocalTasks('guest');
      if (guestTasks.length > 0) {
        // Automatically migrate guest tasks into user account
        Promise.all(
          guestTasks.map((gt) =>
            persistTask(
              user.uid,
              {
                ...gt,
                id: `migrated_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                userId: user.uid,
              },
              isEffectivelyOnline
            )
          )
        ).then(() => {
          // Clear guest tasks
          saveLocalTasks('guest', []);
          showNotification(`已自動將您在訪客模式建立的 ${guestTasks.length} 筆待辦同步至 Google 帳戶！`, 'success');
        });
      }
    }
  }, [user, isEffectivelyOnline]);

  // Extracted unique categories
  const categories = useMemo(() => {
    const customCats = tasks.map((t) => t.category).filter(Boolean) as string[];
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...customCats]));
  }, [tasks]);

  // Overdue count calculation
  const overdueCount = useMemo(() => {
    return tasks.filter((t) => isTaskOverdue(t)).length;
  }, [tasks]);

  // Filter and search
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        const matchCat = task.category?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      // 2. Category
      if (selectedCategory !== 'all' && task.category !== selectedCategory) {
        return false;
      }

      // 3. Status Filters
      if (filter === 'active') return !task.completed;
      if (filter === 'completed') return task.completed;
      if (filter === 'overdue') return isTaskOverdue(task);
      if (filter === 'high_priority') return task.priority === 'high';
      if (filter === 'today') {
        const today = new Date().toISOString().slice(0, 10);
        return task.dueDate === today;
      }

      return true;
    });
  }, [tasks, filter, searchQuery, selectedCategory]);

  // Handlers
  const handleAddTask = async (taskData: {
    title: string;
    description?: string;
    priority: Priority;
    category: string;
    dueDate?: string;
    dueTime?: string;
    reminderMinutes?: number;
  }) => {
    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: activeUserId,
      title: taskData.title,
      description: taskData.description,
      completed: false,
      priority: taskData.priority,
      category: taskData.category,
      dueDate: taskData.dueDate,
      dueTime: taskData.dueTime,
      reminderMinutes: taskData.reminderMinutes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _pendingSync: !isEffectivelyOnline,
    };

    // Optimistic UI update
    setTasks((prev) => [newTask, ...prev]);

    try {
      await persistTask(activeUserId, newTask, isEffectivelyOnline);
      if (!isEffectivelyOnline) {
        showNotification('已儲存至離線資料庫，恢復連線後將自動同步', 'info');
      } else {
        showNotification('已新增任務並同步至雲端', 'success');
      }
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const updated: Task = {
      ...task,
      completed: !task.completed,
      updatedAt: new Date().toISOString(),
      _pendingSync: !isEffectivelyOnline,
    };

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));

    try {
      await persistTask(activeUserId, updated, isEffectivelyOnline);
    } catch (err) {
      console.error('Failed to update task completion:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);

    // If task has Google Calendar event, confirm before deleting per Workspace guidelines
    if (targetTask?.googleEventId) {
      const confirmCalendarDelete = window.confirm(
        '此任務已同步至 Google 行事曆，是否同時從 Google 日曆刪除對應行程？'
      );
      if (confirmCalendarDelete) {
        try {
          const token = await getValidAccessToken();
          if (token) {
            await deleteTaskFromGoogleCalendar(targetTask.googleEventId, token);
          }
        } catch (err) {
          console.warn('Could not delete calendar event:', err);
        }
      }
    }

    // Optimistic update
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await removeTask(activeUserId, taskId, isEffectivelyOnline);
      showNotification('任務已刪除', 'info');
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleSaveEditedTask = async (updated: Task, syncToCalendar?: boolean) => {
    let taskToSave = updated;

    if (syncToCalendar && updated.dueDate) {
      try {
        const token = await getValidAccessToken();
        if (token) {
          showNotification('正在同步至 Google 行事曆...', 'info');
          const { eventId, htmlLink } = await syncTaskToGoogleCalendar(updated, token);
          taskToSave = {
            ...updated,
            googleEventId: eventId,
            googleEventLink: htmlLink,
          };
          showNotification('已成功建立 Google 行事曆行程（已設定 Gmail 與手機提醒）！', 'success');
        } else {
          showNotification('未取得日曆授權權限，僅儲存於待辦清單', 'warn');
        }
      } catch (err) {
        console.error('Failed to sync to Google Calendar:', err);
        showNotification('行事曆同步失敗，任務仍已儲存至待辦清單', 'warn');
      }
    }

    setTasks((prev) => prev.map((t) => (t.id === taskToSave.id ? taskToSave : t)));

    try {
      await persistTask(activeUserId, taskToSave, isEffectivelyOnline);
      if (!syncToCalendar) {
        showNotification('變更已儲存', 'success');
      }
    } catch (err) {
      console.error('Failed to save edited task:', err);
    }
  };

  const handleCompleteAll = async () => {
    const uncompleted = tasks.filter((t) => !t.completed);
    if (uncompleted.length === 0) return;

    const nextTasks = tasks.map((t) => ({
      ...t,
      completed: true,
      updatedAt: new Date().toISOString(),
    }));
    setTasks(nextTasks);

    for (const t of uncompleted) {
      await persistTask(activeUserId, { ...t, completed: true }, isEffectivelyOnline);
    }
    showNotification(`已將 ${uncompleted.length} 項任務標記為完成`, 'success');
  };

  const handleClearCompleted = async () => {
    const completedTasks = tasks.filter((t) => t.completed);
    if (completedTasks.length === 0) return;

    setTasks((prev) => prev.filter((t) => !t.completed));

    for (const t of completedTasks) {
      await removeTask(activeUserId, t.id, isEffectivelyOnline);
    }
    showNotification(`已清除 ${completedTasks.length} 項已完成任務`, 'info');
  };

  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans antialiased flex flex-col">
      {/* Top Header */}
      <Header
        onOpenPrivacyShare={() => setIsPrivacyModalOpen(true)}
        overdueCount={overdueCount}
        onSelectOverdue={() => setFilter('overdue')}
      />

      {/* Floating Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : notification.type === 'warn'
              ? 'bg-amber-900 text-white border-amber-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Guest Mode Banner (if not logged in) */}
        {!user && !authLoading && (
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-indigo-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-white/10 rounded-lg text-indigo-200">
                  <Shield className="w-4 h-4" />
                </span>
                <h3 className="font-semibold text-sm sm:text-base">
                  您目前使用本機離線模式
                </h3>
              </div>
              <p className="text-xs text-indigo-200 leading-relaxed max-w-xl">
                離線編輯之內容將完整儲存在此瀏覽器中。登入 Google 帳號可享有專屬個人的<strong>安全雲端隔離庫</strong>，關閉重開自動保留，且換電腦或手機也能同步！
              </p>
            </div>
            <button
              onClick={() => signInWithGoogle()}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-indigo-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition shrink-0 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-indigo-600" />
              <span>使用 Google 登入</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* User Space Banner (if logged in) */}
        {user && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 px-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-600">
                目前登入：<strong className="text-slate-800">{user.email}</strong>
              </span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="text-emerald-700 font-medium hidden sm:inline flex items-center gap-1">
                🔒 雲端資料庫已加密劃分（僅您本人可見）
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-500">
              {pendingSyncCount > 0 ? (
                <button
                  onClick={() => syncNow()}
                  className="text-amber-700 font-medium hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{pendingSyncCount} 筆待同步</span>
                </button>
              ) : (
                <span className="text-slate-500 flex items-center gap-1">
                  <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>資料已是最新版本</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Task Creator Card */}
        <section aria-label="新增待辦">
          <TaskInput onAddTask={handleAddTask} categories={categories} />
        </section>

        {/* Filter and Search Controls */}
        <section aria-label="篩選與搜尋">
          <FilterBar
            currentFilter={filter}
            onFilterChange={setFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            totalCount={tasks.length}
            completedCount={completedCount}
            overdueCount={overdueCount}
            onCompleteAll={handleCompleteAll}
            onClearCompleted={handleClearCompleted}
          />
        </section>

        {/* Task Items List */}
        <section aria-label="待辦清單列表" className="space-y-2.5">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteTask}
                onEdit={(t) => setEditingTask(t)}
              />
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center mx-auto">
                <ListTodo className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base">
                  {tasks.length === 0
                    ? '尚無任何待辦事項'
                    : '沒有符合篩選條件的任務'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {tasks.length === 0
                    ? '在上方輸入框輸入事項並按下 Enter 即可開始記錄！關閉瀏覽器也能完整保存。'
                    : '嘗試調整搜尋字詞或切換至「全部」檢視所有項目。'}
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={Boolean(editingTask)}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveEditedTask}
        categories={categories}
      />

      {/* Privacy and Share Modal */}
      <PrivacyAndShareModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        tasks={tasks}
        userEmail={user?.email || null}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/60 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            雲端與離線待辦清單・支援 Google 帳號安全登入與離線離網管理
          </span>
          <span className="text-[11px] text-slate-400">
            資料在關閉視窗後安全保留・恢復網路自動同步更新
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TodoApp />
    </AuthProvider>
  );
}
