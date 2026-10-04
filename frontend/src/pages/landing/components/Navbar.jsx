// src/pages/landing/components/Navbar.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import logo from "../../../assets/images/logo.png";

const navLinks = [
  { label: "What We Do",    href: "#what-we-do" },
  { label: "Suitable for",  href: "#who" },
  { label: "For Students",  href: "#offer-students" },
  { label: "Why Counselling", href: "#why" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  function handleMobileNav(e, href) {
    e.preventDefault();
    setMenuOpen(false);
    setTimeout(() => {
      const id = href.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);
  }

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm py-3"
          : "bg-white/80 backdrop-blur-md py-5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 flex items-center justify-between">

        {/* ── Logo + Contact ── */}
        <a href="#" className="flex items-center gap-3">
          <img src={logo} alt="ICGC Logo" className="h-16 w-auto object-contain flex-shrink-0" />
          <div className="hidden md:flex flex-col justify-center gap-0.5">
            <span className="text-[0.65rem] font-display font-[700] tracking-widest uppercase text-[#f99902]">
              Contact Us
            </span>
            <span className="text-[0.82rem] font-body font-[500] text-slate-800 leading-tight">
              info@indiancareerguidancecouncil.com
            </span>
            <span className="text-[0.82rem] font-body font-[500] text-slate-800 leading-tight">
              +91 83789 00007
            </span>
          </div>
        </a>

        

        {/* ── Desktop links (lg and above) ── */}
        <nav className="hidden lg:flex items-center gap-5">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[0.85rem] text-slate-750 hover:text-slate-400 transition-colors duration-200 font-body whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* ── Desktop CTA (md and above) ── */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login/student"
            className="inline-flex items-center gap-2 border border-[#f99902] text-[#f99902] font-display font-[700] text-[0.82rem] py-[0.6rem] px-[1.3rem] rounded-[9px] hover:bg-[#f99902]/5 hover:-translate-y-[1px] hover:shadow-md transition-all duration-200"
          >
            Login
          </Link>
          <a
            href="#session"
            className="inline-flex items-center gap-2 bg-[#f99902] text-white font-display font-[700] text-[0.82rem] py-[0.6rem] px-[1.3rem] rounded-[9px] hover:-translate-y-[1px] hover:shadow-md transition-all duration-200"
          >
            Book a Session
          </a>
        </div>

        {/* ── Hamburger (below md) ── */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          className="lg:hidden flex flex-col justify-center gap-[5px] p-2 -mr-1"
        >
          <motion.span
            animate={menuOpen ? { rotate: 45, y: 6.5 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.22 }}
            className="block w-[22px] h-[1.5px] bg-slate-700 origin-center"
          />
          <motion.span
            animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.18 }}
            className="block w-[22px] h-[1.5px] bg-slate-700"
          />
          <motion.span
            animate={menuOpen ? { rotate: -45, y: -6.5 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.22 }}
            className="block w-[22px] h-[1.5px] bg-slate-700 origin-center"
          />
        </button>
      </div>

      {/* ── Mobile dropdown menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden bg-white border-t border-slate-100 shadow-md"
          >
            <nav className="px-5 pt-3 pb-4 flex flex-col">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.22 }}
                  onClick={(e) => handleMobileNav(e, link.href)}
                  className="text-[0.93rem] text-slate-700 font-body py-3 border-b border-slate-50 last:border-0 hover:text-[#f99902] transition-colors duration-150 flex items-center justify-between"
                >
                  {link.label}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-300">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </motion.a>
              ))}

              {/* Mobile Login link */}
              <Link
                to="/login/student"
                className="mt-3 w-full text-center border border-[#f99902] text-[#f99902] font-display font-[700] text-[0.83rem] py-[0.65rem] px-4 rounded-[9px] hover:bg-[#f99902]/5 transition-all duration-200 block"
              >
                Login
              </Link>

              {/* Mobile CTA */}
              <motion.a
                href="#session"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.05 + 0.1 }}
                onClick={(e) => handleMobileNav(e, "#session")}
                className="mt-2 w-full text-center bg-[#f99902] text-white font-display font-[700] text-[0.83rem] py-[0.65rem] px-4 rounded-[9px] hover:opacity-90 transition-opacity duration-200"
              >
                Book a Session
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
