import { ChevronRight } from 'lucide-react';

interface HomePageProps {
  onNavigate: () => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen bg-brand-darker relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-yellow/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-yellow/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      {/* Hero Section */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 pt-12 pb-24 md:py-24">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">

            {/* Logo Badge */}
            <div className="mb-8 relative group">
              <div className="absolute inset-0 bg-brand-yellow/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <img
                src="/logo.jpeg"
                alt="The Cheese Town"
                className="relative w-32 h-32 md:w-48 md:h-48 rounded-full shadow-2xl border-4 border-brand-dark ring-4 ring-brand-yellow/20 object-cover"
              />
            </div>

            <h1 className="text-4xl md:text-7xl font-bold font-serif text-white mb-6 leading-tight">
              The <span className="text-brand-yellow">Cheese</span> Town
            </h1>

            <p className="text-lg md:text-2xl text-gray-300 mb-10 max-w-2xl font-light leading-relaxed">
              Where every bite is a <span className="text-brand-yellow italic font-serif">cheesy delight</span>.
              Experience the perfect blend of gourmet flavors and cozy moments.
            </p>

            <button
              onClick={onNavigate}
              className="group relative bg-brand-yellow text-brand-darker font-bold text-lg md:text-xl py-4 px-8 md:px-12 rounded-full overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_20px_rgba(251,191,36,0.4)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative flex items-center gap-2">
                Order Now
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="container mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: '🧀', title: 'Fresh Cheese', desc: 'Premium quality artisan cheese in every dish' },
              { icon: '☕', title: 'Hot Beverages', desc: 'Specialty coffee and rich hot chocolates' },
              { icon: '🍰', title: 'Sweet Treats', desc: 'Decadent desserts to satisfy your cravings' }
            ].map((item, index) => (
              <div
                key={index}
                className="bg-brand-dark/50 backdrop-blur-sm p-8 rounded-3xl border border-white/5 hover:border-brand-yellow/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
