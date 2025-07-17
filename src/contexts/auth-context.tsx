
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { users } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleAuthentication = useCallback(() => {
    try {
      const storedUser = sessionStorage.getItem('tech-user');
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        if (pathname === '/') {
          router.replace('/dashboard/pos');
        }
      } else if (pathname.startsWith('/dashboard')) {
        router.replace('/');
      }
    } catch (error) {
      console.error("Failed to parse user from session storage", error);
      sessionStorage.removeItem('tech-user');
      if (pathname.startsWith('/dashboard')) {
        router.replace('/');
      }
    } finally {
      setLoading(false);
    }
  }, [router, pathname]);

  useEffect(() => {
    handleAuthentication();
  }, [pathname, handleAuthentication]);

  const login = (username: string, password: string) => {
    const foundUser = users.find(u => u.username === username && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      sessionStorage.setItem('tech-user', JSON.stringify(foundUser));
      router.push('/dashboard/pos');
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بعودتك، ${foundUser.name}!`,
      });
    } else {
       toast({
        title: "فشل تسجيل الدخول",
        description: "اسم المستخدم أو كلمة المرور غير صالحة.",
        variant: "destructive",
      });
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('tech-user');
    router.push('/');
     toast({
        title: "تم تسجيل الخروج",
        description: "لقد تم تسجيل خروجك بنجاح.",
      });
  };

  if (loading && pathname.startsWith('/dashboard')) {
     return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
