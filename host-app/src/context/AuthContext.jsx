import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // 2. Google Sign-In (Auto update role to 'owner' if logging in on Host App)
  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Auto check if they are customer and upgrade them to owner in MongoDB
      const idToken = await result.user.getIdToken(true);
      localStorage.setItem('token', idToken);
      
      const res = await api.auth.getMe();
      if (res.user && res.user.role === 'customer') {
        // Upgrade to owner
        const syncRes = await api.auth.updateProfile({ role: 'owner' });
        setUser({ ...syncRes.user, emailVerified: result.user.emailVerified });
      }
      
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 3. Email & Password Sign-Up for Host Owner
  const registerWithEmail = async (name, email, password, phone) => {
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

      // Call MongoDB profile sync to set custom details (name, phone, role='owner')
      const syncRes = await api.auth.updateProfile({ name, phone, role: 'owner' });
      
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

  // 6. Update Bank Account for Payouts
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

  // 7. Request Payout / Redeem wallet balance
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
