'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Star, Copy, Check, Clock, Calendar, 
  FileText, Image, Sparkles, File, Trash2, Download
} from 'lucide-react';

interface WorkspaceItemData {
  id: string;
  title: string;
  type: string;
  cloud_id: string | null;
  tool_id: string | null;
  workflow_id: string | null;
  is_starred: boolean;
  preview_text: string | null;
  payload_json: Record<string, any>;
  thumbnail_url: string | null;
  file_url: string | null;
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
}

interface Props {
  item: WorkspaceItemData;
}

const CLOUDS: Record<string, { name: string; color: string }> = {
  creation: { name: 'Creation', color: 'bg-pink-500' },
  video: { name: 'Video', color: 'bg-red-500' },
  writing: { name: 'Writing', color: 'bg-blue-500' },
  files: { name: 'Files', color: 'bg-gray-500' },
  monetize: { name: 'Monetize', color: 'bg-yellow-500' },
  intelligence: { name: 'Intelligence', color: 'bg-purple-500' },
  music: { name: 'Music', color: 'bg-green-500' },
  growth: { name: 'Growth', color: 'bg-orange-500' },
};

const TYPE_ICONS: Record<string, typeof FileText> = {
  copy_output: FileText,
  prompt_output: Sparkles,
  image_asset: Image,
  ad_bundle: FileText,
  workflow_run: File,
  generic: File,
};

export default function WorkspaceItemClient({ item }: Props) {
  const router = useRouter();
  const [isStarred, setIsStarred] = useState(item.is_starred);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const cloud = item.cloud_id ? CLOUDS[item.cloud_id] : null;
  const IconComponent = TYPE_ICONS[item.type] || TYPE_ICONS.generic;

  const toggleStar = async () => {
    try {
      await fetch(`/api/workspace/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_starred: !isStarred }),
      });
      setIsStarred(!isStarred);
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const deleteItem = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    setDeleting(true);
    try {
      await fetch(`/api/workspace/items/${item.id}`, { method: 'DELETE' });
      router.push('/workspace');
    } catch (error) {
      console.error('Failed to delete:', error);
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderPayload = () => {
    const payload = item.payload_json;
    if (!payload || Object.keys(payload).length === 0) {
      return (
        <p className="text-zinc-500 italic">No content available</p>
      );
    }

    const renderValue = (key: string, value: any) => {
      if (typeof value === 'string') {
        return (
          <div key={key} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-zinc-700 capitalize">
                {key.replace(/_/g, ' ')}
              </h4>
              <button
                onClick={() => copyToClipboard(value, key)}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-orange-500 transition-colors"
              >
                {copied === key ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 text-sm text-zinc-800 whitespace-pre-wrap font-mono overflow-x-auto">
              {value}
            </pre>
          </div>
        );
      }
      
      if (Array.isArray(value)) {
        return (
          <div key={key} className="mb-6">
            <h4 className="text-sm font-semibold text-zinc-700 capitalize mb-2">
              {key.replace(/_/g, ' ')}
            </h4>
            <ul className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-2">
              {value.map((item, idx) => (
                <li key={idx} className="text-sm text-zinc-800">
                  {typeof item === 'string' ? item : JSON.stringify(item)}
                </li>
              ))}
            </ul>
          </div>
        );
      }

      if (typeof value === 'object' && value !== null) {
        return (
          <div key={key} className="mb-6">
            <h4 className="text-sm font-semibold text-zinc-700 capitalize mb-2">
              {key.replace(/_/g, ' ')}
            </h4>
            <pre className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 text-sm text-zinc-800 whitespace-pre-wrap font-mono overflow-x-auto">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        );
      }

      return null;
    };

    return (
      <div>
        {Object.entries(payload).map(([key, value]) => renderValue(key, value))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            href="/workspace"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Workspace
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {item.thumbnail_url && (
            <div className="w-full aspect-video bg-zinc-100">
              <img 
                src={item.thumbnail_url}
                alt={item.title}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {cloud && (
                    <span className={`${cloud.color} text-white text-xs font-semibold px-2 py-0.5 rounded-full`}>
                      {cloud.name}
                    </span>
                  )}
                  <span className="text-xs text-zinc-500 uppercase bg-zinc-100 px-2 py-0.5 rounded">
                    {item.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-zinc-900">{item.title}</h1>
                {item.preview_text && (
                  <p className="text-zinc-500 mt-2">{item.preview_text}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {item.file_url && (
                  <a
                    href={item.file_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                )}
                <button
                  onClick={toggleStar}
                  className={`p-2 rounded-lg transition-colors ${
                    isStarred ? 'bg-yellow-50 text-yellow-500' : 'bg-zinc-100 text-zinc-400 hover:text-yellow-500'
                  }`}
                >
                  <Star className={`w-5 h-5 ${isStarred ? 'fill-yellow-400' : ''}`} />
                </button>
                <button
                  onClick={deleteItem}
                  disabled={deleting}
                  className="p-2 bg-zinc-100 text-zinc-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-zinc-500 mb-8 pb-6 border-b border-zinc-100">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Created: {formatDate(item.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Updated: {formatDate(item.updated_at)}
              </span>
              {item.tool_id && (
                <span className="text-zinc-400">Tool: {item.tool_id}</span>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">Content</h3>
              {renderPayload()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
