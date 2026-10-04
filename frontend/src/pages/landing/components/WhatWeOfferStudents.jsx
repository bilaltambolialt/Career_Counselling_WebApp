// src/components/WhatWeOfferStudents.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const services = [
  {
    num: "01", icon: "🧭", color: "#f99902", gradFrom: "#f99902", gradTo: "#193553",
    title: "Career Direction", tag: "After 12th",
    visual: [
      { label: "PCM", to: "Engineering · Research · Design", pct: 85 },
      { label: "PCB", to: "MBBS · BDS · Allied Health", pct: 72 },
      { label: "Commerce", to: "BBA · Law · CA", pct: 91 },
      { label: "Arts", to: "UPSC · Law · Psychology", pct: 68 },
    ],
    type: "streams",
    stat: "4 streams mapped",
    hook: "We decide the right field before picking any college.",
  },
  {
    num: "02", icon: "📢", color: "#7c3aed", gradFrom: "#7c3aed", gradTo: "#6d28d9",
    title: "Exam Tracking", tag: "Zero missed deadlines",
    visual: ["Notification Release", "Application Dates", "Admit Card", "Result", "Counselling Schedule", "Documents"],
    type: "timeline",
    stat: "7 checkpoints tracked per exam",
    hook: "You focus on preparation. We watch the calendar.",
  },
  {
    num: "03", icon: "📝", color: "#059669", gradFrom: "#059669", gradTo: "#047857",
    title: "Form Assistance", tag: "Error-proof submissions",
    visual: ["Form Filling Guidance", "Category & Quota", "Document Upload", "Error Prevention", "Payment Tracking"],
    type: "checklist",
    stat: "The #1 student pain point — solved",
    hook: "One wrong entry in a form can cost an entire round.",
  },
  {
    num: "04", icon: "📊", color: "#2563eb", gradFrom: "#2563eb", gradTo: "#1d4ed8",
    title: "Admission Probability", tag: "Data-backed predictions",
    visual: [
      { label: "Safe", pct: 94, color: "#059669" },
      { label: "Target", pct: 67, color: "#d97706" },
      { label: "Dream", pct: 38, color: "#dc2626" },
    ],
    type: "bars",
    stat: "Rank · Category · Round data combined",
    hook: "Stop guessing which colleges are realistic.",
  },
  {
    num: "05", icon: "🗂️", color: "#d97706", gradFrom: "#d97706", gradTo: "#b45309",
    title: "Round Strategy", tag: "Real handholding",
    visual: ["Choice Filling", "Float vs Freeze", "Round 2 Wait?", "Spot Round", "Final Lock-in"],
    type: "steps",
    stat: "5 critical decisions — guided in real time",
    hook: "Counselling rounds move fast. Decisions are irreversible.",
  },
  {
    num: "06", icon: "📂", color: "#db2777", gradFrom: "#db2777", gradTo: "#be185d",
    title: "Document Support", tag: "Reporting day ready",
    visual: ["Category Certificate", "Gap Certificate", "Bond Rules (Medical)", "Documents List", "Reporting Dates"],
    type: "checklist",
    stat: "No surprises on day one",
    hook: "Missing one document can undo months of preparation.",
  },
  {
    num: "07", icon: "🎓", color: "#193553", gradFrom: "#193553", gradTo: "#0f2235",
    title: "Admission Confirmation", tag: "Seat to joining",
    visual: ["Fee Comparison", "Loan Guidance", "Hostel Booking", "Joining Checklist", "Backup Planning"],
    type: "checklist",
    stat: "Support until you are physically enrolled",
    hook: "Getting the seat is step one. Joining without confusion is step two.",
  },
  {
    num: "08", icon: "🚀", color: "#4f46e5", gradFrom: "#4f46e5", gradTo: "#4338ca",
    title: "Post-Admission Roadmap", tag: "Bonus — beyond the seat",
    visual: ["Skill Development", "Internship Planning", "Certifications", "Placement Readiness"],
    type: "steps",
    stat: "Most services stop at admission. We don't.",
    hook: "Enter college with a plan, not just a seat.",
  },
];

// ── Visual renderers ──────────────────────────────────────

function StreamsVisual({ items, color, active }) {
  return (
    <div className="space-y-2.5 w-full">
      {items.map((item, i) => (
        <motion.div key={item.label}
          initial={{ opacity: 0, x: -16 }}
          animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          className="flex items-center gap-2.5"
        >
          <span className="w-16 text-[0.7rem] font-display font-[700] text-slate-600 flex-shrink-0">{item.label}</span>
          <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={active ? { width: `${item.pct}%` } : { width: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.65, ease: [0.25, 1, 0.5, 1] }}
              className="h-full rounded-lg flex items-center px-2.5"
              style={{ background: `linear-gradient(90deg, ${color}bb, ${color})` }}
            >
              <span className="text-white text-[0.62rem] font-body whitespace-nowrap truncate">{item.to}</span>
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function BarsVisual({ items, active }) {
  return (
    <div className="flex items-end justify-center gap-8 w-full" style={{ height: "130px" }}>
      {items.map((item, i) => (
        <div key={item.label} className="flex flex-col items-center gap-1.5 h-full justify-end">
          <motion.span
            initial={{ opacity: 0 }}
            animate={active ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.35 + i * 0.12 }}
            className="text-[0.72rem] font-display font-[700]"
            style={{ color: item.color }}
          >
            {item.pct}%
          </motion.span>
          <div className="w-14 bg-slate-100 rounded-xl overflow-hidden flex items-end" style={{ height: "90px" }}>
            <motion.div
              initial={{ height: 0 }}
              animate={active ? { height: `${item.pct}%` } : { height: 0 }}
              transition={{ delay: 0.1 + i * 0.12, duration: 0.65, ease: [0.25, 1, 0.5, 1] }}
              className="w-full rounded-xl"
              style={{ background: item.color }}
            />
          </div>
          <span className="text-[0.68rem] font-body text-slate-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ChecklistVisual({ items, color, active }) {
  return (
    <div className="space-y-2 w-full">
      {items.map((item, i) => (
        <motion.div key={item}
          initial={{ opacity: 0, x: -14 }}
          animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 }}
          transition={{ delay: i * 0.08, duration: 0.38 }}
          className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-slate-100 shadow-sm"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={active ? { scale: 1 } : { scale: 0 }}
            transition={{ delay: 0.12 + i * 0.08, duration: 0.28, type: "spring", stiffness: 320 }}
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: color + "18", border: `1.5px solid ${color}` }}
          >
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
          <span className="text-slate-700 text-[0.8rem] font-body">{item}</span>
        </motion.div>
      ))}
    </div>
  );
}

function TimelineVisual({ items, color, active }) {
  return (
    <div className="relative w-full pl-2">
      <div className="absolute left-[15px] top-2 bottom-2 w-[1.5px] bg-slate-100 rounded-full" />
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <motion.div key={item}
            initial={{ opacity: 0, x: -10 }}
            animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
            transition={{ delay: i * 0.09, duration: 0.38 }}
            className="flex items-center gap-3"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={active ? { scale: 1 } : { scale: 0 }}
              transition={{ delay: 0.08 + i * 0.09, duration: 0.28, type: "spring" }}
              className="w-5 h-5 rounded-full border-2 bg-white flex-shrink-0 z-10"
              style={{ borderColor: color }}
            />
            <span className="text-slate-700 text-[0.8rem] font-body bg-white rounded-lg px-3 py-2 border border-slate-100 shadow-sm flex-1">{item}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StepsVisual({ items, color, active }) {
  return (
    <div className="flex flex-wrap gap-2 w-full">
      {items.map((item, i) => (
        <motion.div key={item}
          initial={{ opacity: 0, scale: 0.82, y: 8 }}
          animate={active ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.82, y: 8 }}
          transition={{ delay: i * 0.09, duration: 0.38, type: "spring", stiffness: 220 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border text-[0.78rem] font-body text-slate-700 bg-white shadow-sm"
          style={{ borderColor: color + "35" }}
        >
          <span className="w-4 h-4 rounded-full text-[0.55rem] font-display font-[700] text-white flex items-center justify-center flex-shrink-0"
            style={{ background: color }}>
            {i + 1}
          </span>
          {item}
        </motion.div>
      ))}
    </div>
  );
}

function VisualPanel({ service, active }) {
  const v = service.visual;
  return (
    <>
      {service.type === "streams"   && <StreamsVisual   items={v} color={service.color} active={active} />}
      {service.type === "bars"      && <BarsVisual       items={v}                       active={active} />}
      {service.type === "checklist" && <ChecklistVisual  items={v} color={service.color} active={active} />}
      {service.type === "timeline"  && <TimelineVisual   items={v} color={service.color} active={active} />}
      {service.type === "steps"     && <StepsVisual      items={v} color={service.color} active={active} />}
    </>
  );
}

// ── Main ─────────────────────────────────────────────────
export default function WhatWeOfferStudents() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [animKey, setAnimKey] = useState(0);

  function goTo(index) {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
    setAnimKey((k) => k + 1);
  }

  function handleNext() {
    goTo((activeIndex + 1) % services.length);
  }

  function handlePrev() {
    goTo((activeIndex - 1 + services.length) % services.length);
  }

  const active = services[activeIndex];

  return (
    <section id="offer-students" className="relative bg-white py-16 sm:py-24">

      <div className="max-w-6xl mx-auto px-5 sm:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <span className="section-label">What We Offer — Students</span>
          <h2 className="font-display font-[800] text-[1.75rem] sm:text-[2.55rem] mt-4 tracking-[-0.02em] leading-[1.15] text-slate-900 max-w-2xl">
            8 services. One complete journey.{" "}
            <span className="gradient-text">From confusion to confirmed seat.</span>
          </h2>
        </motion.div>

        {/* ── Card grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mb-8">
          {services.map((s, i) => (
            <motion.button
              key={s.num}
              onClick={() => goTo(i)}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-xl border px-3 py-3 text-left transition-all duration-250 focus:outline-none"
              style={{
                borderColor: activeIndex === i ? s.color + "50" : "#f1f5f9",
                background: activeIndex === i ? s.color + "0d" : "#f8fafc",
                boxShadow: activeIndex === i ? `0 2px 12px ${s.color}18` : "none",
              }}
            >
              <span className="text-lg leading-none block mb-1.5">{s.icon}</span>
              <span
                className="block font-display font-[700] text-[0.72rem] leading-snug transition-colors duration-250"
                style={{ color: activeIndex === i ? s.color : "#64748b" }}
              >
                {s.title}
              </span>
              <span
                className="block text-[0.6rem] font-body mt-0.5 transition-colors duration-250"
                style={{ color: activeIndex === i ? s.color + "aa" : "#94a3b8" }}
              >
                {s.num}
              </span>
            </motion.button>
          ))}
        </div>

        {/* ── Visual panel ── */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: active.color + "30", background: "#f8fafc" }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={animKey}
              custom={direction}
              variants={{
                enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
            >
              <div className="flex flex-col lg:flex-row gap-0">

                {/* Left — info */}
                <div
                  className="lg:w-[300px] flex-shrink-0 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r"
                  style={{ borderColor: active.color + "20" }}
                >
                  <div>
                    {/* Icon + title */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${active.gradFrom}18, ${active.gradTo}28)`, border: `1.5px solid ${active.color}22` }}
                      >
                        {active.icon}
                      </div>
                      <div>
                        <p className="font-display font-[800] text-slate-900 text-[1rem] leading-tight">{active.title}</p>
                        <p className="text-slate-400 text-[0.7rem] font-body mt-0.5">{active.tag}</p>
                      </div>
                    </div>

                    {/* Hook */}
                    <p
                      className="text-[0.85rem] font-body leading-[1.75] italic border-l-2 pl-3"
                      style={{ color: active.color + "cc", borderColor: active.color + "50" }}
                    >
                      {active.hook}
                    </p>

                    {/* Stat */}
                    <div className="mt-5 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: active.color }} />
                      <p className="text-[0.72rem] font-display font-[600] text-slate-500">{active.stat}</p>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center gap-3 mt-6 lg:mt-8">
                    <button
                      onClick={handlePrev}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-500 text-[0.78rem] font-display font-[600] hover:border-slate-300 hover:text-slate-700 transition-all duration-200"
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M12 7H2M7 12l-5-5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Prev
                    </button>
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-[0.78rem] font-display font-[700] transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
                      style={{ background: active.color }}
                    >
                      Next
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <span className="ml-auto text-[0.68rem] font-display font-[600] text-slate-300">
                      {active.num}/{services.length.toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>

                {/* Right — animated visual */}
                <div className="flex-1 p-6 sm:p-8 bg-white">
                  <VisualPanel service={active} active={true} />
                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-5 rounded-2xl bg-[#193553] p-7 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
        >
          <div>
            <p className="font-display font-[800] text-white text-[1.05rem]">Every service above is part of one journey.</p>
            <p className="text-white/60 font-body text-[0.8rem] mt-1">The first conversation maps exactly what you need.</p>
          </div>
          <a
            href="#session"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-[#f99902] font-display font-[700] text-[0.83rem] px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
          >
            Book a Session
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </motion.div>

      </div>
    </section>
  );
}
