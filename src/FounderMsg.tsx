import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FounderMsg = () => {
  const navigate = useNavigate();
  return (
    <div className='tarot-container d-flex flex-column min-vh-100 min-vw-100 text-white' style={{ alignItems: 'start', justifyContent: 'start' }}>
      {/* Back Button */}
      <div className="p-6">
        <button className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors bg-transparent">
          <ArrowLeft size={20} />
          <span className="text-lg" onClick={() => navigate(-1)}>Back</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="d-flex justify-content-center align-items-center flex-grow-1 w-100"
      >
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">🌞 Founder's Welcome</h1>
            {/* <p className="text-gray-400 text-lg">
              Lorem ipsum dolor sit amet consectetur. Vulputate aenean vulputate pellentesque senectus neque.
            </p> */}
          </div>

          {/* Main Card */}
          <div
            className="border border-purple-500/20 rounded-2xl p-8 mb-8"
            style={{
              background:
                "linear-gradient(180deg, rgba(42, 22, 159, 0.3) 0%, rgba(145, 174, 232, 0.3) 100%)",
            }}
          >
            {/* Welcome Message */}
            <div className="mb-8">
              {/* <h2 className="text-xl font-semibold text-white mb-4">🌞 FOUNDER’S WELCOME</h2> */}
              <p className=" leading-relaxed text-gray-100 mb-6">
                👋 Hey Seeker, I’m Manju, and I believe the future of health is energy, not illness.
                For too long, healing meant waiting for something to go wrong. <strong>Eternal flips that script</strong> — it’s your digital soul mirror, blending AI + ancient wisdom to help you:
              </p>

              <ul className="space-y-2 mb-6 pl-6 text-gray-200">
                <li className="list-disc">Understand your vibe and aura (your energy field)</li>
                <li className="list-disc">Decode your stress, recovery, and soul rhythm</li>
                <li className="list-disc">Get rituals, nutrition, and mind resets tailored to you</li>
                <li className="list-disc">Track your Flame Score, your spiritual health meter</li>
              </ul>

              <p className="text-lg leading-relaxed text-gray-100 mb-4">
                ✨ <strong>Here’s how it works:</strong>
              </p>

              <ul className="space-y-2 mb-6 pl-6 text-gray-200">
                <li className="list-disc"><strong>Vibe Check</strong> → share how you feel in body, mind, and spirit</li>
                <li className="list-disc"><strong>Aura Scan (optional)</strong> → choose your mood colors and energy flow</li>
                <li className="list-disc"><strong>Face Scan (optional)</strong> → read your glow, fatigue, and chakra balance (images never stored)</li>
                <li className="list-disc"><strong>Soul Blueprint</strong> → your birth details reveal your karmic code and planetary guidance</li>
              </ul>

              <p className="text-gray-200 leading-relaxed mb-4">
                Eternal is built on frequency medicine, consciousness-based rituals, and personalized wellness.
                No more one-size-fits-all. Your journey is unique — and so is your healing.
              </p>

              <p className="text-gray-200 leading-relaxed">
                🪐 Whether you’re curious about your aura, your energy score, or your soul’s path, Eternal guides you every step of the way.
                The future of healing is here. ✨
              </p>
            </div>

            {/* Terms and Conditions Lists */}
            <div className="space-y-6">
              {/* First List */}


              {/* Spacing between lists */}
              <div className="border-t border-purple-500/10 pt-6"></div>

              {/* Second List (duplicate) */}
              <div className="space-y-4">
                {/* ... (same content as above, you can consider removing the duplicate for clarity) */}
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                console.log("check its working");
                navigate("/profile");
              }}
              className="btn btn-info text-white px-4 py-2 fw-medium"
              style={{ fontFamily: "Poppins" }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FounderMsg;
