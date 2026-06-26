import React, { createContext, useContext, useState } from 'react';


type AuthContextType = {
  auth: { token: string; username: string; role: string; userId: number; email: string; color: string } | null;
  login: (token: string, username: string, role: string, email: string, currentProjectId?: number | null, color?: string) => number | null;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);


export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [auth, setAuth] = useState<{ token: string; username: string; role: string; userId: number; email: string; color: string } | null>(() => {

    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail') ?? '';
    const color = localStorage.getItem('userColor') ?? '#6366f1';
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const username = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
      const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      const userId = parseInt(payload['sub']);
      return { token, username, role, userId, email, color };
    } catch {
      localStorage.removeItem('token')
      return null;
    }
  });

  function login(token: string, username: string, role: string, email: string, currentProjectId?: number | null, color?: string): number | null {
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', email);
    if (color) localStorage.setItem('userColor', color);
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = parseInt(payload['sub']);
    const resolvedColor = color ?? localStorage.getItem('userColor') ?? '#6366f1';
    setAuth({ token, username, role, userId, email, color: resolvedColor });
    return currentProjectId ?? null;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userColor');
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
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
