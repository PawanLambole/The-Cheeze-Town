import { Home, ShoppingBag, Info, Phone } from 'lucide-react';

export type NavPage = 'home' | 'menu' | 'about' | 'contact';

interface NavigationBarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  cartCount?: number;
}

export default function NavigationBar({ activePage, onNavigate, cartCount = 0 }: NavigationBarProps) {
  const navItems = [
    { id: 'home' as NavPage, label: 'Home', icon: Home },
    { id: 'menu' as NavPage, label: 'Menu', icon: ShoppingBag, badge: cartCount > 0 ? cartCount : undefined },
    { id: 'about' as NavPage, label: 'About', icon: Info },
    { id: 'contact' as NavPage, label: 'Contact', icon: Phone },
  ];

  return (
    <>
      {/* Top Navigation Bar (Logo & Desktop Menu) */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-brand-dark to-brand-dark/95 backdrop-blur-lg border-b border-white/5 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3 md:gap-3">
              <img
                src="/logo.jpeg"
                alt="The Cheeze Town"
                className="w-10 h-10 md:w-11 md:h-11 object-cover rounded-full border-2 border-brand-yellow/50"
              />
              <div className="flex flex-col">
                <p className="text-white font-bold text-lg md:text-xl leading-none">The Cheeze</p>
                <p className="text-brand-yellow text-xs md:text-sm font-semibold">Town</p>
              </div>
            </div>

            {/* Desktop Nav Items */}
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

            {/* Mobile Cart Counter (Top Right) - Optional, can just use bottom bar */}
            <div className="md:hidden">
              {/* Placeholder for alignment or maybe search later */}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-brand-darker border-t border-white/10 pb-safe">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${isActive
                  ? 'text-brand-yellow'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-brand-yellow/10' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.badge && (
                  <span className="absolute top-1 right-6 bg-red-500 text-white text-[10px] font-bold px-1.5 min-w-[1.2rem] h-[1.2rem] flex items-center justify-center rounded-full border-2 border-brand-darker">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
