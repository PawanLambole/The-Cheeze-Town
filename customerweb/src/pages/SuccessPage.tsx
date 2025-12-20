import { CheckCircle, Home } from 'lucide-react';

interface SuccessPageProps {
  onBackToHome: () => void;
}

export default function SuccessPage({ onBackToHome }: SuccessPageProps) {
  const orderNumber = Math.floor(Math.random() * 9000) + 1000;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-zinc-900/90 backdrop-blur-sm rounded-3xl p-10 border-4 border-yellow-400 shadow-2xl text-center">
          <div className="mb-6">
            <CheckCircle className="w-24 h-24 text-yellow-400 mx-auto animate-bounce" />
          </div>

          <h1 className="text-4xl font-bold text-yellow-400 mb-4">Order Successful!</h1>

          <p className="text-gray-300 text-lg mb-2">Thank you for your order</p>

          <div className="bg-zinc-800 rounded-xl p-6 my-6 border-2 border-yellow-400/30">
            <p className="text-gray-400 mb-2">Your Order Number</p>
            <p className="text-3xl font-bold text-yellow-400">#{orderNumber}</p>
          </div>

          <div className="bg-yellow-400/10 rounded-xl p-6 mb-8 border border-yellow-400/30">
            <p className="text-white mb-3">Your order is being prepared</p>
            <div className="flex justify-center gap-2 mb-3">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-gray-400 text-sm">Estimated time: 15-20 minutes</p>
          </div>

          <button
            onClick={onBackToHome}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-bold text-lg py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>

          <p className="text-gray-400 text-sm mt-6">
            We hope you enjoy your meal at The Cheese Town!
          </p>
        </div>
      </div>
    </div>
  );
}
