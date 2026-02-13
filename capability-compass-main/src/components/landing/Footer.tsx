import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-footer text-footer-foreground py-12">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-foreground rounded-sm flex items-center justify-center">
              <span className="text-primary font-semibold text-xs">CL</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-tight">Be Noor</span>
              <span className="text-xs text-footer-foreground/70 leading-tight">CLEAR</span>
            </div>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap items-center gap-6 md:gap-8">
            <a href="#how-it-works" className="text-sm text-footer-foreground/70 hover:text-footer-foreground transition-colors">
              How CLEAR Works
            </a>
            <Link to="/playbooks" className="text-sm text-footer-foreground/70 hover:text-footer-foreground transition-colors">
              Playbooks
            </Link>
            <Link to="/institutional" className="text-sm text-footer-foreground/70 hover:text-footer-foreground transition-colors">
              For Institutions
            </Link>
            <Link to="/how-clear-is-different" className="text-sm text-footer-foreground/70 hover:text-footer-foreground transition-colors">
              How CLEAR Is Different
            </Link>
            <a href="#ecosystem" className="text-sm text-footer-foreground/70 hover:text-footer-foreground transition-colors">
              Ecosystem
            </a>
            <a href="#" className="text-sm text-footer-foreground/70 hover:text-footer-foreground transition-colors">
              Contact
            </a>
          </nav>
        </div>

        <div className="mt-8 pt-8 border-t border-footer-foreground/10">
          <p className="text-sm text-footer-foreground/50 text-center">
            © {new Date().getFullYear()} Be Noor. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
