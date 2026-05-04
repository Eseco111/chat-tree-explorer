import { useState, useRef, useEffect } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { useStreamReply } from '../hooks/useStreamReply';
import MessageList from './MessageList';

export default function ChatView() {
  const [input, setInput] = useState('');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
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

  // 保存新的 API Key
  const handleApiSave = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem('deepseek-api-key', apiKeyInput.trim());
      // 重新初始化 API 客户端
      import('../lib/api').then(({ initFromStorage }) => {
        initFromStorage();
      });
      setShowApiModal(false);
      setApiKeyInput('');
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-white rounded shadow relative">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <span className="text-sm font-semibold text-gray-600">当前对话</span>
        <button
          onClick={() => setShowApiModal(true)}
          className="text-gray-400 hover:text-gray-600 transition"
          title="修改 API Key"
        >
          ⚙️输入新的 API Key
        </button>
      </div>

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

      {/* 修改 API Key 弹窗 */}
      {showApiModal && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-80">
            <h3 className="text-lg font-bold mb-2">修改 DeepSeek API Key</h3>
            <input
              type="password"
              className="w-full border p-2 rounded mb-3 text-sm"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="输入新的 API Key"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowApiModal(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                取消
              </button>
              <button
                onClick={handleApiSave}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}