// src/pages/landing/LandingPage.jsx
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import WhatWeDo from "./components/WhatWeDo";
import WhoIsThisFor from "./components/WhoIsThisFor";
import WhatWeOfferStudents from "./components/WhatWeOfferStudents";
import WhyCounselling from "./components/WhyCounselling";
import RequestSession from "./components/RequestSession";
import Footer from "./components/Footer";
import "./landing.css";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      <main>
        <Hero />
        <WhatWeDo />
        <WhoIsThisFor />
        <WhatWeOfferStudents />
        <WhyCounselling />
        <RequestSession />
      </main>
      <Footer />
    </div>
  );
}
