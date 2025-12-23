import { useState } from 'react';
import { QrCode, Smartphone, CreditCard, Shield, ChevronRight, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { customerDB } from '../services/database';

interface PaymentPageProps {
  tableId: number;
  onPaymentComplete: () => void;
  onBack: () => void;
}

export default function PaymentPage({ tableId, onPaymentComplete, onBack }: PaymentPageProps) {
  const { cart, getTotalPrice, clearCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Prepare order items
      const orderItems = cart.map(item => ({
        menu_item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      // Create order in database
      const { error: orderError } = await customerDB.createOrder({
        table_id: tableId,
        customer_name: customerName || undefined,
        items: orderItems,
      });

      if (orderError) {
        throw new Error('Failed to create order. Please try again.');
      }

      // Clear cart after successful order
      clearCart();

      // Navigate to success page
      onPaymentComplete();
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-darker py-6 pb-24">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8 pt-4">
          <h1 className="text-3xl md:text-5xl font-bold font-serif text-brand-yellow mb-2">Complete Order</h1>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Shield className="w-3 h-3" />
            <p className="text-xs uppercase tracking-wider">Secure Transaction</p>
          </div>
        </div>

        <div className="bg-brand-dark rounded-3xl p-5 md:p-8 border border-white/5 shadow-2xl relative overflow-hidden">
          {/* Decorative background blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          {/* Customer Name Input */}
          <div className="mb-6 pb-6 border-b border-white/10 relative z-10">
            <label className="block text-gray-300 font-medium mb-3 ml-1">Your Name (Optional)</label>
            <div className="relative">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-brand-gray/50 text-white border border-white/10 rounded-xl px-4 py-4 pl-12 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/50 transition-all placeholder-gray-600"
              />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="text-center mb-6 pb-6 border-b border-white/10 relative z-10">
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Total Amount</p>
            <div className="inline-block bg-brand-yellow/10 px-6 py-3 rounded-2xl border border-brand-yellow/20">
              <p className="text-3xl md:text-5xl font-bold text-white">₹{getTotalPrice()}</p>
            </div>
          </div>

          {/* Payment Methods Info */}
          <div className="mb-6 bg-brand-gray/30 rounded-2xl p-6 border border-white/5">
            <div className="text-center mb-4">
              <p className="text-brand-yellow font-bold text-lg mb-2">Payment Options</p>
              <p className="text-gray-400 text-sm">Pay at counter or via digital payment</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-brand-dark p-3 rounded-lg text-center">
                <QrCode className="w-6 h-6 mx-auto mb-1 text-brand-yellow" />
                <p className="text-xs text-gray-400">UPI</p>
              </div>
              <div className="bg-brand-dark p-3 rounded-lg text-center">
                <CreditCard className="w-6 h-6 mx-auto mb-1 text-brand-yellow" />
                <p className="text-xs text-gray-400">Card</p>
              </div>
              <div className="bg-brand-dark p-3 rounded-lg text-center">
                <Smartphone className="w-6 h-6 mx-auto mb-1 text-brand-yellow" />
                <p className="text-xs text-gray-400">Cash</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onBack}
              disabled={isProcessing}
              className="flex-1 bg-brand-gray hover:bg-brand-gray/80 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-2 bg-brand-yellow hover:bg-yellow-400 text-brand-darker font-bold text-lg py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-brand-darker"></div>
                  Processing...
                </>
              ) : (
                <>
                  Complete Order
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
