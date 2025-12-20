import { Coffee } from 'lucide-react';

interface HomePageProps {
  onNavigate: () => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800">
      <div className="relative overflow-hidden">
        <svg className="absolute top-0 left-0 w-full h-32" preserveAspectRatio="none" viewBox="0 0 1200 120">
          <path
            d="M0,0 Q50,40 100,20 T200,20 T300,20 T400,20 T500,20 T600,20 T700,20 T800,20 T900,20 T1000,20 T1100,20 L1200,20 L1200,0 Z"
            fill="#fbbf24"
          />
        </svg>
      </div>

      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-12 pt-16">
          <img
            src="/logo.jpeg"
            alt="The Cheese Town"
            className="w-48 h-48 mx-auto mb-8 rounded-full shadow-2xl"
          />
          <h1 className="text-6xl font-bold text-yellow-400 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            The Cheese Town
          </h1>
          <p className="text-2xl text-yellow-300 mb-8">Where Every Bite is Cheesy Delight!</p>
        </div>

        <div className="max-w-2xl mx-auto bg-zinc-900/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border-4 border-yellow-400">
          <div className="text-center mb-8">
            <Coffee className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">Welcome to Our Café</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Indulge in our delicious selection of cheesy delights, gourmet coffees, and delectable treats.
              Experience the perfect blend of comfort and flavor in every visit.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 my-8 text-center">
            <div className="bg-yellow-400/10 rounded-xl p-4 border-2 border-yellow-400/30">
              <p className="text-4xl mb-2">🧀</p>
              <p className="text-yellow-400 font-semibold">Fresh Cheese</p>
            </div>
            <div className="bg-yellow-400/10 rounded-xl p-4 border-2 border-yellow-400/30">
              <p className="text-4xl mb-2">☕</p>
              <p className="text-yellow-400 font-semibold">Hot Beverages</p>
            </div>
            <div className="bg-yellow-400/10 rounded-xl p-4 border-2 border-yellow-400/30">
              <p className="text-4xl mb-2">🍰</p>
              <p className="text-yellow-400 font-semibold">Sweet Treats</p>
            </div>
          </div>

          <button
            onClick={onNavigate}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-bold text-xl py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            View Our Menu
          </button>
        </div>
      </div>
    </div>
  );
}
