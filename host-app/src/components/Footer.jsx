import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="host-footer">
      <div className="container flex-between host-footer-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="Nowhere Nest" style={{ height: '24px', width: 'auto', opacity: 0.7 }} />
          <span className="footer-copyright">© {new Date().getFullYear()} Nowhere Nest · Host Console v2.1.0</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.3px' }}>
            Powered By <strong style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '700' }}>Once In Aeon</strong>
          </span>
          <div className="system-status-indicator">
            <span className="indicator-dot"></span>
            <span className="indicator-text">Backend Synchronized</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
