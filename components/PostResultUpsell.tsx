"use client";

import Link from "next/link";
import { Bell, QrCode, ArrowRight, Flame } from "lucide-react";

export default function PostResultUpsell() {
  return (
    <div className="mt-8 mb-24 p-6 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border border-orange-200 rounded-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-bold text-gray-900">Level Up Your Channel Performance</h3>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-orange-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Nudge</h4>
              <p className="text-sm text-gray-600 mt-1">
                Boost retention and clicks with smart creator overlays.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-orange-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">QR Social</h4>
              <p className="text-sm text-gray-600 mt-1">
                Capture every viewer with one universal QR identity.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/products/nudge"
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all group shadow-md hover:shadow-lg"
        >
          Try Nudge
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <Link
          href="/products/qrsocial"
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all group shadow-md hover:shadow-lg"
        >
          Get QR Social
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
