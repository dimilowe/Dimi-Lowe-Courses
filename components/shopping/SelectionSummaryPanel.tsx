'use client';

import { X, ExternalLink, ShoppingCart } from 'lucide-react';
import type { ShoppingItem } from './ShoppingItemCard';

interface SelectionSummaryPanelProps {
  selectedItems: ShoppingItem[];
  onClearSelection: () => void;
  onOpenAll: () => void;
}

export default function SelectionSummaryPanel({
  selectedItems,
  onClearSelection,
  onOpenAll,
}: SelectionSummaryPanelProps) {
  if (selectedItems.length === 0) return null;

  const storeBreakdown: Record<string, { count: number; total: number; currency: string }> = {};
  let globalTotal = 0;

  for (const item of selectedItems) {
    if (item.priceCurrent !== null) {
      globalTotal += item.priceCurrent;
      if (!storeBreakdown[item.store]) {
        storeBreakdown[item.store] = { count: 0, total: 0, currency: item.currency };
      }
      storeBreakdown[item.store].count++;
      storeBreakdown[item.store].total += item.priceCurrent;
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 shadow-lg z-50 animate-in slide-in-from-bottom duration-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-zinc-900">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="h-6 w-px bg-zinc-200" />

            <div className="flex items-center gap-4">
              {Object.entries(storeBreakdown).slice(0, 4).map(([store, data]) => (
                <div key={store} className="text-sm">
                  <span className="text-zinc-600">{store}:</span>{' '}
                  <span className="font-medium text-zinc-900">
                    ${data.total.toFixed(2)}
                  </span>
                </div>
              ))}
              {Object.keys(storeBreakdown).length > 4 && (
                <span className="text-sm text-zinc-500">
                  +{Object.keys(storeBreakdown).length - 4} more
                </span>
              )}
            </div>

            <div className="h-6 w-px bg-zinc-200" />

            <div className="text-lg font-bold text-zinc-900">
              Total: ${globalTotal.toFixed(2)}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAll}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open All in New Tabs
            </button>
            
            <button
              onClick={onClearSelection}
              className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
