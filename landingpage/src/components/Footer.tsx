import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import cafeLogo from '../../../assets/images/logo.jpeg';

export default function Footer() {
  return (
    <footer className="relative bg-[#121212] border-t border-[#FFB800]/15">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                <img src={cafeLogo} alt="The Cheese Town logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-bold text-white">The Cheese Town</span>
            </div>
            <p className="text-gray-400">
              A cozy cafe powered by our own app to keep your orders smooth and your table happy.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 glass-card rounded-lg flex items-center justify-center hover:bg-[#FFB800]/10 transition-colors">
                <Facebook className="w-5 h-5 text-gray-400" />
              </a>
              <a href="#" className="w-10 h-10 glass-card rounded-lg flex items-center justify-center hover:bg-[#FFB800]/10 transition-colors">
                <Twitter className="w-5 h-5 text-gray-400" />
              </a>
              <a href="#" className="w-10 h-10 glass-card rounded-lg flex items-center justify-center hover:bg-[#FFB800]/10 transition-colors">
                <Instagram className="w-5 h-5 text-gray-400" />
              </a>
              <a href="#" className="w-10 h-10 glass-card rounded-lg flex items-center justify-center hover:bg-[#FFB800]/10 transition-colors">
                <Linkedin className="w-5 h-5 text-gray-400" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Visit Us</h3>
            <ul className="space-y-2 text-gray-400">
              <li>The Cheese Town</li>
              <li>Your local neighbourhood cafe</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li><a href="tel:#" className="text-gray-400 hover:text-[#FFB800] transition-colors">Phone: Add cafe number</a></li>
              <li><a href="mailto:#" className="text-gray-400 hover:text-[#FFB800] transition-colors">Email: Add cafe email</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Opening Hours</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Mon – Sun: Add timings</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#FFB800]/15 pt-8 text-center text-gray-400">
          <p>&copy; 2024 The Cheese Town. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
