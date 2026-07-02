import { useEffect, useRef } from "react";
import createGlobe from "cobe";

// African cities to highlight
const MARKERS = [
  { location: [-1.2921, 36.8219], size: 0.09 }, // Nairobi
  { location: [6.5244, 3.3792], size: 0.08 },   // Lagos
  { location: [30.0444, 31.2357], size: 0.07 }, // Cairo
  { location: [-26.2041, 28.0473], size: 0.07 },// Johannesburg
  { location: [5.6037, -0.187], size: 0.06 },   // Accra
  { location: [9.03, 38.74], size: 0.06 },       // Addis Ababa
  { location: [0.3476, 32.5825], size: 0.05 },   // Kampala
  { location: [14.7167, -17.4677], size: 0.05 }, // Dakar
  { location: [-4.4419, 15.2663], size: 0.05 },  // Kinshasa
  { location: [33.5731, -7.5898], size: 0.05 },  // Casablanca
];

export default function Globe({ size = 420 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let phi = 4.6; // start roughly facing Africa
    let width = 0;
    const canvas = canvasRef.current;
    const onResize = () => { if (canvas) width = canvas.offsetWidth; };
    onResize();
    window.addEventListener("resize", onResize);

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: size * 2,
      height: size * 2,
      phi: 4.6,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.28, 0.26, 0.45],
      markerColor: [0.55, 0.5, 0.95],
      glowColor: [0.5, 0.45, 0.85],
      markers: MARKERS,
      onRender: (state) => {
        state.phi = phi;
        phi += 0.004; // slow auto-rotate
        state.width = width * 2;
        state.height = width * 2;
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [size]);

  return (
    <div style={{ width: "100%", maxWidth: `${size}px`, aspectRatio: "1", margin: "0 auto" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", contain: "layout paint size", opacity: 0.95 }}
      />
    </div>
  );
}
