"use client";
import { ReactLenis } from "@studio-freight/react-lenis";

export default function SmoothScroll({ children }) {
  return (
    <ReactLenis 
      root 
      options={{ 
        lerp: 0.08, // Smoother scrolling
        duration: 1.2,
        syncTouch: true,
        wheelMultiplier: 0.7, // Better control
        touchMultiplier: 1,
        smoothWheel: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}