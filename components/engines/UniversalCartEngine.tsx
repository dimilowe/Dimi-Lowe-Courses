'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Plus, Trash2, ExternalLink, Edit2, X, Check, Share2, Lock, ShoppingCart, AlertTriangle, ChevronDown, ChevronUp, Lightbulb, BookOpen, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToolForRenderer } from '@/lib/cms/getCmsToolBySlug';
import { getUniversalCartConfig } from '@/engines/universal-cart/config';
import { getToolUsageLimitsClient } from '@/lib/limits/toolUsageLimits.client';
import ShoppingCloudUpgradeModal from '@/components/modals/ShoppingCloudUpgradeModal';

interface UniversalCartEngineProps {
  tool: ToolForRenderer;
  canUsePro?: boolean;
  canUseBasic?: boolean;
  entitlementsLoading?: boolean;
}

interface CartItem {
  id: number;
  url: string;
  domain: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  priceCents: number | null;
  currency: string;
  note: string | null;
  tags: string[];
  createdAt: string;
}

interface CartData {
  cart: {
    id: number;
    title: string;
    isPublic: boolean;
    publicToken: string | null;
  };
  items: CartItem[];
  limits: {
    maxSavedItems: number | null;
    currentCount: number;
  };
  isOwner: boolean;
}

export default function UniversalCartEngine({ tool, canUsePro, canUseBasic }: UniversalCartEngineProps) {
  const config = getUniversalCartConfig();

  const [cartData, setCartData] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editTags, setEditTags] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const hasShoppingCloudAccess = canUseBasic || canUsePro || false;

  const limits = getToolUsageLimitsClient({
    toolSlug: 'universal-shopping-cart',
    hasShoppingCloudAccess,
  });

  const maxItems = limits.maxSavedItems ?? null;
  const currentCount = cartData?.items.length || 0;
  const isNearLimit = maxItems !== null && maxItems !== undefined && currentCount >= (maxItems - 3) && currentCount < maxItems;
  const isAtLimit = maxItems !== null && maxItems !== undefined && currentCount >= maxItems;

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    try {
      setLoading(true);
      const response = await fetch('/api/universal-cart');
      if (!response.ok) throw new Error('Failed to load cart');
      const data = await response.json();
      setCartData(data);
    } catch (err) {
      setError('Failed to load your cart');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddItem(e: FormEvent) {
    e.preventDefault();

    if (!urlInput.trim()) return;

    setIsAdding(true);
    setError(null);

    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const priceCents = priceInput ? Math.round(parseFloat(priceInput) * 100) : null;

      const response = await fetch('/api/universal-cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput.trim(),
          note: noteInput.trim() || null,
          tags,
          priceCents,
          currency: 'USD',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'UPGRADE_REQUIRED') {
          setUpgradeReason(data.reason);
          setModalOpen(true);
          return;
        }
        throw new Error(data.error || 'Failed to add item');
      }

      setUrlInput('');
      setNoteInput('');
      setPriceInput('');
      setTagsInput('');
      setShowForm(false);
      await loadCart();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDeleteItem(itemId: number) {
    try {
      const response = await fetch(`/api/universal-cart/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete item');

      await loadCart();
    } catch (err) {
      setError('Failed to delete item');
    }
  }

  async function handleUpdateItem(itemId: number) {
    try {
      const tags = editTags.split(',').map(t => t.trim()).filter(Boolean);

      const response = await fetch(`/api/universal-cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: editNote.trim() || null,
          tags,
        }),
      });

      if (!response.ok) throw new Error('Failed to update item');

      setEditingItemId(null);
      await loadCart();
    } catch (err) {
      setError('Failed to update item');
    }
  }

  async function handleToggleShare() {
    if (!cartData?.cart.isPublic) {
      try {
        const response = await fetch('/api/universal-cart/public', {
          method: 'POST',
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.code === 'UPGRADE_REQUIRED') {
            setUpgradeReason(data.reason);
            setModalOpen(true);
            return;
          }
          throw new Error(data.message || 'Failed to share cart');
        }

        await loadCart();
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      try {
        const response = await fetch('/api/universal-cart/public', {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to make cart private');

        await loadCart();
      } catch (err) {
        setError('Failed to make cart private');
      }
    }
  }

  function formatPrice(cents: number | null, currency: string) {
    if (cents === null) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(cents / 100);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-200 rounded w-1/2"></div>
          <div className="h-12 bg-zinc-200 rounded"></div>
          <div className="h-32 bg-zinc-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">{config.title}</h1>
        <p className="text-lg text-zinc-600">{config.subtitle}</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <ShoppingCart className="w-4 h-4" />
          <span>
            {currentCount} item{currentCount !== 1 ? 's' : ''} saved
            {maxItems !== null && (
              <span className="text-zinc-400"> / {maxItems} free</span>
            )}
            {maxItems === null && hasShoppingCloudAccess && (
              <span className="text-green-600"> (Unlimited)</span>
            )}
          </span>
        </div>
        {cartData && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleShare}
            className="flex items-center gap-1.5"
          >
            {cartData.cart.isPublic ? (
              <>
                <Lock className="w-4 h-4" />
                Make Private
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share Cart
              </>
            )}
          </Button>
        )}
      </div>

      {isNearLimit && !isAtLimit && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800 font-medium">
              You&apos;re close to the free limit
            </p>
            <p className="text-sm text-amber-600">
              Upgrade to Shopping Cloud Starter to save unlimited items.
            </p>
            <button
              onClick={() => {
                setUpgradeReason('NEAR_LIMIT');
                setModalOpen(true);
              }}
              className="text-sm text-amber-700 underline mt-1"
            >
              Upgrade now
            </button>
          </div>
        </div>
      )}

      {cartData?.cart.isPublic && cartData.cart.publicToken && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium mb-1">Your cart is shared!</p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/shared/cart/${cartData.cart.publicToken}`}
              className="text-sm bg-white"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/shared/cart/${cartData.cart.publicToken}`
                );
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full mb-6 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
          disabled={isAtLimit && !hasShoppingCloudAccess}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      ) : (
        <form onSubmit={handleAddItem} className="mb-6 p-4 bg-zinc-50 rounded-xl space-y-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              {config.urlLabel}
            </label>
            <Input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={config.urlPlaceholder}
              required
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                {config.priceLabel}
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder={config.pricePlaceholder}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                {config.tagsLabel}
              </label>
              <Input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder={config.tagsPlaceholder}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              {config.noteLabel}
            </label>
            <Input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder={config.notePlaceholder}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isAdding || !urlInput.trim()}
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
            >
              {isAdding ? 'Adding...' : 'Save Item'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setUrlInput('');
                setNoteInput('');
                setPriceInput('');
                setTagsInput('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {cartData?.items.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Your cart is empty</p>
            <p className="text-sm">Add products from any website to get started</p>
          </div>
        )}

        {cartData?.items.map((item) => (
          <div
            key={item.id}
            className="border border-zinc-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow"
          >
            <div className="flex gap-4">
              {item.imageUrl && (
                <div className="w-20 h-20 flex-shrink-0 bg-zinc-100 rounded-lg overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title || 'Product'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-zinc-900 truncate">
                      {item.title || 'Untitled Product'}
                    </h3>
                    {item.domain && (
                      <p className="text-xs text-zinc-500">{item.domain}</p>
                    )}
                  </div>
                  {item.priceCents !== null && (
                    <span className="text-lg font-semibold text-zinc-900 whitespace-nowrap">
                      {formatPrice(item.priceCents, item.currency)}
                    </span>
                  )}
                </div>

                {item.description && (
                  <p className="text-sm text-zinc-600 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}

                {editingItemId === item.id ? (
                  <div className="mt-3 space-y-2">
                    <Input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="Add a note..."
                      className="text-sm"
                    />
                    <Input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Tags (comma-separated)"
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateItem(item.id)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingItemId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {item.note && (
                      <p className="text-sm text-zinc-500 mt-2 italic">
                        &quot;{item.note}&quot;
                      </p>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {item.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-pink-600 hover:text-pink-700 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </a>
                  <button
                    onClick={() => {
                      setEditingItemId(item.id);
                      setEditNote(item.note || '');
                      setEditTags(item.tags?.join(', ') || '');
                    }}
                    className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tool.deepContent && (
        <section className="mt-10 bg-white rounded-xl border p-6">
          <h2 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-pink-500" />
            About This Tool
          </h2>
          <div className="prose prose-sm max-w-none text-zinc-600">
            {tool.deepContent.split('\n\n').map((paragraph, i) => (
              <p key={i} className="mb-3">{paragraph}</p>
            ))}
          </div>
        </section>
      )}

      {tool.contentGuide && tool.contentGuide.length > 0 && (
        <section className="mt-8 bg-white rounded-xl border p-6">
          <h2 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            How to Use
          </h2>
          <ol className="space-y-3">
            {tool.contentGuide.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-zinc-600">
                <span className="w-6 h-6 flex-shrink-0 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-semibold text-xs">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {tool.proTips && tool.proTips.length > 0 && (
        <section className="mt-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
          <h2 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            Pro Tips
          </h2>
          <ul className="space-y-2">
            {tool.proTips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-zinc-700">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tool.faq && tool.faq.length > 0 && (
        <FAQSection faqs={tool.faq} />
      )}

      <ShoppingCloudUpgradeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        sourceToolSlug={tool.slug}
        sourceCTAId="save-more-items"
      />
    </div>
  );
}

function FAQSection({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mt-8 bg-white rounded-xl border p-6">
      <h2 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-blue-500" />
        Frequently Asked Questions
      </h2>
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <div key={index} className="border-b border-zinc-100 last:border-0">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between py-3 text-left"
            >
              <h3 className="font-medium text-zinc-900 pr-4">{faq.question}</h3>
              {openIndex === index ? (
                <ChevronUp className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              )}
            </button>
            {openIndex === index && (
              <p className="text-sm text-zinc-600 pb-4 leading-relaxed">{faq.answer}</p>
            )}
          </div>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }),
        }}
      />
    </section>
  );
}
