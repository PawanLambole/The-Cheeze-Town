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
    <div className="fixed inset-0 min-h-screen bg-brand-darker flex flex-col items-center justify-center z-50">
      <div className="relative">
        {/* Animated background circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-yellow/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand-yellow/20 rounded-full blur-2xl animate-bounce animation-delay-400"></div>

        {/* Main Logo */}
        <div className="relative z-10 animate-fade-in-up">
          <div className="bg-brand-dark p-6 rounded-full shadow-2xl border-2 border-brand-yellow/20 animate-float">
            <img
              src="/logo.jpeg"
              alt="The Cheeze Town Logo"
              className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Text Content */}
      <div className="mt-8 text-center animate-fade-in-up animation-delay-200">
        <h1 className="text-3xl md:text-5xl font-bold font-serif text-brand-yellow mb-2 tracking-wider">
          The Cheeze Town
        </h1>
        <p className="text-gray-400 text-sm md:text-base tracking-widest uppercase">
          Where Every Bite is Cheesy Delight
        </p>
      </div>

      {/* Loading Indicator */}
      <div className="absolute bottom-12 w-48 h-1 bg-brand-gray rounded-full overflow-hidden animate-fade-in-up animation-delay-600">
        <div className="h-full bg-brand-yellow animate-[width_2s_ease-in-out_infinite] w-full origin-left scale-x-0"></div>
      </div>
    </div>
  );
}
