import React, { useState, useEffect } from 'react';
import { Compass, Bell, CheckCircle, ShieldAlert } from 'lucide-react';
import './SplashScreen.css';

const SplashScreen = ({ onFinish }) => {
  const [loadingStep, setLoadingStep] = useState('animation'); // 'animation', 'location_prompt', 'notification_prompt'
  const [fadeClass, setFadeClass] = useState('fade-in');

  useEffect(() => {
    // 1. Run logo animation for 3.5 seconds, then transition to permission prompts
    const animTimer = setTimeout(() => {
      setFadeClass('fade-out');
      setTimeout(() => {
        setLoadingStep('location_prompt');
        setFadeClass('fade-in');
      }, 300);
    }, 3500);

    return () => clearTimeout(animTimer);
  }, []);

  const handleLocationGrant = (allowed) => {
    if (allowed) {
      localStorage.setItem('gps_enabled', 'true');
      // Simulate real GPS location storage
      localStorage.setItem('user_lat', '9.5930');
      localStorage.setItem('user_lng', '76.4230');
    } else {
      localStorage.setItem('gps_enabled', 'false');
    }
    
    // Go to next step
    setFadeClass('fade-out');
    setTimeout(() => {
      setLoadingStep('notification_prompt');
      setFadeClass('fade-in');
    }, 300);
  };

  const handleNotificationGrant = (allowed) => {
    localStorage.setItem('notifications_enabled', allowed ? 'true' : 'false');
    localStorage.setItem('splash_shown_key', 'true');
    
    // Exit splash
    setFadeClass('fade-out');
    setTimeout(() => {
      onFinish();
    }, 400);
  };

  if (loadingStep === 'animation') {
    return (
      <div className={`splash-overlay ${fadeClass}`}>
        <div className="splash-logo-container">
          <img src="/logo.png" alt="Nowhere Nest Logo" className="splash-logo-animated" />
          <h2 className="splash-title">nowhere nest</h2>
          <p className="splash-subtitle">Premium Stays & Direct Bookings</p>
          <div className="splash-loading-bar-wrapper">
            <div className="splash-loading-bar-fill"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loadingStep === 'location_prompt') {
    return (
      <div className={`splash-overlay flex-center ${fadeClass}`}>
        <div className="prompt-card card">
          <div className="prompt-icon-wrapper location">
            <Compass size={32} />
          </div>
          <h4>Allow Location Tracking?</h4>
          <p>
            Nowhere Nest needs access to your device GPS location to show nearby stays, local tours, and cab driver tracking.
          </p>
          
          <div className="prompt-actions flex-col">
            <button 
              onClick={() => handleLocationGrant(true)} 
              className="btn btn-primary btn-block"
            >
              Allow GPS Location
            </button>
            <button 
              onClick={() => handleLocationGrant(false)} 
              className="btn btn-outline btn-block"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadingStep === 'notification_prompt') {
    return (
      <div className={`splash-overlay flex-center ${fadeClass}`}>
        <div className="prompt-card card">
          <div className="prompt-icon-wrapper notification">
            <Bell size={32} />
          </div>
          <h4>Enable Push Notifications?</h4>
          <p>
            Receive check-in verification codes (OTPs), direct payment statements, and instant cab driver arrivals.
          </p>
          
          <div className="prompt-actions flex-col">
            <button 
              onClick={() => handleNotificationGrant(true)} 
              className="btn btn-primary btn-block"
            >
              Enable Notifications
            </button>
            <button 
              onClick={() => handleNotificationGrant(false)} 
              className="btn btn-outline btn-block"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SplashScreen;
