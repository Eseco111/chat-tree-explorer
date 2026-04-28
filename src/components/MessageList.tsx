import type { MessageNode } from '../types';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: MessageNode[];
  editingNodeId: string | null;
  onEditStart: (nodeId: string) => void;
  onEditSave: (nodeId: string, newContent: string) => void;
}

export default function MessageList({
  messages,
  editingNodeId,
  onEditStart,
  onEditSave,
}: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          role={msg.role}
          content={msg.content}
          timestamp={msg.timestamp}
          isEditing={editingNodeId === msg.id}
          onEdit={() => onEditStart(msg.id)}
          onSaveEdit={(newContent) => onEditSave(msg.id, newContent)}
        />
      ))}
    </div>
  );
}