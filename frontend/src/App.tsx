import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/dashboard/Sidebar';
import { ToastProvider } from './components/ui/Toast';
import { Overview } from './pages/Overview';
import { VideoGen } from './pages/VideoGen';
import { ImageGen } from './pages/ImageGen';
import { MusicGen } from './pages/MusicGen';
import { Tasks } from './pages/Tasks';
import { ApiKeys } from './pages/ApiKeys';
import { McpConfig } from './pages/McpConfig';
import { Webhooks } from './pages/Webhooks';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/video" element={<VideoGen />} />
            <Route path="/image" element={<ImageGen />} />
            <Route path="/music" element={<MusicGen />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/api-keys" element={<ApiKeys />} />
            <Route path="/mcp" element={<McpConfig />} />
            <Route path="/webhooks" element={<Webhooks />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}
