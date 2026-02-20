'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, File as FileIcon, FileText, Image, Video } from 'lucide-react';
import { usePathname } from 'next/navigation';
import {
  TOOL_QUICK_IMPORT_EVENT,
  type ToolQuickImportDetail,
  type QuickImportKind,
  isToolQuickImportCompatible,
} from '@/lib/workspace/toolQuickImport';

type WorkspaceItem = {
  id: string;
  title: string;
  type: string;
  thumbnail_url: string | null;
  file_url: string | null;
  updated_at: string;
  last_opened_at: string | null;
};

const TYPE_ICON: Record<string, typeof FileText> = {
  image: Image,
  video: Video,
  pdf: FileText,
  default: FileIcon,
};

function mapType(type: string) {
  if (type.includes('image')) return 'image';
  if (type.includes('video')) return 'video';
  if (type.includes('pdf')) return 'pdf';
  return 'default';
}

function guessExtension(contentType: string, fallbackKind: QuickImportKind) {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  if (contentType.includes('mp4')) return 'mp4';
  if (contentType.includes('webm')) return 'webm';
  if (contentType.includes('pdf')) return 'pdf';
  if (fallbackKind === 'image') return 'png';
  if (fallbackKind === 'video') return 'mp4';
  if (fallbackKind === 'pdf') return 'pdf';
  return 'bin';
}

export default function ToolsRecentFilesDock() {
  const pathname = usePathname();
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const isToolDetailPage = useMemo(() => {
    if (!pathname) return false;
    if (!pathname.startsWith('/tools/')) return false;
    return pathname.split('/').filter(Boolean).length >= 2;
  }, [pathname]);

  const toolSlug = useMemo(() => {
    if (!pathname?.startsWith('/tools/')) return null;
    const parts = pathname.split('/').filter(Boolean);
    return parts[1] || null;
  }, [pathname]);

  useEffect(() => {
    if (!isToolDetailPage) return;

    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/workspace/items?scope=all&sort=recent&limit=6');
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch {
        // no-op: hide by keeping list empty
      }
    })();

    return () => {
      active = false;
    };
  }, [isToolDetailPage]);

  if (!isToolDetailPage || items.length === 0) return null;

  const handleUseInTool = async (item: WorkspaceItem, kind: QuickImportKind) => {
    if (!item.file_url || !toolSlug) return;
    setImportingId(item.id);
    try {
      const res = await fetch(item.file_url);
      if (!res.ok) throw new Error('Failed to fetch file');
      const blob = await res.blob();
      const contentType = blob.type || (kind === 'image' ? 'image/png' : kind === 'video' ? 'video/mp4' : 'application/octet-stream');
      const ext = guessExtension(contentType, kind);
      const base = item.title?.trim() || `workspace-${item.id}`;
      const hasExt = /\.[a-z0-9]{2,5}$/i.test(base);
      const filename = hasExt ? base : `${base}.${ext}`;
      const file = new File([blob], filename, { type: contentType });
      const detail: ToolQuickImportDetail = {
        file,
        kind,
        itemId: item.id,
        source: 'workspace',
      };
      window.dispatchEvent(new CustomEvent<ToolQuickImportDetail>(TOOL_QUICK_IMPORT_EVENT, { detail }));
    } catch {
      // swallow for now; keep UI non-blocking
    } finally {
      setImportingId(null);
    }
  };

  return (
    <aside
      className={`hidden xl:block fixed right-6 z-40 transition-all duration-200 ${
        collapsed ? 'top-28 w-14' : 'top-24 w-[300px]'
      }`}
    >
      <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-xl border border-white/20 p-3">
        <div className="flex items-center justify-between mb-2">
          {!collapsed && <h3 className="text-white font-semibold text-base">Recent files</h3>}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="ml-auto p-1.5 rounded-lg text-white/90 hover:bg-white/15"
            aria-label={collapsed ? 'Expand recent files' : 'Collapse recent files'}
          >
            {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {!collapsed && (
          <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
            {items.map((item) => {
              const kind = mapType(item.type);
              const Icon = TYPE_ICON[kind] || TYPE_ICON.default;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/30 bg-white/12 p-2 text-white"
                >
                  <div className="flex items-start gap-2">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white/90" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-[10px] uppercase text-white/80">{kind}</p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    {toolSlug && item.file_url && isToolQuickImportCompatible(toolSlug, kind) && (
                      <button
                        onClick={() => handleUseInTool(item, kind)}
                        data-track-output="true"
                        className="text-xs px-2 py-1 rounded-md bg-white text-orange-700 hover:bg-orange-50"
                        disabled={importingId === item.id}
                      >
                        {importingId === item.id ? 'Using...' : 'Use here'}
                      </button>
                    )}
                    <Link
                      href={`/workspace/${item.id}`}
                      className="text-xs px-2 py-1 rounded-md bg-white/15 hover:bg-white/25"
                    >
                      Open
                    </Link>
                    {item.file_url && (
                      <a
                        href={item.file_url}
                        download
                        data-track-output="true"
                        className="text-xs px-2 py-1 rounded-md bg-white text-orange-700 hover:bg-orange-50 inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
