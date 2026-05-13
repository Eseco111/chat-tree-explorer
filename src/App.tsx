import { useTreeStore } from './store/useTreeStore';
import ChatView from './components/ChatView';
import MapView from './components/MapView';
import ViewSwitcher from './components/ViewSwitcher';
import ApiKeySetup from './components/ApiKeySetup';

function App() {
  const viewMode = useTreeStore((s) => s.viewMode);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ApiKeySetup />
      <header className="bg-white shadow p-4 text-center relative">
        <h1 className="text-xl font-bold text-gray-800">对话树浏览器 MVP</h1>
      </header>
      <main className="flex-1 p-4 flex justify-center">
        <div className="w-full max-w-4xl" style={{ height: 'calc(100vh - 8rem)' }}>
          {/* 聊天视图始终挂载，通过 visibility 切换 */}
          <div
            style={{
              height: '100%',
              visibility: viewMode === 'chat' ? 'visible' : 'hidden',
              position: viewMode === 'chat' ? 'relative' : 'absolute',
            }}
          >
            <ChatView />
          </div>
          {/* 全景图始终挂载 */}
          <div
            style={{
              height: '100%',
              visibility: viewMode === 'map' ? 'visible' : 'hidden',
              position: viewMode === 'map' ? 'relative' : 'absolute',
            }}
          >
            <MapView />
          </div>
        </div>
      </main>
      <ViewSwitcher />
    </div>
  );
}

export default App;