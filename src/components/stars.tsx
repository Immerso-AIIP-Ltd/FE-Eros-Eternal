import { useMemo } from "react";
import { PiStarFourFill } from "react-icons/pi";

export default function Stars() {
  // Generate stars only once
  const stars = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      fontSize: `${Math.random() * 15 + 6}px`,
      opacity: Math.random() * 0.7 + 0.3,
      animationDelay: `${Math.random() * 10}s`,
      animationDuration: `${Math.random() * 5 + 1}s`,
    }));
  }, []); // empty deps → runs once

  return (
    <div className="position-absolute w-100 h-100 pointer-events-none starsbg">
      {stars.map((star) => (
        <div
          key={star.id}
          className="text-white star-blink"
          style={{
            position: "absolute",
            top: star.top,
            left: star.left,
            fontSize: star.fontSize,
            opacity: star.opacity,
            animationDelay: star.animationDelay,
            animationDuration: star.animationDuration,
            backgroundRepeat: "repeat"
          }}
        >
          {/* <PiStarFourFill /> */}
          ✦
        </div>
      ))}
    </div>
  );
}
