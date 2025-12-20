import { CheckCircle, Home } from 'lucide-react';

interface SuccessPageProps {
  onBackToHome: () => void;
}

export default function SuccessPage({ onBackToHome }: SuccessPageProps) {
  const orderNumber = Math.floor(Math.random() * 9000) + 1000;

  return (
    <div className="min-h-screen bg-brand-darker flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="bg-brand-dark rounded-3xl p-8 border border-white/5 shadow-2xl text-center relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-yellow/10 rounded-full blur-3xl -translate-y-1/2"></div>

          <div className="mb-6 relative z-10">
            <div className="bg-brand-yellow/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
              <CheckCircle className="w-10 h-10 text-brand-yellow" />
            </div>
          </div>

          <h1 className="text-3xl font-bold font-serif text-brand-yellow mb-2">Order Successful!</h1>
          <p className="text-gray-400 mb-8">Thank you for your order</p>

          <div className="bg-brand-gray/50 rounded-2xl p-6 mb-6 border border-white/5 relative group">
            <div className="absolute inset-0 bg-brand-yellow/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-2 relative z-10">Order Number</p>
            <p className="text-4xl font-bold text-white tracking-wider relative z-10">#{orderNumber}</p>
          </div>

          <div className="bg-brand-yellow/5 rounded-2xl p-5 mb-8 border border-brand-yellow/10">
            <p className="text-white font-medium mb-3">Preparation in progress</p>
            <div className="flex justify-center gap-2 mb-3">
              <div className="w-2 h-2 bg-brand-yellow rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-brand-yellow rounded-full animate-pulse animation-delay-200"></div>
              <div className="w-2 h-2 bg-brand-yellow rounded-full animate-pulse animation-delay-400"></div>
            </div>
            <p className="text-brand-yellow/70 text-sm">Estimated time: 15-20 min</p>
          </div>

          <button
            onClick={onBackToHome}
            className="w-full bg-brand-yellow hover:bg-yellow-400 text-brand-darker font-bold text-lg py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
