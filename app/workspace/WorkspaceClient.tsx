'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, Star, Filter, Clock, Grid, List, 
  FileText, Image, Video, File, Sparkles, 
  ChevronDown, Loader2, Trash2, AlertCircle,
  Upload, X, CheckCircle
} from 'lucide-react';

interface WorkspaceItem {
  id: string;
  title: string;
  type: string;
  cloud_id: string | null;
  tool_id: string | null;
  is_starred: boolean;
  preview_text: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
}

const CLOUDS = [
  { id: 'creation', name: 'Creation', color: 'bg-pink-500' },
  { id: 'video', name: 'Video', color: 'bg-red-500' },
  { id: 'writing', name: 'Writing', color: 'bg-blue-500' },
  { id: 'files', name: 'Files', color: 'bg-gray-500' },
  { id: 'monetize', name: 'Monetize', color: 'bg-yellow-500' },
  { id: 'intelligence', name: 'Intelligence', color: 'bg-purple-500' },
  { id: 'music', name: 'Music', color: 'bg-green-500' },
  { id: 'growth', name: 'Growth', color: 'bg-orange-500' },
];

const TYPE_ICONS: Record<string, typeof FileText> = {
  copy_output: FileText,
  prompt_output: Sparkles,
  image_asset: Image,
  ad_bundle: FileText,
  workflow_run: File,
  uploaded_image: Image,
  uploaded_video: Video,
  uploaded_audio: File,
  uploaded_document: FileText,
  uploaded_file: File,
  file_output: File,
  generic: File,
};

const TYPE_COLORS: Record<string, string> = {
  copy_output: 'from-blue-400 to-blue-500',
  prompt_output: 'from-purple-400 to-purple-500',
  image_asset: 'from-pink-400 to-pink-500',
  ad_bundle: 'from-orange-400 to-orange-500',
  workflow_run: 'from-green-400 to-green-500',
  uploaded_image: 'from-pink-400 to-pink-500',
  uploaded_video: 'from-red-400 to-red-500',
  uploaded_audio: 'from-green-400 to-green-500',
  uploaded_document: 'from-blue-400 to-blue-500',
  uploaded_file: 'from-gray-400 to-gray-500',
  file_output: 'from-gray-400 to-gray-500',
  generic: 'from-zinc-400 to-zinc-500',
};

export default function WorkspaceClient() {
  const router = useRouter();
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [cloudFilter, setCloudFilter] = useState<string>('');
  const [sort, setSort] = useState<'recent' | 'updated' | 'name'>('recent');
  const [starredOnly, setStarredOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCloudDropdown, setShowCloudDropdown] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ fileName: string; status: 'uploading' | 'success' | 'error' }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const initialFetchDone = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (cloudFilter) params.set('cloud_id', cloudFilter);
      if (search) params.set('q', search);
      params.set('sort', sort);
      if (starredOnly) params.set('starred', 'true');

      const res = await fetch(`/api/workspace/items?${params}`);
      
      if (res.status === 401) {
        router.push('/login?redirect=/workspace');
        return;
      }
      
      if (!res.ok) {
        throw new Error('Failed to fetch items');
      }
      
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch workspace items:', error);
      setFetchError('Failed to load workspace items. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [cloudFilter, search, sort, starredOnly, router]);

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchItems();
    }
  }, []);

  useEffect(() => {
    if (initialFetchDone.current) {
      fetchItems();
    }
  }, [cloudFilter, sort, starredOnly]);

  useEffect(() => {
    if (!initialFetchDone.current) return;
    
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      fetchItems();
    }, 300);
    
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [search]);

  const toggleStar = async (id: string, currentStarred: boolean) => {
    setItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, is_starred: !currentStarred } : item
      )
    );
    
    try {
      const res = await fetch(`/api/workspace/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_starred: !currentStarred }),
      });
      
      if (!res.ok) {
        setItems(prev => 
          prev.map(item => 
            item.id === id ? { ...item, is_starred: currentStarred } : item
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle star:', error);
      setItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, is_starred: currentStarred } : item
        )
      );
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const itemToDelete = items.find(item => item.id === id);
    setItems(prev => prev.filter(item => item.id !== id));
    setTotal(prev => prev - 1);
    
    try {
      const res = await fetch(`/api/workspace/items/${id}`, { method: 'DELETE' });
      
      if (!res.ok) {
        if (itemToDelete) {
          setItems(prev => [...prev, itemToDelete]);
          setTotal(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      if (itemToDelete) {
        setItems(prev => [...prev, itemToDelete]);
        setTotal(prev => prev + 1);
      }
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    const newProgress = Array.from(files).map(f => ({ fileName: f.name, status: 'uploading' as const }));
    setUploadProgress(newProgress);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const prepareRes = await fetch('/api/workspace/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
            cloud_id: cloudFilter || 'files',
          }),
        });
        
        if (!prepareRes.ok) {
          throw new Error('Failed to prepare upload');
        }
        
        const { uploadUrl, publicUrl, cloudId } = await prepareRes.json();
        
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        
        if (!uploadRes.ok) {
          throw new Error('Failed to upload file');
        }
        
        const confirmRes = await fetch('/api/workspace/upload/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicUrl,
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
            cloudId,
          }),
        });
        
        if (!confirmRes.ok) {
          throw new Error('Failed to save upload');
        }
        
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'success' } : p
        ));
      } catch (error) {
        console.error('Upload error:', error);
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'error' } : p
        ));
      }
    }
    
    setUploading(false);
    fetchItems();
    
    setTimeout(() => {
      setUploadProgress([]);
    }, 3000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const selectedCloud = CLOUDS.find(c => c.id === cloudFilter);

  return (
    <div 
      className="min-h-screen bg-zinc-50 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="fixed inset-0 bg-orange-500/10 border-4 border-dashed border-orange-500 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Upload className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-zinc-900">Drop files to upload</h3>
            <p className="text-zinc-500 mt-1">Files will be saved to your workspace</p>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Workspace</h1>
            <p className="text-zinc-500 mt-1">Your saved outputs across all tools and clouds</p>
          </div>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              multiple
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span className="font-medium">Upload Files</span>
            </button>
          </div>
        </div>

        {uploadProgress.length > 0 && (
          <div className="mb-4 bg-white rounded-xl border border-zinc-200 p-4">
            <div className="space-y-2">
              {uploadProgress.map((progress, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {progress.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  )}
                  {progress.status === 'success' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {progress.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm text-zinc-700 truncate flex-1">{progress.fileName}</span>
                  <span className="text-xs text-zinc-500">
                    {progress.status === 'uploading' ? 'Uploading...' : progress.status === 'success' ? 'Done' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search workspace..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowCloudDropdown(!showCloudDropdown)}
                className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                <Filter className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-700">
                  {selectedCloud ? selectedCloud.name : 'All Clouds'}
                </span>
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              </button>
              
              {showCloudDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-zinc-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => { setCloudFilter(''); setShowCloudDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 ${!cloudFilter ? 'bg-orange-50 text-orange-600' : 'text-zinc-700'}`}
                  >
                    All Clouds
                  </button>
                  {CLOUDS.map(cloud => (
                    <button
                      key={cloud.id}
                      onClick={() => { setCloudFilter(cloud.id); setShowCloudDropdown(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 flex items-center gap-2 ${cloudFilter === cloud.id ? 'bg-orange-50 text-orange-600' : 'text-zinc-700'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${cloud.color}`}></span>
                      {cloud.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'recent' | 'updated' | 'name')}
              className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="recent">Recent</option>
              <option value="updated">Updated</option>
              <option value="name">Name</option>
            </select>

            <button
              onClick={() => setStarredOnly(!starredOnly)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                starredOnly 
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-700' 
                  : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <Star className={`w-4 h-4 ${starredOnly ? 'fill-yellow-400' : ''}`} />
              <span className="text-sm font-medium">Starred</span>
            </button>

            <div className="flex items-center gap-1 border border-zinc-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {fetchError ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Something went wrong</h3>
            <p className="text-zinc-500 max-w-sm mx-auto mb-4">{fetchError}</p>
            <button
              onClick={fetchItems}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 flex items-center justify-center">
              <FileText className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">No items yet</h3>
            <p className="text-zinc-500 max-w-sm mx-auto">
              {search || cloudFilter || starredOnly 
                ? 'No items match your filters. Try adjusting your search.'
                : 'Start using tools to save outputs to your workspace.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => {
              const IconComponent = TYPE_ICONS[item.type] || TYPE_ICONS.generic;
              const colorGradient = TYPE_COLORS[item.type] || TYPE_COLORS.generic;
              const cloud = CLOUDS.find(c => c.id === item.cloud_id);
              
              return (
                <div key={item.id} className="group bg-white rounded-xl border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow">
                  <Link href={`/workspace/${item.id}`}>
                    <div className="aspect-video relative">
                      {item.thumbnail_url ? (
                        <img 
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${colorGradient} flex items-center justify-center`}>
                          <IconComponent className="w-10 h-10 text-white/80" />
                        </div>
                      )}
                      {cloud && (
                        <span className={`absolute top-2 left-2 ${cloud.color} text-white text-[10px] font-semibold px-2 py-0.5 rounded-full`}>
                          {cloud.name}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="p-3">
                    <Link href={`/workspace/${item.id}`}>
                      <h3 className="font-medium text-zinc-900 text-sm truncate group-hover:text-orange-500 transition-colors">
                        {item.title}
                      </h3>
                    </Link>
                    {item.preview_text && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.preview_text}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.last_opened_at || item.updated_at)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.preventDefault(); toggleStar(item.id, item.is_starred); }}
                          className="p-1 hover:bg-zinc-100 rounded transition-colors"
                        >
                          <Star className={`w-4 h-4 ${item.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-300'}`} />
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); deleteItem(item.id); }}
                          className="p-1 hover:bg-red-50 rounded transition-colors text-zinc-300 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const IconComponent = TYPE_ICONS[item.type] || TYPE_ICONS.generic;
              const colorGradient = TYPE_COLORS[item.type] || TYPE_COLORS.generic;
              const cloud = CLOUDS.find(c => c.id === item.cloud_id);
              
              return (
                <div key={item.id} className="group bg-white rounded-xl border border-zinc-200 p-4 hover:shadow-md transition-shadow flex items-center gap-4">
                  <Link href={`/workspace/${item.id}`} className="flex-shrink-0">
                    {item.thumbnail_url ? (
                      <img 
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${colorGradient} flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white/80" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/workspace/${item.id}`}>
                      <h3 className="font-medium text-zinc-900 truncate group-hover:text-orange-500 transition-colors">
                        {item.title}
                      </h3>
                    </Link>
                    {item.preview_text && (
                      <p className="text-sm text-zinc-500 mt-0.5 line-clamp-1">{item.preview_text}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {cloud && (
                        <span className={`${cloud.color} text-white text-[10px] font-semibold px-2 py-0.5 rounded-full`}>
                          {cloud.name}
                        </span>
                      )}
                      <span className="text-xs text-zinc-400 uppercase">{item.type.replace('_', ' ')}</span>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.last_opened_at || item.updated_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStar(item.id, item.is_starred)}
                      className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                      <Star className={`w-5 h-5 ${item.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-300'}`} />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-zinc-300 hover:text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {total > items.length && (
          <div className="text-center mt-8">
            <p className="text-sm text-zinc-500">Showing {items.length} of {total} items</p>
          </div>
        )}
      </div>
    </div>
  );
}
