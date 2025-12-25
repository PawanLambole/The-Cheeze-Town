import { Plus, Minus, ShoppingCart, Trash2, ChevronRight, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useMenuItems } from '../hooks/useSupabase';
import { Button, Card, Badge, LoadingSpinner, Alert } from '../components';
import { useState } from 'react';

interface MenuPageProps {
  onPlaceOrder: () => void;
}

export default function MenuPage({ onPlaceOrder }: MenuPageProps) {
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
    <div className="min-h-screen bg-brand-darker pb-24 md:pb-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-gradient-to-b from-brand-dark to-brand-dark/95 backdrop-blur-lg border-b border-white/5 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          {/* Title and Cart Badge */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-serif text-white mb-1">
                Order Your <span className="text-brand-yellow">Favorites</span>
              </h1>
              <p className="text-gray-400 text-sm">Handcrafted with passion, served with love</p>
            </div>
            <div className="md:hidden flex items-center gap-2">
              <div className="relative">
                <div className="bg-brand-yellow rounded-full p-2.5 shadow-lg shadow-brand-yellow/20">
                  <ShoppingCart className="w-5 h-5 text-brand-darker" />
                </div>
                {cart.length > 0 && (
                  <Badge
                    variant="error"
                    size="sm"
                    className="absolute -top-2 -right-2 px-2 py-1"
                  >
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-gray/50 text-white border border-white/10 rounded-xl px-4 pl-10 py-3 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/50 transition-all placeholder-gray-600"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                !selectedCategory
                  ? 'bg-brand-yellow text-brand-darker shadow-lg shadow-brand-yellow/20'
                  : 'bg-brand-gray/50 text-gray-300 hover:bg-brand-gray'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-brand-yellow text-brand-darker shadow-lg shadow-brand-yellow/20'
                    : 'bg-brand-gray/50 text-gray-300 hover:bg-brand-gray'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Items Grid */}
          <div className="lg:col-span-2">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No items found matching your search.</p>
                <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredItems.map((item, index) => {
                  const quantity = getItemQuantity(item.id);
                  return (
                    <Card
                      key={item.id}
                      hoverable
                      className="flex flex-col justify-between overflow-hidden group animate-fade-in-up"
                    >
                      {/* Item Header */}
                      <div className="mb-4">
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white group-hover:text-brand-yellow transition-colors line-clamp-1">
                              {item.name}
                            </h3>
                            <p className="text-gray-500 text-xs uppercase tracking-wider mt-1 font-medium">
                              {item.category}
                            </p>
                          </div>
                          <Badge variant="default" size="md" className="flex-shrink-0 font-bold">
                            ₹{item.price}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {item.description || 'Delicious cheesy preparation crafted fresh for you'}
                        </p>
                      </div>

                      {/* Add to Cart Button */}
                      {quantity === 0 ? (
                        <Button
                          onClick={() => addToCart(item)}
                          fullWidth
                          variant="secondary"
                          icon={<Plus className="w-4 h-4" />}
                          className="group-hover:shadow-lg"
                        >
                          Add to Cart
                        </Button>
                      ) : (
                        <div className="flex items-center justify-between bg-brand-yellow rounded-xl p-1.5 gap-1">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 hover:bg-black/10 rounded-lg transition-colors text-brand-darker font-bold"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-brand-darker text-center min-w-8">{quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="p-1.5 hover:bg-black/10 rounded-lg transition-colors text-brand-darker font-bold"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Sticky Cart */}
          <div className="hidden lg:block">
            <div className="sticky top-28 bg-gradient-to-b from-brand-dark to-brand-dark/95 rounded-3xl p-8 border border-brand-yellow/20 shadow-2xl shadow-brand-yellow/10">
              {/* Cart Header */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                <div className="bg-brand-yellow/10 p-3 rounded-xl border border-brand-yellow/20">
                  <ShoppingCart className="w-6 h-6 text-brand-yellow" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Your Order</h2>
                  <p className="text-gray-400 text-xs uppercase tracking-widest">Review before checkout</p>
                </div>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-brand-gray rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                    🛒
                  </div>
                  <p className="text-gray-400 font-medium">Your cart is empty</p>
                  <p className="text-gray-500 text-sm mt-2">Add some cheesy goodness!</p>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-3 mb-6 max-h-[calc(100vh-500px)] overflow-y-auto pr-2 custom-scrollbar">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="bg-brand-gray/30 hover:bg-brand-gray/50 rounded-xl p-4 flex justify-between items-start group transition-all border border-white/5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm mb-1 line-clamp-1">{item.name}</p>
                          <p className="text-brand-yellow text-xs font-bold flex items-center gap-1">
                            ₹{item.price} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          <span className="text-white font-bold text-sm">₹{(item.price * item.quantity).toFixed(0)}</span>
                          <button
                            onClick={() => removeFromCart(String(item.id))}
                            className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cart Summary */}
                  <div className="border-t border-brand-yellow/20 pt-6 space-y-4">
                    <div className="flex justify-between items-center text-gray-400 text-sm">
                      <span>Subtotal</span>
                      <span>₹{totalPrice}</span>
                    </div>
                    <div className="bg-brand-yellow/5 border border-brand-yellow/20 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-white">Total</span>
                        <span className="text-3xl font-bold text-brand-yellow">₹{totalPrice}</span>
                      </div>
                    </div>
                    <Button
                      onClick={onPlaceOrder}
                      fullWidth
                      size="lg"
                      icon={<ChevronRight className="w-5 h-5" />}
                      iconPosition="right"
                      className="shadow-lg shadow-brand-yellow/20"
                    >
                      Proceed to Checkout
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-brand-dark to-brand-dark/95 border-t border-brand-yellow/20 p-4 lg:hidden z-40 pb-safe shadow-2xl shadow-black/50">
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
      )}
    </div>
  );
}
