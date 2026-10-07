import React from 'react';
import {
  CheckCircle2,
  Cloud,
  CloudOff,
  RefreshCw,
  LogIn,
  LogOut,
  ShieldCheck,
  Share2,
  Lock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenPrivacyShare: () => void;
  overdueCount?: number;
  onSelectOverdue?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPrivacyShare,
  overdueCount = 0,
  onSelectOverdue
}) => {
  const {
    user,
    loading,
    isOnline,
    isOfflineSimulated,
    isEffectivelyOnline,
    pendingSyncCount,
    isSyncing,
    lastSyncedAt,
    signInWithGoogle,
    signOut,
    toggleOfflineSimulation,
    syncNow
  } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-900 tracking-tight">
                雲端離線待辦
              </h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Cloud & Offline
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <span>Google 帳號獨立私密儲存</span>
              <span className="text-slate-300">•</span>
              <span>斷網編輯自動同步</span>
            </p>
          </div>
        </div>

        {/* Center: Online/Offline & Sync Controller */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Overdue alert badge if overdueCount > 0 */}
          {overdueCount > 0 && (
            <button
              onClick={onSelectOverdue}
              title={`有 ${overdueCount} 項任務已逾期未完成，點擊立即檢視`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition shadow-2xs cursor-pointer animate-pulse"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
              </span>
              <span>{overdueCount} 項已逾期</span>
            </button>
          )}

          {/* Status badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              !isEffectivelyOnline
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : isSyncing
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {!isEffectivelyOnline ? (
              <>
                <CloudOff className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {isOfflineSimulated ? '離線測試模式' : '網路已斷開 (離線)'}
                </span>
              </>
            ) : isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span>雲端同步中...</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span className="flex items-center gap-1">
                  <span>雲端已連線</span>
                  {pendingSyncCount > 0 && (
                    <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {pendingSyncCount} 待同步
                    </span>
                  )}
                </span>
              </>
            )}
          </div>

          {/* Offline Mode Toggle Button */}
          <button
            onClick={toggleOfflineSimulation}
            title={isOfflineSimulated ? '點擊切換為連線模式' : '點擊切換為離線模式進行編輯測試'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              isOfflineSimulated
                ? 'bg-amber-100/80 text-amber-900 border-amber-300 hover:bg-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80'
            }`}
          >
            {isOfflineSimulated ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                <span>恢復連線</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-slate-600" />
                <span>切換離線</span>
              </>
            )}
          </button>

          {/* Sync Trigger button */}
          {user && (
            <button
              onClick={() => syncNow()}
              disabled={isSyncing || !isEffectivelyOnline}
              title={
                !isEffectivelyOnline
                  ? '目前處於離線狀態，恢復連線後將自動同步'
                  : '點擊立即與雲端資料庫雙向同步'
              }
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                isEffectivelyOnline
                  ? 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">立即同步</span>
              {pendingSyncCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>
          )}

          {/* Privacy & Share Modal Button */}
          <button
            onClick={onOpenPrivacyShare}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 text-xs font-medium transition"
            title="查看隱私防護與分享選項"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">隱私與分享</span>
          </button>
        </div>

        {/* Right: User Authentication */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg" />
          ) : user ? (
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/90 pl-1.5 pr-2.5 py-1 rounded-full shadow-2xs">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-white"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight max-w-[120px] sm:max-w-[150px] truncate flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-emerald-600 inline shrink-0" />
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-emerald-700 leading-none">
                  私密個人空間
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="ml-1 p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-full transition"
                title="登出帳號"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs hover:shadow transition"
            >
              <LogIn className="w-4 h-4 text-indigo-300" />
              <span>使用 Google 登入</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
