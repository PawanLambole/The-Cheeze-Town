import { useState } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { NavigationBar, Footer } from './components';
import SplashScreen from './pages/SplashScreen';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import TableSelectionPage from './pages/TableSelectionPage';
import PaymentPage from './pages/PaymentPage';
import SuccessPage from './pages/SuccessPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import { Page } from './types';
import type { NavPage } from './components/NavigationBar';

function AppContent() {
  const { cart } = useCart();
  const [currentPage, setCurrentPage] = useState<Page>('splash');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

  const handleSplashComplete = () => {
    setCurrentPage('home');
  };

  const handleNavigateToMenu = () => {
    setCurrentPage('menu');
  };

  const handlePlaceOrder = () => {
    setCurrentPage('table-selection');
  };

  const handleTableSelected = (tableId: number) => {
    setSelectedTableId(tableId);
    setCurrentPage('payment');
  };

  const handlePaymentComplete = () => {
    setCurrentPage('success');
  };

  const handleBackToHome = () => {
    setSelectedTableId(null);
    setCurrentPage('home');
  };

  const handleBackToMenu = () => {
    setCurrentPage('menu');
  };

  const handleBackToTableSelection = () => {
    setCurrentPage('table-selection');
  };

  const navigateToPage = (page: Page) => {
    setCurrentPage(page);
  };

  const handleNavigation = (page: NavPage) => {
    if (page === 'tables') {
      setCurrentPage('table-selection');
    } else {
      navigateToPage(page);
    }
  };

  const handleFooterNavigation = (page: Page) => {
    navigateToPage(page);
  };

  const getActivePage = (): NavPage => {
    if (currentPage === 'menu') return 'menu';
    if (currentPage === 'table-selection' || currentPage === 'payment') return 'tables';
    if (currentPage === 'about') return 'about';
    if (currentPage === 'contact') return 'contact';
    return 'home';
  };

  const showNavAndFooter = currentPage !== 'splash' && currentPage !== 'success';
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col">
      {showNavAndFooter && (
        <NavigationBar
          activePage={getActivePage()}
          onNavigate={handleNavigation}
          cartCount={cartCount}
        />
      )}

      <main className={showNavAndFooter ? 'flex-1 pt-24 pb-16' : 'flex-1'}>
        {currentPage === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}
        {currentPage === 'home' && <HomePage onNavigate={handleNavigateToMenu} />}
        {currentPage === 'menu' && <MenuPage onPlaceOrder={handlePlaceOrder} />}
        {currentPage === 'table-selection' && (
          <TableSelectionPage
            onTableSelected={handleTableSelected}
            onBack={handleBackToMenu}
          />
        )}
        {currentPage === 'payment' && selectedTableId && (
          <PaymentPage
            tableId={selectedTableId}
            onPaymentComplete={handlePaymentComplete}
            onBack={handleBackToTableSelection}
          />
        )}
        {currentPage === 'success' && <SuccessPage onBackToHome={handleBackToHome} />}
        {currentPage === 'about' && <AboutPage onNavigate={handleNavigateToMenu} />}
        {currentPage === 'contact' && <ContactPage />}
        {currentPage === 'terms' && <TermsOfServicePage />}
        {currentPage === 'privacy' && <PrivacyPolicyPage />}
        {currentPage === 'refund' && <RefundPolicyPage />}
      </main>

      {showNavAndFooter && <Footer onNavigate={handleFooterNavigation} />}
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}

export default App;
