'use client';

import { Plus, FolderOpen, Lock, ShoppingBag } from 'lucide-react';

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CollectionsSidebarProps {
  collections: Collection[];
  selectedCollectionId: string | null;
  onSelectCollection: (id: string | null) => void;
  onCreateCollection: () => void;
  totalItemCount: number;
  isAtCollectionLimit: boolean;
  collectionLimit: number;
  onUpgradeClick: () => void;
}

export default function CollectionsSidebar({
  collections,
  selectedCollectionId,
  onSelectCollection,
  onCreateCollection,
  totalItemCount,
  isAtCollectionLimit,
  collectionLimit,
  onUpgradeClick,
}: CollectionsSidebarProps) {
  return (
    <div className="w-64 flex-shrink-0 bg-white border-r border-zinc-200 flex flex-col h-full">
      <div className="p-4 border-b border-zinc-200">
        <h2 className="font-semibold text-zinc-900">Collections</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <button
          onClick={() => onSelectCollection(null)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
            selectedCollectionId === null
              ? 'bg-orange-50 text-orange-700'
              : 'text-zinc-700 hover:bg-zinc-50'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="flex-1 font-medium">All Items</span>
          <span className="text-sm text-zinc-500">{totalItemCount}</span>
        </button>

        <div className="mt-2 space-y-1">
          {collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => onSelectCollection(collection.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                selectedCollectionId === collection.id
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <FolderOpen className="w-5 h-5" />
              <span className="flex-1 truncate">{collection.name}</span>
              <span className="text-sm text-zinc-500">{collection.itemCount}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-zinc-200">
        {isAtCollectionLimit ? (
          <button
            onClick={onUpgradeClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-200 text-zinc-500 hover:border-orange-300 hover:text-orange-600 transition-colors"
          >
            <Lock className="w-4 h-4" />
            <span className="text-sm">Upgrade for more</span>
          </button>
        ) : (
          <button
            onClick={onCreateCollection}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Collection</span>
          </button>
        )}
        
        {isAtCollectionLimit && (
          <p className="text-xs text-zinc-500 text-center mt-2">
            {collectionLimit} collection limit on free plan
          </p>
        )}
      </div>
    </div>
  );
}
