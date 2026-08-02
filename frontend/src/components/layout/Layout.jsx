import { createContext, useContext } from 'react';
import Navbar from './Navbar';

const LayoutContext = createContext(false);

export default function Layout({ children }) {
  const nested = useContext(LayoutContext);
  if (nested) return children;
  return (
    <LayoutContext.Provider value>
      <div className="min-h-screen bg-[#f6f7fb] text-slate-950 flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    </LayoutContext.Provider>
  );
}
