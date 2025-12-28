'use client';

import { ElementType } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Search, X } from 'lucide-react';

interface CloudHeroProps {
  title: string;
  subtitle?: string;
  badge?: string;
  proLabel?: boolean;
  primaryCta?: {
    label: string;
    href: string;
  };
  icon?: ElementType;
  gradient?: string;
  showSearchBar?: boolean;
  toolQuery?: string;
  onToolQueryChange?: (query: string) => void;
  toolCount?: number;
}

export default function CloudHero({
  title,
  subtitle,
  badge,
  proLabel,
  primaryCta,
  icon: IconComponent = Sparkles,
  gradient = 'from-pink-500 to-orange-400',
  showSearchBar = true,
  toolQuery = '',
  onToolQueryChange,
  toolCount,
}: CloudHeroProps) {

  return (
    <div className="rounded-2xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-pink-600/20 mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-30 pointer-events-none" />
      
      <div 
        className={`bg-gradient-to-br ${gradient} px-8 py-10 text-white relative`}
      >
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="text-white/90 text-base max-w-xl mx-auto leading-relaxed mb-6">
              {subtitle}
            </p>
          )}

          {showSearchBar && onToolQueryChange && (
            <div className="bg-white/10 backdrop-blur-md rounded-full p-1.5 flex items-center gap-2 shadow-lg border border-white/20 mb-6">
              <div className="flex items-center gap-2 px-4 py-2.5">
                <Search className="w-4 h-4 text-white/70" />
              </div>
              
              <input
                type="text"
                value={toolQuery}
                onChange={(e) => onToolQueryChange(e.target.value)}
                placeholder="Search tools in this cloud..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/60 text-sm px-2"
              />
              
              {toolQuery && (
                <button
                  onClick={() => onToolQueryChange('')}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
              )}
              
              {typeof toolCount === 'number' && (
                <span className="text-white/60 text-xs font-medium px-3">
                  {toolCount} {toolCount === 1 ? 'tool' : 'tools'}
                </span>
              )}
            </div>
          )}

          {!showSearchBar && primaryCta && (
            <Link
              href={primaryCta.href}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium bg-white text-zinc-900 hover:bg-zinc-100 transition-colors shadow-sm"
            >
              {primaryCta.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <div className="absolute top-4 left-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-sm">
            <IconComponent className="w-4 h-4" />
          </div>
          {badge && (
            <span className="px-3 py-1.5 bg-zinc-800/80 rounded-lg text-xs font-semibold uppercase tracking-wide backdrop-blur-md shadow-md border border-white/10">
              {badge}
            </span>
          )}
        </div>

        {proLabel && (
          <span className="absolute top-4 right-4 inline-flex items-center rounded-full bg-amber-400/90 text-amber-900 text-xs font-bold px-3 py-1 uppercase tracking-wide shadow-sm">
            Pro
          </span>
        )}
      </div>
    </div>
  );
}
