import { useState, useRef, useEffect } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { useStreamReply } from '../hooks/useStreamReply';
import MessageList from './MessageList';

export default function ChatView() {
  const [input, setInput] = useState('');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const tree = useTreeStore((s) => s.tree);
  const sendMessage = useTreeStore((s) => s.sendMessage);
  const editMessage = useTreeStore((s) => s.editMessage);
  const regenerateLastAssistant = useTreeStore((s) => s.regenerateLastAssistant);
  const { generate, isGenerating } = useStreamReply();

  const currentMessages = tree.currentPath
    .map((id) => tree.nodes[id])
    .filter(
      (n) => n && (n.role === 'user' || n.role === 'assistant') && n.content !== undefined
    );


  // 监听用户手动滚动，记录是否在底部
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // 当消息数量变化时（新消息），非流式状态则直接滚动到底
  useEffect(() => {
    if (!isGenerating) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages.length, isGenerating]);

  // 流式生成时，如果用户在底部则持续滚动到底
  useEffect(() => {
    if (!isGenerating) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    let rafId: number;
    const scrollToBottom = () => {
      if (!container) return;
      if (isAtBottomRef.current) {
        container.scrollTop = container.scrollHeight;
      }
      rafId = requestAnimationFrame(scrollToBottom);
    };
    rafId = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(rafId);
  }, [isGenerating]);

  // 自动调整输入框高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);
    const maxHeight = lineHeight * 12;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = newHeight + 'px';
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [input]);

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

  const handleRegenerate = async () => {
    if (isGenerating) return;
    regenerateLastAssistant();
    await generate();
  };

  const handleCopy = () => {
    // 复制已在 MessageItem 中实现，这里可留空
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* 消息流区 – 增加 ref 用于智能滚动 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <MessageList
            messages={currentMessages}
            editingNodeId={editingNodeId}
            onEditStart={handleEditStart}
            onEditSave={handleEditSave}
            onRegenerate={handleRegenerate}
            onCopy={handleCopy}
          />
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 底部输入区域 */}
      <div className="flex-shrink-0 px-4 py-3">
        <div className="max-w-5xl mx-auto relative">
          <textarea
            ref={textareaRef}
            className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGenerating ? 'AI 正在回复...' : '输入消息，Enter 发送'}
            disabled={isGenerating}
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={handleSend}
            disabled={isGenerating || !input.trim()}
            className="absolute bottom-2.5 right-2.5 h-8 w-8 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition"
            title="发送"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}