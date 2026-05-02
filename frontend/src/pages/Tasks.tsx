import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { api, Task } from '../lib/api';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { Header } from '../components/dashboard/Header';
import { statusBadgeClass, formatRelative } from '../lib/utils';

export function Tasks() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getTasks({ type: filter.type || undefined, status: filter.status || undefined, limit: 100 });
      setTasks(res.tasks);
      setTotal(res.total);
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => { load(); }, [load]);

  const deleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      setTasks(t => t.filter(x => x.id !== id));
      toast('success', 'Task deleted');
    } catch (e) {
      toast('error', (e as Error).message);
    }
  };

  const refresh = async (taskId: string | null) => {
    if (!taskId) return;
    try {
      await api.getTaskStatus(taskId);
      await load();
      toast('success', 'Status refreshed');
    } catch (e) {
      toast('error', (e as Error).message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Tasks" />
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        <div className="flex items-center gap-3">
          <select className="select w-36" value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
            <option value="">All Types</option>
            <option value="video">Video</option>
            <option value="image">Image</option>
            <option value="music">Music</option>
          </select>
          <select className="select w-40" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="generating">Generating</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <button className="btn-secondary flex items-center gap-2 text-sm" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
          <span className="text-sm text-gray-400 ml-auto">{total} total tasks</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><Spinner size="lg" /></div>
        ) : tasks.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            No tasks yet. Start generating content to see tasks here.
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => {
              const params = task.input_params ? JSON.parse(task.input_params) as Record<string, unknown> : {};
              return (
                <div key={task.id} className="card flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-300 uppercase">{task.type}</span>
                      <span className={statusBadgeClass(task.status)}>{task.status}</span>
                      {task.model && <span className="text-xs text-gray-500">{task.model}</span>}
                    </div>
                    <p className="text-sm text-gray-300 truncate">{(params.prompt as string) || 'No prompt'}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatRelative(task.created_at)}</p>
                    {task.error_message && <p className="text-xs text-red-400 mt-1">{task.error_message}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {task.result_url && (
                      <a href={task.result_url} target="_blank" rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-brand-400 transition-colors">
                        <ExternalLink size={15} />
                      </a>
                    )}
                    {task.task_id && (task.status === 'generating' || task.status === 'pending' || task.status === 'queuing') && (
                      <button onClick={() => refresh(task.task_id)} className="p-2 text-gray-400 hover:text-brand-400 transition-colors">
                        <RefreshCw size={15} />
                      </button>
                    )}
                    <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
