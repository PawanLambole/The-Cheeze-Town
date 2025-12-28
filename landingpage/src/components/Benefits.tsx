import { Zap, TrendingDown, Boxes } from 'lucide-react';
import { useEffect, useRef } from 'react';

const benefits = [
  {
    icon: Zap,
    stat: '50%',
    label: 'Faster Operations',
    description: 'Streamline your workflow and serve customers quicker than ever before'
  },
  {
    icon: TrendingDown,
    stat: '30%',
    label: 'Cost Reduction',
    description: 'Reduce operational costs with smart inventory and staff management'
  },
  {
    icon: Boxes,
    stat: 'All-in-One',
    label: 'Complete Solution',
    description: 'Everything you need integrated into a single powerful platform'
  }
];

export default function Benefits() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const benefitId = 'benefits';

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = sectionRef.current?.querySelectorAll('.scroll-animate');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id={benefitId} className="relative py-24 bg-[#121212]">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-[#FFB800] rounded-full filter blur-[100px]"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#FFD54A] rounded-full filter blur-[100px]"></div>
      </div>

      <div className="relative container mx-auto px-6">
        <div className="text-center mb-16 scroll-animate">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Why We Built the <span className="gradient-text">Cheeze Town Cafe App</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            See how our own app helps us serve you faster, fresher, and with less waiting
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="scroll-animate glass-card rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-[#FFB800]/30"
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#FFB800] to-[#FFD54A] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <benefit.icon className="w-10 h-10 text-white" />
              </div>
              <div className="text-5xl font-bold gradient-text mb-2">{benefit.stat}</div>
              <div className="text-2xl font-semibold text-white mb-3">{benefit.label}</div>
              <p className="text-gray-400 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
