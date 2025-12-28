import { useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Screenshots from './components/Screenshots';
import Benefits from './components/Benefits';
import GetStarted from './components/GetStarted';
import DownloadCTA from './components/DownloadCTA';
import Footer from './components/Footer';

function App() {
  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.scroll-animate');
      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.75;
        if (isVisible) {
          element.classList.add('visible');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#121212]">
      <Header />
      <Hero />
      <Features />
      <Screenshots />
      <Benefits />
      <GetStarted />
      <DownloadCTA />
      <Footer />
    </div>
  );
}

export default App;
