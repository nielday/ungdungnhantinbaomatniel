'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  phoneNumber: string;
  email: string;
  fullName: string;
  age: number;
  avatar?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (phoneNumber: string) => Promise<{ success: boolean; userId: string; email: string }>;
  verifyLogin: (userId: string, otpCode: string) => Promise<void>;
  register: (phoneNumber: string, email: string, fullName: string, age: number) => Promise<{ success: boolean; userId: string; email: string }>;
  verifyRegister: (userId: string, otpCode: string) => Promise<void>;
  resendOtp: (userId: string) => Promise<void>;
  updateUser: (updatedUser: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ungdungnhantinbaomatniel-production.up.railway.app/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        let res = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          headers,
          credentials: 'include'
        });

        // Retry once if unauthorized and token is present (WebKit timing workaround)
        if (!res.ok && token) {
          await new Promise(r => setTimeout(r, 200));
          const freshToken = localStorage.getItem('token');
          if (freshToken) headers['Authorization'] = `Bearer ${freshToken}`;
          res = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers,
            credentials: 'include'
          });
        }

        if (!res.ok) throw new Error('Not logged in');
        const data = await res.json();

        if (data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.log('AuthContext - User not logged in or session expired');
        setUser(null);
        // Ensure we clean up invalid tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      } finally {
        setLoading(false);
      }
    };

    // Run initialization with a tiny delay to ensure WebKit localstorage is ready
    const timer = setTimeout(() => {
      initAuth();
    }, 50);

    // Re-verify auth when page is shown from BFCache (iOS backward/forward navigation)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        initAuth();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pageshow', handlePageShow);
    }

    return () => {
      clearTimeout(timer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('pageshow', handlePageShow);
      }
    };
  }, []);

  const login = async (phoneNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    // Return userId for OTP verification instead of auto-login
    return { success: true, userId: data.userId, email: data.email };
  };

  const verifyLogin = async (userId: string, otpCode: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId, otpCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'OTP verification failed');
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    setUser(data.user);
  };

  const register = async (phoneNumber: string, email: string, fullName: string, age: number) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ phoneNumber, email, fullName, age }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    // Return userId for OTP verification instead of auto-login
    return { success: true, userId: data.userId, email: data.email };
  };

  const verifyRegister = async (userId: string, otpCode: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId, otpCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'OTP verification failed');
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    setUser(data.user);
  };

  const resendOtp = async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Resend OTP failed');
    }
  };

  const updateUser = (updatedUser: User) => {
    try {
      setUser(updatedUser);
    } catch (error) {
      console.error('AuthContext - Update user error:', error);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {},
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      verifyLogin,
      register,
      verifyRegister,
      resendOtp,
      updateUser,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}