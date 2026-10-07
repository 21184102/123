import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Bell,
  Tag,
  Flag,
  AlignLeft,
  Check,
  AlertCircle
} from 'lucide-react';
import { Task, Priority } from '../types';

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Task, syncToCalendar?: boolean) => void;
  categories: string[];
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  categories,
}) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
  const [category, setCategory] = useState(task?.category || '一般');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [dueTime, setDueTime] = useState(task?.dueTime || '');
  const [reminderMinutes, setReminderMinutes] = useState<number | undefined>(
    task?.reminderMinutes !== undefined ? task?.reminderMinutes : 15
  );
  const [hasReminder, setHasReminder] = useState<boolean>(task?.reminderMinutes !== undefined);
  const [syncToCalendar, setSyncToCalendar] = useState<boolean>(Boolean(task?.googleEventId));

  // Sync state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setCategory(task.category || '一般');
      setDueDate(task.dueDate || '');
      setDueTime(task.dueTime || '');
      setHasReminder(task.reminderMinutes !== undefined);
      setReminderMinutes(task.reminderMinutes !== undefined ? task.reminderMinutes : 15);
      setSyncToCalendar(Boolean(task.googleEventId));
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(
      {
        ...task,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category: category.trim() || '一般',
        dueDate: dueDate || undefined,
        dueTime: dueDate && dueTime ? dueTime : undefined,
        reminderMinutes: dueDate && hasReminder ? reminderMinutes : undefined,
        updatedAt: new Date().toISOString(),
      },
      dueDate ? syncToCalendar : false
    );

    onClose();
  };

  // Quick preset shortcuts
  const applyQuickDue = (dayOffset: number, timeStr: string) => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    setDueDate(d.toISOString().slice(0, 10));
    setDueTime(timeStr);
    setHasReminder(true);
  };

  // Check if currently configured time is in the past
  const isPastTime = Boolean(
    dueDate &&
      (() => {
        const timePart = dueTime || '23:59';
        const target = new Date(`${dueDate}T${timePart}:00`);
        return !isNaN(target.getTime()) && target.getTime() < Date.now();
      })()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 text-base">編輯待辦事項</h3>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
              時間與提醒設定
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-sm overflow-y-auto flex-1">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">任務名稱 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={500}
              placeholder="輸入任務名稱..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>詳細備註</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="任務細節說明..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-none"
            />
          </div>

          {/* Due Date & Time Section (Key Request) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>到期時間設定</span>
              </div>
              {/* Quick presets */}
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <button
                  type="button"
                  onClick={() => applyQuickDue(0, '18:00')}
                  className="hover:text-indigo-600 underline cursor-pointer"
                >
                  今天 18:00
                </button>
                <span>・</span>
                <button
                  type="button"
                  onClick={() => applyQuickDue(1, '09:00')}
                  className="hover:text-indigo-600 underline cursor-pointer"
                >
                  明天 09:00
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">截止日期</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>精確到期時間 (可選)</span>
                </label>
                <input
                  type="time"
                  value={dueTime}
                  disabled={!dueDate}
                  onChange={(e) => setDueTime(e.target.value)}
                  placeholder="HH:mm"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
            </div>

            {/* Overdue Warning Alert */}
            {isPastTime && (
              <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shrink-0" />
                <span>
                  注意：設定之截止時間已在過去。若任務未完成，儲存後介面將顯示<strong>醒目紅點警示</strong>。
                </span>
              </div>
            )}

            {/* Reminder Configuration */}
            {dueDate && (
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasReminder}
                      onChange={(e) => setHasReminder(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <Bell className="w-3.5 h-3.5 text-indigo-600" />
                    <span>開啟任務提醒</span>
                  </label>
                </div>

                {hasReminder && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">提醒時機：</span>
                    <select
                      value={reminderMinutes}
                      onChange={(e) => setReminderMinutes(Number(e.target.value))}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    >
                      <option value={0}>到期當下提醒</option>
                      <option value={15}>到期前 15 分鐘</option>
                      <option value={30}>到期前 30 分鐘</option>
                      <option value={60}>到期前 1 小時</option>
                      <option value={1440}>到期前 1 天</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Google Calendar & Gmail Reminder Integration */}
            {dueDate && (
              <div className="p-3 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border border-blue-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-blue-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncToCalendar}
                      onChange={(e) => setSyncToCalendar(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>同步至 Google 行事曆（啟用手機推播與 Gmail 提醒信）</span>
                  </label>
                </div>
                <p className="text-[11px] text-blue-700/90 leading-relaxed">
                  將在您的 Google 日曆建立行程，並自動設定彈出推播與 Gmail 信箱通知，時間到達時自動發送！
                </p>
                {task?.googleEventLink && (
                  <div className="pt-1">
                    <a
                      href={task.googleEventLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-medium text-indigo-700 hover:text-indigo-900 underline inline-flex items-center gap-1"
                    >
                      <span>📅 已連結 Google 行事曆行程 (點擊在新分頁開啟)</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Priority & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-medium text-slate-700">
                <Flag className="w-3.5 h-3.5 text-slate-400" />
                <span>優先級</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              >
                <option value="low">低優先級</option>
                <option value="medium">中優先級</option>
                <option value="high">高優先級</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-medium text-slate-700">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>分類標籤</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                maxLength={50}
                placeholder="分類名稱"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>儲存變更</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
