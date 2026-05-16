import { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface MessageItemProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isEditing?: boolean;
  onEdit?: () => void;
  onSaveEdit?: (newContent: string) => void;
  onRegenerate?: () => void;
  onCopy?: (text: string) => void;
}

export default function MessageItem({
  role,
  content,
  timestamp,
  isEditing = false,
  onEdit,
  onSaveEdit,
  onRegenerate,
  onCopy,
}: MessageItemProps) {
  const isUser = role === 'user';
  const timeStr = new Date(timestamp).toLocaleTimeString();
  const editRef = useRef<HTMLTextAreaElement>(null);
  const [editValue, setEditValue] = useState(content);

  // 编辑框自适应高度（包含首次进入编辑的情况）
  useEffect(() => {
    const textarea = editRef.current;
    if (!textarea) return;
    const adjustHeight = () => {
      textarea.style.height = 'auto';
      const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);
      const maxHeight = lineHeight * 12;
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = newHeight + 'px';
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    };
    // 使用 requestAnimationFrame 确保 DOM 更新完毕后再计算
    const raf = requestAnimationFrame(adjustHeight);
    return () => cancelAnimationFrame(raf);
  }, [editValue, isEditing]); // 依赖 isEditing，确保进入编辑时立即调整

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed) {
      onSaveEdit?.(trimmed);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content).catch(console.error);
    onCopy?.(content);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {isEditing ? (
        // 编辑模式
        <div className="max-w-[80%] w-full">
          <div className="relative">
            <textarea
              ref={editRef}
              className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                } else if (e.key === 'Escape') {
                  setEditValue(content);
                  onSaveEdit?.(content);
                }
              }}
              onBlur={handleSave}
              autoFocus
              style={{ minHeight: '44px' }}
            />
            <button
              onClick={handleSave}
              className="absolute bottom-2.5 right-2.5 h-8 w-8 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              title="保存修改"
            >
              ✓
            </button>
          </div>
          <div className="text-right text-xs text-gray-400 mt-1">{timeStr}</div>
        </div>
      ) : isUser ? (
        // 用户消息：保留换行
        <div className="max-w-[80%] rounded-2xl px-4 py-2 shadow bg-blue-100 text-gray-900">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold opacity-75">你</span>
            {onEdit && (
              <button onClick={onEdit} className="ml-2 text-xs opacity-60 hover:opacity-100" title="编辑消息">
                ✏️
              </button>
            )}
          </div>
          <div className="text-sm text-left whitespace-pre-wrap">{content}</div>
          <div className="text-right text-xs opacity-50 mt-1">{timeStr}</div>
        </div>
      ) : (
        // AI 消息：无背景，Markdown 渲染
        <div className="max-w-[80%] w-full">
          <div className="flex items-center mb-1">
            <span className="text-xs font-semibold text-gray-500">AI</span>
          </div>
          <div className="text-sm prose prose-sm max-w-none dark:prose-invert text-left text-gray-900 dark:text-white">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
            <button onClick={handleCopy} className="hover:text-gray-600 dark:hover:text-gray-300 transition" title="复制">
              复制
            </button>
            <button onClick={onRegenerate} className="hover:text-gray-600 dark:hover:text-gray-300 transition" title="重新生成">
              重新生成
            </button>
          </div>
          <div className="text-right text-xs text-gray-400 mt-1">{timeStr}</div>
        </div>
      )}
    </div>
  );
}