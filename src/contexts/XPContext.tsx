import { createContext, useContext, useState, ReactNode } from 'react';

interface XPContextType {
  triggerXPAnimation: () => void;
  shouldAnimate: boolean;
}

const XPContext = createContext<XPContextType | undefined>(undefined);

export function XPProvider({ children }: { children: ReactNode }) {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const triggerXPAnimation = () => {
    setShouldAnimate(true);
    setTimeout(() => setShouldAnimate(false), 1500);
  };

  return (
    <XPContext.Provider value={{ triggerXPAnimation, shouldAnimate }}>
      {children}
    </XPContext.Provider>
  );
}

export function useXP() {
  const context = useContext(XPContext);
  if (context === undefined) {
    throw new Error('useXP must be used within a XPProvider');
  }
  return context;
}
