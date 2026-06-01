import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/cartcontext';
import { useConfirm } from '../context/confirmcontext';
import CartItem from '../components/cartitem';
import CartIcon from '../components/carticon';

const Cart = () => {
  const { confirm } = useConfirm();
  const { cart, orderMode, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
  const isWalkIn = orderMode === 'walk-in';

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const deliveryFee = 30;
  const total = subtotal + (isWalkIn ? 0 : deliveryFee);

  const handleClearCart = async () => {
    const confirmed = await confirm({
      title: 'Clear your cart?',
      description: 'This will remove every item from your cart.',
      confirmText: 'Clear Cart',
      cancelText: 'Keep Items',
      tone: 'danger'
    });

    if (confirmed) {
      clearCart();
    }
  };

  const handleRemoveItem = async (item) => {
    const confirmed = await confirm({
      title: 'Remove this item?',
      description: `${item.name} will be removed from your cart.`,
      confirmText: 'Remove Item',
      cancelText: 'Keep Item',
      tone: 'danger'
    });

    if (confirmed) {
      removeFromCart(item.id);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <div className="empty-cart-icon">Cart</div>
          <h1>Your Cart Is Empty</h1>
          <p>Add items from the menu to start your order.</p>
          <Link to="/menu" className="btn btn-primary">
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header customer-header-block">
        <div>
          <h1 className="cart-title">
            <CartIcon className="cart-title-icon" />
            Review Cart
          </h1>
        </div>
        <button onClick={handleClearCart} className="clear-cart-btn">
          Clear All
        </button>
      </div>

      <div className="cart-layout">
        <div className="cart-items-section">
          <div className="cart-items-list">
            {cart.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onRemove={handleRemoveItem}
                onUpdateQuantity={updateQuantity}
              />
            ))}
          </div>
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>

          <div className="summary-details">
          <div className="summary-row">
              <span>Subtotal</span>
              <span className="amount">P{subtotal.toFixed(2)}</span>
            </div>
            {!isWalkIn && (
              <div className="summary-row">
                <span>Delivery fee</span>
                <span className="amount">P{deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-divider"></div>
            <div className="summary-row total">
              <span>Total</span>
              <span className="amount">P{total.toFixed(2)}</span>
            </div>
          </div>

          <Link to="/checkout" className="btn btn-primary btn-full">
            {isWalkIn ? 'Continue to Receipt' : 'Continue to Checkout'}
          </Link>

          <Link to="/menu" className="btn btn-secondary btn-full">
            Back to Order
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
