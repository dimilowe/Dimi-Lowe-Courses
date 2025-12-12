"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ShoppingCart, ShoppingBag, Plus, Trash2, ExternalLink, Search, Tag, X, Copy, Check, Share2, Edit2, Save, Grid, List, Link2 } from "lucide-react";

const STORE_GRADIENTS: Record<string, [string, string]> = {
  "amazon.com": ["f97316", "ea580c"],
  "amazon.co.uk": ["f97316", "ea580c"],
  "ebay.com": ["0064d2", "3665f3"],
  "walmart.com": ["0071ce", "004c91"],
  "target.com": ["cc0000", "990000"],
  "bestbuy.com": ["0046be", "003da5"],
  "nordstrom.com": ["1e3a5f", "2c5282"],
  "macys.com": ["e21a2c", "b91c1c"],
  "shein.com": ["000000", "1a1a1a"],
  "us.shein.com": ["000000", "1a1a1a"],
  "asos.com": ["2d2d2d", "1a1a1a"],
  "zara.com": ["000000", "262626"],
  "hm.com": ["cc071e", "a30517"],
  "uniqlo.com": ["ff0000", "cc0000"],
  "etsy.com": ["f1641e", "d35400"],
  "aliexpress.com": ["e62e04", "ff4747"],
  "wish.com": ["2fb7ec", "17a2b8"],
  "wayfair.com": ["7b189f", "5d1277"],
  "ikea.com": ["0058a3", "ffdb00"],
  "homedepot.com": ["f96302", "e55b00"],
  "lowes.com": ["004990", "003366"],
  "costco.com": ["005daa", "e31837"],
  "sephora.com": ["000000", "1a1a1a"],
  "ulta.com": ["fb6b90", "e91e63"],
  "nike.com": ["111111", "000000"],
  "adidas.com": ["000000", "1a1a1a"],
  "reebok.com": ["cc0000", "990000"],
  "puma.com": ["000000", "1a1a1a"],
  "underarmour.com": ["1d1d1d", "000000"],
  "lululemon.com": ["d31334", "b91c1c"],
  "gap.com": ["000066", "000044"],
  "oldnavy.com": ["003057", "002040"],
  "bananarepublic.com": ["1a1a1a", "000000"],
  "jcrew.com": ["1c355e", "0f1f3d"],
  "anthropologie.com": ["2d2926", "1a1714"],
  "urbanoutfitters.com": ["000000", "1a1a1a"],
  "freepeople.com": ["d4a574", "c49358"],
  "revolve.com": ["000000", "1a1a1a"],
  "shopbop.com": ["000000", "1a1a1a"],
  "ssense.com": ["000000", "1a1a1a"],
  "farfetch.com": ["000000", "1a1a1a"],
  "net-a-porter.com": ["000000", "1a1a1a"],
  "mrporter.com": ["000000", "1a1a1a"],
  "apple.com": ["555555", "1d1d1f"],
  "google.com": ["4285f4", "34a853"],
  "shopping.google.com": ["4285f4", "34a853"],
};

function getStoreColor(domain: string): string {
  const lowerDomain = domain.toLowerCase();
  if (STORE_GRADIENTS[lowerDomain]) {
    return STORE_GRADIENTS[lowerDomain][0];
  }
  for (const [storeDomain, colors] of Object.entries(STORE_GRADIENTS)) {
    if (lowerDomain.includes(storeDomain.split(".")[0])) {
      return colors[0];
    }
  }
  return "10b981";
}

function getStoreName(domain: string): string {
  const parts = domain.split(".");
  if (parts.length >= 2) {
    const name = parts[parts.length - 2];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return domain;
}

interface CartItem {
  id: string;
  url: string;
  title: string;
  image: string;
  description: string;
  price: string;
  notes: string;
  tags: string[];
  savedAt: string;
  domain: string;
}

const STORAGE_KEY = "vcm-universal-cart";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace("www.", "");
  } catch {
    return "";
  }
}

export default function UniversalShoppingCartClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CartItem>>({});
  const [tagInput, setTagInput] = useState("");
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSharedView, setIsSharedView] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cartParam = params.get("cart");
    
    if (cartParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(cartParam)));
        if (Array.isArray(decoded)) {
          setItems(decoded);
          setIsSharedView(true);
        }
      } catch (e) {
        console.error("Failed to load shared cart", e);
      }
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setItems(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to load cart", e);
        }
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized && !isSharedView) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isInitialized, isSharedView]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((item) => item.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.domain.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || item.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [items, searchQuery, selectedTag]);

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;

    try {
      new URL(urlInput);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/fetch-product-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch metadata");
      }

      const newItem: CartItem = {
        id: generateId(),
        url: urlInput,
        title: data.title || "Untitled Product",
        image: data.image || "",
        description: data.description || "",
        price: data.price || "",
        notes: "",
        tags: [],
        savedAt: new Date().toISOString(),
        domain: extractDomain(urlInput),
      };

      setItems((prev) => [newItem, ...prev]);
      setUrlInput("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add item";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleStartEdit = (item: CartItem) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      price: item.price,
      notes: item.notes,
      image: item.image,
    });
    setTagInput("");
  };

  const handleSaveEdit = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              title: editForm.title || item.title,
              price: editForm.price || item.price,
              notes: editForm.notes || "",
              image: editForm.image || item.image,
            }
          : item
      )
    );
    setEditingId(null);
    setEditForm({});
  };

  const handleAddTag = (id: string) => {
    if (!tagInput.trim()) return;
    const tag = tagInput.trim().toLowerCase();
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && !item.tags.includes(tag)
          ? { ...item, tags: [...item.tags, tag] }
          : item
      )
    );
    setTagInput("");
  };

  const handleRemoveTag = (id: string, tag: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, tags: item.tags.filter((t) => t !== tag) } : item
      )
    );
  };

  const handleGenerateShareLink = useCallback(() => {
    const cartData = btoa(encodeURIComponent(JSON.stringify(items)));
    const link = `${window.location.origin}/tools/universal-shopping-cart?cart=${cartData}`;
    setShareLink(link);
  }, [items]);

  const handleCopyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };


  const totalValue = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price.replace(/[^0-9.]/g, ""));
      return isNaN(price) ? sum : sum + price;
    }, 0);
  }, [items]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-emerald-500 px-6 py-5 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Your Universal Cart</h2>
            <p className="text-emerald-100 text-sm">
              {items.length} item{items.length !== 1 ? "s" : ""} saved
              {totalValue > 0 && ` · ~$${totalValue.toFixed(2)} total`}
            </p>
          </div>
        </div>
      </div>

      {/* URL Input */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
              placeholder="Paste a product URL from any website..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <button
            onClick={handleAddUrl}
            disabled={isLoading || !urlInput.trim()}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Add
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
            <X className="w-4 h-4" /> {error}
          </p>
        )}
      </div>

      {/* Filters & Actions */}
      {items.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-gray-400" />
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedTag === tag
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {selectedTag && (
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${viewMode === "list" ? "bg-white shadow-sm" : ""}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Share Button */}
            <button
              onClick={handleGenerateShareLink}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share Cart
            </button>
          </div>

          {/* Share Link */}
          {shareLink && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none truncate"
              />
              <button
                onClick={handleCopyShareLink}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="p-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {items.length === 0 ? "Your cart is empty" : "No items match your filters"}
            </h3>
            <p className="text-gray-500 text-sm">
              {items.length === 0
                ? "Paste a product URL above to save your first item"
                : "Try adjusting your search or clearing the tag filter"}
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-4"
            }
          >
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow ${
                  viewMode === "list" ? "flex gap-4" : ""
                }`}
              >
                {/* Image or Store Tile */}
                <div
                  className={`${
                    viewMode === "list" ? "w-32 h-32 flex-shrink-0" : "aspect-square"
                  }`}
                >
                  {item.image ? (
                    <div className="w-full h-full bg-gray-100 relative">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                      <div 
                        className="absolute inset-0 flex-col items-center justify-center text-white hidden"
                        style={{
                          backgroundColor: `#${getStoreColor(item.domain)}`
                        }}
                      >
                        <ShoppingBag className="w-10 h-10 mb-2 opacity-90" />
                        <span className="text-sm font-semibold opacity-90">{getStoreName(item.domain)}</span>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center text-white rounded-t-xl"
                      style={{
                        backgroundColor: `#${getStoreColor(item.domain)}`
                      }}
                    >
                      <ShoppingBag className="w-10 h-10 mb-2 opacity-90" />
                      <span className="text-sm font-semibold opacity-90">{getStoreName(item.domain)}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editForm.title || ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, title: e.target.value }))
                        }
                        className="flex-1 font-medium text-gray-900 border border-gray-200 rounded px-2 py-1"
                      />
                    ) : (
                      <h3 className="font-medium text-gray-900 line-clamp-2">{item.title}</h3>
                    )}
                    <span className="text-xs text-gray-400 whitespace-nowrap">{item.domain}</span>
                  </div>

                  {/* Price */}
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editForm.price || ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, price: e.target.value }))
                      }
                      placeholder="Price"
                      className="w-full mb-2 border border-gray-200 rounded px-2 py-1 text-sm"
                    />
                  ) : (
                    item.price && (
                      <p className="text-emerald-600 font-semibold mb-2">{item.price}</p>
                    )
                  )}

                  {/* Notes */}
                  {editingId === item.id ? (
                    <textarea
                      value={editForm.notes || ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      placeholder="Add notes (size, color, wait for sale...)"
                      className="w-full mb-2 border border-gray-200 rounded px-2 py-1 text-sm resize-none"
                      rows={2}
                    />
                  ) : (
                    item.notes && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.notes}</p>
                    )
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                      >
                        {tag}
                        {editingId === item.id && (
                          <button
                            onClick={() => handleRemoveTag(item.id, tag)}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    {editingId === item.id && (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTag(item.id);
                            }
                          }}
                          placeholder="+ tag"
                          className="w-16 text-xs border border-gray-200 rounded px-1.5 py-0.5"
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open on merchant
                    </a>
                    <div className="flex-1" />
                    {editingId === item.id ? (
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Saved date */}
                  <p className="text-xs text-gray-400 mt-2">
                    Saved {new Date(item.savedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
