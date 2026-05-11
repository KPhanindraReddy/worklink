import { Footer } from './Footer';
import { BottomDockNav } from './BottomDockNav';
import { Navbar } from './Navbar';
import { RequestRoutingController } from '../booking/RequestRoutingController';

export const AppShell = ({ children }) => (
  <div className="min-h-screen">
    <Navbar />
    <RequestRoutingController />
    <div className="app-shell-content">
      <main>{children}</main>
      <Footer />
    </div>
    <BottomDockNav />
  </div>
);
