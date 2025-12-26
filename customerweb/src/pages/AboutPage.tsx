import { Award, Heart, Users, Leaf } from 'lucide-react';
import { Card } from '../components';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  const values = [
    {
      icon: Heart,
      title: 'Passion',
      description: 'Every dish is crafted with love and dedication to excellence',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'We believe in creating a warm, welcoming space for everyone',
    },
    {
      icon: Leaf,
      title: 'Quality',
      description: 'Using only the finest ingredients for the best taste',
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Committed to delivering outstanding service every time',
    },
  ];

  return (
    <div className="pt-20 pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-brand-dark to-brand-darker py-20">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold font-serif text-white mb-6 animate-fade-in-down">
            About <span className="text-brand-yellow">The Cheeze Town</span>
          </h1>
          <p className="text-xl text-gray-300 animate-fade-in-up animation-delay-200">
            A story of passion, craft, and the perfect cheese experience
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto space-y-20">
          {/* Our Story */}
          <section className="animate-fade-in-up">
            <Card hoverable className="p-12">
              <h2 className="text-4xl font-bold font-serif text-white mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  The Cheeze Town was founded with a simple vision: to create a haven where cheese lovers 
                  can experience the finest flavors crafted with passion. What started as a small dream has 
                  grown into a beloved destination for food enthusiasts.
                </p>
                <p>
                  We believe that great food goes beyond just taste—it's about creating memories, building 
                  connections, and celebrating life's special moments. Every cheese dish, every beverage, 
                  and every dessert is prepared with meticulous attention to detail.
                </p>
                <p>
                  Our journey has been marked by constant innovation while staying true to our core values 
                  of quality, authenticity, and customer satisfaction. We're grateful for the trust and 
                  support of our community.
                </p>
              </div>
            </Card>
          </section>

          {/* Values Section */}
          <section className="animate-fade-in-up animation-delay-200">
            <h2 className="text-4xl font-bold font-serif text-white mb-12 text-center">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index} hoverable className="p-8 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="flex gap-6">
                      <div className="bg-brand-yellow/10 rounded-2xl p-4 h-fit border border-brand-yellow/20">
                        <Icon className="w-8 h-8 text-brand-yellow" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2">{value.title}</h3>
                        <p className="text-gray-400">{value.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Stats Section */}
          <section className="bg-brand-dark rounded-3xl p-12 animate-fade-in-up animation-delay-400">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {[
                { stat: '10+', label: 'Years of Excellence' },
                { stat: '50K+', label: 'Happy Customers' },
                { stat: '200+', label: 'Signature Dishes' },
              ].map((item, index) => (
                <div key={index}>
                  <p className="text-5xl font-bold text-brand-yellow mb-2">{item.stat}</p>
                  <p className="text-gray-400 text-lg">{item.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Call to Action */}
          <section className="text-center animate-fade-in-up animation-delay-600">
            <h2 className="text-3xl font-bold font-serif text-white mb-6">Ready to Experience The Magic?</h2>
            <p className="text-gray-400 mb-8 text-lg max-w-2xl mx-auto">
              Visit us today and discover why The Cheeze Town is the place where flavor meets tradition.
            </p>
            <button
              onClick={() => onNavigate('menu')}
              className="bg-brand-yellow hover:bg-yellow-400 text-brand-darker font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg inline-flex items-center gap-2"
            >
              Order Now 🧀
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
