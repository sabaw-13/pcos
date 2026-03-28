import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/cartcontext';
import Navbar from './components/navbar';
import Footer from './components/footer';
import Landing from './pages/landing';
import Menu from './pages/menu';
import Cart from './pages/cart';
import Checkout from './pages/checkout';
import OrderHistory from './pages/orderhistory';
import Login from './pages/login';
import './styles/variables.css';
import './styles/app.css';

function App() {
  return (
    <CartProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/login" element={<Login />} />
        </Routes>
        <Footer />
      </Router>
    </CartProvider>
  );
}

export default App;
