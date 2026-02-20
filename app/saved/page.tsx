"use client"

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bookmark, Trash2, ArrowLeft, CreditCard } from "lucide-react";

export default function SavedItemsPage() {
  const { items, removeFromCart, clearCart, itemCount, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bookmark className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">No saved items yet</h1>
          <p className="text-gray-600 mb-8">
            Browse our products and save items you're interested in for later.
          </p>
          <Link href="/store">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Saved Items</h1>
            <p className="text-gray-600 mt-1">{itemCount} item{itemCount !== 1 ? 's' : ''} saved</p>
          </div>
          <Link href="/store" className="flex items-center text-gray-600 hover:text-orange-500 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Browsing
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/products/${item.slug}`}
                      className="text-lg font-semibold text-gray-900 hover:text-orange-500 transition-colors"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-gray-500 capitalize mt-1">{item.type}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {item.price === 0 ? 'Free' : `$${item.price.toFixed(2)}`}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </Card>
            ))}

            <button
              onClick={clearCart}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              Clear all saved items
            </button>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Saved items ({itemCount})</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={totalPrice === 0}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Proceed to Checkout
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Secure checkout powered by Stripe
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
