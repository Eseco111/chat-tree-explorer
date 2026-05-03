import ReactMarkdown from 'react-markdown';

interface MessageItemProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isEditing?: boolean;
  onEdit?: () => void;
  onSaveEdit?: (newContent: string) => void;
}

export default function MessageItem({
  role,
  content,
  timestamp,
  isEditing = false,
  onEdit,
  onSaveEdit,
}: MessageItemProps) {
  const isUser = role === 'user';
  const timeStr = new Date(timestamp).toLocaleTimeString();

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2 shadow ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold opacity-75">
            {isUser ? '你' : 'AI'}
          </span>
          {isUser && onEdit && !isEditing && (
            <button
              onClick={onEdit}
              className="ml-2 text-xs opacity-60 hover:opacity-100"
              title="编辑消息"
            >
              ✏️
            </button>
          )}
        </div>

        {isEditing ? (
          <textarea
            className="w-full bg-white text-gray-900 p-1 rounded text-sm"
            defaultValue={content}
            onBlur={(e) => onSaveEdit?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSaveEdit?.(e.currentTarget.value);
              }
            }}
            autoFocus
          />
        ) : (
          <div className="text-sm prose prose-sm max-w-none dark:prose-invert text-left">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}

        <div className="text-right text-xs opacity-50 mt-1">{timeStr}</div>
      </div>
    </div>
  );
}