'use client';

import { ExternalLink, Check, ShoppingBag } from 'lucide-react';

export interface ShoppingItem {
  id: string;
  collectionId: string | null;
  title: string;
  imageUrl: string | null;
  canonicalUrl: string;
  affiliateUrl: string | null;
  store: string;
  priceCurrent: number | null;
  priceLast: number | null;
  currency: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ShoppingItemCardProps {
  item: ShoppingItem;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onClick?: (item: ShoppingItem) => void;
  selectionMode?: boolean;
}

export default function ShoppingItemCard({
  item,
  isSelected = false,
  onSelect,
  onClick,
  selectionMode = false,
}: ShoppingItemCardProps) {
  const productUrl = item.affiliateUrl || item.canonicalUrl;
  
  const priceChange = item.priceLast && item.priceCurrent
    ? item.priceCurrent - item.priceLast
    : null;

  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode && onSelect) {
      e.preventDefault();
      onSelect(item.id);
    } else if (onClick) {
      e.preventDefault();
      onClick(item);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(item.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative bg-white rounded-xl border transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${
        isSelected ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-zinc-200 hover:border-zinc-300'
      }`}
    >
      {selectionMode && (
        <button
          onClick={handleCheckboxClick}
          className={`absolute top-3 left-3 z-10 w-5 h-5 rounded flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-orange-500 text-white'
              : 'bg-white/90 border border-zinc-300 hover:border-orange-400'
          }`}
        >
          {isSelected && <Check className="w-3 h-3" />}
        </button>
      )}

      <div className="aspect-square bg-zinc-100 rounded-t-xl overflow-hidden relative">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-pink-500">
            <ShoppingBag className="w-12 h-12 text-white/80" />
          </div>
        )}
        
        <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-zinc-600">
          {item.store}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-medium text-zinc-900 line-clamp-2 text-sm mb-2 group-hover:text-orange-600 transition-colors">
          {item.title}
        </h3>
        
        <div className="flex items-center justify-between">
          <div>
            {item.priceCurrent !== null ? (
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-zinc-900">
                  {item.currency === 'USD' ? '$' : item.currency}
                  {item.priceCurrent.toFixed(2)}
                </span>
                {priceChange !== null && priceChange !== 0 && (
                  <span className={`text-xs font-medium ${priceChange < 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {priceChange < 0 ? '↓' : '↑'}
                    {Math.abs(priceChange).toFixed(2)}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-zinc-500">Price not available</span>
            )}
          </div>
          
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-orange-100 hover:text-orange-600 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
