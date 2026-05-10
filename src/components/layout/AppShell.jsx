import { Footer } from './Footer';
import { BottomDockNav } from './BottomDockNav';
import { GlobalFeatureLauncher } from './GlobalFeatureLauncher';
import { Navbar } from './Navbar';

export const AppShell = ({ children }) => (
  <div className="min-h-screen">
    <Navbar />
    <GlobalFeatureLauncher />
    <div className="app-shell-content">
      <main>{children}</main>
      <Footer />
    </div>
    <BottomDockNav />
  </div>
);
