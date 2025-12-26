import { CheckCircle, Home, Clock, UtensilsCrossed } from 'lucide-react';
import { Button, Card } from '../components';

interface SuccessPageProps {
  onBackToHome: () => void;
}

export default function SuccessPage({ onBackToHome }: SuccessPageProps) {
  const orderNumber = Math.floor(Math.random() * 9000) + 1000;
  const estimatedTime = 15 + Math.floor(Math.random() * 6); // 15-20 min

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-darker via-brand-dark to-brand-darker flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-yellow/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/4 right-0 w-72 h-72 bg-green-500/5 rounded-full blur-3xl animate-bounce animation-delay-1000"></div>
      </div>

      <div className="max-w-lg w-full relative z-10">
        {/* Success Icon */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="inline-relative">
            <div className="absolute inset-0 bg-brand-yellow/20 rounded-full blur-2xl scale-150 animate-pulse-glow"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-brand-yellow rounded-full p-6 shadow-2xl border-4 border-brand-yellow/30">
              <div className="bg-brand-dark rounded-full p-4 animate-scale-pulse">
                <CheckCircle className="w-12 h-12 text-brand-yellow" />
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-10 animate-fade-in-up animation-delay-200">
          <h1 className="text-5xl md:text-6xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow to-yellow-300 mb-3">
            Order Confirmed!
          </h1>
          <p className="text-gray-400 text-lg">Thank you for choosing The Cheeze Town</p>
        </div>

        {/* Order Details Card */}
        <Card glowing className="p-8 mb-8 animate-fade-in-up animation-delay-400 space-y-6">
          {/* Order Number */}
          <div className="bg-brand-gray/30 rounded-2xl p-6 border border-brand-yellow/30 text-center">
            <p className="text-gray-400 text-sm uppercase tracking-widest font-medium mb-2">Order Number</p>
            <p className="text-5xl font-bold text-brand-yellow tracking-wider">#{orderNumber}</p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-yellow to-transparent"></div>

          {/* Status Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-brand-yellow" />
              Preparation Status
            </h3>
            <div className="bg-brand-gray/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-300 font-medium">Your order is being prepared</p>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-brand-yellow rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-brand-yellow rounded-full animate-pulse animation-delay-200"></div>
                  <div className="w-2 h-2 bg-brand-yellow rounded-full animate-pulse animation-delay-400"></div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-brand-yellow font-bold text-lg">
                <Clock className="w-5 h-5" />
                <span>Estimated time: {estimatedTime} minutes</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-brand-yellow/5 border border-brand-yellow/20 rounded-xl p-4 text-center">
            <p className="text-gray-300 font-medium mb-1">Our kitchen team is working on your delicious order</p>
            <p className="text-gray-500 text-sm">We'll notify you when it's ready to serve</p>
          </div>
        </Card>

        {/* Action Button */}
        <div className="animate-fade-in-up animation-delay-600">
          <Button
            onClick={onBackToHome}
            fullWidth
            size="lg"
            icon={<Home className="w-5 h-5" />}
            iconPosition="left"
            className="shadow-2xl shadow-brand-yellow/30"
          >
            Back to Home
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-500 text-sm mt-6 animate-fade-in animation-delay-800">
          Your table staff will bring your order as soon as it's ready
        </p>
      </div>
    </div>
  );
}
