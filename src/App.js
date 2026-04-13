import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/cartcontext';
import { AuthProvider } from './context/authcontext';
import { ConfirmProvider } from './context/confirmcontext';
import Navbar from './components/navbar';
import Footer from './components/footer';
import ScrollToTop from './components/scrolltotop';
import Landing from './pages/landing';
import Menu from './pages/menu';
import Cart from './pages/cart';
import Checkout from './pages/checkout';
import OrderHistory from './pages/orderhistory';
import Login from './pages/login';
import Reservation from './pages/reservation';
import Admin from './pages/admin';
import './styles/variables.css';
import './styles/app.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ConfirmProvider>
            <ScrollToTop />
            <Navbar />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/home" element={<Landing />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/reservation" element={<Reservation />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-history" element={<OrderHistory />} />
              <Route path="/login" element={<Login />} />
            </Routes>
            <Footer />
          </ConfirmProvider>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
