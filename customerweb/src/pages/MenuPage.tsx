import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { menuItems } from '../data/menuData';

interface MenuPageProps {
  onPlaceOrder: () => void;
}

export default function MenuPage({ onPlaceOrder }: MenuPageProps) {
  const { cart, addToCart, removeFromCart, getTotalPrice } = useCart();

  const getItemQuantity = (itemId: string) => {
    const cartItem = cart.find((item) => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const categories = Array.from(new Set(menuItems.map((item) => item.category)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800 py-8">
      <div className="relative overflow-hidden mb-8">
        <svg className="absolute top-0 left-0 w-full h-24" preserveAspectRatio="none" viewBox="0 0 1200 120">
          <path
            d="M0,0 Q50,40 100,20 T200,20 T300,20 T400,20 T500,20 T600,20 T700,20 T800,20 T900,20 T1000,20 T1100,20 L1200,20 L1200,0 Z"
            fill="#fbbf24"
          />
        </svg>
      </div>

      <div className="container mx-auto px-6 pt-16">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-yellow-400 mb-2">Our Menu</h1>
          <p className="text-gray-300 text-lg">Explore our delicious offerings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {categories.map((category) => (
              <div key={category} className="mb-8">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4 border-b-2 border-yellow-400 pb-2">
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
                          className="bg-zinc-900/80 backdrop-blur-sm rounded-xl p-5 border-2 border-yellow-400/30 hover:border-yellow-400 transition-all duration-300"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                            <span className="text-yellow-400 font-bold text-lg">₹{item.price}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {quantity === 0 ? (
                              <button
                                onClick={() => addToCart(item)}
                                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Add
                              </button>
                            ) : (
                              <div className="flex-1 flex items-center justify-between bg-yellow-400 rounded-lg">
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-zinc-900 font-bold py-2 px-4 hover:bg-yellow-500 rounded-l-lg transition-all"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-zinc-900 font-bold">{quantity}</span>
                                <button
                                  onClick={() => addToCart(item)}
                                  className="text-zinc-900 font-bold py-2 px-4 hover:bg-yellow-500 rounded-r-lg transition-all"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-zinc-900/90 backdrop-blur-sm rounded-xl p-6 border-4 border-yellow-400 shadow-2xl">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b-2 border-yellow-400">
                <ShoppingCart className="w-6 h-6 text-yellow-400" />
                <h2 className="text-2xl font-bold text-yellow-400">Your Bill</h2>
              </div>

              {cart.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="bg-zinc-800 rounded-lg p-3 border border-yellow-400/20">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-white font-medium text-sm">{item.name}</span>
                          <span className="text-yellow-400 font-semibold">₹{item.price * item.quantity}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Qty: {item.quantity}</span>
                          <span className="text-gray-400">₹{item.price} each</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-yellow-400 pt-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xl font-bold text-white">Grand Total</span>
                      <span className="text-2xl font-bold text-yellow-400">₹{getTotalPrice()}</span>
                    </div>
                  </div>

                  <button
                    onClick={onPlaceOrder}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-bold text-lg py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Place Order
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
