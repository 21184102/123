import React, { useState } from 'react';
import {
  ShieldCheck,
  Share2,
  Copy,
  Check,
  Download,
  Lock,
  Eye,
  X,
  FileText
} from 'lucide-react';
import { Task } from '../types';

interface PrivacyAndShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  userEmail: string | null;
}

export const PrivacyAndShareModal: React.FC<PrivacyAndShareModalProps> = ({
  isOpen,
  onClose,
  tasks,
  userEmail,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [includeCompleted, setIncludeCompleted] = useState(false);

  if (!isOpen) return null;

  const filteredTasks = includeCompleted ? tasks : tasks.filter(t => !t.completed);

  // Generate plain text / markdown representation
  const generateMarkdown = () => {
    const title = `# 我的待辦清單 (${new Date().toLocaleDateString('zh-TW')})\n`;
    const userLine = userEmail ? `> 使用者: ${userEmail}\n\n` : '';
    const items = filteredTasks
      .map(
        (t) =>
          `- [${t.completed ? 'x' : ' '}] ${t.title}${
            t.priority ? ` [優先級: ${t.priority === 'high' ? '高' : t.priority === 'medium' ? '中' : '低'}]` : ''
          }${t.category ? ` #${t.category}` : ''}${t.dueDate ? ` (截止: ${t.dueDate})` : ''}${
            t.description ? `\n  - 備註: ${t.description}` : ''
          }`
      )
      .join('\n');
    return `${title}${userLine}${items || '目前沒有待辦事項'}`;
  };

  const handleCopyMarkdown = async () => {
    const text = generateMarkdown();
    await navigator.clipboard.writeText(text);
    setCopiedType('markdown');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownloadBackup = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      userEmail,
      taskCount: tasks.length,
      tasks
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30 text-indigo-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">資料隱私與內容分享</h3>
              <p className="text-xs text-indigo-200">嚴格個人隔離・自主掌控分享</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm max-h-[80vh] overflow-y-auto">
          {/* Privacy Guarantee Box */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-medium">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>雲端資料庫私密防護保證</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              您的代辦清單資料在 Firestore 雲端資料庫中綁定個人專屬 Google 帳號 UID。
              <strong>未經授權的其他人無法窺視、修改或存取您的個人清單</strong>。關閉瀏覽器後重開依然安全保存。
            </p>
          </div>

          {/* Controlled Sharing Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-medium">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>安全分享或匯出清單</span>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCompleted}
                  onChange={(e) => setIncludeCompleted(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                包含已完成事項
              </label>
            </div>
            <p className="text-xs text-slate-500">
              若需要將代辦事項發送給同事、家人或備份，可直接複製純文字或匯出檔案，完全不會公開您的雲端資料庫。
            </p>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-900 font-medium text-xs transition"
              >
                {copiedType === 'markdown' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>已複製到剪貼簿！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-indigo-600" />
                    <span>複製 Markdown 清單</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadBackup}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium text-xs transition"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>匯出 JSON 備份檔</span>
              </button>
            </div>
          </div>

          {/* Preview box */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Eye className="w-3.5 h-3.5" />
              <span>文字匯出預覽 ({filteredTasks.length} 筆)</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700 max-h-36 overflow-y-auto whitespace-pre-wrap">
              {generateMarkdown()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition shadow-xs"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
