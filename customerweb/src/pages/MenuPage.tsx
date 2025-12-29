import { Plus, Minus, ShoppingCart, Trash2, ChevronRight, Search, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useMenuItems } from '../hooks/useSupabase';
import { Button, LoadingSpinner, Alert } from '../components';
import { useState } from 'react';

interface MenuPageProps {
  onPlaceOrder: () => void;
  readOnly?: boolean;
}

export default function MenuPage({ onPlaceOrder, readOnly = false }: MenuPageProps) {
  const { cart, addToCart, removeFromCart, getTotalPrice } = useCart();
  const { menuItems, loading, error } = useMenuItems();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const totalPrice = getTotalPrice();

  const getItemQuantity = (itemId: string | number) => {
    const cartItem = cart.find((item) => String(item.id) === String(itemId));
    return cartItem ? cartItem.quantity : 0;
  };

  const categories = Array.from(new Set(menuItems.map((item) => item.category)));

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading delicious menu items..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center p-4">
        <Alert
          type="error"
          title="Failed to Load Menu"
          message={error.message || 'Please refresh the page and try again'}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-darker via-brand-dark to-brand-darker pb-24 md:pb-10 pt-16 md:pt-20">
      {/* Sticky Header */}
      <div className="sticky top-16 md:top-20 z-30 bg-brand-dark/95 backdrop-blur-xl border-b border-white/5 shadow-2xl transition-all duration-300">
        <div className="container mx-auto px-4 py-2 md:py-3">
          <div className="flex flex-col gap-2 md:gap-3">

            {/* Top Row: Title & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
              {/* Title */}
              <div className="flex-shrink-0">
                <h1 className="text-xl md:text-3xl font-bold font-serif text-white tracking-tight">
                  {readOnly ? 'Our' : 'Order Your'} <span className="text-brand-yellow">Favorites</span>
                </h1>
                {readOnly && (
                  <div className="mt-2 text-brand-yellow text-sm font-bold bg-brand-yellow/10 inline-block px-3 py-1 rounded-full border border-brand-yellow/20">
                    Scan QR code on table to place order
                  </div>
                )}
              </div>

              {/* Search Bar - Sleek & Floating */}
              <div className="relative w-full md:max-w-md group">
                <div className="absolute inset-0 bg-brand-yellow/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for cheese delights..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/20 text-white border border-white/10 rounded-full px-6 pl-12 py-2.5 focus:outline-none focus:border-brand-yellow/50 focus:bg-black/40 transition-all placeholder-gray-500 text-sm font-medium backdrop-blur-sm"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors bg-white/10 rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: Categories */}
            <div className="border-t border-white/5 pt-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-1.5 rounded-full font-bold text-xs md:text-sm transition-all whitespace-nowrap flex-shrink-0 border ${!selectedCategory
                    ? 'bg-brand-yellow text-brand-darker border-brand-yellow shadow-lg shadow-brand-yellow/25'
                    : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
                    }`}
                >
                  All Items
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full font-bold text-xs md:text-sm transition-all whitespace-nowrap flex-shrink-0 border ${selectedCategory === cat
                      ? 'bg-brand-yellow text-brand-darker border-brand-yellow shadow-lg shadow-brand-yellow/25'
                      : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Items Grid */}
          <div className="lg:col-span-2">
            {filteredItems.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
                <div className="text-6xl mb-4">🧀</div>
                <h3 className="text-2xl font-serif font-bold text-white mb-2">No cheesy delights found</h3>
                <p className="text-gray-400">Try adjusting your search or category filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredItems.map((item) => {
                  const quantity = getItemQuantity(item.id);
                  return (
                    <div
                      key={item.id}
                      className="group relative bg-brand-dark/40 backdrop-blur-md rounded-3xl border border-white/5 hover:border-brand-yellow/30 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-brand-yellow/10 hover:-translate-y-1"
                    >
                      {/* Image Area */}
                      <div className="relative h-48 overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-brand-gray to-brand-dark flex items-center justify-center">
                            <span className="text-4xl">🧀</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent opacity-80" />

                        {/* Price Badge */}
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white font-bold px-3 py-1.5 rounded-full border border-white/10 shadow-lg translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          ₹{item.price}
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-6 relative">
                        <div className="mb-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold font-serif text-white group-hover:text-brand-yellow transition-colors duration-300 leading-tight">
                              {item.name}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed h-10">
                            {item.description || 'A delicious handcrafted cheesy delight made just for you.'}
                          </p>
                        </div>

                        {/* Actions */}
                        {!readOnly && (
                          <div className="flex items-center justify-between gap-4 mt-auto pt-4 border-t border-white/5">
                            <span className="text-xl font-bold text-brand-yellow">₹{item.price}</span>

                            {quantity === 0 ? (
                              <button
                                onClick={() => addToCart(item)}
                                className="bg-brand-gray/50 hover:bg-brand-yellow text-white hover:text-brand-darker font-medium px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 group/btn"
                              >
                                Add <Plus className="w-4 h-4 transform group-hover/btn:rotate-90 transition-transform" />
                              </button>
                            ) : (
                              <div className="flex items-center gap-1 bg-brand-yellow rounded-xl p-1 shadow-lg shadow-brand-yellow/20">
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-8 h-8 flex items-center justify-center bg-brand-darker/20 hover:bg-brand-darker/40 rounded-lg text-brand-darker transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-bold text-brand-darker">{quantity}</span>
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-8 h-8 flex items-center justify-center bg-brand-darker/20 hover:bg-brand-darker/40 rounded-lg text-brand-darker transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {readOnly && (
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                            <span className="text-xl font-bold text-brand-yellow">₹{item.price}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Sticky Cart */}
          {!readOnly && (
            <div className="hidden lg:block">
              <div className="sticky top-32">
                <div className="bg-brand-darker/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl">
                  {/* Cart Header */}
                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="bg-brand-yellow rounded-xl p-2 text-brand-darker">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-lg text-white">Current Order</span>
                    </div>
                    <span className="bg-white/5 text-xs font-bold px-2 py-1 rounded-lg text-gray-400">
                      {cart.reduce((acc, item) => acc + item.quantity, 0)} Items
                    </span>
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5 border-dashed">
                        <ShoppingCart className="w-6 h-6 text-gray-600" />
                      </div>
                      <p className="text-gray-400 font-medium text-sm">Your plate is empty</p>
                      <p className="text-gray-600 text-xs mt-1">Start adding delicious items</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {cart.map((item) => (
                          <div key={item.id} className="group flex items-start justify-between bg-white/5 p-3 rounded-xl border border-transparent hover:border-brand-yellow/20 transition-all">
                            <div className="flex-1 min-w-0 pr-3">
                              <p className="text-white font-medium text-sm line-clamp-1 mb-1">{item.name}</p>
                              <p className="text-gray-500 text-xs flex items-center gap-2">
                                <span>₹{item.price}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                <span className="text-brand-yellow font-bold">x{item.quantity}</span>
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-white font-bold text-sm">₹{(item.price * item.quantity).toFixed(0)}</span>
                              <button
                                onClick={() => removeFromCart(String(item.id))}
                                className="text-gray-600 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-end">
                          <span className="text-gray-400 text-sm mb-1">Total Amount</span>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-brand-yellow">₹{totalPrice}</span>
                          </div>
                        </div>

                        <Button
                          onClick={onPlaceOrder}
                          fullWidth
                          size="lg"
                          className="shadow-xl shadow-brand-yellow/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                        >
                          <span className="flex items-center justify-center gap-2">
                            Checkout Now <ChevronRight className="w-4 h-4" />
                          </span>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Cart Bar */}
      {
        !readOnly && cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-brand-dark to-brand-dark/95 border-t border-brand-yellow/20 p-4 lg:hidden z-[60] pb-safe shadow-2xl shadow-black/50">
            <div className="container mx-auto flex items-center justify-between gap-4">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Amount</p>
                <p className="text-3xl font-bold text-brand-yellow">₹{totalPrice}</p>
              </div>
              <Button
                onClick={onPlaceOrder}
                size="lg"
                icon={<ChevronRight className="w-5 h-5" />}
                iconPosition="right"
                className="shadow-lg shadow-brand-yellow/20"
              >
                Checkout
              </Button>
            </div>
          </div>
        )
      }
    </div >
  );
}
