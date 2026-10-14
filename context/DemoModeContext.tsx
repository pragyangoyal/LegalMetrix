'use client';

import React, { createContext, useContext, useState } from 'react';

interface DemoModeContextType {
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
}

const DemoModeContext = createContext<DemoModeContextType>({
  demoMode: false,
  setDemoMode: () => {},
});

export const useDemoMode = () => useContext(DemoModeContext);

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [demoMode, setDemoMode] = useState(false);
  return (
    <DemoModeContext.Provider value={{ demoMode, setDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}
