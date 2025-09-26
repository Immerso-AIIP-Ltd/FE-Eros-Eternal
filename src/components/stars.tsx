import { useMemo, useState, useEffect } from "react";

export default function Stars() {
  const [pageHeight, setPageHeight] = useState(document.documentElement.scrollHeight);

  // Update pageHeight when window resizes or content changes
  useEffect(() => {
    const updateHeight = () => setPageHeight(document.documentElement.scrollHeight);
    window.addEventListener("resize", updateHeight);

    // Observe DOM changes that affect height
    const observer = new MutationObserver(updateHeight);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("resize", updateHeight);
      observer.disconnect();
    };
  }, []);

  // Generate stars only once
  const stars = useMemo(() => {
    return Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100, // percentage of container height
      left: `${Math.random() * 100}%`,
      fontSize: `${Math.random() * 15 + 6}px`,
      opacity: Math.random() * 0.7 + 0.3,
      animationDelay: `${Math.random() * 10}s`,
      animationDuration: `${Math.random() * 5 + 1}s`,
    }));
  }, []);

  return (
    <div
      className="pointer-events-none starsbg"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: `${pageHeight - 10}px`, // full dynamic height
        // zIndex: -1,
      }}
    >
      {stars.map((star) => (
        <div
          key={star.id}
          className="text-white star-blink"
          style={{
            position: "absolute",
            top: `${star.top}%`,
            left: star.left,
            fontSize: star.fontSize,
            opacity: star.opacity,
            animationDelay: star.animationDelay,
            animationDuration: star.animationDuration,
          }}
        >
          ✦
        </div>
      ))}
    </div>
  );
}
