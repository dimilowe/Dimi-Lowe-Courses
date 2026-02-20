import Link from "next/link";
import { Check, Bell, QrCode, Cloud, ArrowRight } from "lucide-react";

const recommendations = [
  {
    benefit: "Boost video clicks",
    product: "Nudge",
    href: "/products/nudge",
    icon: Bell,
    color: "bg-amber-500",
    available: true,
  },
  {
    benefit: "Grow your follower count",
    product: "QR Social",
    href: "/products/qrsocial",
    icon: QrCode,
    color: "bg-cyan-500",
    available: true,
  },
  {
    benefit: "Manage your creator files",
    product: "VCM Skydrive",
    href: "#",
    icon: Cloud,
    color: "bg-blue-500",
    available: false,
  },
];

export default function CreatorStack() {
  return (
    <section className="mt-12 mb-8">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Check className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-900">
            Recommended For You
          </h3>
        </div>
        
        <p className="text-gray-600 text-sm mb-6">
          Complete your creator toolkit with these powerful apps
        </p>
        
        <div className="grid sm:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <div key={rec.product} className="relative">
              {rec.available ? (
                <Link
                  href={rec.href}
                  className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-400 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`${rec.color} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <rec.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium mb-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>{rec.benefit}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                          {rec.product}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-4 opacity-60">
                  <div className="flex items-start gap-3">
                    <div className={`${rec.color} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <rec.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium mb-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>{rec.benefit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">
                          {rec.product}
                        </span>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
