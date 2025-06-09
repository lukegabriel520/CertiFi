import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, users } from '../services/api';  // Added users import

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const isAuth = await auth.isAuthenticated();
      if (isAuth) {
        const user = await users.getMyProfile();
        setCurrentUser({
          ...user,
          id: user.principal?.toString() || 'anonymous',
          role: user.role || 'user'
        });
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const loginResult = await auth.login();
      let userProfile = { email };
      
      try {
        userProfile = await users.getMyProfile();
      } catch (err) {
        console.log('No existing profile, will create one');
        // Create a basic profile if it doesn't exist
        await users.updateProfile({
          email,
          name: email.split('@')[0],
          role: 'user',
          metadata: []
        });
        userProfile = await users.getMyProfile();
      }
      
      const userData = {
        ...userProfile,
        id: userProfile.principal?.toString() || loginResult.user?.principal || 'anonymous',
        role: userProfile.role || loginResult.user?.role || 'user',
        email: userProfile.email || email
      };
      
      setCurrentUser(userData);
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (email, password, role = 'user') => {
    try {
      // For signup, we'll just use login since Internet Identity handles registration
      // The first login will create a profile if it doesn't exist
      return await login(email, password);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    loading
  };


  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}


