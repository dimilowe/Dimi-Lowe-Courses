'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Sparkles, CheckSquare, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useUIStore } from '@/lib/state/uiStore';
import { getEntitlementsForTier } from '@/lib/pricing/cloudEntitlements';
import CollectionsSidebar, { type Collection } from '@/components/shopping/CollectionsSidebar';
import ShoppingItemCard, { type ShoppingItem } from '@/components/shopping/ShoppingItemCard';
import AddItemInput from '@/components/shopping/AddItemInput';
import SelectionSummaryPanel from '@/components/shopping/SelectionSummaryPanel';
import ItemDetailDrawer from '@/components/shopping/ItemDetailDrawer';
import CreateCollectionModal from '@/components/shopping/CreateCollectionModal';

interface Summary {
  itemCount: number;
  globalTotal: number;
  storeSubtotals: Record<string, { count: number; total: number; currency: string }>;
}

export default function ShoppingCloudClient() {
  const { userTier, openUpgradeModal } = useUIStore();
  
  const [collections, setCollections] = useState<Collection[]>([]);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [detailItem, setDetailItem] = useState<ShoppingItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const entitlements = getEntitlementsForTier(userTier);
  const { maxItems, maxCollections } = entitlements.shopping;
  const isAtItemLimit = items.length >= maxItems;
  const isAtCollectionLimit = collections.length >= maxCollections;

  const fetchCollections = useCallback(async () => {
    try {
      const res = await fetch('/api/shopping/collections');
      if (res.status === 401) {
        setIsLoggedIn(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      let url = '/api/shopping/list';
      if (selectedCollectionId) {
        url += `?collection_id=${selectedCollectionId}`;
      }
      const res = await fetch(url);
      if (res.status === 401) {
        setIsLoggedIn(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  }, [selectedCollectionId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchCollections(), fetchItems()]);
      setLoading(false);
    };
    init();
  }, [fetchCollections, fetchItems]);

  useEffect(() => {
    fetchItems();
  }, [selectedCollectionId, fetchItems]);

  const handleAddItem = async (url: string, collectionId?: string) => {
    const res = await fetch('/api/shopping/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'url',
        url,
        collectionId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.upgradeRequired) {
        openUpgradeModal('shoppingItems', data.requiredTier);
        throw new Error(data.error);
      }
      throw new Error(data.error || 'Failed to add item');
    }

    await Promise.all([fetchItems(), fetchCollections()]);
  };

  const handleCreateCollection = async (name: string, description: string) => {
    const res = await fetch('/api/shopping/collections/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.upgradeRequired) {
        openUpgradeModal('shoppingCollections', data.requiredTier);
        throw new Error(data.error);
      }
      throw new Error(data.error || 'Failed to create collection');
    }

    await fetchCollections();
  };

  const handleDeleteItem = async (id: string) => {
    const res = await fetch('/api/shopping/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete item');
    }

    await Promise.all([fetchItems(), fetchCollections()]);
  };

  const handleUpdateItem = async (id: string, updates: Partial<ShoppingItem>) => {
    const res = await fetch('/api/shopping/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update item');
    }

    await Promise.all([fetchItems(), fetchCollections()]);
    
    if (detailItem && detailItem.id === id) {
      const updatedItem = { ...detailItem, ...updates };
      setDetailItem(updatedItem as ShoppingItem);
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleOpenAllSelected = () => {
    const selected = items.filter(item => selectedItemIds.has(item.id));
    for (const item of selected) {
      const url = item.affiliateUrl || item.canonicalUrl;
      window.open(url, '_blank');
    }
  };

  const selectedItems = items.filter(item => selectedItemIds.has(item.id));

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <ShoppingBag className="w-16 h-16 text-orange-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-zinc-900 mb-4">Shopping Cloud</h1>
          <p className="text-zinc-600 mb-8">
            Save items from any store, organize into collections, and track prices all in one place.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Log in to get started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900">Shopping Cloud</h1>
                <p className="text-sm text-zinc-500">Your universal cart</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectionMode(!selectionMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                selectionMode
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span className="text-sm font-medium">
                {selectionMode ? 'Exit Select' : 'Select Items'}
              </span>
            </button>

            {userTier === 'free' && (
              <button
                onClick={() => openUpgradeModal('shoppingItems', 'starter')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <CollectionsSidebar
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          onSelectCollection={setSelectedCollectionId}
          onCreateCollection={() => setShowCreateModal(true)}
          totalItemCount={summary?.itemCount || 0}
          isAtCollectionLimit={isAtCollectionLimit}
          collectionLimit={maxCollections}
          onUpgradeClick={() => openUpgradeModal('shoppingCollections', 'starter')}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <AddItemInput
              onAdd={handleAddItem}
              collections={collections.map(c => ({ id: c.id, name: c.name }))}
              disabled={isAtItemLimit}
            />

            {isAtItemLimit && (
              <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <Lock className="w-5 h-5 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800">
                    You&apos;ve reached your limit of {maxItems} saved items.
                  </p>
                  <p className="text-sm text-orange-700">
                    Upgrade to save unlimited items.
                  </p>
                </div>
                <button
                  onClick={() => openUpgradeModal('shoppingItems', 'starter')}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  Upgrade
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-500">Loading your items...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-zinc-900 mb-2">
                  {selectedCollectionId ? 'No items in this collection' : 'No items saved yet'}
                </h2>
                <p className="text-zinc-500 mb-6">
                  Paste a product URL above or save items from the Outfit Generator.
                </p>
                <Link
                  href="/tools/outfit-ideas"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-700 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
                >
                  Try Outfit Ideas Generator
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item) => (
                  <ShoppingItemCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItemIds.has(item.id)}
                    onSelect={toggleItemSelection}
                    onClick={setDetailItem}
                    selectionMode={selectionMode}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <SelectionSummaryPanel
        selectedItems={selectedItems}
        onClearSelection={() => setSelectedItemIds(new Set())}
        onOpenAll={handleOpenAllSelected}
      />

      <ItemDetailDrawer
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onDelete={handleDeleteItem}
        onUpdate={handleUpdateItem}
        collections={collections.map(c => ({ id: c.id, name: c.name }))}
      />

      <CreateCollectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateCollection}
      />
    </div>
  );
}
