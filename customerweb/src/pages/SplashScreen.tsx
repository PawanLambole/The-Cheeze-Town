import { useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="animate-pulse">
        <img
          src="/logo.jpeg"
          alt="The Cheese Town Logo"
          className="w-64 h-64 object-contain"
        />
      </div>
    </div>
  );
}
