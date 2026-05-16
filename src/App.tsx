import { useEffect, useState } from 'react';
import { useTreeStore } from './store/useTreeStore';
import ChatView from './components/ChatView';
import MapView from './components/MapView';
import ViewSwitcher from './components/ViewSwitcher';
import Sidebar from './components/Sidebar';
import ModelSelector from './components/ModelSelector';
import ModelSetupModal from './components/ModelSetupModal';

function App() {
  const viewMode = useTreeStore((s) => s.viewMode);
  const setViewMode = useTreeStore((s) => s.setViewMode);
  const activeId = useTreeStore((s) => s.activeId);
  const sidebarCollapsed = useTreeStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useTreeStore((s) => s.toggleSidebar);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 快捷键 M
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setViewMode(viewMode === 'chat' ? 'map' : 'chat');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [viewMode, setViewMode]);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden relative">
      <ModelSetupModal />

      {/* 桌面端侧边栏：根据折叠状态显示/隐藏 */}
      <div className="hidden md:block">
        {!sidebarCollapsed && <Sidebar onClose={toggleSidebar} />}
      </div>

      {/* 移动端浮层侧边栏 */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 h-full">
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-12 flex items-center justify-between px-3 md:px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* 移动端汉堡按钮 */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-gray-600 dark:text-gray-300"
            >
              ☰
            </button>
            {/* 桌面端：侧边栏折叠时显示展开按钮 */}
            {sidebarCollapsed && (
              <button
                onClick={toggleSidebar}
                className="hidden md:block text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ☰
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 md:gap-3">
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
            <div className="flex items-center justify-center h-full px-4">
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