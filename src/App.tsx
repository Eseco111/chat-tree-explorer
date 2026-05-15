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
  const activeId = useTreeStore((s) => s.activeId);
  const sidebarCollapsed = useTreeStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useTreeStore((s) => s.toggleSidebar);
  const setViewMode = useTreeStore((s) => s.setViewMode);

  // 移动端侧边栏开关（独立于桌面端的折叠状态）
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 快捷键 M（仅桌面端或非输入状态）
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
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

      {/* 桌面端侧边栏（md及以上显示） */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* 移动端浮层侧边栏 */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* 遮罩 */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 h-full">
            <Sidebar />
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* 顶部栏：移动端显示汉堡按钮，桌面端在折叠时才显示 */}
        <header className="h-12 flex items-center justify-between px-3 md:px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0 safe-top">
          <div className="flex items-center gap-2">
            {/* 移动端汉堡 */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-gray-600 dark:text-gray-300"
            >
              ☰
            </button>
            {/* 桌面端折叠按钮（仅在侧边栏收起时显示） */}
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