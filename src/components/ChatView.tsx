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

  const handleEditSave = async (nodeId: string, newContent: string) => {
    const trimmed = newContent.trim();
    if (!trimmed || trimmed === tree.nodes[nodeId]?.content) {
      setEditingNodeId(null);
      return;
    }
    setEditingNodeId(null);
    editMessage(nodeId, trimmed);
    await generate();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4">
          <MessageList
            messages={currentMessages}
            editingNodeId={editingNodeId}
            onEditStart={handleEditStart}
            onEditSave={handleEditSave}
          />
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-2 items-center">
          <textarea
            className="flex-1 h-11 resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGenerating ? 'AI 正在回复...' : '输入消息，Enter 发送'}
            disabled={isGenerating}
          />
          <button
            onClick={handleSend}
            disabled={isGenerating || !input.trim()}
            className="h-11 px-5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition flex-shrink-0 flex items-center justify-center"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}