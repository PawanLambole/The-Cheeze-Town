import { Plus, Minus, ShoppingCart, Trash2, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useMenuItems } from '../hooks/useSupabase';

interface MenuPageProps {
  onPlaceOrder: () => void;
}

export default function MenuPage({ onPlaceOrder }: MenuPageProps) {
  const { cart, addToCart, removeFromCart, getTotalPrice } = useCart();
  const { menuItems, loading, error } = useMenuItems();
  const totalPrice = getTotalPrice();

  const getItemQuantity = (itemId: string | number) => {
    const cartItem = cart.find((item) => String(item.id) === String(itemId));
    return cartItem ? cartItem.quantity : 0;
  };

  const categories = Array.from(new Set(menuItems.map((item) => item.category)));

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-yellow mx-auto mb-4"></div>
          <p className="text-gray-400">Loading menu...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load menu</p>
          <p className="text-gray-500 text-sm">{error.message || 'Please try again later'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-darker pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-brand-dark sticky top-0 z-30 border-b border-white/5 shadow-lg backdrop-blur-md bg-opacity-90">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold font-serif text-brand-yellow">Menu</h1>
            <p className="text-xs text-gray-400">Order your favorites</p>
          </div>
          <div className="md:hidden relative">
            <div className="bg-brand-yellow rounded-full p-2">
              <ShoppingCart className="w-5 h-5 text-brand-darker" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-brand-dark">
                  {cart.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Menu Items */}
          <div className="lg:col-span-2 space-y-10">
            {categories.map((category) => (
              <div key={category} id={category} className="scroll-mt-24">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="w-2 h-8 bg-brand-yellow rounded-full"></span>
                  {category}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems
                    .filter((item) => item.category === category)
                    .map((item) => {
                      const quantity = getItemQuantity(item.id);
                      return (
                        <div
                          key={item.id}
                          className="group bg-brand-dark rounded-2xl p-4 border border-white/5 hover:border-brand-yellow/30 transition-all duration-300 flex flex-col justify-between"
                        >
                          <div className="mb-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-lg font-semibold text-white group-hover:text-brand-yellow transition-colors">{item.name}</h3>
                              <span className="bg-brand-yellow/10 text-brand-yellow px-2 py-1 rounded-lg font-bold text-sm">
                                ₹{item.price}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm line-clamp-2">Delicious cheesy {item.name.toLowerCase()} prepared fresh.</p>
                          </div>

                          {quantity === 0 ? (
                            <button
                              onClick={() => addToCart(item)}
                              className="w-full bg-brand-gray hover:bg-brand-yellow hover:text-brand-darker text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg"
                            >
                              <Plus className="w-4 h-4" />
                              Add to Cart
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-brand-yellow rounded-xl p-1">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="p-2 hover:bg-black/10 rounded-lg transition-colors text-brand-darker"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-bold text-brand-darker w-8 text-center">{quantity}</span>
                              <button
                                onClick={() => addToCart(item)}
                                className="p-2 hover:bg-black/10 rounded-lg transition-colors text-brand-darker"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Cart - Sticky */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 bg-brand-dark rounded-3xl p-6 border border-brand-yellow/20 shadow-xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="bg-brand-yellow/10 p-2 rounded-xl">
                  <ShoppingCart className="w-6 h-6 text-brand-yellow" />
                </div>
                <h2 className="text-2xl font-bold text-white">Your Order</h2>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-brand-gray rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">🛒</div>
                  <p className="text-gray-400">Your cart is empty</p>
                  <p className="text-gray-500 text-sm mt-2">Add some cheesy goodness!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6 max-h-[calc(100vh-400px)] overflow-y-auto pr-2 custom-scrollbar">
                    {cart.map((item) => (
                      <div key={item.id} className="bg-brand-gray/50 rounded-xl p-3 flex justify-between items-center group">
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm mb-1">{item.name}</p>
                          <p className="text-brand-yellow text-xs font-bold">₹{item.price} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-white font-bold">₹{item.price * item.quantity}</span>
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

                  <div className="border-t border-brand-yellow/20 pt-4 space-y-4">
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Subtotal</span>
                      <span>₹{totalPrice}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-white">Total</span>
                      <span className="text-2xl font-bold text-brand-yellow">₹{totalPrice}</span>
                    </div>
                    <button
                      onClick={onPlaceOrder}
                      className="w-full bg-brand-yellow hover:bg-yellow-400 text-brand-darker font-bold text-lg py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
                    >
                      Place Order
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Bottom Bar with Cart Summary */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-brand-dark border-t border-brand-yellow/20 p-4 lg:hidden z-40 pb-safe">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-brand-yellow">₹{totalPrice}</p>
            </div>
            <button
              onClick={onPlaceOrder}
              className="bg-brand-yellow text-brand-darker font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
            >
              Place Order
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
