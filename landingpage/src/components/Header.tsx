import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import cafeLogo from '../../../assets/images/logo.jpeg';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Screenshots', href: '#screenshots' },
    { label: 'Benefits', href: '#benefits' },
    { label: 'Get Started', href: '#get-started' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#121212]/80 backdrop-filter backdrop-blur-lg border-b border-[#FFB800]/15">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-black flex items-center justify-center shadow-lg">
            <img src={cafeLogo} alt="The Cheese Town logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-bold text-white">The Cheese Town</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-gray-300 hover:text-[#FFB800] transition-colors duration-300 font-medium"
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://expo.dev/artifacts/eas/wsqryyDMTgoYBvCWDDHNHD.apk"
            className="bg-gradient-to-r from-[#FFB800] to-[#FFD54A] text-black px-6 py-2 rounded-full hover:scale-105 transition-transform duration-300 font-semibold shadow-lg"
          >
            Download
          </a>
        </nav>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-[#FFB800]/10 transition-colors"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-[#1E1E1E]/95 backdrop-filter backdrop-blur-lg border-b border-[#FFB800]/15">
          <div className="container mx-auto px-6 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-gray-300 hover:text-[#FFB800] transition-colors duration-300 font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://expo.dev/artifacts/eas/wsqryyDMTgoYBvCWDDHNHD.apk"
              className="bg-gradient-to-r from-[#FFB800] to-[#FFD54A] text-black px-6 py-3 rounded-full text-center font-semibold shadow-lg hover:scale-105 transition-transform duration-300"
              onClick={() => setIsOpen(false)}
            >
              Download
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
