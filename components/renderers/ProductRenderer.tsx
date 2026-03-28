'use client';

import { CMSObject } from '@/lib/types/cms';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronDown, ChevronUp, Lightbulb, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface ProductRendererProps {
  cmsObject: CMSObject;
}

function parseCheckoutResponse(raw: string): { error?: string; url?: string } {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as { error?: string; url?: string };
  } catch {
    return { error: raw.trim() || 'Unexpected checkout response' };
  }
}

export function ProductRenderer({ cmsObject }: ProductRendererProps) {
  const { data } = cmsObject;
  const productData = data.product_data;
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  if (!productData) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-red-500">Product data missing for this item.</p>
      </div>
    );
  }

  const handleCheckout = async (overridePriceId?: string, overrideMode?: string, overrideOfferKey?: string) => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          slug: cmsObject.slug,
          ...(overridePriceId && { priceId: overridePriceId }),
          ...(overrideMode && { mode: overrideMode }),
          ...(overrideOfferKey && { offerKey: overrideOfferKey }),
        }),
      });
      const raw = await response.text();
      const result = parseCheckoutResponse(raw);
      if (result.error) {
        console.error('Checkout error:', result.error);
        alert('Checkout error: ' + result.error);
        return;
      }
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {productData.hero_badge && (
              <Badge className="mb-4 bg-orange-100 text-orange-700 border-orange-200">
                {productData.hero_badge}
              </Badge>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {productData.hero_title}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {productData.hero_subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {productData.checkout_strategy === 'external' && productData.cta_primary_href ? (
                <Button
                  size="lg"
                  asChild
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg"
                >
                  <Link href={productData.cta_primary_href} target="_blank" rel="noopener noreferrer">
                    {productData.cta_primary_label}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : productData.checkout_strategy === 'stripe' ? (
                <Button
                  size="lg"
                  onClick={() => handleCheckout()}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg"
                >
                  {productData.cta_primary_label}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : null}
              {productData.cta_secondary_label && productData.cta_secondary_href && (
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-6 text-lg"
                >
                  <Link href={productData.cta_secondary_href} target="_blank" rel="noopener noreferrer">
                    {productData.cta_secondary_label}
                  </Link>
                </Button>
              )}
            </div>

            {productData.additional_prices && productData.additional_prices.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {productData.additional_prices.map((price) => (
                  <Button
                    key={price.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCheckout(price.id, price.mode, price.offer_key)}
                    className="text-gray-600 hover:text-orange-600"
                  >
                    {price.label}
                    {price.badge && (
                      <Badge className="ml-2 bg-green-100 text-green-700 text-xs">
                        {price.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              What You Get
            </h2>
            <div className="grid gap-4">
              {productData.bullets.map((bullet, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700">{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {productData.feature_sections && productData.feature_sections.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {productData.feature_sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="mb-12 last:mb-0">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    {section.title}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {section.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex items-start gap-3 p-3 bg-white rounded-lg"
                      >
                        <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {data.body && data.body.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-lg prose-gray">
              {data.body.map((block, index) => {
                switch (block.type) {
                  case 'heading':
                    const level = block.level || 2;
                    if (level === 2) {
                      return <h2 key={index} className="text-gray-900 text-2xl font-bold mt-8 mb-4">{block.content}</h2>;
                    } else if (level === 3) {
                      return <h3 key={index} className="text-gray-900 text-xl font-semibold mt-6 mb-3">{block.content}</h3>;
                    } else {
                      return <h4 key={index} className="text-gray-900 text-lg font-medium mt-4 mb-2">{block.content}</h4>;
                    }
                  case 'paragraph':
                    return (
                      <p key={index} className="text-gray-600">
                        {block.content}
                      </p>
                    );
                  case 'list':
                    return (
                      <ul key={index} className="space-y-2">
                        {block.items?.map((item, i) => (
                          <li key={i} className="text-gray-600">
                            {item}
                          </li>
                        ))}
                      </ul>
                    );
                  case 'callout':
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          block.variant === 'warning'
                            ? 'bg-yellow-50 border-l-4 border-yellow-400'
                            : block.variant === 'tip'
                            ? 'bg-green-50 border-l-4 border-green-400'
                            : 'bg-blue-50 border-l-4 border-blue-400'
                        }`}
                      >
                        {block.content}
                      </div>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          </div>
        </section>
      )}

      {productData.pro_tips && productData.pro_tips.length > 0 && (
        <section className="py-16 bg-orange-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <Lightbulb className="w-6 h-6 text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-900">Pro Tips</h2>
              </div>
              <div className="space-y-4">
                {productData.pro_tips.map((tip, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white rounded-lg border border-orange-200"
                  >
                    <p className="text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {(productData.faq && productData.faq.length > 0) || (data.faq && data.faq.length > 0) ? (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {(productData.faq || data.faq || []).map((item, index) => (
                  <Card
                    key={index}
                    className="overflow-hidden cursor-pointer"
                    onClick={() =>
                      setOpenFaqIndex(openFaqIndex === index ? null : index)
                    }
                  >
                    <div className="p-4 flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">
                        {item.question}
                      </h3>
                      {openFaqIndex === index ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    {openFaqIndex === index && (
                      <div className="px-4 pb-4 text-gray-600">
                        {item.answer}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            {productData.hero_subtitle}
          </p>
          {productData.checkout_strategy === 'stripe' ? (
            <Button
              size="lg"
              onClick={() => handleCheckout()}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg"
            >
              {productData.cta_primary_label}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : productData.checkout_strategy === 'external' && productData.cta_primary_href ? (
            <Button
              size="lg"
              asChild
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg"
            >
              <Link href={productData.cta_primary_href} target="_blank" rel="noopener noreferrer">
                {productData.cta_primary_label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : null}
        </div>
      </section>

      {productData.recommended_slugs && productData.recommended_slugs.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              You Might Also Like
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {productData.recommended_slugs.map((slug) => (
                <Link
                  key={slug}
                  href={`/products/${slug}`}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  {slug.replace(/-/g, ' ')}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
