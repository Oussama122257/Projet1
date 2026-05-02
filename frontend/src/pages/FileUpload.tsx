import { useState, useRef, useCallback } from 'react';
import { Upload, Link, Code, Copy, ExternalLink, FileText, Image, Film, Music, File } from 'lucide-react';
import { api, FileUploadResult } from '../lib/api';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { Header } from '../components/dashboard/Header';

type Method = 'url' | 'stream' | 'base64';

interface UploadedFile {
  id: string;
  result: FileUploadResult;
  method: Method;
  ts: number;
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image size={14} className="text-pink-400" />;
  if (mimeType.startsWith('video/')) return <Film size={14} className="text-purple-400" />;
  if (mimeType.startsWith('audio/')) return <Music size={14} className="text-green-400" />;
  if (mimeType.startsWith('text/')) return <FileText size={14} className="text-blue-400" />;
  return <File size={14} className="text-gray-400" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload() {
  const { toast } = useToast();
  const [method, setMethod] = useState<Method>('url');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<UploadedFile[]>([]);

  // URL upload state
  const [urlForm, setUrlForm] = useState({ fileUrl: '', uploadPath: '', fileName: '' });

  // Stream upload state
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [streamPath, setStreamPath] = useState('');
  const [streamName, setStreamName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Base64 upload state
  const [base64Data, setBase64Data] = useState('');
  const [b64Path, setB64Path] = useState('');
  const [b64Name, setB64Name] = useState('');

  const addHistory = (result: FileUploadResult, m: Method) => {
    setHistory(h => [{ id: Math.random().toString(36).slice(2), result, method: m, ts: Date.now() }, ...h.slice(0, 19)]);
  };

  const copy = (text: string) => navigator.clipboard.writeText(text).then(() => toast('success', 'Copied!'));

  // --- URL upload ---
  const uploadByUrl = async () => {
    if (!urlForm.fileUrl.trim()) { toast('error', 'File URL is required'); return; }
    setLoading(true);
    try {
      const res = await api.uploadFileByUrl(urlForm.fileUrl, urlForm.uploadPath || undefined, urlForm.fileName || undefined);
      addHistory(res, 'url');
      toast('success', 'File uploaded successfully!');
      setUrlForm({ fileUrl: '', uploadPath: '', fileName: '' });
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // --- Stream upload ---
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setSelectedFile(f);
  }, []);

  const uploadStream = async () => {
    if (!selectedFile) { toast('error', 'Please select a file'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      if (streamPath) fd.append('uploadPath', streamPath);
      fd.append('fileName', streamName || selectedFile.name);
      const res = await api.uploadFileStream(fd);
      addHistory(res, 'stream');
      toast('success', 'File uploaded successfully!');
      setSelectedFile(null);
      setStreamPath('');
      setStreamName('');
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // --- Base64 upload ---
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onBase64FileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast('error', 'Base64 upload supports files up to 10 MB'); return; }
    const b64 = await fileToBase64(f);
    setBase64Data(b64);
    if (!b64Name) setB64Name(f.name);
  };

  const uploadBase64 = async () => {
    if (!base64Data.trim()) { toast('error', 'No base64 data. Select a file first.'); return; }
    setLoading(true);
    try {
      const res = await api.uploadFileBase64(base64Data, b64Path || undefined, b64Name || undefined);
      addHistory(res, 'base64');
      toast('success', 'File uploaded successfully!');
      setBase64Data('');
      setB64Path('');
      setB64Name('');
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const methods: { id: Method; label: string; icon: typeof Link; desc: string }[] = [
    { id: 'url', icon: Link, label: 'URL Upload', desc: 'Upload from remote URL (up to 100 MB, 30s timeout)' },
    { id: 'stream', icon: Upload, label: 'File Upload', desc: 'Upload from your device (large files supported)' },
    { id: 'base64', icon: Code, label: 'Base64 Upload', desc: 'Upload base64-encoded data (up to 10 MB)' },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title="File Upload" />
      <div className="flex-1 p-6 overflow-y-auto space-y-6">

        {/* Info banner */}
        <div className="card border-brand-700 bg-brand-900/20 text-sm text-brand-200 flex items-start gap-3">
          <Upload size={16} className="shrink-0 mt-0.5 text-brand-400" />
          <div>
            Files are <strong>free to upload</strong> and automatically deleted after <strong>3 days</strong>.
            Use the returned <code className="bg-brand-900 px-1 rounded">fileUrl</code> directly in Video / Image / Music generation.
          </div>
        </div>

        {/* Method selector */}
        <div className="grid grid-cols-3 gap-3">
          {methods.map(m => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`card text-left transition-all ${method === m.id ? 'border-brand-500 bg-brand-900/20' : 'hover:border-gray-600'}`}
            >
              <m.icon size={18} className={method === m.id ? 'text-brand-400' : 'text-gray-500'} />
              <p className={`font-medium text-sm mt-2 ${method === m.id ? 'text-brand-300' : 'text-gray-300'}`}>{m.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>

        {/* --- URL Upload Form --- */}
        {method === 'url' && (
          <div className="card space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Link size={16} className="text-brand-400" /> URL File Upload</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Remote File URL *</label>
              <input type="url" className="input" placeholder="https://example.com/image.jpg"
                value={urlForm.fileUrl} onChange={e => setUrlForm(f => ({ ...f, fileUrl: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Upload Path (optional)</label>
                <input type="text" className="input" placeholder="images/uploads"
                  value={urlForm.uploadPath} onChange={e => setUrlForm(f => ({ ...f, uploadPath: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Custom Filename (optional)</label>
                <input type="text" className="input" placeholder="my-file.jpg"
                  value={urlForm.fileName} onChange={e => setUrlForm(f => ({ ...f, fileName: e.target.value }))} />
              </div>
            </div>
            <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={uploadByUrl} disabled={loading}>
              {loading ? <Spinner size="sm" /> : <Upload size={16} />}
              {loading ? 'Uploading...' : 'Upload from URL'}
            </button>
          </div>
        )}

        {/* --- Stream Upload Form --- */}
        {method === 'stream' && (
          <div className="card space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Upload size={16} className="text-brand-400" /> File Stream Upload</h2>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${dragOver ? 'border-brand-400 bg-brand-900/20' : 'border-gray-700 hover:border-gray-500'}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }} />
              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-brand-300 font-medium">{selectedFile.name}</p>
                  <p className="text-gray-500 text-sm">{formatBytes(selectedFile.size)} · {selectedFile.type || 'unknown type'}</p>
                  <p className="text-xs text-gray-600">Click or drag to change</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload size={32} className="mx-auto text-gray-600" />
                  <p className="text-gray-400">Drag & drop a file here, or click to browse</p>
                  <p className="text-xs text-gray-600">Supports all file types · Large files supported</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Upload Path (optional)</label>
                <input type="text" className="input" placeholder="videos/raw"
                  value={streamPath} onChange={e => setStreamPath(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Custom Filename (optional)</label>
                <input type="text" className="input" placeholder="overrides original name"
                  value={streamName} onChange={e => setStreamName(e.target.value)} />
              </div>
            </div>

            <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={uploadStream} disabled={loading || !selectedFile}>
              {loading ? <Spinner size="sm" /> : <Upload size={16} />}
              {loading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        )}

        {/* --- Base64 Upload Form --- */}
        {method === 'base64' && (
          <div className="card space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Code size={16} className="text-brand-400" /> Base64 Upload</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Select file to encode (max 10 MB)</label>
              <input type="file" className="input py-1.5 cursor-pointer" onChange={onBase64FileChange} />
            </div>
            {base64Data && (
              <div className="bg-gray-950 border border-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Base64 preview ({Math.round(base64Data.length / 1024)} KB)</p>
                <p className="text-xs text-gray-400 font-mono break-all line-clamp-3">{base64Data.slice(0, 200)}...</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Upload Path (optional)</label>
                <input type="text" className="input" placeholder="images"
                  value={b64Path} onChange={e => setB64Path(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Filename (optional)</label>
                <input type="text" className="input" placeholder="file.jpg"
                  value={b64Name} onChange={e => setB64Name(e.target.value)} />
              </div>
            </div>
            <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={uploadBase64} disabled={loading || !base64Data}>
              {loading ? <Spinner size="sm" /> : <Upload size={16} />}
              {loading ? 'Uploading...' : 'Upload Base64'}
            </button>
          </div>
        )}

        {/* Upload history */}
        {history.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-300">Uploaded Files <span className="text-gray-500 font-normal text-sm">(this session · auto-deleted after 3 days)</span></h2>
            <div className="space-y-2">
              {history.map(item => {
                const d = item.result.data;
                if (!d) return null;
                return (
                  <div key={item.id} className="card space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {fileIcon(d.mimeType)}
                        <span className="text-sm font-medium text-gray-200 truncate">{d.originalName || d.fileName}</span>
                        <span className="text-xs text-gray-500 shrink-0">{formatBytes(d.fileSize)}</span>
                        <span className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded shrink-0">{item.method}</span>
                      </div>
                      <span className="text-xs text-gray-600 shrink-0">Expires {new Date(d.expiresAt).toLocaleDateString()}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 w-24 shrink-0">File URL</label>
                        <code className="flex-1 text-xs text-brand-300 bg-gray-950 px-2 py-1 rounded truncate">{d.fileUrl}</code>
                        <button onClick={() => copy(d.fileUrl)} className="p-1 text-gray-500 hover:text-gray-300"><Copy size={13} /></button>
                        <a href={d.fileUrl} target="_blank" rel="noreferrer" className="p-1 text-gray-500 hover:text-gray-300"><ExternalLink size={13} /></a>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 w-24 shrink-0">Download URL</label>
                        <code className="flex-1 text-xs text-green-400 bg-gray-950 px-2 py-1 rounded truncate">{d.downloadUrl}</code>
                        <button onClick={() => copy(d.downloadUrl)} className="p-1 text-gray-500 hover:text-gray-300"><Copy size={13} /></button>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 w-24 shrink-0">File ID</label>
                        <code className="text-xs text-gray-400 bg-gray-950 px-2 py-1 rounded">{d.fileId}</code>
                        <button onClick={() => copy(d.fileId)} className="p-1 text-gray-500 hover:text-gray-300"><Copy size={13} /></button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      Paste the <span className="text-brand-300">File URL</span> into the Image URL field on the Video / Image generation pages to use this file as input.
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
