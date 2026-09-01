import { createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const LayoutContext = createContext(false);

export default function Layout({ children }) {
  const nested = useContext(LayoutContext);
  const location = useLocation();
  if (nested) return children;
  return (
    <LayoutContext.Provider value>
      <div className="min-h-screen bg-[#f6f7fb] text-slate-950 flex flex-col">
        <Navbar />
        <main key={location.pathname} className="flex-1 animate-fade-up">{children}</main>
      </div>
    </LayoutContext.Provider>
  );
}
