import React from 'react';
import {
  Search,
  X,
  Filter,
  CheckCheck,
  Trash,
  Tag,
  AlertCircle
} from 'lucide-react';
import { TaskFilter } from '../types';

interface FilterBarProps {
  currentFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  totalCount: number;
  completedCount: number;
  overdueCount: number;
  onCompleteAll: () => void;
  onClearCompleted: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  currentFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  totalCount,
  completedCount,
  overdueCount,
  onCompleteAll,
  onClearCompleted,
}) => {
  const activeCount = totalCount - completedCount;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filters: { key: TaskFilter; label: string; count?: number; isAlert?: boolean }[] = [
    { key: 'all', label: '全部' },
    { key: 'active', label: '進行中', count: activeCount },
    { key: 'overdue', label: '逾期未完成', count: overdueCount, isAlert: overdueCount > 0 },
    { key: 'completed', label: '已完成', count: completedCount },
    { key: 'today', label: '今天截止' },
    { key: 'high_priority', label: '高優先級' },
  ];

  return (
    <div className="space-y-3">
      {/* Search & Categories Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜尋任務名稱、分類或備註..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-44">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full pl-7 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 appearance-none cursor-pointer"
            >
              <option value="all">所有分類標籤</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Filter className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Quick Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-b border-slate-200/80 pb-3">
        {/* Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {filters.map((f) => {
            const isActive = currentFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => onFilterChange(f.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? f.isAlert
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-900 text-white shadow-2xs'
                    : f.isAlert
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                {/* Red dot indicator in filter tab */}
                {f.isAlert && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                  </span>
                )}
                <span>{f.label}</span>
                {f.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : f.isAlert
                        ? 'bg-rose-200 text-rose-900 font-bold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {f.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Batch actions & progress */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {totalCount > 0 && (
            <div className="hidden md:flex items-center gap-2 font-medium">
              <span>
                進度: {completedCount}/{totalCount}
              </span>
              <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <span className="text-emerald-600 font-semibold">{completionRate}%</span>
            </div>
          )}

          {activeCount > 0 && (
            <button
              onClick={onCompleteAll}
              className="hover:text-indigo-600 transition flex items-center gap-1 cursor-pointer font-medium"
              title="將目前所有待辦標示為已完成"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">全標完成</span>
            </button>
          )}

          {completedCount > 0 && (
            <button
              onClick={onClearCompleted}
              className="hover:text-rose-600 transition flex items-center gap-1 cursor-pointer font-medium"
              title="清除已標示完成的事項"
            >
              <Trash className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">清除已完成</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
