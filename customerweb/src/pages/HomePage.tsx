import { ChevronRight, Utensils, Flame, Clock, Sparkles } from 'lucide-react';
import { Button, Card } from '../components';

interface HomePageProps {
  onNavigate: () => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const features = [
    {
      icon: <Utensils className="w-8 h-8" />,
      title: 'Premium Selection',
      description: 'Handpicked artisan cheeses and quality ingredients in every bite.',
    },
    {
      icon: <Flame className="w-8 h-8" />,
      title: 'Freshly Prepared',
      description: 'Made to order with our signature recipes and passion for excellence.',
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Quick Service',
      description: 'Enjoy fast preparation without compromising on quality and taste.',
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Unique Experience',
      description: 'Create memorable moments with flavors you will never forget.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-darker via-brand-dark to-brand-darker relative overflow-hidden pt-16 md:pt-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-yellow/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-yellow/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 animate-bounce animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-brand-yellow/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-8 md:py-32">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
            {/* Logo Animation */}
            <div className="mb-6 md:mb-12 animate-fade-in-up">
              <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-brand-yellow/20 rounded-full blur-3xl group-hover:blur-[40px] transition-all duration-700 animate-pulse"></div>
                {/* Logo Container */}
                <div className="relative bg-gradient-to-br from-brand-dark to-brand-darker p-4 md:p-8 rounded-full shadow-2xl border-4 border-brand-yellow/30 group-hover:border-brand-yellow/50 transition-all duration-300 animate-float">
                  <img
                    src="/logo.jpeg"
                    alt="The Cheeze Town"
                    className="w-24 h-24 md:w-56 md:h-56 rounded-full shadow-xl object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>

            {/* Main Heading */}
            <div className="mb-4 md:mb-6 animate-fade-in-up animation-delay-200 w-full px-2">
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold font-serif leading-tight mb-2 md:mb-4">
                <span className="text-white">The </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow via-yellow-300 to-brand-yellow">Cheese</span>
                <span className="text-white"> Town</span>
              </h1>
            </div>

            {/* Tagline */}
            <div className="mb-8 md:mb-14 animate-fade-in-up animation-delay-400 max-w-3xl px-4">
              <p className="text-lg md:text-2xl text-gray-300 mb-3 font-light leading-relaxed">
                Where every <span className="font-serif italic text-brand-yellow font-bold">bite</span> is a
                <span className="font-serif italic text-brand-yellow font-bold"> cheesy delight</span>
              </p>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                Experience the perfect blend of gourmet flavors, quality ingredients, and cozy moments.
                Handcrafted with passion, served with love.
              </p>
            </div>

            {/* CTA Button */}
            <div className="animate-fade-in-up animation-delay-600">
              <Button
                size="lg"
                onClick={onNavigate}
                icon={<ChevronRight className="w-6 h-6" />}
                iconPosition="right"
                className="shadow-2xl shadow-brand-yellow/20 hover:shadow-3xl hover:shadow-brand-yellow/30"
              >
                Explore Menu & Order
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-16 md:py-28">
          <div className="mb-12 md:mb-16 text-center">
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-white mb-4 animate-fade-in-down">
              Why Choose <span className="text-brand-yellow">Us</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-transparent via-brand-yellow to-transparent mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                hoverable
                className={`flex flex-col gap-4 p-8 animate-fade-in-up transition-all duration-500 hover:shadow-xl`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="bg-brand-yellow/10 rounded-2xl p-4 w-fit border border-brand-yellow/20 group-hover:border-brand-yellow/50 transition-all">
                  <div className="text-brand-yellow">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed flex-grow">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonial/Info Section */}
        <div className="container mx-auto px-4 py-12 md:py-24">
          <Card glowing className="p-6 md:p-12 text-center max-w-4xl mx-auto">
            <p className="text-lg md:text-2xl text-gray-300 mb-4 font-light leading-relaxed">
              <span className="text-brand-yellow font-bold">"</span>
              Join us for an unforgettable culinary journey where tradition meets innovation.
              Every dish tells a story, and every moment becomes a memory.
              <span className="text-brand-yellow font-bold">"</span>
            </p>
            <p className="text-gray-500 text-xs md:text-sm uppercase tracking-widest font-medium">- The Cheeze Town Family</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
