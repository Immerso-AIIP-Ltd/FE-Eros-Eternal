import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UsersRound } from "lucide-react";
import Stars from "./components/stars";

// 💡 Replace this with your actual API URL
const API_URL = "http://164.52.205.108:8500";

// const API_URL =
//   "http://192.168.18.5:7001";

interface CompatibilityData {
  match_for: string;
  match_summary: string;
  dynamic_summary: string;
  compatibility_score: number;

  sign_main: string;
  sign_partner: string;

  strengths: string[];
  challenges: string[];
  shared_values: string[];
  ideal_roles: string[];
  warning_signs: string[];

  communication_style: string;
  growth_opportunities: string;

  advice_for_main: string;
  advice_for_partner: string;

  element_interaction: string;
  modality_interaction: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: CompatibilityData;
}

const RelationshipCompatibility: React.FC = () => {
  const navigate = useNavigate();

  const [stars] = useState(() =>
    Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: 0.3 + Math.random() * 0.7,
      size: Math.random() * 2 + 1,
    })),
  );
  const [yourName, setYourName] = useState("");
  const [yourDob, setYourDob] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerDob, setPartnerDob] = useState("");

  // 📊 State for API result
  const [compatibilityResult, setCompatibilityResult] =
    useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🗃️ Load from memory on mount (using state instead of localStorage)
  useEffect(() => {
    // Data persists in component state during session
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem("user_id") || "0";

    if (!yourName || !yourDob || !partnerName || !partnerDob) {
      alert("Please fill all fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    // 📦 Create FormData
    const formData = new FormData();
    formData.append("user_id", userId || "123");
    formData.append("user_name", yourName);
    formData.append("dob", yourDob);
    formData.append("dob_partner", partnerDob);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/numerology/career_compatibility`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        setCompatibilityResult(result);
      } else {
        setError("No compatibility data found.");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🧮 Generate compatibility score
  const getCompatibilityScore = () => {
    if (!compatibilityResult?.data) return 0;
    const isSameSign =
      compatibilityResult.data.sign_main ===
      compatibilityResult.data.sign_partner;
    return isSameSign ? 90 : 75;
  };

  // 💬 Render results UI
  const renderResults = () => {
    if (!compatibilityResult) return null;

    const { data } = compatibilityResult;
    const score = getCompatibilityScore();

    return (
      <div
        className="w-full  mx-auto px-4"
        style={{ position: "relative", zIndex: 10 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Relationship Compatibility
          </h2>

          <p className="text-gray-300 text-lg">
            <span className="text-cyan-400 fs-4 font-semibold">{yourName}</span>{" "}
            &{" "}
            <span className="text-cyan-400 fs-4 font-semibold">
              {partnerName}
            </span>{" "}
            <br />
            <span className="fs-6">{data.match_for}</span>
          </p>
        </div>

        {/* Relationship Strengths */}
        <h5 className="text-xl font-semibold text-white mb-4 flex items-center">
          {/* <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div> */}
          Relationship Strengths
        </h5>
        <div
          className="mb-8 p-6 rounded-2xl border border-gray-600 shadow-xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(42, 22, 159, 0.3) 0%, rgba(145, 174, 232, 0.3) 100%)",
          }}
        >
          <div className="space-y-6">
            {/* Match Summary */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Match Summary
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {data.match_summary}
              </p>
            </div>

            {/* Dynamic Summary */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Overview
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {data.dynamic_summary}
              </p>
            </div>

            {/* Compatibility Score */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Compatibility Score
              </h3>
              <p className="text-gray-300 text-2xl font-bold">
                {data.compatibility_score}%
              </p>
            </div>

            {/* Strengths */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Strengths
              </h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                {data.strengths?.length ? (
                  <ul className="list-disc list-inside text-gray-300 space-y-2">
                    {data.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No strengths available</p>
                )}
              </ul>
            </div>

            {/* Challenges */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Challenges
              </h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                {data.challenges.map((challenge, index) => (
                  <li key={index}>{challenge}</li>
                ))}
              </ul>
            </div>

            {/* Shared Values */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Shared Values
              </h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                {data.shared_values.map((value, index) => (
                  <li key={index}>{value}</li>
                ))}
              </ul>
            </div>

            {/* Ideal Roles */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Ideal Roles
              </h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                {data.ideal_roles.map((role, index) => (
                  <li key={index}>{role}</li>
                ))}
              </ul>
            </div>

            {/* Communication Style */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Communication Style
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {data.communication_style}
              </p>
            </div>

            {/* Growth Opportunities */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Growth Opportunities
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {data.growth_opportunities}
              </p>
            </div>

            {/* Warning Signs */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Warning Signs
              </h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                {data.warning_signs.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>

            {/* Advice for Main */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Advice for {data.sign_main}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {data.advice_for_main}
              </p>
            </div>

            {/* Advice for Partner */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Advice for {data.sign_partner}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {data.advice_for_partner}
              </p>
            </div>

            {/* Element Interaction */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Element Interaction
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {data.element_interaction}
              </p>
            </div>

            {/* Modality Interaction */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Modality Interaction
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {data.modality_interaction}
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          
        </div>
      </div>
    );
  };

  return (
    <div
      className="vw-100 d-flex flex-column p-4"
      style={{ position: "relative", minHeight: "100vh" }}
    >
      <Stars />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ zIndex: 0, pointerEvents: "none" }}
      >
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              top: `${star.y}%`,
              left: `${star.x}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button
          className="btn text-white"
          onClick={() => navigate("/result")}
          style={{ fontSize: "1rem", position: "relative", zIndex: 1000 }}
        >
          ← Back
        </button>
        {/* <button
          className="btn  text-white"
          onClick={() => window.location.reload()}
          style={{ fontSize: '1.2rem' }}
        >
          ↻
        </button> */}
      </div>

      {/* Header */}
      {/* <div className="flex items-center justify-between p-4 w-full mx-auto" style={{ position: "relative", zIndex: 10 }}>
        <button
          className="p-2 text-gray-400 hover:text-white transition-colors duration-200 bg-transparent"
          onClick={() => navigate("/result")}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          className="p-2 text-gray-400 hover:text-white transition-colors duration-200 bg-transparent"
          onClick={() => window.location.reload()}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div> */}

      <div
        className="flex-grow flex my-4 p-4"
        style={{ position: "relative", zIndex: 10 }}
      >
        {/* Show Form OR Results */}
        {!compatibilityResult ? (
          <div
            className="w-full max-w-4xl mx-auto"
            style={{ position: "relative", zIndex: 10 }}
          >
            <div className="d-flex justify-content-center mb-4">
              <div
                className="bg-info rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "48px", height: "48px" }}
              >
                <UsersRound size={18} />
              </div>
            </div>

            {/* Intro */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Relationship Compatibility
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                Discover your spiritual and emotional compatibility with your
                partner using vedic astrology
              </p>
            </div>

            {/* Form */}
            <div className="mb-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Your Details */}
                <div
                  className="p-8 rounded-2xl  "
                  style={{
                    backgroundColor: "#262626",
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                  <h5 className="text-2xl font-semibold mb-6 text-cyan-400">
                   Your Information
                  </h5>

                  <div className="mb-6">
                    <label
                      htmlFor="yourName"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Enter Your Name
                    </label>
                    <input
                      type="text"
                      id="yourName"
                      className="w-full px-4 py-3  border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                      style={{
                        backgroundColor: "#262626",
                        position: "relative",
                        zIndex: 10,
                      }}
                      placeholder="Your full name"
                      value={yourName}
                      onChange={(e) => setYourName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label
                      htmlFor="yourDob"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="yourDob"
                      className="w-full px-4 py-3  border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                      style={{
                        backgroundColor: "#262626",
                        position: "relative",
                        zIndex: 10,
                      }}
                      value={yourDob}
                      onChange={(e) => setYourDob(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                </div>

                {/* Partner Details */}
                <div
                  className="p-8 rounded-2xl "
                  style={{
                    backgroundColor: "#262626",
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                  <h5 className="text-2xl font-semibold mb-6 text-pink-400">
                    Partner Information
                  </h5>

                  <div className="mb-6">
                    <label
                      htmlFor="partnerName"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Partner's Name
                    </label>
                    <input
                      type="text"
                      id="partnerName"
                      className="w-full px-4 py-3  border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                      style={{
                        backgroundColor: "#262626",
                        position: "relative",
                        zIndex: 10,
                      }}
                      placeholder="Partner's full name"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label
                      htmlFor="partnerDob"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="partnerDob"
                      className="w-full px-4 py-3  border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                      style={{
                        backgroundColor: "#262626",
                        position: "relative",
                        zIndex: 10,
                      }}
                      value={partnerDob}
                      onChange={(e) => setPartnerDob(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div
                className="p-8 rounded-2xl shadow-xl mb-8"
                style={{
                  position: "relative",
                  zIndex: 10,
                }}
              >
                <h5 className="text-xl font-semibold text-white mb-4">
                 What We’ll Analyze
                </h5>
                <div className="grid gap-3">
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                    <span>Provides personalized relationship insights</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                    <span>Identifies relationship strengths</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                    <span>Identifies relationship Challenges</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                    <span>Suggest growth oppourtunities</span>
                  </div>
                  {/* <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                    <span>Suggests growth opportunities</span>
                  </div> */}
                  {/* <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                    <span>Based on ancient wisdom traditions</span>
                  </div> */}
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  onClick={handleSubmit}
                  disabled={
                    !yourName ||
                    !yourDob ||
                    !partnerName ||
                    !partnerDob ||
                    isLoading
                  }
                  className="px-12 py-4 btn text-white btn-info rounded-pill px-4 py-2 mt-4 w-full"
                  style={{
                    cursor: "pointer",
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating Compatibility...
                    </span>
                  ) : (
                    "Analyze Compatibility"
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // 👇 Show Results
          renderResults()
        )}

        {/* Global Error Message */}
        {error && (
          <div
            className="fixed bottom-4 right-4 max-w-sm p-4 bg-red-600 text-white rounded-xl shadow-xl border border-red-500"
            style={{ zIndex: 1000 }}
          >
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelationshipCompatibility;
