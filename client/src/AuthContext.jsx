import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('bloodBankUser') || 'null'));
  const authenticate = data => {
    localStorage.setItem('bloodBankToken', data.token);
    localStorage.setItem('bloodBankUser', JSON.stringify(data.user));
    setUser(data.user);
  };
  const logout = () => {
    localStorage.removeItem('bloodBankToken');
    localStorage.removeItem('bloodBankUser');
    setUser(null);
  };
  const value = useMemo(() => ({ user, authenticate, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
