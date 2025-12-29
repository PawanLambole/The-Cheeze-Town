import { Smartphone } from 'lucide-react';

export default function DownloadCTA() {
  return (
    <section id="download" className="relative py-24 bg-[#121212]">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFB800] to-[#FFD54A]"></div>
      </div>

      <div className="relative container mx-auto px-6">
        <div className="glass-card rounded-3xl p-12 md:p-16 bg-gradient-to-r from-[#FFB800]/20 to-[#FFD54A]/20 border-2 border-[#FFB800]/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFB800]/10 to-transparent"></div>

          <div className="relative z-10 text-center max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Ready to Experience <span className="gradient-text">Cheeze Town Cafe?</span>
            </h2>

            <p className="text-xl md:text-2xl text-gray-300">
              Use the same app our team relies on every day to keep your orders flowing smoothly at Cheeze Town Cafe.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <a
                href="https://expo.dev/artifacts/eas/wsqryyDMTgoYBvCWDDHNHD.apk"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-[#FFB800] to-[#FFD54A] text-black px-12 py-6 rounded-full text-xl font-bold hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-[#FFB800]/60 animate-pulse-glow"
              >
                <Smartphone className="w-7 h-7" />
                Download for Android
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-8 pt-8 text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#FFB800] rounded-full"></div>
                <span>Free to Download</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#FFB800] rounded-full"></div>
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#FFB800] rounded-full"></div>
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#FFB800] rounded-full filter blur-[80px] opacity-50"></div>
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#FFD54A] rounded-full filter blur-[80px] opacity-50"></div>
        </div>
      </div>
    </section>
  );
}
