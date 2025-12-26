import { useEffect, useState } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { NavigationBar, Footer } from './components';
import SplashScreen from './pages/SplashScreen';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import PaymentPage from './pages/PaymentPage';
import SuccessPage from './pages/SuccessPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import { Page } from './types';
import type { NavPage } from './components/NavigationBar';

import AES from 'crypto-js/aes';
import enc from 'crypto-js/enc-utf8';

// ... other imports ...

function AppContent() {
  const { cart } = useCart();
  const [currentPage, setCurrentPage] = useState<Page>('splash');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [hasTableFromUrl, setHasTableFromUrl] = useState(false);

  // Secret key for decryption - matching the one used for encryption
  const SECRET_KEY = "CHEEZETOWN_SECRET";

  // Read table id from URL so QR codes can pre-select a table, e.g. ?table=1 or ?tableId=1
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const encryptedQ = params.get('q');
    let rawTableId: string | null = null;

    // Try to decrypt if 'q' param exists
    if (encryptedQ) {
      try {
        const bytes = AES.decrypt(encryptedQ, SECRET_KEY);
        const decryptedData = bytes.toString(enc);
        if (decryptedData) {
          // expecting format "table-ID" to add some basic validation/salt, or just "ID"
          // Let's assume just ID for now or a JSON
          rawTableId = decryptedData;
          console.log("Decrypted table ID:", rawTableId);
        }
      } catch (e) {
        console.error("Failed to decrypt QR code", e);
      }
    }

    // Fallback to unencrypted params (optional - can remove if we want strict enforcement)
    // currently keeping it for easier testing if needed, or we can prioritize encrypted
    if (!rawTableId) {
      rawTableId = params.get('tableId') || params.get('table') || params.get('t');
    }

    if (rawTableId) {
      const parsed = Number(rawTableId);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setSelectedTableId(parsed);
        setHasTableFromUrl(true);
      }
    }
  }, []);

  const handleSplashComplete = () => {
    // If user came via table QR link, go directly to menu; otherwise go to home page
    if (hasTableFromUrl) {
      setCurrentPage('menu');
    } else {
      setCurrentPage('home');
    }
  };

  const handleNavigateToMenu = () => {
    setCurrentPage('menu');
  };

  const handlePlaceOrder = () => {
    // Navigate directly to payment, bypassing table selection
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

  const navigateToPage = (page: Page) => {
    setCurrentPage(page);
  };

  const handleNavigation = (page: NavPage) => {
    navigateToPage(page);
  };

  const handleFooterNavigation = (page: Page) => {
    navigateToPage(page);
  };

  const getActivePage = (): NavPage => {
    if (currentPage === 'menu') return 'menu';
    if (currentPage === 'payment') return 'menu'; // Keep menu active during payment
    if (currentPage === 'about') return 'about';
    if (currentPage === 'contact') return 'contact';
    return 'home';
  };

  // Hide navigation/footer only on splash screen; show them during booking and success
  // ALSO Hide navigation/footer if a table is selected (ordering mode) to focus user on the menu
  const showNavAndFooter = currentPage !== 'splash' && !selectedTableId;
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
        {currentPage === 'menu' && (
          <MenuPage
            onPlaceOrder={handlePlaceOrder}
            readOnly={!selectedTableId}
          />
        )}
        {currentPage === 'payment' && (
          <PaymentPage
            tableId={selectedTableId || 0} // Pass 0 if no table selected
            onPaymentComplete={handlePaymentComplete}
            onBack={handleBackToMenu}
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
