import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Zap, Users, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const certiFiFeatures = [
  {
    icon: <ShieldCheck size={96} />,
    title: "Blockchain Authentication",
    description: "Securely issue, verify, and manage digital certifications and identity records using cutting-edge blockchain technology.",
  },
  {
    icon: <Zap size={96} />,
    title: "Dynamic Management",
    description: "Efficiently handle a wide range of digital credentials with robust tools for issuance and verification.",
  },
  {
    icon: <Users size={96} />,
    title: "Multi-Sector Versatility",
    description: "Supports healthcare, professional credentials, government records, and personal identity proofs, not just education.",
  },
  {
    icon: <Globe size={96} />,
    title: "Decentralized Trust",
    description: "All certifications and identity records are anchored in a decentralized system, ensuring trust and immutability.",
  },
];


function FeatureSlide({ icon, title, description, isActive }) {
  return (
    <div className={`feature-slide ${isActive ? 'active' : ''}`}>
      <div className="feature-slide-icon">
        {React.cloneElement(icon, { className: `feature-icon-svg ${isActive ? 'active' : ''}` })}
      </div>
      <h3 className="feature-slide-title">{title}</h3>
      <p className="feature-slide-description">{description}</p>
    </div>
  );
}


const LoginContent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prevIndex) =>
        (prevIndex + 1) % certiFiFeatures.length
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // This will now trigger Internet Identity login
      await login(email, password);
      
      // If login is successful, navigate to dashboard
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Failed to log in. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Demo account login handler
  const handleDemoLogin = (userType) => {
    // For demo purposes, we'll just show a message
    // In a real app, you might have test identities or a different flow
    toast.info(`In a real deployment, this would log you in as a ${userType}`);
    
    // Just trigger the login flow
    handleSubmit({ preventDefault: () => {} });
  };

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="app-container">
      <main className="main-content">
        <div className="main-box">
          <div className="left-pane">
            <div className="slideshow-container">
              {certiFiFeatures.map((feature, index) => (
                <FeatureSlide
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  isActive={index === currentFeatureIndex}
                />
              ))}
            </div>
          </div>
          <div className="right-pane">
            <div className="login-box">
              <img src="/CertiFi_Logo.png" alt="CertiFi Logo" className="logo" />
              <h2 className="title">Welcome Back!</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon">
                      <i className="fa-solid fa-envelope"></i>
                    </span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="luke@gmail.com"
                      value={email}
                      onChange={handleEmailChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon">
                      <i className="fa-solid fa-lock"></i>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={handlePasswordChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="input-icon right"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                </div>
                <div className="form-options">
                  <label>
                    <input type="checkbox" /> Remember Me
                  </label>
                  <Link to="/forgot-password">Forgot Username/Password?</Link>
                </div>
                <button type="submit" className="login-button" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                {error && <p className="error-message" style={{ color: '#ff6b6b', textAlign: 'center', marginTop: '1rem' }}>{error}</p>}
              </form>
              <p className="text-link">Don't have an account? <Link to="/signup">Sign up now</Link></p>
              <p className="text-link">Are you an Institution or Verifier? <span style={{cursor: 'pointer', color: '#3b82f6'}} onClick={() => navigate('/', { state: { scrollTo: 'contact-us-section' } })}>Contact us now!</span></p>
            </div>
          </div>
        </div>
      </main>
      <footer className="footer">
        &copy; 2024 CertiFi. All rights reserved.
      </footer>
    </div>
  );
};


export default LoginContent;




