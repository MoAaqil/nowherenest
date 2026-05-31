import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, LogIn, Mail, Lock, ShieldAlert } from 'lucide-react';
import './Login.css';

const Login = () => {
  const { user, loginWithGoogle, loginWithEmail, registerWithEmail, error } = useAuth();
  const navigate = useNavigate();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name || !email || !password || !phone) {
          throw new Error('All fields are required for registration');
        }
        await registerWithEmail(name, email, password, phone);
      } else {
        await loginWithEmail(email, password);
      }
      navigate('/');
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-side-panel">
        <div className="panel-overlay"></div>
        <div className="panel-content">
          <img src="/logo.png" alt="Branding logo" className="panel-logo" />
          <h2>Manage Your Properties Seamlessly</h2>
          <p>Join thousands of hotel owners, homestay hosts, and PG managers maximizing their earnings and automating customer check-ins.</p>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="form-card">
          <div className="form-header">
            <div className="brand-logo-container">
              <Building2 size={28} className="brand-logo-icon" />
            </div>
            <h3>{isSignUp ? 'Create Host Account' : 'Host Console Login'}</h3>
            <p className="subtitle">
              {isSignUp ? 'Sign up to start listing accommodations' : 'Access your property management dashboard'}
            </p>
          </div>

          {(localError || error) && (
            <div className="login-error-alert">
              <ShieldAlert size={18} />
              <span>{localError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {isSignUp && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number (E.164 format)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="+919999988888"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="name@property.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
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

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Processing...' : isSignUp ? 'Register as Host' : 'Log In'}
            </button>
          </form>

          <div className="divider-row">
            <span>OR CONTINUING WITH</span>
          </div>

          <button onClick={handleGoogleSignIn} className="btn btn-outline btn-block btn-google" disabled={loading}>
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Sign In with Google</span>
          </button>

          <p className="toggle-auth-link">
            {isSignUp ? 'Already have an account?' : "Don't have a host account?"}
            <button onClick={() => setIsSignUp(!isSignUp)} className="btn-toggle-link">
              {isSignUp ? 'Log In here' : 'Register as Owner here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
