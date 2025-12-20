import { useState } from 'react';
import { QrCode, Smartphone, CreditCard, Shield, Lock, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface PaymentPageProps {
  onPaymentComplete: () => void;
}

export default function PaymentPage({ onPaymentComplete }: PaymentPageProps) {
  const { getTotalPrice } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'upi' | 'card'>('qr');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');

  const handlePayment = () => {
    onPaymentComplete();
  };

  return (
    <div className="min-h-screen bg-brand-darker py-6 pb-24">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8 pt-4">
          <h1 className="text-3xl md:text-5xl font-bold font-serif text-brand-yellow mb-2">Secure Payment</h1>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Shield className="w-3 h-3" />
            <p className="text-xs uppercase tracking-wider">Encrypted Transaction</p>
          </div>
        </div>

        <div className="bg-brand-dark rounded-3xl p-5 md:p-8 border border-white/5 shadow-2xl relative overflow-hidden">
          {/* Decorative background blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="text-center mb-6 pb-6 border-b border-white/10 relative z-10">
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Total Amount</p>
            <div className="inline-block bg-brand-yellow/10 px-6 py-3 rounded-2xl border border-brand-yellow/20">
              <p className="text-3xl md:text-5xl font-bold text-white">₹{getTotalPrice()}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
            {[
              { id: 'qr', icon: QrCode, label: 'Scan QR' },
              { id: 'upi', icon: Smartphone, label: 'UPI ID' },
              { id: 'card', icon: CreditCard, label: 'Card' }
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id as 'qr' | 'upi' | 'card')}
                className={`p-3 md:p-4 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 ${paymentMethod === method.id
                    ? 'bg-brand-yellow text-brand-darker border-brand-yellow shadow-lg shadow-brand-yellow/20'
                    : 'bg-brand-gray/50 text-gray-400 border-transparent hover:border-brand-yellow/30 hover:bg-brand-gray'
                  }`}
              >
                <method.icon className="w-5 h-5 md:w-6 md:h-6" />
                <span className="font-semibold text-xs md:text-sm">{method.label}</span>
              </button>
            ))}
          </div>

          <div className="min-h-[300px] bg-brand-gray/30 rounded-2xl p-4 md:p-6 border border-white/5 mb-6">
            {paymentMethod === 'qr' && (
              <div className="text-center py-4">
                <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-xl relative group">
                  <div className="absolute inset-0 bg-brand-yellow/20 blur-xl group-hover:blur-2xl transition-all"></div>
                  <div className="relative bg-white p-2 rounded-lg">
                    <QrCode className="w-40 h-40 md:w-48 md:h-48 text-brand-dark" />
                  </div>
                </div>
                <p className="text-gray-300 mb-2">Scan with <span className="text-brand-yellow font-bold">Any UPI App</span></p>
                <p className="text-xs text-gray-500">Google Pay, PhonePe, Paytm, etc.</p>
              </div>
            )}

            {paymentMethod === 'upi' && (
              <div className="py-4">
                <label className="block text-gray-300 font-medium mb-3 ml-1">Enter UPI ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@bank"
                    className="w-full bg-brand-dark text-white border border-white/10 rounded-xl px-4 py-4 pl-12 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/50 transition-all placeholder-gray-600"
                  />
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>

                <div className="mt-6">
                  <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider font-semibold">Popular Apps</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['Google Pay', 'PhonePe', 'Paytm', 'Amazon Pay'].map((app) => (
                      <div key={app} className="bg-brand-dark p-3 rounded-lg text-center text-gray-400 text-sm border border-white/5 hover:border-brand-yellow/30 hover:text-brand-yellow transition-colors cursor-pointer">
                        {app}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="py-2 space-y-5">
                <div>
                  <label className="block text-gray-300 font-medium mb-2 ml-1">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="w-full bg-brand-dark text-white border border-white/10 rounded-xl px-4 py-4 pl-12 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/50 transition-all placeholder-gray-600 font-mono"
                    />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 font-medium mb-2 ml-1">Expiry</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full bg-brand-dark text-white border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/50 transition-all placeholder-gray-600 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-medium mb-2 ml-1">CVV</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="123"
                        maxLength={3}
                        className="w-full bg-brand-dark text-white border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/50 transition-all placeholder-gray-600 font-mono text-center"
                      />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 justify-center pt-2">
                  <Shield className="w-3 h-3" />
                  <span>Secure 256-bit SSL Encrypted</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handlePayment}
            className="w-full bg-brand-yellow hover:bg-yellow-400 text-brand-darker font-bold text-lg py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 group"
          >
            Complete Payment
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
