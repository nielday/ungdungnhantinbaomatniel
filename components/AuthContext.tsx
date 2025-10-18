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
    // Check if user is logged in
    const token = localStorage.getItem('token');
    console.log('AuthContext - Token from localStorage:', token ? 'Present' : 'Missing');
    
    if (token) {
      // Verify token and get user data
      console.log('AuthContext - Verifying token...');
      fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        console.log('AuthContext - Profile response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('AuthContext - Profile data:', data);
        if (data._id) {
          setUser({
            id: data._id,
            phoneNumber: data.phoneNumber,
            email: data.email,
            fullName: data.fullName,
            age: data.age,
            avatar: data.avatar
          });
        }
      })
      .catch((error) => {
        console.error('AuthContext - Profile error:', error);
        localStorage.removeItem('token');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (phoneNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      body: JSON.stringify({ userId, otpCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'OTP verification failed');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const register = async (phoneNumber: string, email: string, fullName: string, age: number) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      body: JSON.stringify({ userId, otpCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'OTP verification failed');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const resendOtp = async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Resend OTP failed');
    }
  };

  const updateUser = (updatedUser: User) => {
    try {
      console.log('AuthContext - Updating user:', updatedUser);
      setUser(updatedUser);
    } catch (error) {
      console.error('AuthContext - Update user error:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
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