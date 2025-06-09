import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Zap, Users, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Signup.css';

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

const Signup = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handleUsernameChange = (e) => setUsername(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);
  const handleTermsChange = (e) => setTermsAccepted(e.target.checked);

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

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (!termsAccepted) {
      setError("You must accept the terms and conditions");
      setLoading(false);
      return;
    }

    try {
      await signup(email, password, userType);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create an account');
    } finally {
      setLoading(false);
    }
  };

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
            <div className="signup-box">
              <img src="/CertiFi_Logo.png" alt="CertiFi Logo" className="logo" />
              <h2 className="title">Create an Account</h2>
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
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon">
                      <i className="fa-solid fa-user"></i>
                    </span>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
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
                      onChange={(e) => setPassword(e.target.value)}
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
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon">
                      <i className="fa-solid fa-lock"></i>
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="input-icon right"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      <i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="userType">I am a</label>
                  <div className="input-icon-wrapper">
                    <select
                      id="userType"
                      value={userType}
                      onChange={(e) => setUserType(e.target.value)}
                      className="form-select"
                      required
                    >
                      <option value="user">Individual User</option>
                      <option value="verifier">Verifier</option>
                      <option value="institution">Institution</option>
                    </select>
                  </div>
                </div>
                <div className="form-options">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={termsAccepted}
                      onChange={handleTermsChange}
                    /> I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                  </label>
                </div>
                <button type="submit" className="signup-button" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
                {error && <p className="error-message" style={{ color: '#ff6b6b', textAlign: 'center', marginTop: '1rem' }}>{error}</p>}
              </form>
              <p className="text-link">Already have an account? <Link to="/login">Log in</Link></p>
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


export default Signup;




