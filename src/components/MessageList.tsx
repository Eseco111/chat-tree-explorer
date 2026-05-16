import type { MessageNode } from '../types';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: MessageNode[];
  editingNodeId: string | null;
  onEditStart: (nodeId: string) => void;
  onEditSave: (nodeId: string, newContent: string) => void;
  onRegenerate?: () => void;
  onCopy?: (text: string) => void;
}

export default function MessageList({
  messages,
  editingNodeId,
  onEditStart,
  onEditSave,
  onRegenerate,
  onCopy,
}: MessageListProps) {
  return (
    <div className="space-y-2">
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          role={msg.role}
          content={msg.content}
          timestamp={msg.timestamp}
          isEditing={editingNodeId === msg.id}
          onEdit={() => onEditStart(msg.id)}
          onSaveEdit={(newContent) => onEditSave(msg.id, newContent)}
          onRegenerate={msg.role === 'assistant' ? onRegenerate : undefined}
          onCopy={onCopy}
        />
      ))}
    </div>
  );
}