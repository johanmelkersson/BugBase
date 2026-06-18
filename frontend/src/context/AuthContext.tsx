import React, { createContext, useContext, useState } from 'react';


type AuthContextType = {
  auth: { token: string; username: string; role: string } | null;
  login: (token: string, username: string, role: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);


export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [auth, setAuth] = useState<{ token: string; username: string; role: string } | null>(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try{
      const payload = JSON.parse(atob(token.split('.')[1]));
      const username = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
      const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      return { token, username, role };
    } catch{
      localStorage.removeItem('token')
      return null;
    }

  });

  function login(token: string, username: string, role: string) {
    localStorage.setItem('token', token);
    setAuth({ token, username, role });
  }

  function logout() {
    localStorage.removeItem('token');
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