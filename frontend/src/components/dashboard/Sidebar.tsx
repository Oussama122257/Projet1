import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Video, Image, Music, ListTodo, Key, Settings, Webhook, Bot, Zap, FolderUp } from 'lucide-react';
import { cn } from '../../lib/utils';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/video', icon: Video, label: 'Video Gen' },
  { to: '/image', icon: Image, label: 'Image Gen' },
  { to: '/music', icon: Music, label: 'Music Gen' },
  { to: '/files', icon: FolderUp, label: 'File Upload' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/api-keys', icon: Key, label: 'API Keys' },
  { to: '/mcp', icon: Bot, label: 'MCP Config' },
  { to: '/webhooks', icon: Webhook, label: 'Webhooks' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">KIE.ai SaaS</p>
            <p className="text-xs text-gray-400 mt-0.5">Personal Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-brand-600/20 text-brand-400 font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <a href="https://docs.kie.ai" target="_blank" rel="noreferrer"
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1.5">
          <Zap size={12} /> KIE.ai Docs
        </a>
      </div>
    </aside>
  );
}
