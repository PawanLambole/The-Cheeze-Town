import { useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    // Slightly longer timer to allow animations to play out
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 min-h-screen bg-gradient-to-b from-brand-darker via-brand-dark to-brand-darker flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 right-0 w-72 h-72 bg-brand-yellow/5 rounded-full blur-3xl animate-bounce animation-delay-200"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-brand-yellow/5 rounded-full blur-3xl animate-bounce animation-delay-400"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Container */}
        <div className="mb-6 md:mb-8 animate-fade-in-up">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-brand-yellow/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse-glow"></div>
            {/* Logo */}
            <div className="relative bg-gradient-to-br from-brand-dark to-brand-darker p-4 md:p-6 rounded-full shadow-2xl border-2 border-brand-yellow/30 animate-float">
              <img
                src="/logo.jpeg"
                alt="The Cheeze Town Logo"
                className="w-24 h-24 md:w-48 md:h-48 object-cover rounded-full shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center animate-fade-in-up animation-delay-200">
          <h1 className="text-3xl md:text-6xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-yellow to-brand-yellow mb-2 md:mb-3 tracking-wider">
            The Cheeze Town
          </h1>
          <p className="text-gray-400 text-xs md:text-lg tracking-widest uppercase font-medium">
            Where Every Bite is <span className="text-brand-yellow italic">Cheesy Delight</span>
          </p>
        </div>
      </div>

      {/* Loading Progress Bar */}
      <div className="absolute bottom-16 w-56 h-1 bg-brand-gray/30 rounded-full overflow-hidden animate-fade-in-up animation-delay-400 border border-brand-yellow/10">
        <div className="h-full bg-gradient-to-r from-transparent via-brand-yellow to-transparent animate-[shimmer_2s_infinite] w-full"></div>
      </div>

      {/* Loading Text */}
      <div className="absolute bottom-6 text-center animate-fade-in animation-delay-600">
        <p className="text-gray-500 text-xs tracking-widest uppercase font-medium">Loading...</p>
      </div>
    </div>
  );
}
