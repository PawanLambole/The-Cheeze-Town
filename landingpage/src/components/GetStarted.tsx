import { Download, Settings, Rocket } from 'lucide-react';
import { useEffect, useRef } from 'react';

const steps = [
  {
    icon: Download,
    number: '01',
    title: 'Download the App',
    description: 'Install the Cheeze Town Cafe app from the Google Play Store on your Android device.'
  },
  {
    icon: Settings,
    number: '02',
    title: 'Sign In or Continue as Guest',
    description: 'Create an account or jump straight in as a guest to browse the full menu.'
  },
  {
    icon: Rocket,
    number: '03',
    title: 'Order Your Favourites',
    description: 'Place dine-in or takeaway orders, track status, and relax while we prepare everything for you.'
  }
];

export default function GetStarted() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const gettingStartedId = 'get-started';

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
    <section ref={sectionRef} id={gettingStartedId} className="relative py-24 bg-gradient-to-b from-[#1E1E1E] to-[#121212]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 scroll-animate">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Get Started In <span className="gradient-text">Minutes</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Three simple steps to start ordering from Cheeze Town Cafe with our own app
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="scroll-animate relative"
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <div className="glass-card rounded-2xl p-8 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-[#FFB800]/30 h-full">
                <div className="text-7xl font-bold text-[#FFB800]/10 absolute top-4 right-4">
                  {step.number}
                </div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#FFB800] to-[#FFD54A] rounded-xl flex items-center justify-center mb-6 shadow-xl">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.description}</p>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-[#FFB800] to-[#FFD54A]"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
