// VoiceMessage.tsx  (or paste above your ChatPage component)
import React from "react";

type VoiceMessageProps = {
  url: string;      // blob: or data: url created after recording
  duration: number; // seconds
};

const VoiceMessage: React.FC<VoiceMessageProps> = ({ url, duration }) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const durationRef = React.useRef<number>(duration || 0);

  // keep ref updated
  React.useEffect(() => {
    durationRef.current = duration || 0;
  }, [duration]);

  // attach src when url changes
  React.useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.src = url;
    audioRef.current.load();
  }, [url]);

  // timeupdate / play / pause / ended handlers
  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onTime = () => setCurrent(a.currentTime || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    a.addEventListener("timeupdate", onTime);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);

    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
    };
  }, [url]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(secs % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  // toggle play/pause (also pauses other audios on the page)
  const togglePlay = React.useCallback(
    async (e?: React.MouseEvent | React.KeyboardEvent) => {
      if (e) e.stopPropagation();
      const a = audioRef.current;
      if (!a) {
        console.warn("VoiceMessage: no audio element");
        return;
      }

      console.log("VoiceMessage togglePlay clicked", {
        paused: a.paused,
        readyState: a.readyState,
        src: a.currentSrc || a.src,
      });

      // pause any other audio elements
      document.querySelectorAll("audio").forEach((el) => {
        if (el !== a) {
          try {
            el.pause();
          } catch {}
        }
      });

      if (a.paused) {
        try {
          await a.play();
          // playing will flip state by event listener
        } catch (err) {
          console.error("Play failed:", err);
        }
      } else {
        a.pause();
      }
    },
    []
  );

  const progressPct =
    durationRef.current > 0 ? Math.min(100, (current / durationRef.current) * 100) : 0;

  // static bars generator
  const bars = React.useMemo(() => Array.from({ length: 40 }), []);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={togglePlay}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          togglePlay(e);
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        // background: "#00b8f8",
        color: "#fff",
        padding: "4px 4px",
        borderRadius: 24,
        maxWidth: 250,
        cursor: "pointer",
        userSelect: "none",
        position: "relative", // so audio can be positioned offscreen
      }}
      aria-label="Play voice message"
    >
      {/* Play button circle */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#00b8f8",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {isPlaying ? "❚❚" : "▶"}
      </div>

      {/* Waveform + progress */}
      <div style={{ flex: 1, minWidth: 140 }}>
        <div style={{ position: "relative", height: 22 }}>
          {/* background bars (unplayed) */}
          <div style={{ display: "flex", gap: 4, alignItems: "end", height: "100%" }}>
            {bars.map((_, i) => {
              const h = 6 + ((i * 7) % 12);
              return (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height: h,
                    background: "rgba(255,255,255,0.28)",
                    borderRadius: 2,
                  }}
                />
              );
            })}
          </div>

          {/* played overlay: clipped to progress width */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${progressPct}%`,
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            <div style={{ display: "flex", gap: 4, alignItems: "end", height: "100%" }}>
              {bars.map((_, i) => {
                const h = 6 + ((i * 7) % 12);
                return (
                  <div
                    key={i}
                    style={{
                      width: 3,
                      height: h,
                      background: "rgba(255,255,255,0.95)",
                      borderRadius: 2,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* duration + speaker aligned right */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6, fontSize: 13 }}>
          <div style={{ marginRight: 8 }}>{formatTime(durationRef.current || 0)}</div>
          <div>🔊</div>
        </div>
      </div>

      {/* off-screen audio element (keeps browser happy) */}
      <audio
        ref={audioRef}
        preload="auto"
        style={{ position: "absolute", left: -9999, width: 0, height: 0 }}
      >
        <source src={url} type="audio/webm;codecs=opus" />
        {/* keep other sources as needed */}
      </audio>
    </div>
  );
};

export default VoiceMessage;
