"use client";

import Link from "next/link";
import { X, Bell, QrCode, Zap } from "lucide-react";
import { useState, useEffect } from "react";

export default function MonetizationBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("monetization-bar-dismissed");
    if (dismissed) {
      setIsHidden(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("monetization-bar-dismissed", "true");
    setTimeout(() => setIsHidden(true), 300);
  };

  if (isHidden) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
    >
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <Zap className="w-4 h-4 text-orange-400 flex-shrink-0 hidden sm:block" />
              <span className="text-sm text-gray-300 truncate">
                <span className="font-semibold text-white">Creators:</span>
                <span className="hidden sm:inline"> Want more views, subs, & conversions?</span>
              </span>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link 
                href="/products/nudge"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-900 rounded-full text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Try Nudge</span>
              </Link>
              
              <Link 
                href="/products/qrsocial"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-gray-900 rounded-full text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">QR Social</span>
                <span className="sm:hidden">QR</span>
              </Link>
              
              <button 
                onClick={handleDismiss}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
