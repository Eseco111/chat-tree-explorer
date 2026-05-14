import { useTreeStore } from './store/useTreeStore';
import ChatView from './components/ChatView';
import MapView from './components/MapView';
import ViewSwitcher from './components/ViewSwitcher';
import Sidebar from './components/Sidebar';
import ModelSelector from './components/ModelSelector';
import ModelSetupModal from './components/ModelSetupModal';

function App() {
  const viewMode = useTreeStore((s) => s.viewMode);
  const activeId = useTreeStore((s) => s.activeId);
  const sidebarCollapsed = useTreeStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useTreeStore((s) => s.toggleSidebar);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
      <ModelSetupModal />
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            {sidebarCollapsed && (
              <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                ☰
              </button>
            )}
            <h1 className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
              {activeId ? '对话树浏览器' : ''}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ModelSelector />
            {activeId && <ViewSwitcher />}
          </div>
        </header>

        <main className="flex-1 min-h-0">
          {activeId ? (
            <>
              <div style={{ display: viewMode === 'chat' ? 'block' : 'none' }} className="h-full">
                <ChatView />
              </div>
              <div style={{ display: viewMode === 'map' ? 'block' : 'none' }} className="h-full">
                <MapView />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <p className="text-2xl mb-2">📭</p>
                <p className="text-sm">新建或选择一个对话开始</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;