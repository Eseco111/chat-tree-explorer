import { useTreeStore } from '../store/useTreeStore';

export default function ViewSwitcher() {
  const viewMode = useTreeStore((s) => s.viewMode);
  const setViewMode = useTreeStore((s) => s.setViewMode);

  const toggle = () => setViewMode(viewMode === 'chat' ? 'map' : 'chat');

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition"
      title={viewMode === 'chat' ? '切换到全景图' : '切换到对话'}
    >
      {viewMode === 'chat' ? '🗺️' : '💬'}
    </button>
  );
}