import { Footer } from './Footer';
import { Navbar } from './Navbar';

export const AppShell = ({ children }) => (
  <div className="min-h-screen">
    <Navbar />
    <main>{children}</main>
    <Footer />
  </div>
);

