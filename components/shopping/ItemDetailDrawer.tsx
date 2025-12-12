'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink, TrendingDown, TrendingUp, Tag, Trash2, Edit2, Check } from 'lucide-react';
import type { ShoppingItem } from './ShoppingItemCard';

interface PriceSnapshot {
  price: number;
  currency: string;
  snapshotAt: string;
}

interface ItemDetailDrawerProps {
  item: ShoppingItem | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<ShoppingItem>) => Promise<void>;
  collections: { id: string; name: string }[];
}

export default function ItemDetailDrawer({
  item,
  onClose,
  onDelete,
  onUpdate,
  collections,
}: ItemDetailDrawerProps) {
  const [priceHistory, setPriceHistory] = useState<PriceSnapshot[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (item) {
      setEditTitle(item.title);
      fetchPriceHistory(item.id);
    }
  }, [item?.id]);

  const fetchPriceHistory = async (itemId: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/shopping/price-history?item_id=${itemId}`);
      if (res.ok) {
        const data = await res.json();
        setPriceHistory(data.snapshots || []);
      }
    } catch (error) {
      console.error('Failed to fetch price history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!item) return null;

  const productUrl = item.affiliateUrl || item.canonicalUrl;
  
  const priceChange = item.priceLast && item.priceCurrent
    ? item.priceCurrent - item.priceLast
    : null;

  const handleSaveTitle = async () => {
    if (editTitle.trim() && editTitle !== item.title) {
      await onUpdate(item.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    setIsDeleting(true);
    try {
      await onDelete(item.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <h2 className="font-semibold text-zinc-900">Item Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {item.imageUrl && (
            <div className="aspect-video bg-zinc-100">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-start gap-2">
                {isEditing ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveTitle}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="flex-1 text-lg font-medium text-zinc-900">{item.title}</h3>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              <p className="text-sm text-zinc-500 mt-1">from {item.store}</p>
            </div>

            <div className="flex items-center gap-4">
              {item.priceCurrent !== null && (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-zinc-900">
                    {item.currency === 'USD' ? '$' : item.currency}
                    {item.priceCurrent.toFixed(2)}
                  </span>
                  {priceChange !== null && priceChange !== 0 && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      priceChange < 0 ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {priceChange < 0 ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <TrendingUp className="w-4 h-4" />
                      )}
                      ${Math.abs(priceChange).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>

            <a
              href={productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Product Page
            </a>

            {item.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-zinc-700 mb-2">Collection</h4>
              <select
                value={item.collectionId || ''}
                onChange={(e) => onUpdate(item.id, { collectionId: e.target.value || null } as Partial<ShoppingItem>)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="">No collection</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h4 className="text-sm font-medium text-zinc-700 mb-3">Price History</h4>
              {loadingHistory ? (
                <p className="text-sm text-zinc-500">Loading...</p>
              ) : priceHistory.length === 0 ? (
                <p className="text-sm text-zinc-500">No price history yet</p>
              ) : (
                <div className="space-y-2">
                  {priceHistory.slice(-5).reverse().map((snapshot, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-zinc-100 last:border-0">
                      <span className="text-zinc-500">
                        {new Date(snapshot.snapshotAt).toLocaleDateString()}
                      </span>
                      <span className="font-medium text-zinc-900">
                        ${snapshot.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete Item'}
          </button>
        </div>
      </div>
    </>
  );
}
