import { useState } from 'react';
import { Handle, Position, NodeToolbar } from 'reactflow';
import { useTreeStore } from '../store/useTreeStore';

interface CustomNodeData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isCurrentPath: boolean;
  isLeaf: boolean;
  childrenIds?: string[];
}

// 去Markdown标记（保留中文和字母数字等）
function stripMarkdown(text: string): string {
  return text
    // 移除 Markdown 图片和链接语法
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    // 移除行首的标题标记（#、##、### 等）
    .replace(/^\s*#{1,6}\s+/gm, '')
    // 移除常见的 emphasis 标记（**，__，*，_）
    .replace(/(\*{1,3}|_{1,3})/g, '')
    // 移除行内代码和代码块标记
    .replace(/`+/g, '')
    // 移除块引用标记 >
    .replace(/^\s*>\s+/gm, '')
    // 移除无序列表标记 - + *
    .replace(/^\s*[-+*]\s+/gm, '')
    // 移除数字列表标记 1.
    .replace(/^\s*\d+\.\s+/gm, '')
    // 移除水平分割线
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    // 将连续空白字符压缩为一个空格
    .replace(/\s+/g, ' ')
    .trim();
}

export default function CustomNode({ data }: { data: CustomNodeData }) {
  const switchToNode = useTreeStore((s) => s.switchToNode);
  const [isHovered, setIsHovered] = useState(false);

  // 预览内容：去除 Markdown 格式，限制长度
  const preview = data.content
    ? (() => {
        const cleaned = stripMarkdown(data.content);
        return cleaned.length > 30 ? cleaned.slice(0, 30) + '...' : cleaned;
      })()
    : '(空)';

  const isUser = data.role === 'user';
  const showActionButton = isUser || data.isLeaf;

  return (
    <div
      className="relative overflow-visible group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />

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

        {showActionButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              switchToNode(data.id);
            }}
            title={isUser ? '从这里开始对话' : '继续对话'}
            className="
              w-5 h-5 rounded-full bg-white border border-gray-300 
              flex items-center justify-center text-xs 
              opacity-0 group-hover:opacity-100 hover:bg-blue-100 hover:border-blue-400 transition
            "
          >
            ✎
          </button>
        )}
      </div>

      <NodeToolbar isVisible={isHovered} position={Position.Right} offset={10}>
        <div className="w-44 p-2 bg-gray-800 text-white text-xs rounded shadow-lg" style={{ whiteSpace: 'normal' }}>
          <div className="font-bold mb-1">{isUser ? '你' : 'AI'}</div>
          <div className="break-words">{preview}</div>
          <div className="text-gray-400 mt-1">
            {new Date(data.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </NodeToolbar>
    </div>
  );
}