import ChatView from './components/ChatView';
import MapView from './components/MapView';
import ViewSwitcher from './components/ViewSwitcher';
import ApiKeySetup from './components/ApiKeySetup';
import { useTreeStore } from './store/useTreeStore';

function App() {
  const viewMode = useTreeStore((s) => s.viewMode);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ApiKeySetup />
      <header className="bg-white shadow p-4 text-center relative">
        <h1 className="text-xl font-bold text-gray-800">对话树浏览器 MVP</h1>
      </header>
      <main className="flex-1 p-4 flex justify-center">
        <div className="w-full max-w-4xl h-[calc(100vh-8rem)]">
          {viewMode === 'chat' ? <ChatView /> : <MapView />}
        </div>
      </main>
      <ViewSwitcher />
    </div>
  );
}

export default App;