import { ShoppingCart, ChefHat, BarChart3, Package, Users, Receipt, UserCircle, Lightbulb } from 'lucide-react';
import { useEffect, useRef } from 'react';

const features = [
  {
    icon: ShoppingCart,
    title: 'Order Management',
    description: 'Track and manage orders in real-time with automated workflows and instant notifications.'
  },
  {
    icon: ChefHat,
    title: 'Chef Dashboard',
    description: 'Kitchen display system for efficient order preparation and cooking management.'
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Detailed insights and reports on sales, revenue, and performance metrics.'
  },
  {
    icon: Package,
    title: 'Inventory',
    description: 'Smart inventory tracking with low-stock alerts and automatic reorder suggestions.'
  },
  {
    icon: Users,
    title: 'Staff Management',
    description: 'Manage shifts, attendance, and staff performance with ease.'
  },
  {
    icon: Receipt,
    title: 'Digital Receipts',
    description: 'Generate and send digital receipts instantly to customers via email or SMS.'
  },
  {
    icon: UserCircle,
    title: 'Customer Portal',
    description: 'Let customers view menus, place orders, and track delivery status online.'
  },
  {
    icon: Lightbulb,
    title: 'Business Insights',
    description: 'AI-powered recommendations to optimize operations and increase revenue.'
  }
];

export default function Features() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const featureId = 'features';

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
    <section ref={sectionRef} id={featureId} className="relative py-24 bg-[#121212]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 scroll-animate">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Powerful <span className="gradient-text">Features</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything we use behind the scenes to run Cheeze Town Cafe, all in one powerful app
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="scroll-animate glass-card rounded-2xl p-6 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-[#FFB800]/20 group"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-[#FFB800] to-[#FFD54A] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
