import { createContext, useContext, useState, useEffect } from 'react';

const ManagerAuthContext = createContext();

export const ManagerAuthProvider = ({ children }) => {
  const [manager, setManager] = useState(null);

  useEffect(() => {
    const savedManager = localStorage.getItem('manager');
    if (savedManager) {
      setManager(JSON.parse(savedManager));
    }
  }, []);

  const login = (managerData) => {
    setManager(managerData);
    localStorage.setItem('manager', JSON.stringify(managerData));
  };

  const logout = () => {
    setManager(null);
    localStorage.removeItem('manager');
  };

  return (
    <ManagerAuthContext.Provider value={{ manager, login, logout }}>
      {children}
    </ManagerAuthContext.Provider>
  );
};

export const useManagerAuth = () => useContext(ManagerAuthContext);
