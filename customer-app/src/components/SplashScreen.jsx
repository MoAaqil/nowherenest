import React, { useState, useEffect } from 'react';
import { Compass, Bell, CheckCircle, ShieldAlert } from 'lucide-react';
import './SplashScreen.css';

const SplashScreen = ({ onFinish }) => {
  const [loadingStep, setLoadingStep] = useState('animation'); // 'animation', 'location_prompt', 'notification_prompt'
  const [fadeClass, setFadeClass] = useState('fade-in');

  useEffect(() => {
    const checkPermissionsAndProgress = async () => {
      // 1. Run logo animation for 3.5 seconds
      await new Promise(r => setTimeout(r, 3500));
      setFadeClass('fade-out');
      await new Promise(r => setTimeout(r, 300));
      
      // Check GPS permission state if supported
      let gpsGranted = false;
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          if (result.state === 'granted') {
            gpsGranted = true;
            // Get location quietly
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                localStorage.setItem('user_lat', pos.coords.latitude.toString());
                localStorage.setItem('user_lng', pos.coords.longitude.toString());
              },
              () => {}
            );
          }
        }
      } catch (e) {
        console.warn("Permission API not supported", e);
      }

      if (!gpsGranted) {
        setLoadingStep('location_prompt');
        setFadeClass('fade-in');
        return;
      }

      // Check Notification state
      let notifGranted = false;
      if ('Notification' in window) {
        notifGranted = Notification.permission === 'granted';
      }

      if (!notifGranted) {
        setLoadingStep('notification_prompt');
        setFadeClass('fade-in');
        return;
      }

      // Both granted, skip prompts
      onFinish();
    };
    
    checkPermissionsAndProgress();
  }, [onFinish]);

  const proceedToNotifications = () => {
    let notifGranted = false;
    if ('Notification' in window) {
      notifGranted = Notification.permission === 'granted';
    }
    
    if (notifGranted) {
      onFinish();
    } else {
      setFadeClass('fade-out');
      setTimeout(() => {
        setLoadingStep('notification_prompt');
        setFadeClass('fade-in');
      }, 300);
    }
  };

  const handleLocationGrant = (allowed) => {
    if (allowed) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            localStorage.setItem('gps_enabled', 'true');
            localStorage.setItem('user_lat', position.coords.latitude.toString());
            localStorage.setItem('user_lng', position.coords.longitude.toString());
            proceedToNotifications();
          },
          (error) => {
            console.error("GPS Error:", error);
            localStorage.setItem('gps_enabled', 'false');
            proceedToNotifications();
          }
        );
      } else {
        proceedToNotifications();
      }
    } else {
      localStorage.setItem('gps_enabled', 'false');
      proceedToNotifications();
    }
  };

  const handleNotificationGrant = async (allowed) => {
    if (allowed && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('notifications_enabled', 'true');
        new Notification("Welcome to Nowhere Nest!", {
          body: "You're all set to receive direct booking updates and cab tracking.",
          icon: "/logo.png"
        });
      } else {
        localStorage.setItem('notifications_enabled', 'false');
      }
    } else {
      localStorage.setItem('notifications_enabled', 'false');
    }
    
    localStorage.setItem('splash_shown_key', 'true');
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
