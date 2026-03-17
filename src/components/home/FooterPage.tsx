import { useState } from "react";
import ErosLogo from "../../assets/LogoEros.png";
import PhoneBackground from "../../assets/result-images/footer.png"

/* ─── ICONS ──────────────────────────────────────────────────── */
const AppleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const TwitterIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const GithubIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

/* ─── LOGO ────────────────────────────────────────────────────── */
// const ErosLogo = ({ size = "md" }: { size?: "sm" | "md" }) => (
//   <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//     <div
//       style={{
//         width: size === "sm" ? 34 : 42,
//         height: size === "sm" ? 28 : 34,
//         background: "#1d4ed8",
//         borderRadius: "7px",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         flexShrink: 0,
//       }}
//     >
//       <span
//         style={{
//           color: "#fff",
//           fontSize: size === "sm" ? "9px" : "11px",
//           fontWeight: 800,
//           letterSpacing: "0.06em",
//           fontFamily: "Georgia, serif",
//         }}
//       >
//         EROS
//       </span>
//     </div>
//     <div style={{ lineHeight: 1.1 }}>
//       <div
//         style={{
//           fontSize: size === "sm" ? "13px" : "16px",
//           fontWeight: 800,
//           color: "#111",
//           letterSpacing: "0.04em",
//           fontFamily: "Georgia, serif",
//         }}
//       >
//         EROS
//       </div>
//       <div
//         style={{
//           fontSize: "8px",
//           color: "#888",
//           letterSpacing: "0.28em",
//           textTransform: "uppercase",
//           fontFamily: "Helvetica Neue, sans-serif",
//         }}
//       >
//         wellness
//       </div>
//     </div>
//   </div>
// );

/* ─── PHONE MOCKUP ────────────────────────────────────────────── */
// const PhoneMockup = () => {
//   const emojis = ["😔", "😐", "🙂", "😊", "😄"];
//   const [selected, setSelected] = useState(3);

//   return (
//     <div
//       style={{
//         position: "relative",
//         width: "260px",
//         height: "520px",
//         margin: "0 auto",
//         flexShrink: 0,
//       }}
//     >
   
//       <div
//         style={{
//           position: "absolute",
//           width: "340px",
//           height: "340px",
//           borderRadius: "50%",
//           background:
//             "radial-gradient(circle, rgba(147,197,253,0.35) 0%, rgba(219,234,254,0.15) 60%, transparent 80%)",
//           top: "50%",
//           left: "50%",
//           transform: "translate(-50%, -44%)",
//           zIndex: 0,
//         }}
//       />
     
//       <div
//         style={{
//           position: "relative",
//           zIndex: 1,
//           width: "260px",
//           height: "520px",
//           background: "#111",
//           borderRadius: "40px",
//           padding: "12px",
//           boxShadow:
//             "0 40px 80px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.08)",
//         }}
//       >
      
//         <div
//           style={{
//             width: "100%",
//             height: "100%",
//             background: "#f8fafc",
//             borderRadius: "30px",
//             overflow: "hidden",
//             position: "relative",
//           }}
//         >
        
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               padding: "10px 18px 4px",
//               background: "#f8fafc",
//             }}
//           >
//             <span style={{ fontSize: "10px", fontWeight: 700, color: "#111" }}>
//               9:41
//             </span>
//             <div
//               style={{
//                 width: "60px",
//                 height: "16px",
//                 background: "#111",
//                 borderRadius: "0 0 10px 10px",
//                 position: "absolute",
//                 top: 0,
//                 left: "50%",
//                 transform: "translateX(-50%)",
//               }}
//             />
//             <span style={{ fontSize: "9px", color: "#111" }}>◼◼◼</span>
//           </div>

       
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               padding: "8px 14px",
//             }}
//           >
//             <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//               <div
//                 style={{
//                   background: "#1d4ed8",
//                   borderRadius: "5px",
//                   width: "28px",
//                   height: "22px",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                 }}
//               >
//                 <span
//                   style={{
//                     color: "#fff",
//                     fontSize: "6px",
//                     fontWeight: 800,
//                     letterSpacing: "0.04em",
//                   }}
//                 >
//                   EROS
//                 </span>
//               </div>
//               <div>
//                 <div
//                   style={{
//                     fontSize: "9px",
//                     fontWeight: 800,
//                     color: "#111",
//                     letterSpacing: "0.04em",
//                   }}
//                 >
//                   EROS
//                 </div>
//                 <div style={{ fontSize: "6px", color: "#888", letterSpacing: "0.2em" }}>
//                   UNIVERSE
//                 </div>
//               </div>
//             </div>
//             <div
//               style={{
//                 width: "22px",
//                 height: "22px",
//                 borderRadius: "50%",
//                 background: "#e5e7eb",
//               }}
//             />
//           </div>

        
//           <div
//             style={{
//               margin: "4px 12px",
//               background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
//               borderRadius: "14px",
//               padding: "14px",
//               color: "#fff",
//             }}
//           >
//             <div style={{ fontSize: "9px", opacity: 0.8, marginBottom: "4px" }}>
//               Vibrational frequency
//             </div>
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "flex-end",
//               }}
//             >
//               <div>
//                 <div
//                   style={{ fontSize: "28px", fontWeight: 800, lineHeight: 1 }}
//                 >
//                   72.
//                 </div>
//                 <div style={{ display: "flex", gap: "2px", marginTop: "4px" }}>
//                   {[1, 2, 3, 4, 5].map((s) => (
//                     <span key={s} style={{ color: s <= 4 ? "#fbbf24" : "#93c5fd", fontSize: "9px" }}>
//                       ★
//                     </span>
//                   ))}
//                 </div>
//               </div>
//               <div style={{ position: "relative", width: "52px", height: "52px" }}>
//                 <svg viewBox="0 0 52 52" width="52" height="52">
//                   <circle
//                     cx="26"
//                     cy="26"
//                     r="22"
//                     fill="none"
//                     stroke="rgba(255,255,255,0.25)"
//                     strokeWidth="4"
//                   />
//                   <circle
//                     cx="26"
//                     cy="26"
//                     r="22"
//                     fill="none"
//                     stroke="#fff"
//                     strokeWidth="4"
//                     strokeDasharray={`${2 * Math.PI * 22 * 0.8} ${2 * Math.PI * 22}`}
//                     strokeLinecap="round"
//                     transform="rotate(-90 26 26)"
//                   />
//                 </svg>
//                 <div
//                   style={{
//                     position: "absolute",
//                     inset: 0,
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     fontSize: "9px",
//                     fontWeight: 700,
//                   }}
//                 >
//                   80%
//                 </div>
//               </div>
//             </div>
//             <div style={{ fontSize: "7px", opacity: 0.7, marginTop: "8px", lineHeight: 1.4 }}>
//               Your energy is expressing freely. Keep radiating!
//             </div>
//             <div style={{ display: "flex", gap: "4px", marginTop: "10px" }}>
//               {[0, 1, 2].map((d) => (
//                 <div
//                   key={d}
//                   style={{
//                     width: d === 1 ? "18px" : "6px",
//                     height: "4px",
//                     borderRadius: "2px",
//                     background: d === 1 ? "#fff" : "rgba(255,255,255,0.4)",
//                   }}
//                 />
//               ))}
//             </div>
//           </div>

       
//           <div style={{ padding: "12px 14px 6px" }}>
//             <div
//               style={{
//                 fontSize: "10px",
//                 fontWeight: 600,
//                 color: "#374151",
//                 marginBottom: "10px",
//               }}
//             >
//               How are you feeling today?
//             </div>
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//               }}
//             >
//               {emojis.map((e, i) => (
//                 <button
//                   key={i}
//                   onClick={() => setSelected(i)}
//                   style={{
//                     background:
//                       selected === i ? "#eff6ff" : "transparent",
//                     border:
//                       selected === i
//                         ? "1.5px solid #93c5fd"
//                         : "1.5px solid transparent",
//                     borderRadius: "8px",
//                     padding: "5px",
//                     fontSize: "18px",
//                     cursor: "pointer",
//                     transition: "all 0.15s",
//                   }}
//                 >
//                   {e}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

/* ─── HERO SECTION ────────────────────────────────────────────── */
const HeroSection = () => (
  <section
    style={{
      background: "#fff",
      padding: "80px 40px 60px",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* Top label */}
    <div
      style={{
        textAlign: "center",
        fontSize: "11px",
        color: "#9ca3af",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: "36px",
      }}
    >
      EROS Wellness App
    </div>

    {/* Headline row */}
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: "20px",
        flexWrap: "wrap",
        marginBottom: "24px",
      }}
    >
      {/* John avatar chip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#111",
          color: "#fff",
          borderRadius: "24px",
          padding: "6px 14px 6px 8px",
          fontSize: "12px",
          fontWeight: 600,
          alignSelf: "flex-end",
          marginBottom: "12px",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "#4ade80",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 700,
            color: "#166534",
          }}
        >
          J
        </div>
        John
      </div>

      {/* Main heading */}
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 56px)",
            fontWeight: 800,
            color: "#111",
            margin: 0,
            lineHeight: 1.1,
            fontFamily: "Inter, serif",
            letterSpacing: "-0.02em",
          }}
        >
          Start Explore{" "}
         <span
  style={{
    background: "linear-gradient(135deg, #9dcae6 0%, #e0b7c0 40%, #d29cb9 65%, #a097c7 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontFamily: "Inter, serif",
  }}
>
  Today
</span>
        </h1>
      </div>

      {/* Katie avatar chip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#111",
          color: "#fff",
          borderRadius: "24px",
          padding: "6px 14px 6px 8px",
          fontSize: "12px",
          fontWeight: 600,
          alignSelf: "flex-start",
          marginTop: "8px",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "#fb923c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 700,
            color: "#7c2d12",
          }}
        >
          K
        </div>
        Katie
      </div>
    </div>

    {/* Subtitle */}
    <p
      style={{
        textAlign: "center",
        color: "#6b7280",
        fontSize: "14px",
        lineHeight: 1.7,
        maxWidth: "420px",
        margin: "0 auto 32px",
      }}
    >
      Lorem ipsum dolor sit amet consectetur. Ac quis praesent ullamcorper congue altricia scelerisque.
    </p>

    {/* CTA Button */}
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "56px" }}>
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#111",
          color: "#fff",
          border: "none",
          borderRadius: "28px",
          padding: "14px 28px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          letterSpacing: "0.01em",
          boxShadow: "0 4px 16px rgba(0,0,0,0.16)",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.22)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.16)";
        }}
      >
        <AppleIcon />
        Download App Store
      </button>
    </div>

    {/* Phone mockup */}
    {/* <PhoneMockup /> */}
<div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding:"30px"
    // height: "100vh"   
  }}
>
  <img
    src={PhoneBackground}
    alt="Eros Wellness Logo"
    style={{
      width: "100%",
      maxWidth: "160px",
      height: "auto"
    }}
  />
</div>
  </section>
);

/* ─── NAVBAR ──────────────────────────────────────────────────── */
const Navbar = () => (
  <nav
    style={{
      position: "sticky",
      top: 0,
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid #f3f4f6",
      zIndex: 100,
      padding: "0 48px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: "64px",
    }}
  >
    <ErosLogo size="sm" />
    <div style={{ display: "flex", gap: "32px" }}>
      {["Home", "Features", "Pricing", "About"].map((item) => (
        <a
          key={item}
          href="#"
          style={{
            fontSize: "13px",
            color: "#374151",
            textDecoration: "none",
            fontWeight: 500,
            letterSpacing: "0.01em",
          }}
        >
          {item}
        </a>
      ))}
    </div>
    <button
      style={{
        background: "#111",
        color: "#fff",
        border: "none",
        borderRadius: "20px",
        padding: "9px 20px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      Get Started
    </button>
  </nav>
);

/* ─── FOOTER ──────────────────────────────────────────────────── */
const Footer = () => {
  const companyLinks = ["About", "Features", "Works", "Career"];
  const productLinks = ["EROS Play", "EROS Create", "EROS Wellness", "EROS OS", "EROS World"];
  const helpLinks = ["Customer Support", "Delivery Details", "Terms & Conditions", "Privacy Policy"];
  const socialIcons = [
    <TwitterIcon />, <FacebookIcon />, <InstagramIcon />, <GithubIcon />,
  ];

  return (
    <footer style={{ background: "#fff", borderTop: "1px solid #e5e7eb" }}>
      {/* Main grid */}
      <div
        style={{
          width: "100%",
          margin: "0 auto",
          padding: "56px 48px 40px",
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: "48px",
          fontFamily:"Poppins, serif"
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* <ErosLogo /> */}
            <img src={ErosLogo} alt="Eros Wellness Logo" className="eros-logo" />
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              lineHeight: 1.75,
              maxWidth: "240px",
              margin: 0,
            }}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
            dictum aliquet accumsan porta lectus nisl in mattis. Netus sodales
            in volutpat ullamcorper amet adipiscing fermentum.
          </p>
          <div style={{ display: "flex", gap: "16px" }}>
            {socialIcons.map((icon, i) => (
              <a
                key={i}
                href="#"
                style={{
                  color: "#374151",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.2s",
                }}
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* Company */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px",fontFamily:"Poppins, serif" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#111",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Company
          </div>
          {companyLinks.map((l) => (
            <a
              key={l}
              href="#"
              style={{ fontSize: "13px", color: "#6b7280", textDecoration: "none" }}
            >
              {l}
            </a>
          ))}
        </div>

        {/* Products */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#111",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Products
          </div>
          {productLinks.map((l) => (
            <a
              key={l}
              href="#"
              style={{ fontSize: "13px", color: "#6b7280", textDecoration: "none" }}
            >
              {l}
            </a>
          ))}
        </div>

        {/* Help */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#111",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Help
          </div>
          {helpLinks.map((l) => (
            <a
              key={l}
              href="#"
              style={{ fontSize: "13px", color: "#6b7280", textDecoration: "none" }}
            >
              {l}
            </a>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid #e5e7eb", margin: "0 48px" }} />

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "16px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "24px" }}>
          {["About us", "Contact", "Privacy policy", "Sitemap", "Terms of Use"].map((label) => (
            <a
              key={label}
              href="#"
              style={{ fontSize: "12px", color: "#6b7280", textDecoration: "none" }}
            >
              {label}
            </a>
          ))}
        </div>
        <span style={{ fontSize: "12px", color: "#9ca3af" }}>
          © 2025, All Rights Reserved
        </span>
      </div>
    </footer>
  );
};

/* ─── ROOT PAGE ───────────────────────────────────────────────── */
export default function ErosWellnessPage() {
  return (
    <div
      style={{
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        background: "#fff",
        minHeight: "100vh",
      }}
    >
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; }
        a:hover { color: #111 !important; }
        button:active { transform: scale(0.97) !important; }
      `}</style>
      {/* <Navbar /> */}
      <HeroSection />
      <Footer />
    </div>
  );
}