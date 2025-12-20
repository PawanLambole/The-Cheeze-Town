import { useState } from 'react';
import { QrCode, Smartphone, CreditCard } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800 py-8">
      <div className="relative overflow-hidden mb-8">
        <svg className="absolute top-0 left-0 w-full h-24" preserveAspectRatio="none" viewBox="0 0 1200 120">
          <path
            d="M0,0 Q50,40 100,20 T200,20 T300,20 T400,20 T500,20 T600,20 T700,20 T800,20 T900,20 T1000,20 T1100,20 L1200,20 L1200,0 Z"
            fill="#fbbf24"
          />
        </svg>
      </div>

      <div className="container mx-auto px-6 pt-16 max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-yellow-400 mb-2">Payment</h1>
          <p className="text-gray-300 text-lg">Choose your payment method</p>
        </div>

        <div className="bg-zinc-900/90 backdrop-blur-sm rounded-xl p-8 border-4 border-yellow-400 shadow-2xl mb-6">
          <div className="text-center mb-8 pb-6 border-b-2 border-yellow-400">
            <p className="text-gray-300 text-lg mb-2">Amount to Pay</p>
            <p className="text-5xl font-bold text-yellow-400">₹{getTotalPrice()}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => setPaymentMethod('qr')}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                paymentMethod === 'qr'
                  ? 'bg-yellow-400 border-yellow-400 text-zinc-900'
                  : 'bg-zinc-800 border-yellow-400/30 text-yellow-400 hover:border-yellow-400'
              }`}
            >
              <QrCode className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-semibold">QR Code</p>
            </button>
            <button
              onClick={() => setPaymentMethod('upi')}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                paymentMethod === 'upi'
                  ? 'bg-yellow-400 border-yellow-400 text-zinc-900'
                  : 'bg-zinc-800 border-yellow-400/30 text-yellow-400 hover:border-yellow-400'
              }`}
            >
              <Smartphone className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-semibold">UPI</p>
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                paymentMethod === 'card'
                  ? 'bg-yellow-400 border-yellow-400 text-zinc-900'
                  : 'bg-zinc-800 border-yellow-400/30 text-yellow-400 hover:border-yellow-400'
              }`}
            >
              <CreditCard className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-semibold">Card</p>
            </button>
          </div>

          <div className="min-h-72">
            {paymentMethod === 'qr' && (
              <div className="text-center py-8">
                <div className="bg-white p-6 rounded-xl inline-block mb-6">
                  <div className="w-48 h-48 bg-zinc-900 rounded-lg flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-yellow-400" />
                  </div>
                </div>
                <p className="text-gray-300 mb-2">Scan QR Code to Pay</p>
                <p className="text-yellow-400 font-semibold">Using any UPI App</p>
              </div>
            )}

            {paymentMethod === 'upi' && (
              <div className="py-8">
                <label className="block text-yellow-400 font-semibold mb-3">Enter UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="example@upi"
                  className="w-full bg-zinc-800 text-white border-2 border-yellow-400/30 rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-400 mb-4"
                />
                <div className="bg-zinc-800 rounded-lg p-4 border border-yellow-400/20">
                  <p className="text-gray-400 text-sm mb-2">Popular UPI Apps</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-zinc-700 rounded-lg p-3 text-center text-white text-sm">Google Pay</div>
                    <div className="bg-zinc-700 rounded-lg p-3 text-center text-white text-sm">PhonePe</div>
                    <div className="bg-zinc-700 rounded-lg p-3 text-center text-white text-sm">Paytm</div>
                    <div className="bg-zinc-700 rounded-lg p-3 text-center text-white text-sm">Amazon Pay</div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="py-8">
                <div className="mb-4">
                  <label className="block text-yellow-400 font-semibold mb-2">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full bg-zinc-800 text-white border-2 border-yellow-400/30 rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-yellow-400 font-semibold mb-2">Expiry Date</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full bg-zinc-800 text-white border-2 border-yellow-400/30 rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-yellow-400 font-semibold mb-2">CVV</label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      maxLength={3}
                      className="w-full bg-zinc-800 text-white border-2 border-yellow-400/30 rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4 border border-yellow-400/20">
                  <p className="text-gray-400 text-sm">
                    💳 We accept Visa, Mastercard, and RuPay cards
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handlePayment}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-bold text-xl py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg mt-6"
          >
            Complete Payment
          </button>
        </div>
      </div>
    </div>
  );
}
