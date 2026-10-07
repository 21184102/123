import React, { useState } from 'react';
import {
  Check,
  Trash2,
  Edit3,
  Calendar,
  Clock,
  Bell,
  Tag,
  Flag,
  CloudOff,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { Task } from '../types';
import { getTaskDueStatus } from '../utils/dateUtils';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onDelete,
  onEdit,
}) => {
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const dueInfo = getTaskDueStatus(task);
  const isOverdue = Boolean(dueInfo?.isOverdue && !task.completed);

  const priorityStyles = {
    high: 'bg-rose-50 text-rose-700 border-rose-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const priorityLabels = {
    high: '高',
    medium: '中',
    low: '低',
  };

  return (
    <div
      className={`group relative bg-white rounded-2xl border transition-all duration-200 p-4 sm:p-4.5 ${
        task.completed
          ? 'border-slate-200/60 bg-slate-50/50 opacity-80'
          : isOverdue
          ? 'border-rose-300/80 bg-rose-50/25 shadow-xs border-l-4 border-l-rose-500'
          : 'border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-indigo-200'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          aria-label={task.completed ? '標記為未完成' : '標記為已完成'}
          className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition shrink-0 cursor-pointer ${
            task.completed
              ? 'bg-emerald-600 text-white shadow-xs'
              : isOverdue
              ? 'border-2 border-rose-400 hover:border-rose-600 bg-white hover:bg-rose-50 text-transparent'
              : 'border-2 border-slate-300 hover:border-indigo-600 bg-white hover:bg-indigo-50/40 text-transparent'
          }`}
        >
          <Check className={`w-4 h-4 stroke-[3] ${task.completed ? 'opacity-100' : 'opacity-0'}`} />
        </button>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center flex-wrap gap-2">
              {/* Eye-catching Red Dot Indicator for Overdue & Incomplete task */}
              {isOverdue && (
                <div
                  title="此任務已超過設定截止時間且尚未完成！"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-bold shadow-2xs animate-pulse"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                  </span>
                  <span>逾期未完成</span>
                </div>
              )}

              <span
                className={`text-sm sm:text-base font-medium break-words leading-snug cursor-pointer select-none transition ${
                  task.completed
                    ? 'line-through text-slate-400 decoration-slate-400 decoration-2'
                    : isOverdue
                    ? 'text-rose-950 font-semibold'
                    : 'text-slate-800'
                }`}
                onClick={() => onToggleComplete(task)}
              >
                {task.title}
              </span>
            </div>

            {/* Quick Actions (Edit, Delete) */}
            <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition shrink-0">
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                title="編輯任務（可調整到期時間與提醒）"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isDeleting) {
                    onDelete(task.id);
                  } else {
                    setIsDeleting(true);
                    setTimeout(() => setIsDeleting(false), 3000);
                  }
                }}
                className={`p-1.5 rounded-lg transition text-xs flex items-center gap-1 cursor-pointer ${
                  isDeleting
                    ? 'bg-rose-100 text-rose-700 font-semibold px-2'
                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                }`}
                title="刪除任務"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting && <span>確定刪除？</span>}
              </button>
            </div>
          </div>

          {/* Badges Row: Due Date/Time, Reminder, Priority, Category, Sync Pending */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
            {/* Due date and time badge */}
            {dueInfo && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium ${
                  isOverdue
                    ? 'bg-rose-100/80 text-rose-800 border-rose-300 font-semibold'
                    : dueInfo.isToday
                    ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {isOverdue ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                ) : task.dueTime ? (
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{dueInfo.displayStr}</span>
              </span>
            )}

            {/* Reminder Badge */}
            {dueInfo?.reminderLabel && !task.completed && (
              <span
                title={dueInfo.reminderLabel}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium"
              >
                <Bell className="w-3 h-3 text-indigo-500" />
                <span>{dueInfo.reminderLabel}</span>
              </span>
            )}

            {/* Google Calendar & Gmail Synced Badge */}
            {task.googleEventLink && (
              <a
                href={task.googleEventLink}
                target="_blank"
                rel="noopener noreferrer"
                title="已同步至 Google 行事曆，點擊可開啟日曆查看此行程與 Gmail 提醒"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-medium transition cursor-pointer"
              >
                <Calendar className="w-3 h-3 text-blue-500" />
                <span>已同步日曆與 Gmail 提醒</span>
              </a>
            )}

            {/* Priority */}
            {task.priority && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium ${
                  priorityStyles[task.priority] || priorityStyles.medium
                }`}
              >
                <Flag className="w-3 h-3" />
                <span>{priorityLabels[task.priority]}優先級</span>
              </span>
            )}

            {/* Category */}
            {task.category && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>{task.category}</span>
              </span>
            )}

            {/* Offline sync pending badge */}
            {task._pendingSync && (
              <span
                title="已安全儲存於本機，恢復雲端連線時將自動同步"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium"
              >
                <CloudOff className="w-3 h-3 text-amber-600" />
                <span>離線暫存待同步</span>
              </span>
            )}

            {/* Notes collapse toggle if description exists */}
            {task.description && (
              <button
                type="button"
                onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 transition cursor-pointer"
              >
                {isNotesExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>收合備註</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>查看備註</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Expanded Notes Box */}
          {task.description && isNotesExpanded && (
            <div className="mt-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed animate-in fade-in duration-150">
              {task.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
