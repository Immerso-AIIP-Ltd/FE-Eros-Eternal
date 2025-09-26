import React, { useState, useEffect } from 'react';

// 💡 Replace this with your actual API URL
const API_URL = 'http://192.168.29.154:6001';

interface CompatibilityData {
  match_for: string;
  match_summary: string;
  sign_main: string;
  sign_partner: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: CompatibilityData;
}

const RelationshipCompatibility: React.FC = () => {
  const [yourName, setYourName] = useState('');
  const [yourDob, setYourDob] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerDob, setPartnerDob] = useState('');

  // 📊 State for API result
  const [compatibilityResult, setCompatibilityResult] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🗃️ Load from memory on mount (using state instead of localStorage)
  useEffect(() => {
    // Data persists in component state during session
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!yourName || !yourDob || !partnerName || !partnerDob) {
      alert('Please fill all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    // 📦 Create FormData
    const formData = new FormData();
    formData.append("user_id", "7b274190-1893-44df-80aa-20708e94f693");
    formData.append("user_name", yourName);
    formData.append("dob", yourDob);
    formData.append("dob_partner", partnerDob);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/numerology/career_compatibility`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        setCompatibilityResult(result);
      } else {
        setError('No compatibility data found.');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 🧮 Generate compatibility score
  const getCompatibilityScore = () => {
    if (!compatibilityResult?.data) return 0;
    const isSameSign = compatibilityResult.data.sign_main === compatibilityResult.data.sign_partner;
    return isSameSign ? 90 : 75;
  };

  // 💬 Render results UI
  const renderResults = () => {
    if (!compatibilityResult) return null;

    const { data } = compatibilityResult;
    const score = getCompatibilityScore();

    return (
      <div className="w-full max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-2xl font-bold mb-4 shadow-lg">
            {score}%
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Relationship Compatibility</h2>
          <p className="text-gray-300 text-lg">
            <span className="text-cyan-400 font-semibold">{yourName}</span> & <span className="text-cyan-400 font-semibold">{partnerName}</span> — {data.match_for}
          </p>
        </div>

        {/* Compatibility Score Bar */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 shadow-xl">
          <h5 className="text-xl font-semibold text-white mb-4">Compatibility Score</h5>
          <div className="w-full bg-gray-600 rounded-full h-4 mb-3">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-4 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${score}%` }}
            ></div>
          </div>
          <p className="text-gray-300 text-sm">Your compatibility score indicates a {score >= 80 ? 'strong' : score >= 60 ? 'good' : 'moderate'} connection</p>
        </div>

        {/* Relationship Strengths */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 shadow-xl">
          <h5 className="text-xl font-semibold text-white mb-4 flex items-center">
            <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
            Relationship Strengths
          </h5>
          <div className="text-gray-300 leading-relaxed">
            <p className="text-base">{data.match_summary}</p>
          </div>
        </div>

        {/* Zodiac Signs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-800 to-purple-700 border border-purple-500 shadow-xl text-center">
            <h6 className="text-lg font-semibold text-white mb-2">{yourName}'s Sign</h6>
            <div className="text-3xl font-bold text-purple-300">{data.sign_main}</div>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-800 to-pink-700 border border-pink-500 shadow-xl text-center">
            <h6 className="text-lg font-semibold text-white mb-2">{partnerName}'s Sign</h6>
            <div className="text-3xl font-bold text-pink-300">{data.sign_partner}</div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            onClick={() => {
              setCompatibilityResult(null);
            }}
          >
            ← Try Another Pair
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col vw-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 w-full max-w-4xl mx-auto">
        <button 
          className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
          onClick={() => window.history.back()}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-center flex-grow">Harmony Index</h1>
        <button 
          className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
          onClick={() => window.location.reload()}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="flex-grow flex items-center justify-center p-4">
        {/* Show Form OR Results */}
        {!compatibilityResult ? (
          <div className="w-full max-w-4xl mx-auto">
            {/* Intro */}
            <div className="text-center mb-12">
              {/* <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div> */}
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Relationship Compatibility
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                Discover your spiritual and emotional compatibility with your partner using vedic astrology
              </p>
            </div>

            {/* Form */}
            <div className="mb-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Your Details */}
                <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 shadow-xl">
                  <h5 className="text-2xl font-semibold mb-6 text-cyan-400">Enter Your Details</h5>
                  
                  <div className="mb-6">
                    <label htmlFor="yourName" className="block text-sm font-medium text-gray-300 mb-2">
                      Enter Your Name
                    </label>
                    <input
                      type="text"
                      id="yourName"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                      placeholder="Your full name"
                      value={yourName}
                      onChange={(e) => setYourName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="yourDob" className="block text-sm font-medium text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="yourDob"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                      value={yourDob}
                      onChange={(e) => setYourDob(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                {/* Partner Details */}
                <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 shadow-xl">
                  <h5 className="text-2xl font-semibold mb-6 text-pink-400">Enter Partner's Details</h5>
                  
                  <div className="mb-6">
                    <label htmlFor="partnerName" className="block text-sm font-medium text-gray-300 mb-2">
                      Enter Partner's Name
                    </label>
                    <input
                      type="text"
                      id="partnerName"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                      placeholder="Partner's full name"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="partnerDob" className="block text-sm font-medium text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="partnerDob"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                      value={partnerDob}
                      onChange={(e) => setPartnerDob(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 shadow-xl mb-8">
                <h5 className="text-xl font-semibold text-white mb-6">How It Works</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3 flex-shrink-0"></div>
                    <span>Analyzes birth dates using vedic astrology</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3 flex-shrink-0"></div>
                    <span>Calculates spiritual compatibility scores</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3 flex-shrink-0"></div>
                    <span>Provides personalized relationship insights</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3 flex-shrink-0"></div>
                    <span>Identifies relationship strengths</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3 flex-shrink-0"></div>
                    <span>Suggests growth opportunities</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3 flex-shrink-0"></div>
                    <span>Based on ancient wisdom traditions</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  onClick={handleSubmit}
                  disabled={!yourName || !yourDob || !partnerName || !partnerDob || isLoading}
                  className="px-12 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg font-semibold rounded-full hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Compatibility...
                    </span>
                  ) : (
                    'Start Compatibility Reading'
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
          <div className="fixed bottom-4 right-4 max-w-sm p-4 bg-red-600 text-white rounded-xl shadow-xl border border-red-500">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
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