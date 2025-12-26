import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Page } from '../types';

interface FooterProps {
  onNavigate?: (page: Page) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-darker border-t border-white/5 mb-16 md:mb-0">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-6xl mx-auto">
          {/* Top Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-8">
            {/* Brand Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.jpeg"
                  alt="The Cheeze Town"
                  className="w-12 h-12 object-cover rounded-full border-2 border-brand-yellow/50"
                />
                <div>
                  <p className="text-white font-bold text-lg">The Cheeze</p>
                  <p className="text-brand-yellow text-sm font-semibold">Town</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Where every bite is a cheesy delight. Crafted with passion, served with love.
              </p>
            </div>

            {/* Site Links */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Explore</h3>
              <ul className="space-y-3">
                {[
                  { label: 'Home', page: 'home' as Page },
                  { label: 'Menu', page: 'menu' as Page },
                  { label: 'About Us', page: 'about' as Page },
                  { label: 'Contact', page: 'contact' as Page },
                ].map((link) => (
                  <li key={link.label}>
                    <button
                      type="button"
                      onClick={() => {
                        window.scrollTo(0, 0);
                        onNavigate?.(link.page);
                      }}
                      className="text-gray-400 hover:text-brand-yellow transition-colors text-sm font-medium"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Legal</h3>
              <ul className="space-y-3">
                {[
                  { label: 'Terms of Service', page: 'terms' as Page },
                  { label: 'Privacy Policy', page: 'privacy' as Page },
                  { label: 'Refund Policy', page: 'refund' as Page },
                ].map((link) => (
                  <li key={link.label}>
                    <button
                      type="button"
                      onClick={() => {
                        window.scrollTo(0, 0);
                        onNavigate?.(link.page);
                      }}
                      className="text-gray-400 hover:text-brand-yellow transition-colors text-sm font-medium"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4"></div>

          {/* Bottom Row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm text-center md:text-left">
              &copy; {currentYear} The Cheeze Town. All rights reserved.
            </p>

            <div className="flex items-center gap-4">
              <p className="text-gray-400 text-sm hidden sm:block">Follow us</p>
              <div className="flex items-center gap-3">
                {[
                  { icon: Facebook, label: 'Facebook', href: '#' },
                  { icon: Instagram, label: 'Instagram', href: '#' },
                  { icon: Twitter, label: 'Twitter', href: '#' },
                ].map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      title={social.label}
                      className="bg-brand-gray/50 hover:bg-brand-yellow hover:text-brand-darker text-gray-400 p-2.5 rounded-lg transition-all duration-300 transform hover:scale-110"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
