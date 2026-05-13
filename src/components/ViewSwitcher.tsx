import { useTreeStore } from '../store/useTreeStore';

export default function ViewSwitcher() {
  const viewMode = useTreeStore((s) => s.viewMode);
  const setViewMode = useTreeStore((s) => s.setViewMode);

  const toggle = () => setViewMode(viewMode === 'chat' ? 'map' : 'chat');

  return (
    <button
      onClick={toggle}
      className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 transition"
      title={viewMode === 'chat' ? '切换到全景图' : '切换到对话'}
    >
      {viewMode === 'chat' ? '🗺️ 全景图' : '💬 对话'}
    </button>
  );
}