import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  Bell,
  Tag,
  Flag,
  ChevronDown,
  ChevronUp,
  AlignLeft
} from 'lucide-react';
import { Priority } from '../types';

interface TaskInputProps {
  onAddTask: (taskData: {
    title: string;
    description?: string;
    priority: Priority;
    category: string;
    dueDate?: string;
    dueTime?: string;
    reminderMinutes?: number;
  }) => void;
  categories: string[];
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask, categories }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('工作');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const chosenCategory = isCustomCategory && customCategory.trim()
      ? customCategory.trim()
      : category;

    onAddTask({
      title: trimmedTitle,
      description: description.trim() || undefined,
      priority,
      category: chosenCategory || '一般',
      dueDate: dueDate || undefined,
      dueTime: dueDate && dueTime ? dueTime : undefined,
      reminderMinutes: dueDate && hasReminder ? reminderMinutes : undefined,
    });

    setTitle('');
    setDescription('');
    setDueDate('');
    setDueTime('');
    setHasReminder(false);
    setIsExpanded(false);
    setIsCustomCategory(false);
  };

  const setPresetDate = (daysAhead: number, presetTime?: string) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setDueDate(d.toISOString().slice(0, 10));
    if (presetTime) {
      setDueTime(presetTime);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 transition-all">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Main Input Bar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="新增代辦事項... (按下 Enter 即可快速新增)"
            maxLength={500}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-medium text-sm flex items-center gap-1.5 transition shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">新增</span>
          </button>
        </div>

        {/* Expand / Collapse toggle button */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 hover:text-indigo-600 transition font-medium cursor-pointer"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>收合詳細設定</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>展開詳細設定 (優先級、分類、到期時間與提醒、備註)</span>
              </>
            )}
          </button>

          {title.trim() && (
            <span className="text-[11px] text-slate-400">
              按 Enter 鍵直接儲存
            </span>
          )}
        </div>

        {/* Collapsible Options Drawer */}
        {isExpanded && (
          <div className="pt-2 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
            {/* Description textarea */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>詳細備註 (選填)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="添加任務說明、要點清單或相關細節..."
                rows={2}
                maxLength={2000}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-none"
              />
            </div>

            {/* Grid with Priority, Category, Due Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Priority */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-medium text-slate-600">
                  <Flag className="w-3.5 h-3.5 text-slate-400" />
                  <span>優先級</span>
                </label>
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPriority('low')}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      priority === 'low'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    低
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('medium')}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      priority === 'medium'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    中
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('high')}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      priority === 'high'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    高
                  </button>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-medium text-slate-600">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>分類標籤</span>
                </label>
                {isCustomCategory ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="自訂標籤"
                      maxLength={50}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 px-1 cursor-pointer"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategory(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">+ 自訂新分類...</option>
                  </select>
                )}
              </div>

              {/* Due Date & Time */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-medium text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>到期時間</span>
                </label>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
                    />
                    <input
                      type="time"
                      value={dueTime}
                      disabled={!dueDate}
                      onChange={(e) => setDueTime(e.target.value)}
                      placeholder="時間"
                      className="w-24 px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 disabled:opacity-50"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <button
                      type="button"
                      onClick={() => setPresetDate(0, '18:00')}
                      className="hover:text-indigo-600 underline cursor-pointer"
                    >
                      今天 18:00
                    </button>
                    <span>・</span>
                    <button
                      type="button"
                      onClick={() => setPresetDate(1, '09:00')}
                      className="hover:text-indigo-600 underline cursor-pointer"
                    >
                      明天 09:00
                    </button>
                    {dueDate && (
                      <>
                        <span>・</span>
                        <button
                          type="button"
                          onClick={() => {
                            setDueDate('');
                            setDueTime('');
                          }}
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          清除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Reminder Toggle if date selected */}
            {dueDate && (
              <div className="flex items-center justify-between p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <label className="flex items-center gap-2 text-xs font-medium text-indigo-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasReminder}
                    onChange={(e) => setHasReminder(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <Bell className="w-3.5 h-3.5 text-indigo-600" />
                  <span>到期提醒</span>
                </label>
                {hasReminder && (
                  <select
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(Number(e.target.value))}
                    className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-xs text-indigo-950 focus:outline-none"
                  >
                    <option value={0}>到期當下</option>
                    <option value={15}>到期前 15 分鐘</option>
                    <option value={30}>到期前 30 分鐘</option>
                    <option value={60}>到期前 1 小時</option>
                    <option value={1440}>到期前 1 天</option>
                  </select>
                )}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};
