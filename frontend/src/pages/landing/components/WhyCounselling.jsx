// src/pages/landing/components/WhyCounselling.jsx
import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const stats = [
  {
    value: "55%",
    label: "Engineering graduates in roles unrelated to their branch",
    sub: "within 5 years of graduating",
    color: "#f99902",
    bg: "#fff8e6",
    border: "#f9990228",
  },
  {
    value: "1 in 3",
    label: "MBBS students second-guess their career choice",
    sub: "by year 3 of studies",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#7c3aed25",
  },
  {
    value: "< 6 mo",
    label: "Average time spent deciding a path",
    sub: "that shapes the next 8 years",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#d9770625",
  },
  {
    value: "70%",
    label: "Students say no one explained career options clearly in school",
    sub: "before they had to decide",
    color: "#db2777",
    bg: "#fdf2f8",
    border: "#db277725",
  },
];


function StatCube({ mouseX, mouseY, isInView }) {
  const rotX = useTransform(mouseY, [-1, 1], [18, -18]);
  const rotY = useTransform(mouseX, [-1, 1], [-25, 25]);
  const sRotX = useSpring(rotX, { stiffness: 50, damping: 14 });
  const sRotY = useSpring(rotY, { stiffness: 50, damping: 14 });

  const SIZE = 170;

  const faces = [
    { stat: stats[0], style: { transform: `translateZ(${SIZE / 2}px)` } },
    { stat: stats[1], style: { transform: `rotateY(180deg) translateZ(${SIZE / 2}px)` } },
    { stat: stats[2], style: { transform: `rotateY(90deg) translateZ(${SIZE / 2}px)` } },
    { stat: stats[3], style: { transform: `rotateY(-90deg) translateZ(${SIZE / 2}px)` } },
    { stat: null, style: { transform: `rotateX(90deg) translateZ(${SIZE / 2}px)` } },
    { stat: null, style: { transform: `rotateX(-90deg) translateZ(${SIZE / 2}px)` } },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: "900px", width: SIZE, height: SIZE, margin: "0 auto" }}
    >
      <motion.div
        animate={{ rotateY: [0, 360] }}
        transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
        style={{
          width: SIZE,
          height: SIZE,
          position: "relative",
          transformStyle: "preserve-3d",
          rotateX: sRotX,
        }}
      >
        {faces.map((face, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: SIZE,
              height: SIZE,
              ...face.style,
              backfaceVisibility: "visible",
            }}
          >
            {face.stat ? (
              <div
                className="w-full h-full rounded-2xl flex flex-col items-center justify-center p-5 text-center"
                style={{
                  background: face.stat.bg,
                  border: `1.5px solid ${face.stat.border}`,
                  boxShadow: `0 8px 32px ${face.stat.color}12`,
                }}
              >
                <span
                  className="font-display font-[800] leading-none"
                  style={{ fontSize: "2.4rem", color: face.stat.color }}
                >
                  {face.stat.value}
                </span>
                <span
                  className="font-display font-[600] text-[0.58rem] tracking-widest uppercase mt-2 opacity-60"
                  style={{ color: face.stat.color }}
                >
                  {face.stat.sub}
                </span>
              </div>
            ) : (
              <div
                className="w-full h-full rounded-2xl"
                style={{
                  background: "rgba(248,250,252,0.6)",
                  border: "1.5px solid rgba(148,163,184,0.15)",
                  backdropFilter: "blur(4px)",
                }}
              />
            )}
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default function WhyCounselling() {
  const sectionRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setIsInView(true); },
      { threshold: 0.05, rootMargin: "0px 0px -50px 0px" }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  function onMouseMove(e) {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    rawX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    rawY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function onMouseLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <section
      id="why"
      ref={sectionRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative py-16 sm:py-24 bg-white"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 75% 50%, rgba(249,153,2,0.05) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          <div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7 }}
            >
              <span className="section-label">Why This Matters</span>

              <h2 className="font-display font-[800] text-[2rem] sm:text-[2.5rem] mt-4 tracking-[-0.02em] leading-[1.12] text-slate-900">
                The cost of the wrong turn{" "}
                <span className="gradient-text">isn't failure —</span>
                <br />
                it's five lost years.
              </h2>

              <p className="text-slate-500 mt-5 text-[0.95rem] font-body font-[300] leading-[1.85] max-w-md">
                India produces millions of graduates annually. A significant number are doing work that doesn't fit how they think or what they're naturally suited for. That gap almost always begins right here — in the months after 12th boards.
              </p>

              <div className="mt-6 flex flex-col gap-2">
                {stats.map((s, i) => (
                  <motion.div
                    key={s.value}
                    initial={{ opacity: 0, x: -14 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                    className="flex items-center gap-3"
                  >
                    <span
                      className="font-display font-[800] text-[1.05rem] w-16 flex-shrink-0"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </span>
                    <span className="text-slate-500 text-[0.8rem] font-body leading-[1.6]">
                      {s.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col items-center">
            <div
              className="relative flex items-center justify-center w-full"
              style={{ height: "280px", minHeight: "280px" }}
            >
              <motion.div
                initial={{ opacity: 0, scaleX: 0.5 }}
                animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 w-40 h-5 rounded-full"
                style={{
                  background: "radial-gradient(ellipse, rgba(249,153,2,0.16) 0%, transparent 70%)",
                  filter: "blur(6px)",
                }}
              />

              <StatCube mouseX={rawX} mouseY={rawY} isInView={isInView} />

              <motion.p
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1.2 }}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 text-slate-300 text-[0.6rem] font-body tracking-widest uppercase whitespace-nowrap"
              >
                Tap to interact · Rotates automatically
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
