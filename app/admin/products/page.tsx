"use client"

import { useEffect, useRef, useState, type DragEvent } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { InlineUploader } from "@/components/inline-uploader";
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Package, GripVertical } from "lucide-react";
import { extractCourseResourceLinks, type CourseResourceLink } from "@/lib/products/courseResourceLinks";
import { extractOrderBumpMeta } from "@/lib/products/orderBump";

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: string;
  price_type: string;
  price: number;
  thumbnail_url: string | null;
  download_url: string | null;
  external_url: string | null;
  visibility: string;
  meta?: unknown;
}

interface CourseResourceDraft {
  id: string;
  label: string;
  url: string;
}

function makeResourceId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMeta(meta: unknown): Record<string, any> {
  if (typeof meta === "object" && meta !== null && !Array.isArray(meta)) {
    return { ...(meta as Record<string, any>) };
  }
  if (typeof meta === "string") {
    try {
      const parsed = JSON.parse(meta);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, any>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

function toResourceDraft(resource: CourseResourceLink): CourseResourceDraft {
  return { id: makeResourceId(), label: resource.label, url: resource.url };
}

function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;
  const resourceFilesInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingResourceFiles, setIsUploadingResourceFiles] = useState(false);
  const [resourceUploadError, setResourceUploadError] = useState<string | null>(null);
  const [courseResources, setCourseResources] = useState<CourseResourceDraft[]>([]);
  const [draggingResourceId, setDraggingResourceId] = useState<string | null>(null);
  const [isResourceDropActive, setIsResourceDropActive] = useState(false);
  const [slugEditedManually, setSlugEditedManually] = useState(false);
  const [priceInput, setPriceInput] = useState("0.00");
  const [baseMeta, setBaseMeta] = useState<Record<string, any>>({});
  const [orderBumpForm, setOrderBumpForm] = useState({
    productId: "",
    headline: "",
    description: "",
    ctaLabel: "",
  });
  
  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    description: "",
    type: "app",
    price_type: "free",
    price: 0,
    thumbnail_url: "",
    download_url: "",
    external_url: "",
    visibility: "public",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await fetch("/api/admin/products", { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    
    const raw = await res.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const message =
        data?.error ||
        data?.detail ||
        (raw && raw.length < 300 ? raw : null) ||
        `Upload failed (HTTP ${res.status})`;
      throw new Error(message);
    }

    if (!data.fileUrl) throw new Error("No file URL returned");
    return data.fileUrl;
  };

  const upsertCourseResource = (id: string, field: "label" | "url", value: string) => {
    setCourseResources((prev) =>
      prev.map((resource) => (resource.id === id ? { ...resource, [field]: value } : resource))
    );
  };

  const addEmptyCourseResource = () => {
    setCourseResources((prev) => [...prev, { id: makeResourceId(), label: "", url: "" }]);
  };

  const removeCourseResource = (id: string) => {
    setCourseResources((prev) => prev.filter((resource) => resource.id !== id));
  };

  const reorderCourseResource = (draggedId: string, targetId: string) => {
    if (!draggedId || !targetId || draggedId === targetId) return;
    setCourseResources((prev) => {
      const fromIndex = prev.findIndex((resource) => resource.id === draggedId);
      const toIndex = prev.findIndex((resource) => resource.id === targetId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleResourceDragStart = (event: DragEvent<HTMLButtonElement>, resourceId: string) => {
    setDraggingResourceId(resourceId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", resourceId);
  };

  const handleResourceDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleResourceDrop = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    const sourceId = draggingResourceId || event.dataTransfer.getData("text/plain");
    reorderCourseResource(sourceId, targetId);
    setDraggingResourceId(null);
  };

  const handleResourceDragEnd = () => {
    setDraggingResourceId(null);
  };

  const handleCourseResourceFilesUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsUploadingResourceFiles(true);
    setResourceUploadError(null);
    const files = Array.from(fileList);

    const nextResources: CourseResourceDraft[] = [];
    const failedFiles: string[] = [];

    for (const file of files) {
      try {
        const url = await handleFileUpload(file);
        nextResources.push({
          id: makeResourceId(),
          label: file.name.replace(/\.[^/.]+$/, ""),
          url,
        });
      } catch (error) {
        console.error("Failed to upload course resource file:", error);
        failedFiles.push(file.name);
      }
    }

    if (nextResources.length > 0) {
      setCourseResources((prev) => [...prev, ...nextResources]);
    }

    if (failedFiles.length > 0) {
      const suffix = failedFiles.length > 3 ? ` and ${failedFiles.length - 3} more` : "";
      setResourceUploadError(
        `Some files failed to upload: ${failedFiles.slice(0, 3).join(", ")}${suffix}`
      );
    }

    if (resourceFilesInputRef.current) {
      resourceFilesInputRef.current.value = "";
    }
    setIsUploadingResourceFiles(false);
  };

  const handleResourceFilesDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsResourceDropActive(true);
  };

  const handleResourceFilesDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsResourceDropActive(false);
  };

  const handleResourceFilesDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsResourceDropActive(false);
    void handleCourseResourceFilesUpload(event.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (formData.price_type === "one_time" && formData.price <= 0) {
        alert("One-time products must have a price greater than $0.00.");
        return;
      }

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";
      
      const method = editingProduct ? "PUT" : "POST";
      
      const cleanedResources = courseResources
        .map((resource) => ({
          label: resource.label.trim(),
          url: resource.url.trim(),
        }))
        .filter((resource) => resource.label && resource.url);

      const nextMeta = { ...baseMeta };

      const orderBumpId = Number.parseInt(orderBumpForm.productId, 10);
      if (Number.isFinite(orderBumpId) && orderBumpId > 0) {
        if (editingProduct && Number.parseInt(String(editingProduct.id), 10) === orderBumpId) {
          alert("Order bump product must be different from the main product.");
          return;
        }

        nextMeta.order_bump = {
          product_id: orderBumpId,
          ...(orderBumpForm.headline.trim() ? { headline: orderBumpForm.headline.trim() } : {}),
          ...(orderBumpForm.description.trim() ? { description: orderBumpForm.description.trim() } : {}),
          ...(orderBumpForm.ctaLabel.trim() ? { cta_label: orderBumpForm.ctaLabel.trim() } : {}),
        };
      } else {
        delete nextMeta.order_bump;
      }

      if (formData.type === "course" || formData.type === "video") {
        if (cleanedResources.length > 0) {
          nextMeta.course_resources = cleanedResources;
        } else {
          delete nextMeta.course_resources;
        }
      } else {
        delete nextMeta.course_resources;
      }

      const payload = {
        ...formData,
        price: formData.price_type === "free" ? 0 : formData.price,
        meta: Object.keys(nextMeta).length > 0 ? nextMeta : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await loadProducts();
        resetForm();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save product");
      }
    } catch (error) {
      console.error("Failed to save product:", error);
      alert("Failed to save product");
    }
  };

  const handleEdit = (product: Product) => {
    const normalizedMeta = normalizeMeta(product.meta);
    const orderBumpMeta = extractOrderBumpMeta(normalizedMeta);
    setEditingProduct(product);
    setFormData({
      slug: product.slug,
      name: product.name,
      description: product.description,
      type: product.type,
      price_type: product.price_type,
      price: Math.round(parseFloat(product.price as any)),
      thumbnail_url: product.thumbnail_url || "",
      download_url: product.download_url || "",
      external_url: product.external_url || "",
      visibility: product.visibility,
    });
    setBaseMeta(normalizedMeta);
    setOrderBumpForm({
      productId: orderBumpMeta ? String(orderBumpMeta.product_id) : "",
      headline: orderBumpMeta?.headline || "",
      description: orderBumpMeta?.description || "",
      ctaLabel: orderBumpMeta?.cta_label || "",
    });
    setCourseResources(extractCourseResourceLinks(normalizedMeta).map(toResourceDraft));
    setResourceUploadError(null);
    setSlugEditedManually(true);
    setPriceInput((product.price / 100).toFixed(2));
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadProducts();
      } else {
        alert("Failed to delete product");
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product");
    }
  };

  const resetForm = () => {
    setFormData({
      slug: "",
      name: "",
      description: "",
      type: "app",
      price_type: "free",
      price: 0,
      thumbnail_url: "",
      download_url: "",
      external_url: "",
      visibility: "public",
    });
    setBaseMeta({});
    setOrderBumpForm({
      productId: "",
      headline: "",
      description: "",
      ctaLabel: "",
    });
    setCourseResources([]);
    setResourceUploadError(null);
    setIsUploadingResourceFiles(false);
    setIsResourceDropActive(false);
    setSlugEditedManually(false);
    setPriceInput("0.00");
    setEditingProduct(null);
    setShowForm(false);
  };

  const filteredProducts = products.filter(product => {
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.slug.toLowerCase().includes(query) ||
      product.type.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const isCourseType = formData.type === "course" || formData.type === "video";
  const showExternalUrlField = formData.type === "app" || isCourseType;
  const currentEditingId = editingProduct ? Number.parseInt(String(editingProduct.id), 10) : null;
  const orderBumpOptions = products
    .filter((product) => {
      const productId = Number.parseInt(String(product.id), 10);
      if (!Number.isFinite(productId) || productId <= 0) return false;
      if (currentEditingId && productId === currentEditingId) return false;
      if (product.price_type === "free") return false;
      if (Number(product.price) <= 0) return false;
      if (product.visibility !== "public") return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-orange-500" />
              Products
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your digital products and downloads
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-12 h-12"
          />
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingProduct ? "Edit Product" : "Add New Product"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Slug (URL-friendly)"
                    value={formData.slug}
                    onChange={(e) => {
                      const nextSlug = generateSlug(e.target.value);
                      setFormData({ ...formData, slug: nextSlug });
                      setSlugEditedManually(nextSlug.length > 0);
                    }}
                    required
                  />
                  <Input
                    placeholder="Product Name"
                    value={formData.name}
                    onChange={(e) => {
                      const nextName = e.target.value;
                      if (!editingProduct && !slugEditedManually) {
                        setFormData({
                          ...formData,
                          name: nextName,
                          slug: generateSlug(nextName),
                        });
                        return;
                      }
                      setFormData({ ...formData, name: nextName });
                    }}
                    required
                  />
                </div>

                <Textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />

                <div className="grid md:grid-cols-3 gap-4">
                  <select
                    className="border rounded px-3 py-2"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="app">App</option>
                    <option value="course">Course</option>
                    <option value="video">Video (Legacy)</option>
                    <option value="download">Download</option>
                    <option value="funnel">Template</option>
                    <option value="freebie">Freebie</option>
                    <option value="invisible">Invisible</option>
                  </select>

                  <select
                    className="border rounded px-3 py-2"
                    value={formData.price_type}
                    onChange={(e) => setFormData({ ...formData, price_type: e.target.value })}
                  >
                    <option value="free">Free</option>
                    <option value="one_time">One-time</option>
                  </select>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="10.00"
                      className="pl-8"
                      value={priceInput}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/[^0-9.]/g, "");
                        if (!/^\d*\.?\d{0,2}$/.test(rawValue)) return;
                        setPriceInput(rawValue);
                        const parsed = parseFloat(rawValue);
                        setFormData({
                          ...formData,
                          price: Number.isFinite(parsed) ? Math.round(parsed * 100) : 0,
                        });
                      }}
                      onBlur={() => {
                        const parsed = parseFloat(priceInput);
                        const normalized = Number.isFinite(parsed) ? parsed : 0;
                        setPriceInput(normalized.toFixed(2));
                        setFormData({ ...formData, price: Math.round(normalized * 100) });
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50/40 p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Order Bump (Optional)</p>
                    <p className="text-xs text-gray-600">
                      Show a one-click add-on offer on this product sales page.
                    </p>
                  </div>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={orderBumpForm.productId}
                    onChange={(e) => setOrderBumpForm((prev) => ({ ...prev, productId: e.target.value }))}
                  >
                    <option value="">No order bump</option>
                    {orderBumpOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} - ${(Number(option.price) / 100).toFixed(2)}
                      </option>
                    ))}
                  </select>
                  {orderBumpOptions.length === 0 && (
                    <p className="text-xs text-gray-500">
                      Create at least one paid public product to use as an order bump.
                    </p>
                  )}

                  <div className="grid gap-2 md:grid-cols-2">
                    <Input
                      placeholder="Order bump headline (optional)"
                      value={orderBumpForm.headline}
                      onChange={(e) => setOrderBumpForm((prev) => ({ ...prev, headline: e.target.value }))}
                    />
                    <Input
                      placeholder="Checkbox label (optional)"
                      value={orderBumpForm.ctaLabel}
                      onChange={(e) => setOrderBumpForm((prev) => ({ ...prev, ctaLabel: e.target.value }))}
                    />
                  </div>
                  <Textarea
                    placeholder="Order bump description (optional)"
                    rows={2}
                    value={orderBumpForm.description}
                    onChange={(e) => setOrderBumpForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Thumbnail Image</label>
                  <InlineUploader
                    onUpload={async (file) => {
                      const url = await handleFileUpload(file);
                      setFormData({ ...formData, thumbnail_url: url });
                      return url;
                    }}
                    accept="image/*"
                    maxSize={20971520}
                    currentUrl={formData.thumbnail_url}
                    onRemove={() => setFormData({ ...formData, thumbnail_url: "" })}
                    placeholder="Drop your image here or click to browse"
                    showPreview={true}
                  />
                </div>

                {showExternalUrlField && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {isCourseType ? "Course Video URL" : "External URL (for apps)"}
                    </label>
                    <Input
                      placeholder={
                        isCourseType
                          ? "https://youtube.com/watch?v=..."
                          : "https://your-app-url.com"
                      }
                      value={formData.external_url}
                      onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                    />
                    {isCourseType && (
                      <p className="text-xs text-gray-500">
                        Add your hosted lesson URL (YouTube, Vimeo, Loom, etc). Purchased users will watch from
                        their course page in Dashboard.
                      </p>
                    )}
                  </div>
                )}

                {!isCourseType && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Download File</label>
                    <InlineUploader
                      onUpload={async (file) => {
                        const url = await handleFileUpload(file);
                        setFormData({ ...formData, download_url: url });
                        return url;
                      }}
                      maxSize={524288000}
                      currentUrl={formData.download_url}
                      onRemove={() => setFormData({ ...formData, download_url: "" })}
                      placeholder="Drop your file here or click to browse"
                      showPreview={false}
                    />
                  </div>
                )}

                {isCourseType && (
                  <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Course Resources (Multi-file)</p>
                        <p className="text-xs text-gray-600">
                          Add multiple downloadable files/links, then drag to reorder. This order appears on the student course page.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          ref={resourceFilesInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => void handleCourseResourceFilesUpload(e.target.files)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => resourceFilesInputRef.current?.click()}
                          disabled={isUploadingResourceFiles}
                        >
                          {isUploadingResourceFiles ? "Uploading..." : "Upload Files"}
                        </Button>
                        <Button type="button" variant="outline" onClick={addEmptyCourseResource}>
                          Add Link
                        </Button>
                      </div>
                    </div>

                    <div
                      onDragOver={handleResourceFilesDragOver}
                      onDragLeave={handleResourceFilesDragLeave}
                      onDrop={handleResourceFilesDrop}
                      onClick={() => resourceFilesInputRef.current?.click()}
                      className={`rounded-md border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${
                        isResourceDropActive
                          ? "border-orange-500 bg-orange-100/70"
                          : "border-orange-300 bg-white hover:bg-orange-50"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-800">
                        Drag and drop multiple files here
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        or click to browse and select multiple files
                      </p>
                    </div>

                    {resourceUploadError && (
                      <p className="text-xs text-red-600">{resourceUploadError}</p>
                    )}

                    {courseResources.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        No extra resource files yet. Upload files or add direct links.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {courseResources.map((resource) => (
                          <div
                            key={resource.id}
                            className={`grid gap-2 md:grid-cols-[auto_1fr_2fr_auto] ${
                              draggingResourceId === resource.id ? "opacity-60" : ""
                            }`}
                            onDragOver={handleResourceDragOver}
                            onDrop={(event) => handleResourceDrop(event, resource.id)}
                          >
                            <button
                              type="button"
                              draggable
                              onDragStart={(event) => handleResourceDragStart(event, resource.id)}
                              onDragEnd={handleResourceDragEnd}
                              className="flex items-center justify-center rounded border border-gray-200 bg-white px-2 text-gray-500 cursor-grab active:cursor-grabbing"
                              title="Drag to reorder"
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>
                            <Input
                              placeholder="Resource name"
                              value={resource.label}
                              onChange={(e) => upsertCourseResource(resource.id, "label", e.target.value)}
                            />
                            <Input
                              placeholder="https://...resource-file.zip"
                              value={resource.url}
                              onChange={(e) => upsertCourseResource(resource.id, "url", e.target.value)}
                            />
                            <Button type="button" variant="ghost" onClick={() => removeCourseResource(resource.id)}>
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                    {editingProduct ? "Update Product" : "Create Product"}
                  </Button>
                  <Button type="button" onClick={resetForm} variant="outline">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProducts.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                {product.thumbnail_url && (
                  <div className="w-full h-40 bg-gray-100 rounded mb-4 relative overflow-hidden flex items-center justify-center">
                    <img
                      src={product.thumbnail_url}
                      alt={product.name}
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                )}
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{product.type}</Badge>
                  <Badge variant="secondary">
                    {product.price_type === "free" ? "Free" : `$${(product.price / 100).toFixed(2)}`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => handleEdit(product)} variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => handleDelete(product.id)} variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {searchQuery ? `No products found matching "${searchQuery}"` : 'No products yet. Click "Add Product" to get started.'}
              </p>
            </CardContent>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
