// src/pages/landing/components/WhatWeDo.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import imgEngg from "../../../assets/images/Engg.jpeg";
import imgIG from "../../../assets/images/IG.jpeg";
import imgMedical from "../../../assets/images/medical.jpeg";
import imgCA from "../../../assets/images/CA.jpeg";

const slideshowImages = [
  { src: imgEngg, label: "Engineering" },
  { src: imgMedical, label: "Medical" },
  { src: imgCA, label: "Career Assessment" },
  { src: imgIG, label: "Global Pathways" },
];

const domains = [
  {
    heading: "Career Discovery & Mentorship, Clarity Before Career",
    color: "#f99902",
    bg: "#fff8e6",
    border: "#f99a0267",
    points: [
      "We believe every successful career starts with the right decision. Our scientific assessment and one-on-one counselling help students discover their true potential.",
      "Aptitude, Interest & Personality Analysis",
      "Personalized Career Roadmap",
      "One-on-One Expert Counselling",
      "Continuous Mentorship & Handholding",
      "We don't just guide — we stay till you succeed.",
    ],
  },
  {
    heading: "Medical Career Pathways",
    color: "#059669",
    bg: "#eafcdf",
    border: "#03734f6c",
    points: [
      "Your Path to a Medical Career Starts Here",
      "Navigate NEET and medical admissions with confidence through expert guidance and proven strategies.",
      "MBBS, BDS, AYUSH Admissions",
      "All India & State Counselling",
      "College Selection Based on Rank & Budget",
      "Complete Admission Support",
      "From NEET score to confirmed seat.",
    ],
  },
  {
    heading: "Engineering Career Pathways",
    color: "#193553",
    bg: "#e0e8f2",
    border: "#19355364",
    points: [
      "Build the Future with the Right Engineering Path.",
      "Make informed decisions about colleges, branches, and future careers in engineering.",
      "JEE, CET & Private University Guidance",
      "Branch Selection (CSE, AI, Core Fields)",
      "Tier-wise College Mapping",
      "Industry-Aligned Career Advice",
      "Right college. Right branch. Right future.",
    ],
  },
  {
    heading: "Global Career Pathways",
    color: "#db2777",
    bg: "#fdf2f8",
    border: "#db277863",
    points: [
      "Your Global Career Begins Here.",
      "Explore world-class education opportunities with expert international guidance.",
      "Study Abroad Counselling",
      "University & Country Selection",
      "SOP, LOR & Visa Assistance",
      "Scholarship Guidance",
      "From India to the world.",
    ],
  },
];

function ImageSlideshow() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  function goTo(index) {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slideshowImages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mt-10 relative rounded-2xl overflow-hidden shadow-lg bg-slate-100"
      style={{ aspectRatio: "16/6" }}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={{
            enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.55, ease: [0.25, 0.8, 0.25, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={slideshowImages[current].src}
            alt={slideshowImages[current].label}
            className="w-full h-full object-contain"
          />
        </motion.div>
      </AnimatePresence>

      {/* Dot navigation */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slideshowImages.map((img, i) => (
          <button
            key={img.label}
            onClick={() => goTo(i)}
            aria-label={img.label}
            className={`rounded-full transition-all duration-300 ${
              i === current ? "w-5 h-2.5 bg-[#f99902]" : "w-2.5 h-2.5 bg-white/60"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function WhatWeDo() {
  return (
    <section id="what-we-do" className="relative py-16 sm:py-24 bg-white/60 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <span className="section-label">What We Do</span>
          <h2 className="font-display font-[800] text-[1.75rem] sm:text-[2.55rem] mt-4 tracking-[-0.02em] leading-[1.15] text-slate-900 max-w-2xl">
            A Structured Path to One Outcome {" "}
            <span className="gradient-text">Your Career Success.</span>
          </h2>
          <p className="mt-3 font-display font-[600] text-[0.78rem] sm:text-[0.85rem] tracking-[0.18em] uppercase text-400">
            Career Discovery&nbsp;&nbsp;|&nbsp;&nbsp;Medical&nbsp;&nbsp;|&nbsp;&nbsp;Engineering&nbsp;&nbsp;|&nbsp;&nbsp;Global Pathways
          </p>
        </motion.div>

        {/* 4-column domain cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {domains.map((d, i) => (
            <motion.div
              key={d.heading}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border p-6 flex flex-col"
              style={{ background: d.bg, borderColor: d.border }}
            >
              {/* Heading */}
              <div className="mb-4">
                <h3
                  className="font-display font-[800] text-[1.1rem] sm:text-[1.15rem] tracking-[-0.01em]"
                  style={{ color: d.color }}
                >
                  {d.heading}
                </h3>
              </div>

              {/* Points */}
              <ul className="space-y-2.5 flex-1">
                {d.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5">
                    <span
                      className="mt-[0.35rem] w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: d.color }}
                    />
                    <span className="text-slate-600 text-[0.82rem] font-body leading-[1.65]">
                      {pt}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Image Slideshow */}
        <ImageSlideshow />

      </div>
    </section>
  );
}
