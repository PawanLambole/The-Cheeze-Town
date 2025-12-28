import { useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutDashboard, ClipboardList, TrendingUp, Users } from 'lucide-react';

const screenshots = [
  {
    title: 'Dashboard Overview',
    icon: LayoutDashboard,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Order Management',
    icon: ClipboardList,
    color: 'from-[#FFB800] to-[#FFD54A]'
  },
  {
    title: 'Revenue Analytics',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Staff Dashboard',
    icon: Users,
    color: 'from-purple-500 to-pink-500'
  }
];

export default function Screenshots() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % screenshots.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  const CurrentIcon = screenshots[currentIndex].icon;

  return (
    <section id="screenshots" className="relative py-24 bg-gradient-to-b from-[#121212] to-[#1E1E1E]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            See It In <span className="gradient-text">Action</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Get a feel for the same simple screens our team uses every day at Cheeze Town Cafe
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={prev}
              className="w-12 h-12 rounded-full glass-card flex items-center justify-center hover:bg-[#FFB800]/10 transition-all duration-300"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            <div className="relative flex-1 max-w-md">
              <div className="glass-card rounded-[3rem] p-6 shadow-2xl">
                <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] rounded-[2rem] p-8 h-[600px] flex flex-col items-center justify-center border-4 border-[#FFB800]/20 overflow-hidden">
                  <div className={`w-full h-full bg-gradient-to-br ${screenshots[currentIndex].color} rounded-2xl flex flex-col items-center justify-center space-y-6 transition-all duration-500`}>
                    <CurrentIcon className="w-24 h-24 text-white" />
                    <h3 className="text-2xl font-bold text-white">{screenshots[currentIndex].title}</h3>
                    <div className="w-32 h-1 bg-white/30 rounded-full"></div>
                    <div className="space-y-3 w-full px-8">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-3 bg-white/20 rounded-full" style={{ width: `${80 - i * 10}%` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={next}
              className="w-12 h-12 rounded-full glass-card flex items-center justify-center hover:bg-[#FFB800]/10 transition-all duration-300"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {screenshots.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-[#FFB800] w-8' : 'bg-gray-600'
                }`}
              ></button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
