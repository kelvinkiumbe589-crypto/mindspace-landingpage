import { useEffect, useRef } from "react";
import createGlobe from "cobe";

// Cities around the world — MindSpace is for everyone, everywhere
const MARKERS = [
  { location: [-1.2921, 36.8219], size: 0.07 },  // Nairobi
  { location: [6.5244, 3.3792], size: 0.06 },    // Lagos
  { location: [30.0444, 31.2357], size: 0.06 },  // Cairo
  { location: [-26.2041, 28.0473], size: 0.06 }, // Johannesburg
  { location: [51.5074, -0.1278], size: 0.07 },  // London
  { location: [40.7128, -74.006], size: 0.08 },  // New York
  { location: [19.076, 72.8777], size: 0.07 },   // Mumbai
  { location: [35.6762, 139.6503], size: 0.07 }, // Tokyo
  { location: [-33.8688, 151.2093], size: 0.06 },// Sydney
  { location: [-23.5505, -46.6333], size: 0.07 },// São Paulo
  { location: [25.2048, 55.2708], size: 0.05 },  // Dubai
  { location: [1.3521, 103.8198], size: 0.05 },  // Singapore
  { location: [19.4326, -99.1332], size: 0.06 }, // Mexico City
  { location: [52.52, 13.405], size: 0.05 },     // Berlin
  { location: [43.6532, -79.3832], size: 0.05 }, // Toronto
];

export default function Globe({ size = 420 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let phi = 0; // rotate through the whole world
    let width = 0;
    const canvas = canvasRef.current;
    const onResize = () => { if (canvas) width = canvas.offsetWidth; };
    onResize();
    window.addEventListener("resize", onResize);

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: size * 2,
      height: size * 2,
      phi: 0,
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
