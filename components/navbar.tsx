"use client"

import Link from "next/link";
import { User, Bookmark, Menu, LayoutDashboard, ShieldCheck, Settings, LogOut, LogIn, ChevronDown, X, Sparkles, Trash2, Camera, Calculator, HelpCircle, Lightbulb, LinkIcon, FileImage, Image, FileText, Palette, Search, Wand2, Bot, Mic, Target, Network, Zap, Layout, Smile, Star, Heart, ArrowRight, FilePen, TrendingUp, Users, Images, RotateCcw, Youtube, Instagram, Twitter, Linkedin, Video, FileArchive } from "lucide-react";
import GoogleTranslate from "@/components/GoogleTranslate";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

interface DropdownItem {
  label: string;
  href: string;
  description?: string;
}

interface ResourceItem {
  label: string;
  href: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
}

interface ResourceCategory {
  name: string;
  items: ResourceItem[];
}

interface NavDropdown {
  label: string;
  items: DropdownItem[];
}

const productDropdown: NavDropdown = {
  label: "Products",
  items: [
    { label: "Apps", href: "/apps", description: "Premium applications for creators" },
    { label: "Downloads", href: "/downloads", description: "Digital downloads & assets" },
    { label: "Templates", href: "/funnels", description: "Conversion-focused templates" },
    { label: "Videos", href: "/videos", description: "Video content & tutorials" },
    { label: "Freebies", href: "/freebies", description: "Free products & resources" },
  ]
};

const resourceCategories: ResourceCategory[] = [
  {
    name: "AI Tools",
    items: [
      { label: "Thumbnail Coach", href: "/tools/ai-thumbnail-coach", description: "YouTube thumbnail analyzer", icon: Camera, iconBg: "bg-red-500" },
      { label: "YouTube Title Split-Test", href: "/tools/youtube-title-split-test", description: "A/B test YouTube titles", icon: RotateCcw, iconBg: "bg-red-500" },
      { label: "Logo Generator", href: "/tools/logo-generator", description: "AI-powered logo maker", icon: Palette, iconBg: "bg-pink-500" },
      { label: "AI Humanizer", href: "/tools/ai-humanizer-free", description: "Detect & humanize AI text", icon: Bot, iconBg: "bg-indigo-500" },
      { label: "AI Summarizer", href: "/tools/summarizer", description: "Summarize any text instantly", icon: Zap, iconBg: "bg-yellow-500" },
      { label: "Producer Tags", href: "/tools/producer-tag-generator", description: "AI voice tags for beats", icon: Mic, iconBg: "bg-green-500" },
    ]
  },
  {
    name: "SEO & Marketing",
    items: [
      { label: "Keyword Finder", href: "/tools/keyword-finder", description: "Low-competition SEO ideas", icon: Search, iconBg: "bg-blue-500" },
      { label: "Reach Grabber", href: "/tools/reach-grabber-tool", description: "AI SEO content optimizer", icon: Target, iconBg: "bg-orange-500" },
      { label: "Ad Copy Analyzer", href: "/tools/ad-copy-analyzer", description: "Analyze & improve ad copy", icon: Wand2, iconBg: "bg-cyan-500" },
      { label: "Internal Link Audit", href: "/tools/internal-link-seo-audit", description: "Find orphan pages & weak links", icon: Network, iconBg: "bg-emerald-500" },
    ]
  },
  {
    name: "Image Tools",
    items: [
      { label: "Image Size Guide", href: "/tools/social-media-image-sizes", description: "All platform dimensions", icon: Image, iconBg: "bg-orange-500" },
      { label: "Calorie Calculator", href: "/tools/calorie-deficit-calculator", description: "AI food calorie counter", icon: Calculator, iconBg: "bg-green-500" },
      { label: "Image Compressor", href: "/tools/image-compressor", description: "Compress JPG, PNG, WebP", icon: Image, iconBg: "bg-sky-500" },
      { label: "GIF Compressor", href: "/tools/gif-compressor", description: "Compress GIF files", icon: FileImage, iconBg: "bg-violet-500" },
      { label: "GIF Maker", href: "/tools/gif-maker", description: "Convert video/images to GIF", icon: FileImage, iconBg: "bg-fuchsia-500" },
      { label: "HEIC to JPG", href: "/tools/heic-to-jpg", description: "Convert iPhone HEIC photos", icon: FileImage, iconBg: "bg-rose-500" },
      { label: "Photo Gallery Maker", href: "/tools/photo-gallery-maker", description: "Create gallery layouts", icon: Images, iconBg: "bg-indigo-500" },
      { label: "YouTube Thumbnail Resizer", href: "/tools/youtube-thumbnail-resizer", description: "Resize to 1280×720", icon: Youtube, iconBg: "bg-red-500" },
      { label: "Instagram Post Resizer", href: "/tools/instagram-post-resizer", description: "Resize to 1080×1080", icon: Instagram, iconBg: "bg-pink-500" },
      { label: "Instagram Story Resizer", href: "/tools/instagram-story-resizer", description: "Resize to 1080×1920", icon: Instagram, iconBg: "bg-purple-500" },
      { label: "TikTok Cover Resizer", href: "/tools/tiktok-video-resizer", description: "Resize to 1080×1920", icon: Video, iconBg: "bg-gray-900" },
      { label: "Twitter Header Resizer", href: "/tools/twitter-header-resizer", description: "Resize to 1500×500", icon: Twitter, iconBg: "bg-sky-400" },
      { label: "LinkedIn Banner Resizer", href: "/tools/linkedin-banner-resizer", description: "Resize to 1584×396", icon: Linkedin, iconBg: "bg-blue-600" },
    ]
  },
  {
    name: "Utilities",
    items: [
      { label: "ZIP File Creator", href: "/tools/zip-file-creator", description: "Create ZIP archives instantly", icon: FileArchive, iconBg: "bg-orange-500" },
      { label: "Online Notepad", href: "/tools/online-notepad", description: "Write notes online with AI", icon: FileText, iconBg: "bg-amber-500" },
      { label: "PDF Editor", href: "/tools/pdf-editor", description: "Reorder, rotate, delete PDF pages", icon: FilePen, iconBg: "bg-red-500" },
      { label: "Word Counter", href: "/tools/word-counter", description: "Count words & characters", icon: FileText, iconBg: "bg-gray-500" },
      { label: "Resource Box", href: "/tools/resource-box", description: "Create shareable link cards", icon: LinkIcon, iconBg: "bg-teal-500" },
      { label: "Visualization Tool", href: "/tools/visualization", description: "Turn text into diagrams", icon: Layout, iconBg: "bg-amber-500" },
      { label: "Emoji Combos", href: "/tools/emoji-combos", description: "Copy aesthetic emoji combos", icon: Smile, iconBg: "bg-yellow-400" },
      { label: "Name Combiner", href: "/tools/name-combiner", description: "Combine names into mashups", icon: Users, iconBg: "bg-cyan-500" },
    ]
  },
  {
    name: "Lifestyle",
    items: [
      { label: "Horoscope", href: "/tools/horoscope-of-the-day", description: "AI daily zodiac readings", icon: Star, iconBg: "bg-purple-400" },
      { label: "Self-Love Affirmations", href: "/tools/affirmation-about-self-love", description: "Daily affirmation generator", icon: Heart, iconBg: "bg-pink-400" },
    ]
  },
  {
    name: "Community",
    items: [
      { label: "Prediction Center", href: "/tools/prediction-center", description: "Vote on future events", icon: TrendingUp, iconBg: "bg-purple-500" },
      { label: "VCM Answers", href: "/answers", description: "Community Q&A forum", icon: HelpCircle, iconBg: "bg-blue-400" },
      { label: "Ideas Hub", href: "/ideas", description: "Browse & share startup ideas", icon: Lightbulb, iconBg: "bg-amber-400" },
    ]
  }
];

export function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { items, removeFromCart, itemCount, totalPrice } = useCart();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setIsCartOpen(false);
      }
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        setIsLoggedIn(data.isLoggedIn || false);
        setIsAdmin(data.isAdmin || false);
        setIsCheckingSession(false);
      })
      .catch(() => {
        setIsLoggedIn(false);
        setIsAdmin(false);
        setIsCheckingSession(false);
      });
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleDropdownEnter = (label: string) => {
    // Cancel any pending close
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown(label);
  };

  const handleDropdownLeave = () => {
    // Delay closing to allow cursor to move to dropdown
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-8" ref={navRef}>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">VCM Suite</span>
              <span className="text-xs text-gray-500 hidden sm:inline">Creator Campus</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-1">
              {/* Products Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleDropdownEnter("Products")}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                    openDropdown === "Products" 
                      ? 'text-orange-500 bg-orange-50' 
                      : 'text-gray-700 hover:text-orange-500 hover:bg-gray-50'
                  }`}
                >
                  Products
                  <ChevronDown className={`h-4 w-4 transition-transform ${
                    openDropdown === "Products" ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {openDropdown === "Products" && (
                  <div className="absolute top-full left-0 pt-2 z-50">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-xl min-w-[280px] overflow-hidden">
                      <div className="py-2">
                        {productDropdown.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block px-5 py-3 hover:bg-gray-50 transition-colors"
                            onClick={() => setOpenDropdown(null)}
                          >
                            <span className="block text-sm font-medium text-gray-900">
                              {item.label}
                            </span>
                            {item.description && (
                              <span className="block text-xs text-gray-500 mt-0.5">
                                {item.description}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Resources Mega Menu */}
              <div
                className="relative"
                onMouseEnter={() => handleDropdownEnter("Resources")}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                    openDropdown === "Resources" 
                      ? 'text-orange-500 bg-orange-50' 
                      : 'text-gray-700 hover:text-orange-500 hover:bg-gray-50'
                  }`}
                >
                  Resources
                  <ChevronDown className={`h-4 w-4 transition-transform ${
                    openDropdown === "Resources" ? 'rotate-180' : ''
                  }`} />
                </button>
              </div>
              
              {/* Resources Mega Menu Panel - Separate from trigger for proper hover */}
              {openDropdown === "Resources" && (
                <div 
                  className="fixed left-0 right-0 top-[73px] z-50"
                  onMouseEnter={() => handleDropdownEnter("Resources")}
                  onMouseLeave={handleDropdownLeave}
                >
                  {/* Invisible bridge to connect button to dropdown */}
                  <div className="absolute -top-4 left-0 right-0 h-4" />
                  <div className="bg-white border-b border-gray-200 shadow-xl">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                      <div className="flex gap-8">
                        {/* Categories Sidebar */}
                        <div className="w-48 flex-shrink-0 border-r border-gray-100 pr-6">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Categories</h3>
                          <div className="space-y-1">
                            {resourceCategories.map((category) => (
                              <button
                                key={category.name}
                                className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-orange-500 hover:bg-gray-50 rounded-lg transition-colors"
                                onClick={() => {
                                  const element = document.getElementById(`category-${category.name.replace(/\s+/g, '-')}`);
                                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                              >
                                {category.name}
                              </button>
                            ))}
                          </div>
                          <div className="mt-6 pt-4 border-t border-gray-100">
                            <Link
                              href="/tools"
                              className="flex items-center gap-2 text-sm font-medium text-orange-500 hover:text-orange-600"
                              onClick={() => setOpenDropdown(null)}
                            >
                              Explore All Tools
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                        
                        {/* Tools Grid */}
                        <div className="flex-1 max-h-[70vh] overflow-y-auto pr-2">
                          {resourceCategories.map((category) => (
                            <div key={category.name} id={`category-${category.name.replace(/\s+/g, '-')}`} className="mb-6 last:mb-0">
                              <h3 className="text-sm font-semibold text-gray-900 mb-3 sticky top-0 bg-white py-1">{category.name}</h3>
                              <div className="grid grid-cols-3 gap-3">
                                {category.items.map((item) => {
                                  const IconComponent = item.icon;
                                  return (
                                    <Link
                                      key={item.href}
                                      href={item.href}
                                      className="group flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all"
                                      onClick={() => setOpenDropdown(null)}
                                    >
                                      <div className={`${item.iconBg} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                                        <IconComponent className="h-5 w-5 text-white" />
                                      </div>
                                      <div className="min-w-0">
                                        <span className="block text-sm font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                                          {item.label}
                                        </span>
                                        <span className="block text-xs text-gray-500 mt-0.5 line-clamp-2">
                                          {item.description}
                                        </span>
                                      </div>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <Link 
                href="/newsletter" 
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50 transition-colors rounded-lg"
              >
                Magazine
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block">
              <GoogleTranslate />
            </div>
            
            <div className="relative" ref={cartRef}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-600 hover:text-orange-500 hover:bg-gray-50 rounded-lg relative"
                onClick={() => setIsCartOpen(!isCartOpen)}
              >
                <Bookmark className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Button>
              
              {isCartOpen && (
                <div className="fixed md:absolute right-4 md:right-0 left-4 md:left-auto top-16 md:top-auto mt-2 md:w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Saved Items</h3>
                    <p className="text-sm text-gray-500">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                  </div>
                  
                  {items.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bookmark className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No saved items yet</p>
                      <p className="text-gray-400 text-xs mt-1">Browse products and save items for later</p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-64 overflow-y-auto">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50">
                            <div className="flex-1 min-w-0">
                              <Link 
                                href={`/product/${item.slug}`}
                                className="block text-sm font-medium text-gray-900 truncate hover:text-orange-500"
                                onClick={() => setIsCartOpen(false)}
                              >
                                {item.name}
                              </Link>
                              <p className="text-xs text-gray-500">{item.type}</p>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {item.price === 0 ? 'Free' : `$${(item.price / 100).toFixed(2)}`}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <div className="flex justify-between mb-3">
                          <span className="text-sm text-gray-600">Total</span>
                          <span className="font-semibold text-gray-900">${(totalPrice / 100).toFixed(2)}</span>
                        </div>
                        <Link
                          href="/saved"
                          className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center font-medium py-2.5 rounded-lg transition-colors"
                          onClick={() => setIsCartOpen(false)}
                        >
                          View All Saved Items
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {!isCheckingSession && (
              <>
                {isLoggedIn ? (
                  <div className="relative" ref={dropdownRef}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-600 hover:text-orange-500 hover:bg-gray-50 rounded-lg"
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                      <User className="h-5 w-5" />
                    </Button>
                    
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-[100] overflow-hidden">
                        <div className="py-2">
                          <Link href="/dashboard" onClick={() => setIsProfileOpen(false)}>
                            <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                              <LayoutDashboard className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">Dashboard</span>
                            </div>
                          </Link>
                          
                          {isAdmin && (
                            <Link href="/admin" onClick={() => setIsProfileOpen(false)}>
                              <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                                <ShieldCheck className="h-4 w-4 text-orange-500" />
                                <span className="text-sm font-medium text-gray-700">Admin</span>
                              </div>
                            </Link>
                          )}
                          
                          <div className="border-t border-gray-100 my-2"></div>
                          
                          <Link href="/settings" onClick={() => setIsProfileOpen(false)}>
                            <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                              <Settings className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">Settings</span>
                            </div>
                          </Link>
                          
                          <button 
                            onClick={async () => {
                              if (isLoggingOut) return;
                              setIsLoggingOut(true);
                              setIsProfileOpen(false);
                              try {
                                const response = await fetch('/api/auth/logout', { method: 'POST' });
                                if (!response.ok) {
                                  console.error('Logout failed:', response.statusText);
                                }
                              } catch (error) {
                                console.error('Logout error:', error);
                              }
                              setIsLoggedIn(false);
                              window.location.href = '/';
                            }}
                            disabled={isLoggingOut}
                            className="w-full"
                          >
                            <div className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${isLoggingOut ? 'opacity-50' : ''}`}>
                              <LogOut className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">
                                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/login">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg px-4">
                      Sign In
                    </Button>
                  </Link>
                )}
              </>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-gray-600 hover:text-orange-500 hover:bg-gray-50 rounded-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-6 py-4 space-y-1">
            {/* Products Dropdown */}
            <div>
              <button
                onClick={() => setMobileOpenDropdown(
                  mobileOpenDropdown === "Products" ? null : "Products"
                )}
                className="flex items-center justify-between w-full text-sm font-medium py-3 text-gray-700"
              >
                Products
                <ChevronDown className={`h-4 w-4 transition-transform ${
                  mobileOpenDropdown === "Products" ? 'rotate-180' : ''
                }`} />
              </button>
              
              {mobileOpenDropdown === "Products" && (
                <div className="pl-4 pb-2 space-y-1">
                  {productDropdown.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block py-2 text-sm text-gray-600 hover:text-orange-500 transition-colors"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setMobileOpenDropdown(null);
                      }}
                    >
                      {item.label}
                      {item.description && (
                        <span className="block text-xs text-gray-400 mt-0.5">
                          {item.description}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Resources Dropdown */}
            <div>
              <button
                onClick={() => setMobileOpenDropdown(
                  mobileOpenDropdown === "Resources" ? null : "Resources"
                )}
                className="flex items-center justify-between w-full text-sm font-medium py-3 text-gray-700"
              >
                Resources
                <ChevronDown className={`h-4 w-4 transition-transform ${
                  mobileOpenDropdown === "Resources" ? 'rotate-180' : ''
                }`} />
              </button>
              
              {mobileOpenDropdown === "Resources" && (
                <div className="pl-2 pb-2 space-y-4 max-h-[60vh] overflow-y-auto">
                  {resourceCategories.map((category) => (
                    <div key={category.name}>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">{category.name}</h4>
                      <div className="space-y-1">
                        {category.items.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                setMobileOpenDropdown(null);
                              }}
                            >
                              <div className={`${item.iconBg} w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <IconComponent className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <span className="block text-sm font-medium text-gray-700">
                                  {item.label}
                                </span>
                                <span className="block text-xs text-gray-400">
                                  {item.description}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <Link
                    href="/tools"
                    className="flex items-center gap-2 px-2 py-3 text-sm font-medium text-orange-500"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setMobileOpenDropdown(null);
                    }}
                  >
                    Explore All Tools
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
            
            <Link 
              href="/newsletter" 
              className="block text-sm font-medium py-3 text-gray-700 hover:text-orange-500 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Magazine
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
