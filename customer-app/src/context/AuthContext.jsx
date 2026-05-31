import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  signOut, 
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Phone Auth Confirmation Result
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Parse token from URL if present (cross-origin session passing)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      // Clean up URL query parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // 1. Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);
      if (firebaseUser) {
        try {
          // Retrieve ID Token from Firebase
          const idToken = await firebaseUser.getIdToken(true);
          localStorage.setItem('token', idToken);

          // Get/Sync user profile with MongoDB backend
          const res = await api.auth.getMe();
          
          // Enrich profile with Firebase properties (e.g. email verified status)
          const enrichedUser = {
            ...res.user,
            emailVerified: firebaseUser.emailVerified
          };
          
          setUser(enrichedUser);
        } catch (err) {
          console.error('Firebase sync with backend failed:', err.message);
          setUser(null);
        }
      } else {
        // Fallback check for any valid token in localStorage (legacy seed or cross-origin session)
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const res = await api.auth.getMe();
            setUser(res.user);
          } catch (err) {
            console.error('Local token verification failed:', err.message);
            localStorage.removeItem('token');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Google Sign-In
  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 3. Email & Password Sign-Up with Verification Trigger
  const registerWithEmail = async (name, email, password, phone, role) => {
    setLoading(true);
    setError(null);
    try {
      // Create account in Firebase Auth
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Trigger Email Verification link
      await sendEmailVerification(credential.user);

      // Get ID token to authenticate sync profile request
      const idToken = await credential.user.getIdToken(true);
      localStorage.setItem('token', idToken);

      // Call MongoDB profile sync to set custom details (name, phone, role)
      const syncRes = await api.auth.updateProfile({ name, phone, role });
      
      const enrichedUser = {
        ...syncRes.user,
        emailVerified: false // since verification mail was just sent
      };
      
      setUser(enrichedUser);
      return credential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 4. Email & Password Sign-In
  const loginWithEmail = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return credential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 5. Sign Out
  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      localStorage.removeItem('token');
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 6. Setup ReCAPTCHA Verifier for SMS Phone Auth
  const setupRecaptcha = (containerId) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: (response) => {
          // reCAPTCHA solved, phone auth proceeds
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired, reset required.');
        }
      });
    }
  };

  // 7. Send SMS OTP Code via Firebase Phone Auth
  const sendPhoneOTP = async (phoneNumber, containerId) => {
    setError(null);
    try {
      setupRecaptcha(containerId);
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // 8. Verify SMS OTP Code
  const verifyPhoneOTP = async (otpCode) => {
    setLoading(true);
    setError(null);
    try {
      if (!confirmationResult) {
        throw new Error('No pending OTP request found. Please request code first.');
      }
      const result = await confirmationResult.confirm(otpCode);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBankDetails = async (bankData) => {
    setError(null);
    try {
      const res = await api.auth.updateBank(bankData);
      setUser(prev => prev ? { ...prev, bankDetails: res.user.bankDetails } : null);
      return res.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const triggerWalletRedeem = async (amount) => {
    setError(null);
    try {
      const res = await api.payouts.request(amount);
      const meRes = await api.auth.getMe();
      setUser(prev => prev ? { ...prev, walletBalance: meRes.user.walletBalance } : null);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      logout,
      sendPhoneOTP,
      verifyPhoneOTP,
      updateBankDetails,
      triggerWalletRedeem,
      setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
