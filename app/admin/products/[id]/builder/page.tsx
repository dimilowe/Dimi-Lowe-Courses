"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LongformOfferLivePreview } from "@/components/sales-templates/LongformOfferLivePreview";
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

interface SalesPageFormState {
  templateId: SalesPageTemplateId;
  activeTab: "text" | "images" | "colors";
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

const DEFAULT_SALES_PAGE_COLORS = {
  primaryColor: "#f97316",
  accentColor: "#7c2d12",
  surfaceColor: "#fff7ed",
  textColor: "#111827",
  mutedTextColor: "#4b5563",
};

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

function mapSalesMetaToForm(meta: unknown): SalesPageFormState {
  const salesPageMeta = extractSalesPageMeta(meta);
  return {
    templateId: salesPageMeta?.template_id || "longform_offer_v1",
    activeTab: "text",
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
  };
}

function ProductSalesBuilderInner() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [product, setProduct] = useState<Product | null>(null);
  const [salesPageForm, setSalesPageForm] = useState<SalesPageFormState>(() =>
    mapSalesMetaToForm(null)
  );

  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      setLoading(true);
      setError(null);
      setSaveMessage("");
      try {
        const res = await fetch("/api/admin/products", { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load products");
        const found = (data.products || []).find((item: Product) => String(item.id) === String(productId));
        if (!found) throw new Error("Product not found");
        setProduct(found);
        setSalesPageForm(mapSalesMetaToForm(found.meta));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    }

    void loadProduct();
  }, [productId]);

  const livePromisePoints = useMemo(() => {
    const parsed = toLineList(salesPageForm.promisePointsText);
    return parsed.length > 0 ? parsed : ["Clear setup", "Fast implementation", "Better consistency"];
  }, [salesPageForm.promisePointsText]);

  const liveFeatureBullets = useMemo(() => {
    const parsed = toLineList(salesPageForm.featureBulletsText);
    return parsed.length > 0 ? parsed : ["Simple workflow", "Actionable next steps", "Outcome-focused structure"];
  }, [salesPageForm.featureBulletsText]);

  const resetLongformTemplateFields = () => {
    setSalesPageForm((prev) => ({
      ...prev,
      activeTab: "text",
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
    }));
  };

  const saveBuilder = async () => {
    if (!product) return;

    setSaving(true);
    setSaveMessage("");
    setError(null);
    try {
      const nextMeta = normalizeMeta(product.meta);

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

      const payload = {
        slug: product.slug,
        name: product.name,
        description: product.description,
        type: product.type,
        price_type: product.price_type,
        price: product.price,
        thumbnail_url: product.thumbnail_url || null,
        download_url: product.download_url || null,
        external_url: product.external_url || null,
        visibility: product.visibility,
        meta: Object.keys(nextMeta).length > 0 ? nextMeta : null,
      };

      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");

      setProduct(data.product);
      setSaveMessage("Saved");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-500">Loading builder...</div>
    );
  }

  if (error || !product) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error || "Product not found"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">Product Builder</p>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-xs text-gray-500">/products/{product.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products">
            <Button type="button" variant="outline">Back to Products</Button>
          </Link>
          <Link href={`/products/${product.slug}`} target="_blank">
            <Button type="button" variant="outline">Open Sales Page</Button>
          </Link>
          <Button type="button" onClick={saveBuilder} disabled={saving}>
            {saving ? "Saving..." : "Save Builder"}
          </Button>
        </div>
      </div>

      {saveMessage && <p className="text-sm text-green-700">{saveMessage}</p>}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <LongformOfferLivePreview
          productName={product.name}
          productType={product.type}
          productDescription={product.description}
          priceCents={product.price}
          isFree={product.price_type === "free"}
          thumbnailUrl={product.thumbnail_url || undefined}
          heroImageUrl={salesPageForm.heroImageUrl || undefined}
          heroHeadline={salesPageForm.heroHeadline}
          heroSubheadline={salesPageForm.heroSubheadline}
          heroSupportingText={salesPageForm.heroSupportingText}
          promisePoints={livePromisePoints}
          painPoints={salesPageForm.painPointCards}
          steps={salesPageForm.stepCards}
          featureBullets={liveFeatureBullets}
          guaranteeText={salesPageForm.guaranteeText}
          primaryColor={salesPageForm.primaryColor}
          accentColor={salesPageForm.accentColor}
          surfaceColor={salesPageForm.surfaceColor}
          textColor={salesPageForm.textColor}
          mutedTextColor={salesPageForm.mutedTextColor}
        />

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xl font-semibold text-gray-900">Customize Template</p>
          <p className="mt-1 text-sm text-gray-600">Edit text, swap images, and change colors in real time.</p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={salesPageForm.activeTab === "text" ? "default" : "outline"}
              onClick={() => setSalesPageForm((prev) => ({ ...prev, activeTab: "text" }))}
            >
              Text
            </Button>
            <Button
              type="button"
              variant={salesPageForm.activeTab === "images" ? "default" : "outline"}
              onClick={() => setSalesPageForm((prev) => ({ ...prev, activeTab: "images" }))}
            >
              Images
            </Button>
            <Button
              type="button"
              variant={salesPageForm.activeTab === "colors" ? "default" : "outline"}
              onClick={() => setSalesPageForm((prev) => ({ ...prev, activeTab: "colors" }))}
            >
              Colors
            </Button>
          </div>

          <Button type="button" variant="outline" className="mt-2 w-full" onClick={resetLongformTemplateFields}>
            Reset Template
          </Button>

          {salesPageForm.activeTab === "text" && (
            <div className="mt-4 space-y-3">
              <Input
                placeholder="Hero headline"
                value={salesPageForm.heroHeadline}
                onChange={(e) => setSalesPageForm((prev) => ({ ...prev, heroHeadline: e.target.value }))}
              />
              <Textarea
                rows={2}
                placeholder="Hero subheadline"
                value={salesPageForm.heroSubheadline}
                onChange={(e) => setSalesPageForm((prev) => ({ ...prev, heroSubheadline: e.target.value }))}
              />
              <Textarea
                rows={2}
                placeholder="Hero supporting text"
                value={salesPageForm.heroSupportingText}
                onChange={(e) => setSalesPageForm((prev) => ({ ...prev, heroSupportingText: e.target.value }))}
              />
              <Input
                placeholder="Guarantee line"
                value={salesPageForm.guaranteeText}
                onChange={(e) => setSalesPageForm((prev) => ({ ...prev, guaranteeText: e.target.value }))}
              />

              <Textarea
                rows={4}
                placeholder="Promise points (one per line)"
                value={salesPageForm.promisePointsText}
                onChange={(e) => setSalesPageForm((prev) => ({ ...prev, promisePointsText: e.target.value }))}
              />
              <Textarea
                rows={4}
                placeholder="Feature bullets (one per line)"
                value={salesPageForm.featureBulletsText}
                onChange={(e) => setSalesPageForm((prev) => ({ ...prev, featureBulletsText: e.target.value }))}
              />
              <Textarea
                rows={4}
                placeholder="FAQ lines (Question | Answer)"
                value={salesPageForm.faqText}
                onChange={(e) => setSalesPageForm((prev) => ({ ...prev, faqText: e.target.value }))}
              />

              <div className="space-y-2 rounded-md border border-gray-200 p-3">
                <p className="text-xs font-semibold text-gray-800">Pain Point Cards</p>
                {salesPageForm.painPointCards.map((card, idx) => (
                  <div key={`pain-${idx}`} className="space-y-2 rounded-md border border-gray-100 p-2">
                    <p className="text-xs text-gray-600">Card {idx + 1}</p>
                    <Input
                      placeholder="Title"
                      value={card.title}
                      onChange={(e) =>
                        setSalesPageForm((prev) => ({
                          ...prev,
                          painPointCards: prev.painPointCards.map((item, itemIdx) =>
                            itemIdx === idx ? { ...item, title: e.target.value } : item
                          ),
                        }))
                      }
                    />
                    <Textarea
                      rows={2}
                      placeholder="Problem text"
                      value={card.problem}
                      onChange={(e) =>
                        setSalesPageForm((prev) => ({
                          ...prev,
                          painPointCards: prev.painPointCards.map((item, itemIdx) =>
                            itemIdx === idx ? { ...item, problem: e.target.value } : item
                          ),
                        }))
                      }
                    />
                    <Input
                      placeholder="Solution line (optional)"
                      value={card.solution || ""}
                      onChange={(e) =>
                        setSalesPageForm((prev) => ({
                          ...prev,
                          painPointCards: prev.painPointCards.map((item, itemIdx) =>
                            itemIdx === idx ? { ...item, solution: e.target.value } : item
                          ),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-md border border-gray-200 p-3">
                <p className="text-xs font-semibold text-gray-800">3-Step Cards</p>
                {salesPageForm.stepCards.map((card, idx) => (
                  <div key={`step-${idx}`} className="space-y-2 rounded-md border border-gray-100 p-2">
                    <p className="text-xs text-gray-600">Step {idx + 1}</p>
                    <Input
                      placeholder="Label (e.g. Step One)"
                      value={card.label || ""}
                      onChange={(e) =>
                        setSalesPageForm((prev) => ({
                          ...prev,
                          stepCards: prev.stepCards.map((item, itemIdx) =>
                            itemIdx === idx ? { ...item, label: e.target.value } : item
                          ),
                        }))
                      }
                    />
                    <Input
                      placeholder="Title"
                      value={card.title}
                      onChange={(e) =>
                        setSalesPageForm((prev) => ({
                          ...prev,
                          stepCards: prev.stepCards.map((item, itemIdx) =>
                            itemIdx === idx ? { ...item, title: e.target.value } : item
                          ),
                        }))
                      }
                    />
                    <Textarea
                      rows={2}
                      placeholder="Description"
                      value={card.description}
                      onChange={(e) =>
                        setSalesPageForm((prev) => ({
                          ...prev,
                          stepCards: prev.stepCards.map((item, itemIdx) =>
                            itemIdx === idx ? { ...item, description: e.target.value } : item
                          ),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {salesPageForm.activeTab === "images" && (
            <div className="mt-4 space-y-3">
              <Input
                placeholder="Hero image URL (optional)"
                value={salesPageForm.heroImageUrl}
                onChange={(e) => setSalesPageForm((prev) => ({ ...prev, heroImageUrl: e.target.value }))}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  setSalesPageForm((prev) => ({ ...prev, heroImageUrl: product.thumbnail_url || "" }))
                }
              >
                Use Product Thumbnail
              </Button>
              <p className="text-xs text-gray-600">Leave empty to automatically use the product thumbnail.</p>
            </div>
          )}

          {salesPageForm.activeTab === "colors" && (
            <div className="mt-4 space-y-3">
              {[
                { key: "primaryColor", label: "Primary", value: salesPageForm.primaryColor },
                { key: "accentColor", label: "Accent", value: salesPageForm.accentColor },
                { key: "surfaceColor", label: "Surface", value: salesPageForm.surfaceColor },
                { key: "textColor", label: "Text", value: salesPageForm.textColor },
                { key: "mutedTextColor", label: "Muted Text", value: salesPageForm.mutedTextColor },
              ].map((item) => (
                <div key={item.key} className="grid grid-cols-[90px_1fr_auto] items-center gap-2">
                  <label className="text-xs font-medium text-gray-700">{item.label}</label>
                  <Input
                    value={item.value}
                    onChange={(e) =>
                      setSalesPageForm((prev) => ({
                        ...prev,
                        [item.key]: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="color"
                    value={item.value}
                    onChange={(e) =>
                      setSalesPageForm((prev) => ({
                        ...prev,
                        [item.key]: e.target.value,
                      }))
                    }
                    className="h-9 w-10 cursor-pointer rounded border border-gray-300 bg-white p-1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductSalesBuilderPage() {
  return (
    <AdminLayout>
      <ProductSalesBuilderInner />
    </AdminLayout>
  );
}
