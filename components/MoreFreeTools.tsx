'use client';

import Link from 'next/link';
import { 
  Calculator, 
  Image, 
  FileText, 
  Palette,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const tools = [
  {
    name: 'Calorie Counter Walking',
    href: '/tools/calorie-counter-walking',
    icon: Calculator,
    color: 'bg-orange-100 text-orange-600'
  },
  {
    name: 'Instagram Story Resizer',
    href: '/tools/instagram-story-resizer',
    icon: Image,
    color: 'bg-pink-100 text-pink-600'
  },
  {
    name: 'YouTube Thumbnail Resizer',
    href: '/tools/youtube-thumbnail-resizer',
    icon: Image,
    color: 'bg-red-100 text-red-600'
  },
  {
    name: 'TDEE Calculator',
    href: '/tools/calorie-counter-maintenance',
    icon: Calculator,
    color: 'bg-green-100 text-green-600'
  },
  {
    name: 'LinkedIn Banner Resizer',
    href: '/tools/linkedin-banner-resizer',
    icon: Image,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    name: 'Maintenance Calories',
    href: '/tools/calorie-counter-maintenance',
    icon: Calculator,
    color: 'bg-purple-100 text-purple-600'
  }
];

interface MoreFreeToolsProps {
  exclude?: string[];
}

export default function MoreFreeTools({ exclude = [] }: MoreFreeToolsProps) {
  const filteredTools = tools.filter(tool => !exclude.includes(tool.href));
  const displayTools = filteredTools.slice(0, 6);

  return (
    <section className="bg-gray-50 rounded-2xl p-6 border border-gray-200 mb-16">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900">More Free Tools</h3>
      </div>
      <p className="text-gray-600 text-sm mb-5">
        Explore our collection of free tools for creators and health enthusiasts.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all group"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tool.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">
                {tool.name}
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
            </Link>
          );
        })}
      </div>
      <div className="mt-4 text-center">
        <Link 
          href="/tools" 
          className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          View all tools
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
