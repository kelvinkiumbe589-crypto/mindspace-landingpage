import { useRef, useEffect } from "react";

function chunk(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export function ThreeDMarquee({ images, className = "" }) {
  const containerRef = useRef(null);

  const columns = chunk(images, Math.ceil(images.length / 4));

  return (
    <div
      ref={containerRef}
      className={`marquee-container ${className}`}
      style={{
        width: "100%",
        height: "600px",
        overflow: "hidden",
        perspective: "1000px",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
          gap: "12px",
          transform: "rotateX(20deg) rotateZ(-10deg)",
          transformOrigin: "center center",
          width: "120%",
          marginLeft: "-10%",
          height: "100%",
        }}
      >
        {columns.map((col, colIdx) => (
          <MarqueeColumn
            key={colIdx}
            images={col}
            reverse={colIdx % 2 !== 0}
          />
        ))}
      </div>

      {/* Top fade */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "120px",
          background:
            "linear-gradient(to bottom, #0d0d14 0%, transparent 100%)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />
      {/* Bottom fade */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "120px",
          background:
            "linear-gradient(to top, #0d0d14 0%, transparent 100%)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />
      {/* Left fade */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "80px",
          background:
            "linear-gradient(to right, #0d0d14 0%, transparent 100%)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />
      {/* Right fade */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "80px",
          background:
            "linear-gradient(to left, #0d0d14 0%, transparent 100%)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function MarqueeColumn({ images, reverse }) {
  const columnRef = useRef(null);
  const animationRef = useRef(null);
  const posRef = useRef(0);
  const speed = 0.5;

  useEffect(() => {
    const column = columnRef.current;
    if (!column) return;

    const animate = () => {
      posRef.current += reverse ? speed : -speed;
      const totalHeight = column.scrollHeight / 2;
      if (!reverse && Math.abs(posRef.current) >= totalHeight) {
        posRef.current = 0;
      }
      if (reverse && posRef.current >= totalHeight) {
        posRef.current = 0;
      }
      column.style.transform = `translateY(${posRef.current}px)`;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [reverse]);

  const doubled = [...images, ...images];

  return (
    <div style={{ overflow: "hidden", height: "100%" }}>
      <div ref={columnRef} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {doubled.map((src, idx) => (
          <div
            key={idx}
            style={{
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid rgba(127,119,221,0.2)",
              flexShrink: 0,
            }}
          >
            <img
              src={src}
              alt=""
              style={{
                width: "100%",
                height: "160px",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
