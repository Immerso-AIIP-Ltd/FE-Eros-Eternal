// ChartImage - Renders chart from URL (handles both raw SVG and HTML pages with Pretty-print)
import React, { useState, useCallback } from "react";

interface ChartImageProps {
  src: string;
  alt: string;
  onLoad?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const ChartImage: React.FC<ChartImageProps> = ({
  src,
  alt,
  onLoad,
  className,
  style,
}) => {
  const [fallbackContent, setFallbackContent] = useState<
    "loading" | "svg" | "html-svg" | "error" | null
  >(null);
  const [extractedSvg, setExtractedSvg] = useState<string | null>(null);
  const [extractedImgSrc, setExtractedImgSrc] = useState<string | null>(null);

  const tryFetchAndExtract = useCallback(async () => {
    setFallbackContent("loading");

    try {
      const res = await fetch(src.trim(), { mode: "cors" });
      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();

      // Raw SVG
      if (
        contentType.includes("image/svg") ||
        contentType.includes("text/xml") ||
        text.trimStart().startsWith("<svg") ||
        text.trimStart().startsWith("<?xml")
      ) {
        const blob = new Blob([text], { type: "image/svg+xml" });
        const blobUrl = URL.createObjectURL(blob);
        setExtractedImgSrc(blobUrl);
        setFallbackContent("svg");
        onLoad?.();
        return;
      }

      // HTML - try to extract SVG or chart image
      if (contentType.includes("text/html") || text.includes("</html>")) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");

        // Look for embedded SVG
        const svg = doc.querySelector("svg");
        if (svg) {
          setExtractedSvg(svg.outerHTML);
          setFallbackContent("html-svg");
          onLoad?.();
          return;
        }

        // Look for img with chart (common in chart viewers)
        const img = doc.querySelector('img[src*="chart"], img[src*="svg"], img[src*=".svg"]');
        if (img?.getAttribute("src")) {
          const imgSrc = img.getAttribute("src")!;
          const fullUrl = imgSrc.startsWith("http") ? imgSrc : new URL(imgSrc, src).href;
          setExtractedImgSrc(fullUrl);
          setFallbackContent("html-svg");
          onLoad?.();
          return;
        }

        // Look for object/embed pointing to SVG
        const obj = doc.querySelector('object[data], embed[src]');
        const dataUrl = obj?.getAttribute("data") || obj?.getAttribute("src");
        if (dataUrl) {
          const fullUrl = dataUrl.startsWith("http") ? dataUrl : new URL(dataUrl, src).href;
          setExtractedImgSrc(fullUrl);
          setFallbackContent("html-svg");
          onLoad?.();
          return;
        }

        // Look for any img in the main content (skip icons/nav)
        const imgs = doc.querySelectorAll("img[src]");
        for (const i of imgs) {
          const s = i.getAttribute("src") || "";
          if (s && !s.includes("icon") && !s.includes("logo") && (s.endsWith(".svg") || s.includes("chart"))) {
            const fullUrl = s.startsWith("http") ? s : new URL(s, src).href;
            setExtractedImgSrc(fullUrl);
            setFallbackContent("html-svg");
            onLoad?.();
            return;
          }
        }

        // Pretty-print viewers often put SVG in pre/code - extract via regex
        const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
        if (svgMatch) {
          setExtractedSvg(svgMatch[0]);
          setFallbackContent("html-svg");
          onLoad?.();
          return;
        }
      }

      setFallbackContent("error");
    } catch (err) {
      console.error("Chart fetch error:", err);
      setFallbackContent("error");
    }
  }, [src, onLoad]);

  const handleImgError = useCallback(() => {
    tryFetchAndExtract();
  }, [tryFetchAndExtract]);

  const chartStyle: React.CSSProperties = {
    maxWidth: "100%",
    height: "auto",
    maxHeight: "100%",
    objectFit: "contain",
    borderRadius: "8px",
    ...style,
  };

  // Rendered extracted SVG from HTML
  if (fallbackContent === "html-svg" && extractedSvg) {
    return (
      <div
        className={className}
        style={{ ...chartStyle, overflow: "auto" }}
        dangerouslySetInnerHTML={{ __html: extractedSvg }}
      />
    );
  }

  // Rendered extracted img src (from fetch blob or HTML)
  if ((fallbackContent === "svg" || fallbackContent === "html-svg") && extractedImgSrc) {
    return (
      <img
        src={extractedImgSrc}
        alt={alt}
        className={className}
        style={chartStyle}
        onLoad={onLoad}
      />
    );
  }

  if (fallbackContent === "loading") {
    return (
      <div className={className} style={chartStyle}>
        <span className="text-muted small">Loading chart…</span>
      </div>
    );
  }

  if (fallbackContent === "error") {
    return (
      <div className={className} style={chartStyle}>
        <span className="text-muted small">Could not load chart image</span>
      </div>
    );
  }

  // Primary: direct img
  return (
    <img
      src={src.trim()}
      alt={alt}
      className={className}
      style={chartStyle}
      onLoad={onLoad}
      onError={handleImgError}
    />
  );
};

export default ChartImage;
