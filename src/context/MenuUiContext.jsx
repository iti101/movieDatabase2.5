import { createContext, useContext, useMemo, useState } from 'react';

const MenuUiContext = createContext(null);

export function MenuUiProvider({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const value = useMemo(
    () => ({
      menuOpen,
      setMenuOpen,
    }),
    [menuOpen],
  );

  return (
    <MenuUiContext.Provider value={value}>{children}</MenuUiContext.Provider>
  );
}

export function useMenuUi() {
  const context = useContext(MenuUiContext);
  if (!context) {
    throw new Error('useMenuUi must be used within MenuUiProvider');
  }
  return context;
}
