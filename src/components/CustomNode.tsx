import { Handle, Position } from 'reactflow';
import { useTreeStore } from '../store/useTreeStore';

interface CustomNodeData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isCurrentPath: boolean;
}

export default function CustomNode({ data }: { data: CustomNodeData }) {
  const switchToNode = useTreeStore((s) => s.switchToNode);
  const preview = data.content
    ? data.content.slice(0, 30) + (data.content.length > 30 ? '...' : '')
    : '(空)';

  const isUser = data.role === 'user';

  return (
    <div className="relative group">
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />

      {/* 节点图标 + 按钮包裹 */}
      <div className="flex items-center gap-1">
        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            border-2 text-lg
            ${isUser ? 'bg-blue-100 border-blue-400' : 'bg-green-100 border-green-400'}
            ${data.isCurrentPath ? 'ring-2 ring-blue-500 shadow-md' : ''}
          `}
        >
          {isUser ? '👤' : '🤖'}
        </div>

        {/* User 节点旁的按钮 */}
        {isUser && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              switchToNode(data.id);
            }}
            title="从这里开始对话"
            className="
              w-5 h-5 rounded-full bg-white border border-gray-300 
              flex items-center justify-center text-xs 
              hover:bg-blue-100 hover:border-blue-400 transition
              opacity-0 group-hover:opacity-100
            "
          >
            ✎
          </button>
        )}
      </div>

      {/* Hover 预览卡片 */}
      <div
        className="
          absolute left-full ml-3 top-0 w-44 p-2 bg-gray-800 text-white
          text-xs rounded opacity-0 group-hover:opacity-100 transition
          pointer-events-none z-10
        "
      >
        <div className="font-bold mb-1">{isUser ? '你' : 'AI'}</div>
        <div className="break-words">{preview}</div>
        <div className="text-gray-400 mt-1">
          {new Date(data.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}