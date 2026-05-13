import { useTreeStore } from './store/useTreeStore';
import ChatView from './components/ChatView';
import MapView from './components/MapView';
import ViewSwitcher from './components/ViewSwitcher';
import ApiKeySetup from './components/ApiKeySetup';
import Sidebar from './components/Sidebar';

function App() {
  const viewMode = useTreeStore((s) => s.viewMode);

  return (
    <div className="flex h-screen bg-gray-100">
      <ApiKeySetup />
      {/* 左侧边栏 */}
      <Sidebar />

      {/* 右侧主区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow p-3 text-center relative flex-shrink-0">
          <h1 className="text-lg font-bold text-gray-800">对话树浏览器 MVP</h1>
          {/* 视图切换按钮放到标题栏右侧 */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <ViewSwitcher />
          </div>
        </header>
        <main className="flex-1 p-4 overflow-hidden">
          <div className="w-full max-w-4xl mx-auto h-full">
            {/* 用 CSS 切换而非常规挂载，以保持 MapView 状态 */}
            <div style={{ display: viewMode === 'chat' ? 'block' : 'none', height: '100%' }}>
              <ChatView />
            </div>
            <div style={{ display: viewMode === 'map' ? 'block' : 'none', height: '100%' }}>
              <MapView />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;