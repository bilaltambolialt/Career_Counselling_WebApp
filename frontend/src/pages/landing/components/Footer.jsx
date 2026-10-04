// src/pages/landing/components/Footer.jsx
import { motion } from "framer-motion";
import logo from "../../../assets/images/logo.png";

const navLinks = [
  { label: "Who It's For", href: "#who" },
  { label: "Career Paths", href: "#paths" },
  { label: "Our Process", href: "#process" },
  { label: "Why It Matters", href: "#why" },
  { label: "Request Session", href: "#session" },
];

const contactItems = [
  { label: "info@indiancareerguidancecouncil.com", icon: "✉" },
  { label: "+91 83789 00007", icon: "☎" },
  { label: "Sambhajinagar, Maharashtra, India", icon: "◎" },
];

const socials = [
  {
    name: "Instagram",
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>),
  },
  {
    name: "YouTube",
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>),
  },
  {
    name: "LinkedIn",
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>),
  },
  {
    name: "WhatsApp",
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>),
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-slate-100 pt-12 sm:pt-16 pb-8 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-12 mb-14">

          {/* Brand */}
          <div>
            <a href="#" className="flex items-center gap-3 mb-5">
              <img src={logo} alt="ICGC Logo" className="h-10 w-auto object-contain flex-shrink-0" />
              <div>
                <p className="font-display font-[800] text-slate-900 text-[1rem]">
                  Indian Career <span className="text-[#f99902]">Guidance Council</span>
                </p>
                <p className="text-[0.62rem] text-slate-400 tracking-wider mt-0.5">ICGC — EMPOWERING INDIAN STUDENTS</p>
              </div>
            </a>
            <p className="text-slate-500 text-[0.87rem] font-body leading-[1.8] max-w-[280px]">
              India’s trusted career guidance council for students after Class 12 and Diploma, Offering data-driven insights and honest counselling, one student at a time.
            </p>
            <div className="flex gap-2.5 mt-6">
              {socials.map((s) => (
                <button
                  key={s.name}
                  aria-label={s.name}
                  title={s.name}
                  className="w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:text-[#f99902] hover:border-[#f99902]/30 hover:bg-[#f99902]/[0.05] transition-all duration-200 flex items-center justify-center"
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="font-display font-[700] text-slate-400 text-[0.72rem] uppercase tracking-[0.18em] mb-5">Navigate</p>
            <ul className="space-y-3.5">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-500 text-[0.87rem] font-body hover:text-slate-900 transition-colors duration-200">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="font-display font-[700] text-slate-400 text-[0.72rem] uppercase tracking-[0.18em] mb-5">Contact</p>
            <ul className="space-y-3.5">
              {contactItems.map((item) => (
                <li key={item.label} className="flex items-start gap-2.5">
                  <span className="text-[#f99902]/70 text-[0.85rem] mt-0.5 flex-shrink-0">{item.icon}</span>
                  <span className="text-slate-500 text-[0.85rem] font-body">{item.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 pt-5 border-t border-slate-100">
              <p className="text-[0.72rem] font-display font-[700] text-slate-400 uppercase tracking-widest mb-2">Session Availability</p>
              <p className="text-slate-400 text-[0.82rem] font-body leading-[1.7]">
                Mon – Sat, 10 AM – 7 PM IST<br />
                Online & in-person (Sambhajinagar)
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-400 text-[0.78rem] font-body text-center">© 2025 Indian Career Guidance Council (ICGC). All rights reserved.</p>
          <p className="text-slate-300 text-[0.75rem] font-body text-center">Data-driven career guidance for Indian students — transparent, honest, and student-first.</p>
        </div>
      </div>
    </footer>
  );
}
