import { useState, useRef, useEffect } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { useStreamReply } from '../hooks/useStreamReply';
import MessageList from './MessageList';

export default function ChatView() {
  const [input, setInput] = useState('');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tree = useTreeStore((s) => s.tree);
  const sendMessage = useTreeStore((s) => s.sendMessage);
  const editMessage = useTreeStore((s) => s.editMessage);
  const { generate, isGenerating } = useStreamReply();

  const currentMessages = tree.currentPath
    .map((id) => tree.nodes[id])
    .filter(
      (n) => n && (n.role === 'user' || n.role === 'assistant') && n.content !== undefined
    );

  const lastContent = currentMessages[currentMessages.length - 1]?.content ?? '';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length, lastContent]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    const content = input.trim();
    setInput('');
    sendMessage(content);
    await generate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEditStart = (nodeId: string) => {
    const node = tree.nodes[nodeId];
    if (node && node.role === 'user' && !isGenerating) {
      setEditingNodeId(nodeId);
    }
  };

  // 改进点：异步保存编辑，内容无变化时不创建分支，编辑后自动触发生成
  const handleEditSave = async (nodeId: string, newContent: string) => {
    const trimmed = newContent.trim();
    // 如果编辑后内容为空，或与原内容完全一致，则放弃修改
    if (!trimmed || trimmed === tree.nodes[nodeId]?.content) {
      setEditingNodeId(null);
      return;
    }
    setEditingNodeId(null);
    editMessage(nodeId, trimmed);
    // 关键：创建新分支后立刻生成 AI 回复，且复用现有生成逻辑
    await generate();
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-white rounded shadow">
      <MessageList
        messages={currentMessages}
        editingNodeId={editingNodeId}
        onEditStart={handleEditStart}
        onEditSave={handleEditSave}
      />
      <div ref={messagesEndRef} />

      <div className="border-t p-3 flex gap-2">
        <textarea
          className="flex-1 resize-none rounded border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isGenerating ? 'AI 正在回复...' : '输入消息，Enter 发送，Shift+Enter 换行'}
          disabled={isGenerating}
        />
        <button
          onClick={handleSend}
          disabled={isGenerating || !input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          发送
        </button>
      </div>
    </div>
  );
}