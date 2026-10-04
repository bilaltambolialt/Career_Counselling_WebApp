// src/pages/landing/components/Hero.jsx
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">

      {/* Soft background tint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 70% 30%, rgba(249,153,2,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 5% 80%, rgba(25,53,83,0.04) 0%, transparent 55%)
          `,
        }}
      />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(circle, #f99902 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 w-full pt-28 sm:pt-32 pb-16 sm:pb-20">

        {/* ── Brand + Headline — centered ── */}
        <div className="text-center mb-14">
          <motion.div custom={0} initial="hidden" animate="show" variants={fadeUp} className="mb-5">
            <span className="section-label justify-center">Career Counselling for Indian Students</span>
          </motion.div>

          <motion.div custom={0.08} initial="hidden" animate="show" variants={fadeUp}>
            <p className="font-display font-[900] text-[5rem] sm:text-[7rem] lg:text-[9rem] leading-none tracking-[-0.04em] text-slate-900">
              ICGC
            </p>
            <p className="font-display font-[600] text-[0.85rem] sm:text-[1rem] lg:text-[1.1rem] tracking-[0.22em] uppercase mt-3" style={{ color: "#f99902" }}>
              Indian Career Guidance Council
            </p>
          </motion.div>

          <motion.h1
            custom={0.2}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="font-display font-[800] text-[1.5rem] sm:text-[2rem] lg:text-[2.6rem] leading-[1.15] tracking-[-0.02em] text-slate-900 mt-8"
          >
            The <span className="gradient-text">right career</span> shouldn't be a guess.
          </motion.h1>

          <motion.p
            custom={0.28}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="font-display font-[900] text-[1.72rem] tracking-[.2em] uppercase text-900 mt-5"
          >
            About Us
          </motion.p>
        </div>

        {/* ── Vision + Mission cards ── */}
        <motion.div
          custom={0.32}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mt-14 grid sm:grid-cols-2 gap-5"
        >
          {/* Vision */}
          <div className="rounded-2xl border border-[#f99902]/25 bg-white/70 p-7 text-center">
            <div className="w-10 h-[3px] rounded-full mx-auto mb-4" style={{ background: "#2ba629" }} />
            <h3 className="font-display font-[800] text-[2.2rem] text-900 mb-3" style={{ letterSpacing: "0.1em" }}>VISION</h3>
            <p className="text-900 text-[1rem] font-body leading-[1.85]">
              A future where every Indian student — regardless of background, city, or income — makes their career choice with clarity, confidence, and complete information.
            </p>
          </div>

          {/* Mission */}
          <div className="rounded-2xl border border-[#193553]/20 bg-white/70 p-7 text-center">
            <div className="w-10 h-[3px] rounded-full mx-auto mb-4" style={{ background: "#2ba629" }} />
            <h3 className="font-display font-[800] text-[2.2rem] text-900 mb-3" style={{ letterSpacing: "0.1em" }}>MISSION</h3>
            <p className="text-900 text-[1rem] font-body leading-[1.85]">
              To provide structured, honest, one-on-one career counselling that cuts through noise — using real data, real conversations, and zero pressure — so students own the paths they choose.
            </p>
          </div>
        </motion.div>

        {/* ── Stats row — below Mission/Vision ── */}
        <motion.div
          custom={0.44}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mt-10 flex justify-center gap-10 sm:gap-16"
        >
          {[
            { val: "500+", label: "Students Guided", color: "#f99902" },
            { val: "8 Yrs", label: "In Practice",    color: "#f99902" },
            { val: "40+",  label: "Paths Mapped",    color: "#f99902" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display font-[800] text-[1.55rem]" style={{ color: s.color }}>{s.val}</p>
              <p className="text-slate-900 text-[0.95rem] font-body font-[500] mt-0.5 tracking-wide">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Paragraph + CTA row ── */}
        <motion.div
          custom={0.56}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mt-8 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10 pt-8 border-t border-slate-100"
        >
          <p className="text-slate-800 text-[1.25rem] leading-[1.5rem] font-body font-[500] max-w-xl">
            Thousands of students pick careers based on peer pressure, incomplete
            information, or what their relatives suggest. You deserve a real
            conversation — one that helps you understand your options honestly,
            so you can choose a path you'll actually own.
          </p>
          <div className="flex-shrink-0">
            <a href="#session" className="lp-btn-primary whitespace-nowrap">
              Request Your First Session
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </motion.div>

      </div>

    </section>
  );
}
