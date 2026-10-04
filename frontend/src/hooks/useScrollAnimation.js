// e:\projects 1\Career_Counseling_WebApp\frontend\src\hooks\useScrollAnimation.js
import { useRef } from "react";
import { useInView } from "framer-motion";

/**
 * A reusable hook that returns a ref + boolean for scroll-triggered animations.
 * @param {number} threshold - How much of the element needs to be visible (0–1)
 * @param {boolean} once - Fire only once (true) or every time element enters view
 */
export function useScrollAnimation(threshold = 0.15, once = true) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });
  return { ref, isInView };
}
