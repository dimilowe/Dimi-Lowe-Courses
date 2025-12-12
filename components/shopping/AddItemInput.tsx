'use client';

import { useState } from 'react';
import { Plus, Loader2, Link as LinkIcon } from 'lucide-react';

interface AddItemInputProps {
  onAdd: (url: string, collectionId?: string) => Promise<void>;
  collections: { id: string; name: string }[];
  disabled?: boolean;
}

export default function AddItemInput({ onAdd, collections, disabled }: AddItemInputProps) {
  const [url, setUrl] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading || disabled) return;

    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onAdd(url.trim(), selectedCollection || undefined);
      setUrl('');
      setSelectedCollection('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <LinkIcon className="w-5 h-5 text-orange-500" />
        <h3 className="font-medium text-zinc-900">Add Item by URL</h3>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste product URL from any store..."
          disabled={disabled || isLoading}
          className="flex-1 px-4 py-2.5 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-zinc-50 disabled:text-zinc-500"
        />
        
        {collections.length > 0 && (
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            disabled={disabled || isLoading}
            className="px-3 py-2.5 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-zinc-50 bg-white"
          >
            <option value="">No collection</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        
        <button
          type="submit"
          disabled={!url.trim() || isLoading || disabled}
          className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </form>
  );
}
