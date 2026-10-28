"use client"

import Link from "next/link";
import { User, Bookmark, Menu, LayoutDashboard, ShieldCheck, Settings, LogOut, ChevronDown, X, Sparkles, Trash2, FolderOpen } from "lucide-react";
import GoogleTranslate from "@/components/GoogleTranslate";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";

interface DropdownItem {
  label: string;
  href: string;
  description?: string;
}





interface NavDropdown {
  label: string;
  items: DropdownItem[];
}

const productDropdown: NavDropdown = {
  label: "Products",
  items: [
    { label: "All Products", href: "/store", description: "Browse the full catalog" },
    { label: "Subscriptions", href: "/pricing", description: "Membership plans and ongoing access" },
    { label: "Apps", href: "/apps", description: "Premium applications for creators" },
    { label: "Downloads", href: "/downloads", description: "Digital downloads & assets" },
    { label: "Templates", href: "/funnels", description: "Conversion-focused templates" },
    { label: "Courses", href: "/courses", description: "Video courses & tutorials" },
    { label: "Freebies", href: "/freebies", description: "Free products & resources" },
  ]
};





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
  const { signOut } = useClerk();

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
    <nav data-global-navbar="true" className="relative z-[70] bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-8" ref={navRef}>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Dimi Lowe Courses</span>
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
                  <div className="absolute top-full left-0 pt-2 z-[80]">
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



              <Link
                href="/newsletter"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50 transition-colors rounded-lg"
              >
                Articles
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
                <div className="fixed md:absolute right-4 md:right-0 left-4 md:left-auto top-16 md:top-auto mt-2 md:w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-[80] overflow-hidden">
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
                                href={`/products/${item.slug}`}
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

                          <Link href="/workspace" onClick={() => setIsProfileOpen(false)}>
                            <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                              <FolderOpen className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">Workspace</span>
                            </div>
                          </Link>

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
                              try {
                                await signOut({ redirectUrl: "/" });
                              } catch (error) {
                                console.error("Clerk sign-out failed:", error);
                                setIsLoggingOut(false);
                                alert("We couldn't finish signing out. Please try again.");
                              }
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



            <Link
              href="/newsletter"
              className="block text-sm font-medium py-3 text-gray-700 hover:text-orange-500 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Articles
            </Link>


          </div>
        </div>
      )}
    </nav>
  );
}
