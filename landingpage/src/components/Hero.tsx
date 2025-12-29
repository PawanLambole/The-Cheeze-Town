import { Smartphone, Pizza, Coffee, Cake, Apple } from 'lucide-react';
import cafeLogo from '../assets/logo.png';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#121212] via-[#1E1E1E] to-[#121212]"></div>

      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#FFB800] rounded-full filter blur-[120px]"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#FFD54A] rounded-full filter blur-[120px]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-white space-y-8 animate-slide-in-left">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
            Welcome to <span className="gradient-text">The Cheese Town</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
            Our own cafe app powers everything we do – from taking your order to serving fresh pizzas, coffee, and desserts right on time.
          </p>

          <div className="pt-4">
            <a
              href="https://expo.dev/artifacts/eas/wsqryyDMTgoYBvCWDDHNHD.apk"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-[#FFB800] to-[#FFD54A] text-black px-10 py-5 rounded-full text-lg font-semibold hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-[#FFB800]/50 animate-pulse-glow"
            >
              <Smartphone className="w-6 h-6" />
              Download Cafe App
            </a>
          </div>

          <div className="flex gap-8 pt-6">
            <div>
              <div className="text-3xl font-bold gradient-text">Fresh</div>
              <div className="text-gray-400">Oven-baked Pizzas</div>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-text">One</div>
              <div className="text-gray-400">Cozy Cafe</div>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-text">4.9★</div>
              <div className="text-gray-400">Loved by Regulars</div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="relative w-full max-w-md">
            <div className="glass-card rounded-[3rem] p-8 shadow-2xl transform hover:scale-105 transition-transform duration-500">
              <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] rounded-[2rem] p-6 h-[600px] flex items-center justify-center border-4 border-[#FFB800]/20">
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden bg-black shadow-xl">
                    <img src={cafeLogo} alt="The Cheese Town app" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-white text-2xl font-bold">The Cheese Town</div>
                  <div className="text-gray-400">Official Cafe App</div>
                </div>
              </div>
            </div>

            <div className="absolute -top-10 -right-10 animate-float" style={{ animationDelay: '0s' }}>
              <div className="bg-gradient-to-br from-[#FFB800] to-[#FFD54A] w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl">
                <Pizza className="w-10 h-10 text-white" />
              </div>
            </div>

            <div className="absolute top-1/4 -left-10 animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="bg-gradient-to-br from-[#FFD54A] to-[#FFB800] w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl">
                <Coffee className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="absolute bottom-20 -right-8 animate-float" style={{ animationDelay: '1s' }}>
              <div className="bg-gradient-to-br from-[#FFB800] to-[#FFD54A] w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl">
                <Cake className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="absolute bottom-1/3 -left-8 animate-float" style={{ animationDelay: '1.5s' }}>
              <div className="bg-gradient-to-br from-[#FFD54A] to-[#FFB800] w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl">
                <Apple className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#121212] to-transparent"></div>
    </section>
  );
}
