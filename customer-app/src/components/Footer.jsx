import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand-section">
          <Link to="/" className="footer-brand">
            <img src="/logo.png" alt="Nowhere Nest Logo" className="footer-logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            <span style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '-0.3px' }}>nowhere nest</span>
          </Link>
          <p className="footer-description">
            Discover luxury cottages, premium hotel stays, tour packages, and long-term PG rentals—all without brokerage. Pay smart, travel safe.
          </p>
        </div>

        <div className="footer-links-columns">
          <div className="footer-column">
            <h4>Explore</h4>
            <Link to="/">Stays & Hotels</Link>
            <Link to="/rentals">PG Rentals</Link>
            <Link to="/">Tours & Trekking</Link>
          </div>
          <div className="footer-column">
            <h4>Hosting</h4>
            <Link to="/login?owner=true">List Your Property</Link>
            <Link to="/login?owner=true">Owner Dashboard</Link>
            <Link to="/">USP Experience Hosting</Link>
          </div>
          <div className="footer-column">
            <h4>Company</h4>
            <Link to="/">About Us</Link>
            <Link to="/">Terms of Service</Link>
            <Link to="/">Privacy Policy</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container flex-between footer-bottom-container">
          <span>&copy; {new Date().getFullYear()} Nowhere Nest. All rights reserved.</span>
          <span className="footer-motto">Built for the modern wanderer.</span>
        </div>
        <div style={{ textAlign: 'center', padding: '8px 0 12px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>
          Powered By <strong style={{ color: 'rgba(255,255,255,0.65)', fontWeight: '700' }}>Once In Aeon</strong>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
