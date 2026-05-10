import { Footer } from './Footer';
import { BottomDockNav } from './BottomDockNav';
import { Navbar } from './Navbar';

export const AppShell = ({ children }) => (
  <div className="min-h-screen">
    <Navbar />
    <div className="app-shell-content">
      <main>{children}</main>
      <Footer />
    </div>
    <BottomDockNav />
  </div>
);
