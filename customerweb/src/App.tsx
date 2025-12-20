import { useState } from 'react';
import { CartProvider } from './context/CartContext';
import SplashScreen from './pages/SplashScreen';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import PaymentPage from './pages/PaymentPage';
import SuccessPage from './pages/SuccessPage';
import { Page } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('splash');

  const handleSplashComplete = () => {
    setCurrentPage('home');
  };

  const handleNavigateToMenu = () => {
    setCurrentPage('menu');
  };

  const handlePlaceOrder = () => {
    setCurrentPage('payment');
  };

  const handlePaymentComplete = () => {
    setCurrentPage('success');
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
  };

  return (
    <CartProvider>
      {currentPage === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}
      {currentPage === 'home' && <HomePage onNavigate={handleNavigateToMenu} />}
      {currentPage === 'menu' && <MenuPage onPlaceOrder={handlePlaceOrder} />}
      {currentPage === 'payment' && <PaymentPage onPaymentComplete={handlePaymentComplete} />}
      {currentPage === 'success' && <SuccessPage onBackToHome={handleBackToHome} />}
    </CartProvider>
  );
}

export default App;
