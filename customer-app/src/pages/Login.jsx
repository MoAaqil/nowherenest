import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Shield, Key, User, Phone, Mail, ChevronRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import './Login.css';

const Login = () => {
  const { 
    user, 
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle, 
    sendPhoneOTP, 
    verifyPhoneOTP, 
    setUser, 
    error: authError 
  } = useAuth();
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Mode settings
  const isOwnerMode = searchParams.get('owner') === 'true';
  const isSignupParam = searchParams.get('signup') === 'true';
  const [isSignup, setIsSignup] = useState(isSignupParam);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password', 'otp', or 'google'
  
  // OTP Flow Steps: 'phone', 'verify', or 'complete_profile'
  const [otpStep, setOtpStep] = useState('phone'); 
  const [otpCode, setOtpCode] = useState('');
  
  // Profile Setup step (for Google or Phone users who need to select a role/name)
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [setupRole, setSetupRole] = useState('customer');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+91 '); // default country code prefix
  const [role, setRole] = useState('customer');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  useEffect(() => {
    setIsSignup(searchParams.get('signup') === 'true');
    setRole('customer');
  }, [searchParams]);

  // Check if logged-in user needs a profile setup (e.g. Google/Phone signin who has no custom role yet)
  useEffect(() => {
    if (user) {
      if (user.name === 'Firebase User' || !user.role) {
        setNeedsProfileSetup(true);
        setSetupName(user.name !== 'Firebase User' ? user.name : '');
        setSetupRole(user.role || 'customer');
      } else {
        // Logged in and profile is complete, redirect to home
        setInfoMessage(`Successfully authenticated as ${user.name}!`);
        setTimeout(() => {
          navigate('/');
        }, 1200);
      }
    }
  }, [user, navigate]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);
    try {
      if (isSignup) {
        if (!name || !email || !password || !phone) {
          throw new Error('Please fill in all registration fields');
        }
        const cleanPhone = phone.replace(/[\s-()]/g, '');
        if (!cleanPhone.startsWith('+') || cleanPhone.length < 10) {
          throw new Error('Please enter a valid phone number starting with "+" and country code (e.g., +919999988888)');
        }
        await registerWithEmail(name, email, password, cleanPhone, role);
        setInfoMessage('Registration successful! A verification email has been sent to your inbox. Please click the link to activate.');
      } else {
        if (!email || !password) {
          throw new Error('Please enter email and password');
        }
        const loggedUser = await loginWithEmail(email, password);
        setInfoMessage('Authenticated successfully!');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setInfoMessage(null);
    try {
      const firebaseUser = await loginWithGoogle();
      const idToken = await firebaseUser.getIdToken(true);
      localStorage.setItem('token', idToken);
      
      // Update profile on backend with selected role immediately
      const syncRes = await api.auth.updateProfile({
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Google User',
        role: role
      });
      
      setUser({
        ...syncRes.user,
        emailVerified: firebaseUser.emailVerified
      });
      
      setInfoMessage(`Signed in as ${syncRes.user.name}!`);
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Google Sign-In cancelled or failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneOTP = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[\s-()]/g, '');
    if (!cleanPhone || cleanPhone === '+91' || !cleanPhone.startsWith('+')) {
      setError('Please enter a valid phone number starting with "+" and country code (e.g., +919999988888)');
      return;
    }
    if (cleanPhone.length < 10) {
      setError('The phone number is too short. Please include your country code and mobile number.');
      return;
    }
    setLoading(true);
    setError(null);
    setInfoMessage(null);
    try {
      // Firebase phone Auth sends real SMS via recaptcha verifier container
      await sendPhoneOTP(cleanPhone, 'recaptcha-container');
      setOtpStep('verify');
      setInfoMessage('An SMS verification code was sent to your phone number!');
    } catch (err) {
      setError(err.message || 'Failed to dispatch SMS. Try checking your phone number format.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      setError('Please enter the 6-digit confirmation code');
      return;
    }
    const cleanPhone = phone.replace(/[\s-()]/g, '');
    setLoading(true);
    setError(null);
    setInfoMessage(null);
    try {
      const firebaseUser = await verifyPhoneOTP(otpCode);
      const idToken = await firebaseUser.getIdToken(true);
      localStorage.setItem('token', idToken);
      
      // Update profile on backend with selected role immediately
      const syncRes = await api.auth.updateProfile({
        name: firebaseUser.displayName || 'Phone User',
        phone: firebaseUser.phoneNumber || cleanPhone,
        role: role
      });
      
      setUser({
        ...syncRes.user,
        emailVerified: true
      });

      setInfoMessage(`Signed in as ${syncRes.user.name}!`);
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Verification failed. Code may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSetupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.updateProfile({ 
        name: setupName, 
        role: setupRole 
      });
      setUser(prev => prev ? { ...prev, name: res.user.name, role: res.user.role } : null);
      setNeedsProfileSetup(false);
      setInfoMessage('Profile setup complete! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to complete profile registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page flex-center">
      {/* Container for invisible Firebase recaptcha verifier */}
      <div id="recaptcha-container"></div>

      <div className="login-card card">
        <div className="login-card-header">
          <img src="/logo.png" alt="Owl Logo" className="login-owl-logo" />
          <h2>
            {needsProfileSetup 
              ? 'Complete Your Nest Profile' 
              : isSignup 
                ? 'Create Nowhere Nest Account' 
                : 'Sign in to Nowhere Nest'
            }
          </h2>
          <p className="login-subtitle">
            {needsProfileSetup 
              ? 'Just a few details to get your workspace ready'
              : isSignup 
                ? 'Register to book homestays or list PGs' 
                : 'Access stays, PG rentals, and cabs with Firebase Auth'
            }
          </p>
        </div>

        {error && (
          <div className="login-error-alert">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {authError && !error && (
          <div className="login-error-alert">
            <ShieldAlert size={18} />
            <span>{authError}</span>
          </div>
        )}

        {infoMessage && (
          <div className="login-success-alert">
            <CheckCircle2 size={18} />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Email verification notice if user logged in but has not verified email */}
        {user && !user.emailVerified && !needsProfileSetup && (
          <div className="email-verification-notice card" style={{ padding: '16px', background: '#FEF3C7', border: '1px solid #FCD34D', color: '#B45309', marginBottom: '20px', fontSize: '13px' }}>
            ⚠️ <strong>Verification Pending:</strong> A confirmation link was sent to <strong>{user.email}</strong>. Please check your spam folder and verify your account to unlock booking checkouts and listing posts.
          </div>
        )}



        {needsProfileSetup ? (
          /* PROFILE SETUP FORM FOR DYNAMIC FIREBASE USER ROLES */
          <form onSubmit={handleProfileSetupSubmit} className="login-form">
            <div className="form-group">
              <label>Your Account Name</label>
              <div className="input-with-icon">
                <User size={18} />
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Enter your name" 
                  value={setupName} 
                  onChange={e => setSetupName(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Are you a guest or listing properties?</label>
              <select 
                className="form-control" 
                value={setupRole} 
                onChange={e => setSetupRole(e.target.value)}
              >
                <option value="customer">Guest / Customer (Search, book stays & cabs)</option>
                <option value="owner">Host / Owner (List cottages/PGs, check stats, withdraw payouts)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Saving Profile...' : 'Finish Setup'}
              <ChevronRight size={16} />
            </button>
          </form>
        ) : (
          /* REGULAR LOGIN PANEL options */
          <>
            {/* Authenticator choice buttons */}
            {!isSignup && (
              <div className="login-method-selector">
                <button 
                  type="button" 
                  className={loginMethod === 'password' ? 'active' : ''} 
                  onClick={() => { setLoginMethod('password'); setError(null); }}
                >
                  Password
                </button>
                <button 
                  type="button" 
                  className={loginMethod === 'otp' ? 'active' : ''} 
                  onClick={() => { setLoginMethod('otp'); setError(null); }}
                >
                  SMS OTP (Phone)
                </button>
              </div>
            )}

            {loginMethod === 'password' ? (
              /* EMAIL/PASSWORD FORM (Supports Login and Signup) */
              <form onSubmit={handleEmailSubmit} className="login-form">
                {isSignup && (
                  <div className="form-group">
                    <label>Full Name</label>
                    <div className="input-with-icon">
                      <User size={18} />
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter your name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={18} />
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="name@example.com" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="input-with-icon">
                    <Key size={18} />
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                {isSignup && (
                  <>
                    <div className="form-group">
                      <label>Mobile Number (with country code)</label>
                      <div className="input-with-icon">
                        <Phone size={18} />
                        <input 
                          type="tel" 
                          className="form-control" 
                          placeholder="+91 99999 88888" 
                          value={phone} 
                          onChange={e => setPhone(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>

                  </>
                )}

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Processing...' : isSignup ? 'Create Account' : 'Sign In'}
                  <ChevronRight size={16} />
                </button>
              </form>
            ) : (
              /* FIREBASE PHONE SMS OTP AUTH */
              <div className="otp-flow-container">
                {otpStep === 'phone' ? (
                  <form onSubmit={handleSendPhoneOTP} className="login-form">
                    <div className="form-group">
                      <label>Mobile Number (with country code)</label>
                      <p className="field-helper-text">Enter your phone with country code (e.g. +91 99999 88888) to receive a real SMS.</p>
                      <div className="input-with-icon">
                        <Phone size={18} />
                        <input 
                          type="tel" 
                          className="form-control" 
                          value={phone} 
                          onChange={e => setPhone(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                      {loading ? 'Verifying Recaptcha...' : 'Send SMS Verification Code'}
                      <ChevronRight size={16} />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPhoneOTP} className="login-form">
                    <div className="form-group">
                      <label>Enter 6-Digit SMS Code</label>
                      <div className="input-with-icon">
                        <Shield size={18} />
                        <input 
                          type="text" 
                          maxLength="6"
                          className="form-control" 
                          placeholder="000000" 
                          value={otpCode} 
                          onChange={e => setOtpCode(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>
                    <div className="flex-between otp-controls">
                      <button type="button" className="btn-resend" onClick={() => setOtpStep('phone')}>
                        Back
                      </button>
                      <button type="submit" className="btn btn-primary btn-small" disabled={loading}>
                        Verify & Login
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Google Sign in button branding */}
            {!isSignup && (
              <div className="google-signin-separator">
                <hr className="sep-line" />
                <span>or</span>
                <hr className="sep-line" />
              </div>
            )}

            {!isSignup && (
              <button 
                type="button" 
                className="btn btn-outline btn-block google-signin-button flex-center"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="google-btn-logo" />
                <span>Continue with Google</span>
              </button>
            )}

            <div className="login-card-footer">
              {isSignup ? (
                <p>Already have an account? <span onClick={() => { setIsSignup(false); setError(null); setInfoMessage(null); }} className="toggle-link">Sign In</span></p>
              ) : (
                <p>New to Nowhere Nest? <span onClick={() => { setIsSignup(true); setError(null); setInfoMessage(null); }} className="toggle-link">Create Account</span></p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
