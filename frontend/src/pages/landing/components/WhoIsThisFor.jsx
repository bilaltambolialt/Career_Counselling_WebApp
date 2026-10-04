// src/pages/landing/components/WhoIsThisFor.jsx
import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

const audience = [
  { icon: "🎓", tag: "Class 12",              color: "#f99902", title: "Science Students After Boards"     },
  { icon: "🔩", tag: "Diploma Holders",        color: "#7c3aed", title: "Polytechnic Diploma Holders"       },
  { icon: "🏥", tag: "Medical / Engg Aspirants", color: "#059669", title: "Students Under Exam Pressure"   },
  { icon: "🤷", tag: "Undecided",              color: "#d97706", title: "Students Without a Clear Path"     },
  { icon: "👨‍👩‍👧", tag: "Parents",             color: "#db2777", title: "Parents Seeking Clarity"          },
];

export default function WhoIsThisFor() {
  const sectionRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setIsInView(true); },
      { threshold: 0.08 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="who" ref={sectionRef} className="relative py-16 sm:py-24 overflow-hidden" style={{ background: "#feeed5" }}>

      {/* Subtle dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">

        {/* ── Heading — centered, one line ── */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="text-center mb-14"
        >
          <span className="section-label justify-center">Suitable For</span>
          <h2 className="font-display font-[800] text-[1.5rem] sm:text-[2rem] lg:text-[2.4rem] mt-4 tracking-[-0.02em] leading-[1.2] text-slate-900 max-w-2xl mx-auto">
            Every student deserves{" "}
            <span className="gradient-text">a clear direction</span>
            {" "}before committing to a path.
          </h2>
        </motion.div>

        {/* ── List ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {audience.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-4 rounded-2xl border border-[#e8dfc8] shadow-sm px-5 py-4" style={{ background: "#FFFDF7" }}
            >
              <span className="text-[1.6rem] leading-none flex-shrink-0">{item.icon}</span>
              <div className="min-w-0">
                <span
                  className="inline-block text-[0.6rem] font-display font-[700] tracking-widest uppercase px-2 py-0.5 rounded-full mb-1"
                  style={{ background: item.color + "14", color: item.color }}
                >
                  {item.tag}
                </span>
                <p className="font-display font-[700] text-slate-900 text-[0.9rem] leading-snug">
                  {item.title}
                </p>
              </div>
            </motion.div>
          ))}

          {/* CTA card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.08 + audience.length * 0.08 }}
            className="flex items-center gap-4 bg-[#f99902]/[0.06] border border-[#f99902]/20 rounded-2xl px-5 py-4"
          >
            <span className="text-[1.6rem] leading-none flex-shrink-0">💬</span>
            <div className="min-w-0">
              <p className="font-display font-[700] text-slate-900 text-[0.9rem] leading-snug mb-1">
                Not sure if this applies to you?
              </p>
              <a
                href="#session"
                className="text-[0.75rem] font-display font-[700] text-[#f99902] hover:underline"
              >
                Book a session →
              </a>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
