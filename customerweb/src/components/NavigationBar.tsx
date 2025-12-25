import React from 'react';
import { Home, ShoppingBag, MapPin, Info, Phone } from 'lucide-react';

export type NavPage = 'home' | 'menu' | 'tables' | 'about' | 'contact';

interface NavigationBarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  cartCount?: number;
}

export default function NavigationBar({ activePage, onNavigate, cartCount = 0 }: NavigationBarProps) {
  const navItems = [
    { id: 'home' as NavPage, label: 'Home', icon: Home },
    { id: 'menu' as NavPage, label: 'Menu', icon: ShoppingBag, badge: cartCount > 0 ? cartCount : undefined },
    { id: 'tables' as NavPage, label: 'Tables', icon: MapPin },
    { id: 'about' as NavPage, label: 'About', icon: Info },
    { id: 'contact' as NavPage, label: 'Contact', icon: Phone },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-brand-dark to-brand-dark/95 backdrop-blur-lg border-b border-white/5 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="The Cheeze Town"
              className="w-10 h-10 object-cover rounded-full border-2 border-brand-yellow/50"
            />
            <div className="hidden sm:flex flex-col">
              <p className="text-white font-bold text-lg leading-none">The Cheeze</p>
              <p className="text-brand-yellow text-xs font-semibold">Town</p>
            </div>
          </div>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-2 group ${isActive
                      ? 'bg-brand-yellow text-brand-darker shadow-lg shadow-brand-yellow/20'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile Menu Icon */}
          <div className="md:hidden flex items-center gap-2">
            {cartCount > 0 && (
              <div className="bg-brand-yellow text-brand-darker text-xs font-bold px-2.5 py-1 rounded-full">
                {cartCount}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-all flex-shrink-0 ${isActive
                    ? 'bg-brand-yellow text-brand-darker'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
