import { useState } from 'react';
import { CartProvider } from './context/CartContext';
import SplashScreen from './pages/SplashScreen';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import TableSelectionPage from './pages/TableSelectionPage';
import PaymentPage from './pages/PaymentPage';
import SuccessPage from './pages/SuccessPage';
import { Page } from './types';

function App() {
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

  return (
    <CartProvider>
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
    </CartProvider>
  );
}

export default App;
