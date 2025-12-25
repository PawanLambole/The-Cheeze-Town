import { useState } from 'react';
import { QrCode, Smartphone, CreditCard, Shield, ChevronRight, User, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { customerDB } from '../services/database';
import { Button, Card, Input, Alert } from '../components';

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
      const { data, error: orderError } = await customerDB.createOrder({
        table_id: tableId,
        customer_name: customerName || undefined,
        items: orderItems,
      });

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error((orderError as any).message || 'Failed to create order. Please try again.');
      }

      console.log('Order created successfully:', data);

      // Clear cart after successful order
      clearCart();

      // Navigate to success page
      onPaymentComplete();
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-darker via-brand-dark to-brand-darker py-8 pb-24">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-12 animate-fade-in-down">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-yellow transition-colors mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-5xl md:text-6xl font-bold font-serif text-white mb-3">
            Complete Your <span className="text-brand-yellow">Order</span>
          </h1>
          <div className="flex items-center gap-2 text-gray-400 font-medium">
            <Shield className="w-5 h-5" />
            Secure & Encrypted Transaction
          </div>
        </div>

        {/* Main Card */}
        <Card glowing className="p-8 md:p-12 animate-fade-in-up space-y-8">
          {/* Order Summary */}
          <div className="bg-brand-gray/30 rounded-2xl p-6 border border-brand-yellow/20">
            {tableId > 0 && (
              <>
                <p className="text-gray-400 text-sm uppercase tracking-widest font-medium mb-2">Table Number</p>
                <p className="text-3xl font-bold text-brand-yellow mb-6">#{tableId}</p>
              </>
            )}

            <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-gray-400 text-sm">x {item.quantity}</p>
                  </div>
                  <p className="text-brand-yellow font-bold">₹{(item.price * item.quantity).toFixed(0)}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-white">Total Amount</span>
              <span className="text-4xl font-bold text-brand-yellow">₹{getTotalPrice()}</span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              type="error"
              title="Order Error"
              message={error}
              dismissible
              onClose={() => setError(null)}
            />
          )}

          {/* Customer Name */}
          <div>
            <Input
              label="Your Name (Optional)"
              icon={<User className="w-5 h-5" />}
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your name for the order"
            />
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Payment Methods</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: QrCode, label: 'UPI', desc: 'Digital Payment' },
                { icon: CreditCard, label: 'Card', desc: 'Debit/Credit' },
                { icon: Smartphone, label: 'Cash', desc: 'At Counter' },
              ].map((method) => {
                const Icon = method.icon;
                return (
                  <div key={method.label} className="bg-brand-gray/30 border border-white/5 hover:border-brand-yellow/30 rounded-2xl p-4 text-center transition-all cursor-pointer">
                    <Icon className="w-8 h-8 mx-auto mb-2 text-brand-yellow" />
                    <p className="text-white font-semibold text-sm">{method.label}</p>
                    <p className="text-gray-400 text-xs mt-1">{method.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-white/10">
            <Button
              onClick={onBack}
              variant="secondary"
              size="lg"
              fullWidth
              disabled={isProcessing}
              icon={<ArrowLeft className="w-5 h-5" />}
            >
              Back
            </Button>
            <Button
              onClick={handlePayment}
              isLoading={isProcessing}
              size="lg"
              fullWidth
              disabled={isProcessing}
              icon={<ChevronRight className="w-5 h-5" />}
              iconPosition="right"
              className="shadow-lg shadow-brand-yellow/20"
            >
              {isProcessing ? 'Processing' : 'Complete Order'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
