"use client"

import { useEffect, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { InlineUploader } from "@/components/inline-uploader";
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Package, GripVertical, Wand2 } from "lucide-react";
import { extractBundleMeta } from "@/lib/products/bundleMeta";
import { extractCourseResourceLinks, type CourseResourceLink } from "@/lib/products/courseResourceLinks";
import { extractOrderBumpMeta } from "@/lib/products/orderBump";
import { extractPostPurchaseOffersMeta } from "@/lib/products/postPurchaseOffers";
import {
  extractSalesPageMeta,
  type SalesPageFaqItem,
  type SalesPagePainPoint,
  type SalesPageStep,
  type SalesPageTemplateId,
} from "@/lib/products/salesPageTemplate";

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

interface SalesPageFormState {
  templateId: SalesPageTemplateId;
  heroHeadline: string;
  heroSubheadline: string;
  heroSupportingText: string;
  heroImageUrl: string;
  promisePointsText: string;
  featureBulletsText: string;
  faqText: string;
  guaranteeText: string;
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  painPointCards: SalesPagePainPoint[];
  stepCards: SalesPageStep[];
}

function makeResourceId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeStepLabel(index: number): string {
  if (index === 0) return "Step One";
  if (index === 1) return "Step Two";
  if (index === 2) return "Step Three";
  return `Step ${index + 1}`;
}

function normalizePainPointCards(value: SalesPagePainPoint[] | undefined): SalesPagePainPoint[] {
  const source = Array.isArray(value) ? value.slice(0, 3) : [];
  const normalized = source.map((item) => ({
    title: (item.title || "").trim(),
    problem: (item.problem || "").trim(),
    solution: (item.solution || "").trim() || undefined,
  }));
  while (normalized.length < 3) {
    normalized.push({ title: "", problem: "", solution: "" });
  }
  return normalized;
}

function normalizeStepCards(value: SalesPageStep[] | undefined): SalesPageStep[] {
  const source = Array.isArray(value) ? value.slice(0, 3) : [];
  const normalized = source.map((item, idx) => ({
    label: (item.label || makeStepLabel(idx)).trim(),
    title: (item.title || "").trim(),
    description: (item.description || "").trim(),
  }));
  while (normalized.length < 3) {
    const nextIndex = normalized.length;
    normalized.push({
      label: makeStepLabel(nextIndex),
      title: "",
      description: "",
    });
  }
  return normalized;
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

function normalizeEditableProductType(type: string): string {
  if (type === "video") return "course";
  return type;
}

function isMembershipPriceType(priceType: string): boolean {
  return priceType === "membership";
}

function isZeroPriceType(priceType: string): boolean {
  return priceType === "free" || isMembershipPriceType(priceType);
}

function formatProductAccessLabel(product: Pick<Product, "price_type" | "price">): string {
  if (product.price_type === "free") return "Free";
  if (isMembershipPriceType(product.price_type)) return "$49 Membership";
  return `$${(Number(product.price || 0) / 100).toFixed(2)}`;
}

function inferResourceLabelFromUrl(url: string): string {
  if (!url) return "Download file";
  try {
    const parsed = new URL(url, "http://localhost");
    const parts = parsed.pathname.split("/").filter(Boolean);
    const fileName = parts[parts.length - 1];
    if (!fileName) return "Download file";
    const normalized = decodeURIComponent(fileName).replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim();
    return normalized || "Download file";
  } catch {
    return "Download file";
  }
}

function toLineList(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toLineText(value: string[] | undefined): string {
  if (!value || value.length === 0) return "";
  return value.join("\n");
}

function parseFaqText(value: string): SalesPageFaqItem[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [questionPart, ...answerParts] = line.split("|");
      const question = questionPart?.trim() || "";
      const answer = answerParts.join("|").trim();
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((item): item is SalesPageFaqItem => Boolean(item));
}

function faqTextFromItems(items: SalesPageFaqItem[] | undefined): string {
  if (!items || items.length === 0) return "";
  return items.map((item) => `${item.question} | ${item.answer}`).join("\n");
}

const DEFAULT_SALES_PAGE_COLORS = {
  primaryColor: "#f97316",
  accentColor: "#7c2d12",
  surfaceColor: "#fff7ed",
  textColor: "#111827",
  mutedTextColor: "#4b5563",
};

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
  const [bundleProductIds, setBundleProductIds] = useState<string[]>([]);
  const [orderBumpForm, setOrderBumpForm] = useState({
    productId: "",
    headline: "",
    description: "",
    ctaLabel: "",
  });
  const [postPurchaseOffersForm, setPostPurchaseOffersForm] = useState({
    upsellProductId: "",
    downsellProductId: "",
    upsellHeadline: "",
    upsellDescription: "",
    upsellCtaLabel: "",
    downsellHeadline: "",
    downsellDescription: "",
    downsellCtaLabel: "",
  });
  const [salesPageForm, setSalesPageForm] = useState<SalesPageFormState>({
    templateId: "default",
    heroHeadline: "",
    heroSubheadline: "",
    heroSupportingText: "",
    heroImageUrl: "",
    promisePointsText: "",
    featureBulletsText: "",
    faqText: "",
    guaranteeText: "",
    primaryColor: DEFAULT_SALES_PAGE_COLORS.primaryColor,
    accentColor: DEFAULT_SALES_PAGE_COLORS.accentColor,
    surfaceColor: DEFAULT_SALES_PAGE_COLORS.surfaceColor,
    textColor: DEFAULT_SALES_PAGE_COLORS.textColor,
    mutedTextColor: DEFAULT_SALES_PAGE_COLORS.mutedTextColor,
    painPointCards: normalizePainPointCards(undefined),
    stepCards: normalizeStepCards(undefined),
  });

  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    description: "",
    type: "app",
    price_type: "membership",
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
      const selectedBundleProductIds = Array.from(
        new Set(
          bundleProductIds
            .map((value) => Number.parseInt(value, 10))
            .filter((value) => Number.isFinite(value) && value > 0)
        )
      );

      if (editingProduct) {
        const editingId = Number.parseInt(String(editingProduct.id), 10);
        if (selectedBundleProductIds.includes(editingId)) {
          alert("A bundle cannot include itself.");
          return;
        }
      }

      if (selectedBundleProductIds.length > 0) {
        nextMeta.bundle = {
          included_product_ids: selectedBundleProductIds,
        };
      } else {
        delete nextMeta.bundle;
      }

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

      const upsellProductId = Number.parseInt(postPurchaseOffersForm.upsellProductId, 10);
      const downsellProductId = Number.parseInt(postPurchaseOffersForm.downsellProductId, 10);
      const hasUpsell = Number.isFinite(upsellProductId) && upsellProductId > 0;
      const hasDownsell = Number.isFinite(downsellProductId) && downsellProductId > 0;

      if (editingProduct) {
        const editingId = Number.parseInt(String(editingProduct.id), 10);
        if (hasUpsell && upsellProductId === editingId) {
          alert("Upsell product must be different from the main product.");
          return;
        }
        if (hasDownsell && downsellProductId === editingId) {
          alert("Downsell product must be different from the main product.");
          return;
        }
      }

      if (hasUpsell || hasDownsell) {
        nextMeta.post_purchase_offers = {
          ...(hasUpsell ? { upsell_product_id: upsellProductId } : {}),
          ...(hasDownsell ? { downsell_product_id: downsellProductId } : {}),
          ...(postPurchaseOffersForm.upsellHeadline.trim()
            ? { upsell_headline: postPurchaseOffersForm.upsellHeadline.trim() }
            : {}),
          ...(postPurchaseOffersForm.upsellDescription.trim()
            ? { upsell_description: postPurchaseOffersForm.upsellDescription.trim() }
            : {}),
          ...(postPurchaseOffersForm.upsellCtaLabel.trim()
            ? { upsell_cta_label: postPurchaseOffersForm.upsellCtaLabel.trim() }
            : {}),
          ...(postPurchaseOffersForm.downsellHeadline.trim()
            ? { downsell_headline: postPurchaseOffersForm.downsellHeadline.trim() }
            : {}),
          ...(postPurchaseOffersForm.downsellDescription.trim()
            ? { downsell_description: postPurchaseOffersForm.downsellDescription.trim() }
            : {}),
          ...(postPurchaseOffersForm.downsellCtaLabel.trim()
            ? { downsell_cta_label: postPurchaseOffersForm.downsellCtaLabel.trim() }
            : {}),
        };
      } else {
        delete nextMeta.post_purchase_offers;
      }

      if (salesPageForm.templateId === "longform_offer_v1") {
        const promisePoints = toLineList(salesPageForm.promisePointsText);
        const featureBullets = toLineList(salesPageForm.featureBulletsText);
        const faqItems = parseFaqText(salesPageForm.faqText);
        const painPoints = salesPageForm.painPointCards
          .map((item) => ({
            title: item.title.trim(),
            problem: item.problem.trim(),
            solution: (item.solution || "").trim(),
          }))
          .filter((item) => item.title && item.problem)
          .map((item) => ({
            title: item.title,
            problem: item.problem,
            ...(item.solution ? { solution: item.solution } : {}),
          }));
        const steps = salesPageForm.stepCards
          .map((item, idx) => ({
            label: (item.label || makeStepLabel(idx)).trim(),
            title: item.title.trim(),
            description: item.description.trim(),
          }))
          .filter((item) => item.title && item.description);

        nextMeta.sales_page = {
          template_id: "longform_offer_v1",
          ...(salesPageForm.heroHeadline.trim() ? { hero_headline: salesPageForm.heroHeadline.trim() } : {}),
          ...(salesPageForm.heroSubheadline.trim()
            ? { hero_subheadline: salesPageForm.heroSubheadline.trim() }
            : {}),
          ...(salesPageForm.heroSupportingText.trim()
            ? { hero_supporting_text: salesPageForm.heroSupportingText.trim() }
            : {}),
          ...(salesPageForm.heroImageUrl.trim() ? { hero_image_url: salesPageForm.heroImageUrl.trim() } : {}),
          ...(promisePoints.length > 0 ? { promise_points: promisePoints } : {}),
          ...(painPoints.length > 0 ? { pain_points: painPoints } : {}),
          ...(steps.length > 0 ? { steps } : {}),
          ...(featureBullets.length > 0 ? { feature_bullets: featureBullets } : {}),
          ...(faqItems.length > 0 ? { faq: faqItems } : {}),
          ...(salesPageForm.guaranteeText.trim()
            ? { guarantee_text: salesPageForm.guaranteeText.trim() }
            : {}),
          theme: {
            primary_color: salesPageForm.primaryColor,
            accent_color: salesPageForm.accentColor,
            surface_color: salesPageForm.surfaceColor,
            text_color: salesPageForm.textColor,
            muted_text_color: salesPageForm.mutedTextColor,
          },
        };
      } else {
        delete nextMeta.sales_page;
      }

      if (cleanedResources.length > 0) {
        nextMeta.course_resources = cleanedResources;
      } else {
        delete nextMeta.course_resources;
      }

      const primaryDownloadUrl = cleanedResources[0]?.url || "";

      const payload = {
        ...formData,
        price: isZeroPriceType(formData.price_type) ? 0 : formData.price,
        download_url: primaryDownloadUrl || null,
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
    const bundleMeta = extractBundleMeta(normalizedMeta);
    const orderBumpMeta = extractOrderBumpMeta(normalizedMeta);
    const postPurchaseOffersMeta = extractPostPurchaseOffersMeta(normalizedMeta);
    const salesPageMeta = extractSalesPageMeta(normalizedMeta);
    setEditingProduct(product);
    setFormData({
      slug: product.slug,
      name: product.name,
      description: product.description,
      type: normalizeEditableProductType(product.type),
      price_type: product.price_type,
      price: Math.round(parseFloat(product.price as any)),
      thumbnail_url: product.thumbnail_url || "",
      download_url: product.download_url || "",
      external_url: product.external_url || "",
      visibility: product.visibility,
    });
    setBaseMeta(normalizedMeta);
    setBundleProductIds(bundleMeta?.included_product_ids.map((id) => String(id)) || []);
    setOrderBumpForm({
      productId: orderBumpMeta ? String(orderBumpMeta.product_id) : "",
      headline: orderBumpMeta?.headline || "",
      description: orderBumpMeta?.description || "",
      ctaLabel: orderBumpMeta?.cta_label || "",
    });
    setPostPurchaseOffersForm({
      upsellProductId: postPurchaseOffersMeta?.upsell_product_id
        ? String(postPurchaseOffersMeta.upsell_product_id)
        : "",
      downsellProductId: postPurchaseOffersMeta?.downsell_product_id
        ? String(postPurchaseOffersMeta.downsell_product_id)
        : "",
      upsellHeadline: postPurchaseOffersMeta?.upsell_headline || "",
      upsellDescription: postPurchaseOffersMeta?.upsell_description || "",
      upsellCtaLabel: postPurchaseOffersMeta?.upsell_cta_label || "",
      downsellHeadline: postPurchaseOffersMeta?.downsell_headline || "",
      downsellDescription: postPurchaseOffersMeta?.downsell_description || "",
      downsellCtaLabel: postPurchaseOffersMeta?.downsell_cta_label || "",
    });
    setSalesPageForm({
      templateId: salesPageMeta?.template_id || "default",
      heroHeadline: salesPageMeta?.hero_headline || "",
      heroSubheadline: salesPageMeta?.hero_subheadline || "",
      heroSupportingText: salesPageMeta?.hero_supporting_text || "",
      heroImageUrl: salesPageMeta?.hero_image_url || "",
      promisePointsText: toLineText(salesPageMeta?.promise_points),
      featureBulletsText: toLineText(salesPageMeta?.feature_bullets),
      faqText: faqTextFromItems(salesPageMeta?.faq),
      guaranteeText: salesPageMeta?.guarantee_text || "",
      primaryColor: salesPageMeta?.theme?.primary_color || DEFAULT_SALES_PAGE_COLORS.primaryColor,
      accentColor: salesPageMeta?.theme?.accent_color || DEFAULT_SALES_PAGE_COLORS.accentColor,
      surfaceColor: salesPageMeta?.theme?.surface_color || DEFAULT_SALES_PAGE_COLORS.surfaceColor,
      textColor: salesPageMeta?.theme?.text_color || DEFAULT_SALES_PAGE_COLORS.textColor,
      mutedTextColor: salesPageMeta?.theme?.muted_text_color || DEFAULT_SALES_PAGE_COLORS.mutedTextColor,
      painPointCards: normalizePainPointCards(salesPageMeta?.pain_points),
      stepCards: normalizeStepCards(salesPageMeta?.steps),
    });
    const extractedResources = extractCourseResourceLinks(normalizedMeta).map(toResourceDraft);
    if (extractedResources.length === 0 && product.download_url) {
      extractedResources.push({
        id: makeResourceId(),
        label: inferResourceLabelFromUrl(product.download_url),
        url: product.download_url,
      });
    }
    setCourseResources(extractedResources);
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
      price_type: "membership",
      price: 0,
      thumbnail_url: "",
      download_url: "",
      external_url: "",
      visibility: "public",
    });
    setBaseMeta({});
    setBundleProductIds([]);
    setOrderBumpForm({
      productId: "",
      headline: "",
      description: "",
      ctaLabel: "",
    });
    setPostPurchaseOffersForm({
      upsellProductId: "",
      downsellProductId: "",
      upsellHeadline: "",
      upsellDescription: "",
      upsellCtaLabel: "",
      downsellHeadline: "",
      downsellDescription: "",
      downsellCtaLabel: "",
    });
    setSalesPageForm({
      templateId: "default",
      heroHeadline: "",
      heroSubheadline: "",
      heroSupportingText: "",
      heroImageUrl: "",
      promisePointsText: "",
      featureBulletsText: "",
      faqText: "",
      guaranteeText: "",
      primaryColor: DEFAULT_SALES_PAGE_COLORS.primaryColor,
      accentColor: DEFAULT_SALES_PAGE_COLORS.accentColor,
      surfaceColor: DEFAULT_SALES_PAGE_COLORS.surfaceColor,
      textColor: DEFAULT_SALES_PAGE_COLORS.textColor,
      mutedTextColor: DEFAULT_SALES_PAGE_COLORS.mutedTextColor,
      painPointCards: normalizePainPointCards(undefined),
      stepCards: normalizeStepCards(undefined),
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
  const postPurchaseOfferOptions = orderBumpOptions;
  const bundleOptions = products
    .filter((product) => {
      const productId = Number.parseInt(String(product.id), 10);
      if (!Number.isFinite(productId) || productId <= 0) return false;
      if (currentEditingId && productId === currentEditingId) return false;
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

                <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50/40 p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Sales Page Template</p>
                    <p className="text-xs text-gray-600">
                      Choose how the product sales page is rendered.
                    </p>
                  </div>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={salesPageForm.templateId}
                    onChange={(e) => {
                      const nextTemplate = (e.target.value as SalesPageTemplateId) || "default";
                      setSalesPageForm((prev) => ({
                        ...prev,
                        templateId: nextTemplate,
                      }));
                    }}
                  >
                    <option value="default">Default (Simple)</option>
                    <option value="longform_offer_v1">Long-form Offer v1</option>
                  </select>

                  {salesPageForm.templateId === "longform_offer_v1" && (
                    <div className="rounded-md border border-gray-200 bg-white p-3">
                      <p className="text-sm text-gray-700">
                        Live visual editing is now in the dedicated builder.
                      </p>
                      {editingProduct ? (
                        <Button type="button" variant="outline" className="mt-2" asChild>
                          <Link href={`/admin/products/${editingProduct.id}/builder`}>
                            Open Sales Builder
                          </Link>
                        </Button>
                      ) : (
                        <p className="mt-2 text-xs text-gray-500">
                          Create this product first, then open its builder from the product card.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <select
                    className="border rounded px-3 py-2"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="app">App</option>
                    <option value="course">Course</option>
                    <option value="invisible">Invisible</option>
                    <option value="download">Download</option>
                    <option value="funnel">Template</option>
                    <option value="freebie">Freebie</option>
                  </select>

                  <select
                    className="border rounded px-3 py-2"
                    value={formData.price_type}
                    onChange={(e) => {
                      const nextPriceType = e.target.value;
                      if (isZeroPriceType(nextPriceType)) {
                        setPriceInput("0.00");
                        setFormData({ ...formData, price_type: nextPriceType, price: 0 });
                        return;
                      }
                      setFormData({ ...formData, price_type: nextPriceType });
                    }}
                  >
                    <option value="membership">Included in $49 Membership</option>
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
                      disabled={isZeroPriceType(formData.price_type)}
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
                <p className="text-xs text-gray-600">
                  Products marked "Included in $49 Membership" are available to active global subscribers when visibility is Public.
                </p>

                <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50/40 p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Bundle Access (Optional)</p>
                    <p className="text-xs text-gray-600">
                      Buying this product can unlock multiple child products. Use this for multi-module bundles.
                    </p>
                  </div>
                  {bundleOptions.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      Create additional products first, then select which ones this bundle unlocks.
                    </p>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-2">
                      {bundleOptions.map((option) => {
                        const checked = bundleProductIds.includes(String(option.id));
                        return (
                          <label
                            key={`bundle-${option.id}`}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                              checked
                                ? "border-orange-300 bg-white"
                                : "border-orange-100 bg-white/70 hover:border-orange-200"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setBundleProductIds((prev) => {
                                  const next = new Set(prev);
                                  if (e.target.checked) {
                                    next.add(String(option.id));
                                  } else {
                                    next.delete(String(option.id));
                                  }
                                  return Array.from(next);
                                });
                              }}
                              className="mt-1 h-4 w-4 accent-orange-500"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900">{option.name}</p>
                              <p className="text-xs text-gray-600">
                                {option.type} · {option.slug} · {formatProductAccessLabel(option)}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {bundleProductIds.length > 0 && (
                    <p className="text-xs text-gray-600">
                      This purchase will grant access to {bundleProductIds.length} product{bundleProductIds.length === 1 ? "" : "s"}.
                    </p>
                  )}
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

                <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50/40 p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Post-Purchase Funnel (Optional)</p>
                    <p className="text-xs text-gray-600">
                      Show an upsell offer right after checkout, then a downsell if they decline.
                    </p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700">Upsell Product</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={postPurchaseOffersForm.upsellProductId}
                        onChange={(e) =>
                          setPostPurchaseOffersForm((prev) => ({ ...prev, upsellProductId: e.target.value }))
                        }
                      >
                        <option value="">No upsell</option>
                        {postPurchaseOfferOptions.map((option) => (
                          <option key={`upsell-${option.id}`} value={option.id}>
                            {option.name} - ${(Number(option.price) / 100).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700">Downsell Product</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={postPurchaseOffersForm.downsellProductId}
                        onChange={(e) =>
                          setPostPurchaseOffersForm((prev) => ({ ...prev, downsellProductId: e.target.value }))
                        }
                      >
                        <option value="">No downsell</option>
                        {postPurchaseOfferOptions.map((option) => (
                          <option key={`downsell-${option.id}`} value={option.id}>
                            {option.name} - ${(Number(option.price) / 100).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {postPurchaseOfferOptions.length === 0 && (
                    <p className="text-xs text-gray-500">
                      Create paid public products first, then attach them as upsell/downsell offers.
                    </p>
                  )}

                  <div className="grid gap-2 md:grid-cols-2">
                    <Input
                      placeholder="Upsell headline (optional)"
                      value={postPurchaseOffersForm.upsellHeadline}
                      onChange={(e) =>
                        setPostPurchaseOffersForm((prev) => ({ ...prev, upsellHeadline: e.target.value }))
                      }
                    />
                    <Input
                      placeholder="Upsell CTA label (optional)"
                      value={postPurchaseOffersForm.upsellCtaLabel}
                      onChange={(e) =>
                        setPostPurchaseOffersForm((prev) => ({ ...prev, upsellCtaLabel: e.target.value }))
                      }
                    />
                  </div>
                  <Textarea
                    rows={2}
                    placeholder="Upsell description (optional)"
                    value={postPurchaseOffersForm.upsellDescription}
                    onChange={(e) =>
                      setPostPurchaseOffersForm((prev) => ({ ...prev, upsellDescription: e.target.value }))
                    }
                  />

                  <div className="grid gap-2 md:grid-cols-2">
                    <Input
                      placeholder="Downsell headline (optional)"
                      value={postPurchaseOffersForm.downsellHeadline}
                      onChange={(e) =>
                        setPostPurchaseOffersForm((prev) => ({ ...prev, downsellHeadline: e.target.value }))
                      }
                    />
                    <Input
                      placeholder="Downsell CTA label (optional)"
                      value={postPurchaseOffersForm.downsellCtaLabel}
                      onChange={(e) =>
                        setPostPurchaseOffersForm((prev) => ({ ...prev, downsellCtaLabel: e.target.value }))
                      }
                    />
                  </div>
                  <Textarea
                    rows={2}
                    placeholder="Downsell description (optional)"
                    value={postPurchaseOffersForm.downsellDescription}
                    onChange={(e) =>
                      setPostPurchaseOffersForm((prev) => ({ ...prev, downsellDescription: e.target.value }))
                    }
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

                <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Product Files (Multi-file)</p>
                      <p className="text-xs text-gray-600">
                        Add multiple downloadable files/links, then drag to reorder. The first file is used as the main download button.
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
                      No files yet. Upload files or add direct links.
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
                            placeholder="https://...resource-file.zip or /api/files/..."
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
          {paginatedProducts.map((product) => {
            const bundleMeta = extractBundleMeta(normalizeMeta(product.meta));

            return (
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
                  <CardTitle className="text-lg">
                    <Link
                      href={`/products/${product.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-orange-600 hover:underline"
                    >
                      {product.name}
                    </Link>
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{product.type}</Badge>
                    <Badge variant="secondary">
                      {formatProductAccessLabel(product)}
                    </Badge>
                    {bundleMeta && (
                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                        Bundle · {bundleMeta.included_product_ids.length}
                      </Badge>
                    )}
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
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/products/${product.id}/builder`}>
                        <Wand2 className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button onClick={() => handleDelete(product.id)} variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
