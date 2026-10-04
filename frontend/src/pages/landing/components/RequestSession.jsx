// src/pages/landing/components/RequestSession.jsx
import { motion } from "framer-motion";
import { useScrollAnimation } from "../../../hooks/useScrollAnimation";
import { useState } from "react";
import api from "../../../utils/api";

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY || "";

const CONCERN_LABELS = {
  career_confusion:    "I'm confused about which career path to choose",
  engineering_or_other:"Should I pursue Engineering or another field?",
  college_selection:   "Need help choosing the right college",
  after_12:            "Not sure what to do after Class 12",
  drop_year:           "Should I take a drop year for entrance exams?",
  branch_selection:    "Which engineering branch should I choose?",
  abroad_vs_india:     "Study abroad vs studying in India",
  parents_expectations:"Dealing with family expectations about career",
  other:               "Other",
};

function Field({ label, hint, required, children }) {
  return (
    <div>
      <label className="lp-form-label">
        {label}
        {required && <span className="text-[#f99902] ml-0.5">*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-slate-400 text-[0.72rem] mt-1.5 font-body">
          {hint}
        </p>
      )}
    </div>
  );
}

export default function RequestSession() {
  const { ref, isInView } = useScrollAnimation(0.1);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    qualification: "",
    concern: "",
    concernDetail: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");

 const set = (field) => (e) => {
  let value = e.target.value;

  if (field === "phone") {
    value = value.replace(/\D/g, "").slice(0, 10); // only digits, max 10
  }

  setForm((f) => ({ ...f, [field]: value }));
};

const handleSubmit = async (e) => {
  e.preventDefault();

  const phone = form.phone.trim();

  if (!form.name.trim() || !form.email.trim() || !phone) {
    setError("Please fill in your name, email and phone number.");
    return;
  }

  if (!/^\d{10}$/.test(phone)) {
    setError("Phone number must be exactly 10 digits.");
    return;
  }

  setError("");
  setSubmitting(true);

    try {
      // 1 ─ Send email via Web3Forms
      if (WEB3FORMS_KEY) {
        const web3Payload = {
          access_key: WEB3FORMS_KEY,
          subject:    `New Session Request — ${form.name}`,
          from_name:  "ICGC Landing Form",
          name:       form.name,
          email:      form.email,
          phone:      form.phone || "—",
          qualification: form.qualification || "—",
          concern:    form.concern
            ? (CONCERN_LABELS[form.concern] ?? form.concern)
            : "—",
          message:    form.concern === "other" ? (form.concernDetail || "—") : "—",
        };
        await fetch("https://api.web3forms.com/submit", {
          method:  "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(web3Payload),
        });
      }

      // 2 ─ Store in our DB
      await api.post("/public/inquiry", {
        name:          form.name.trim(),
        email:         form.email.trim(),
        phone:         form.phone.trim(),
        qualification: form.qualification,
        concern:       form.concern,
        concernDetail: form.concern === "other" ? form.concernDetail : "",
      });

      setSubmitted(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again or contact us directly."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="session" className="relative py-16 sm:py-24" style={{ background: "#feeed5" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 110%, rgba(249,153,2,0.07) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8">

        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 22 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="text-center mb-10"
        >
          <span className="section-label justify-center">Book a Session</span>
          <h2 className="font-display font-[800] text-[2rem] sm:text-[2.5rem] mt-4 tracking-[-0.02em] text-slate-900">
            Start with one honest conversation.
          </h2>
          <p className="text-slate-500 mt-4 text-[0.97rem] font-body font-[300] leading-[1.8] max-w-lg mx-auto">
            Fill in the form below. We will reach out within 24 hours to schedule your session.
          </p>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.65 }}
          className="bg-white border border-slate-200 rounded-2xl p-7 sm:p-9 shadow-sm"
        >
          {submitted ? (
            /* ── Success state ── */
            <div className="py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-display font-[700] text-xl text-slate-900 mb-2">
                Request Received!
              </h3>
              <p className="text-slate-500 text-sm font-body leading-relaxed max-w-xs mx-auto">
                Thank you, <strong>{form.name}</strong>. We will reach out to you at{" "}
                <strong>{form.email}</strong> within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid sm:grid-cols-2 gap-5">

                <Field label="Student Name" required hint="The student's full name, not a parent's name">
                  <input
                    type="text"
                    value={form.name}
                    onChange={set("name")}
                    className="lp-form-input"
                    placeholder="e.g. Rahul Sharma"
                  />
                </Field>

                <Field label="Email Address" required>
                  <input
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    className="lp-form-input"
                    placeholder="you@example.com"
                  />
                </Field>

                <Field label="Phone Number" required hint="WhatsApp preferred — used to schedule the session">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    className="lp-form-input"
                    placeholder="9876543210"
                  />
                </Field>

                <Field label="Current Qualification" required>
                  <select
                    value={form.qualification}
                    onChange={set("qualification")}
                    className="lp-form-input"
                  >
                    <option value="">Select your current status</option>
                    <option>Appearing in Class 12 (this year)</option>
                    <option>Completed Class 12 (last year or before)</option>
                    <option>Currently in Diploma (Polytechnic)</option>
                    <option>Diploma Completed</option>
                    <option>Currently in 1st year of college</option>
                    <option>Parent / Guardian (on behalf of student)</option>
                  </select>
                </Field>

                {/* Concern */}
                <div className="sm:col-span-2">
                  <Field
                    label="Your Main Concern or Question"
                    hint="Select the closest concern. If your situation is different, choose 'Other'."
                  >
                    <select
                      className="lp-form-input"
                      value={form.concern}
                      onChange={set("concern")}
                    >
                      <option value="">Select your main concern</option>
                      <option value="career_confusion">I'm confused about which career path to choose</option>
                      <option value="engineering_or_other">Should I pursue Engineering or another field?</option>
                      <option value="college_selection">Need help choosing the right college</option>
                      <option value="after_12">Not sure what to do after Class 12</option>
                      <option value="drop_year">Should I take a drop year for entrance exams?</option>
                      <option value="branch_selection">Which engineering branch should I choose?</option>
                      <option value="abroad_vs_india">Study abroad vs studying in India</option>
                      <option value="parents_expectations">Dealing with family expectations about career</option>
                      <option value="other">Other (my concern is different)</option>
                    </select>

                    {form.concern === "other" && (
                      <textarea
                        rows={4}
                        className="lp-form-input resize-none mt-3"
                        value={form.concernDetail}
                        onChange={set("concernDetail")}
                        placeholder="Please describe your concern…"
                      />
                    )}
                  </Field>
                </div>

              </div>

              {error && (
                <p className="mt-4 text-sm text-red-600 font-body">{error}</p>
              )}

              <div className="mt-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pt-5 border-t border-slate-100">
                <p className="text-slate-400 text-[0.75rem] font-body max-w-[260px] leading-[1.65]">
                  Your information is kept confidential and never shared with third parties.
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="lp-btn-primary whitespace-nowrap disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit Request"}
                  {!submitting && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
