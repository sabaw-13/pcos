import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">About Persimonay</h3>
            <p className="footer-text">
              Crafting the perfect cup of coffee and delicious pastries since 2024.
            </p>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">Quick Links</h3>
            <div className="footer-links">
              <Link to="/login" className="footer-link">Log In</Link>
              <Link to="/" className="footer-link">Cafe Info</Link>
              <a href="/#about" className="footer-link">About</a>
            </div>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">Contact</h3>
            <p className="footer-text">
              123 Coffee Street, Cafe City
              <br />
              (555) 123-4567
              <br />
              hello@persimonay.com
            </p>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">Hours</h3>
            <p className="footer-text">
              Mon - Fri: 6am - 8pm
              <br />
              Sat - Sun: 7am - 9pm
            </p>
          </div>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-bottom">
          <p className="copyright">&copy; {currentYear} Persimonay Cafe. All rights reserved.</p>
          <div className="social-links">
            <a href="https://facebook.com" className="social-link">Facebook</a>
            <a href="https://instagram.com" className="social-link">Instagram</a>
            <a href="https://twitter.com" className="social-link">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
