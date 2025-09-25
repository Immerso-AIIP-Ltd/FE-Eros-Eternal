import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

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
  const [yourDob, setYourDob] = useState<Date | null>(null);
  const [partnerName, setPartnerName] = useState('');
  const [partnerDob, setPartnerDob] = useState<Date | null>(null);

  // 📊 State for API result
  const [compatibilityResult, setCompatibilityResult] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🗃️ Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('relationshipCompatibility');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setYourName(parsed.yourName || '');
        setYourDob(parsed.yourDob ? new Date(parsed.yourDob) : null);
        setPartnerName(parsed.partnerName || '');
        setPartnerDob(parsed.partnerDob ? new Date(parsed.partnerDob) : null);
      } catch (e) {
        console.warn('Failed to parse saved data from localStorage');
      }
    }
  }, []);

  // 💾 Save to localStorage whenever any field changes
  useEffect(() => {
    const saveData = {
      yourName,
      yourDob: yourDob ? yourDob.toISOString() : null,
      partnerName,
      partnerDob: partnerDob ? partnerDob.toISOString() : null,
    };
    localStorage.setItem('relationshipCompatibility', JSON.stringify(saveData));
  }, [yourName, yourDob, partnerName, partnerDob]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!yourName || !yourDob || !partnerName || !partnerDob) {
      alert('Please fill all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    // ✅ Format dates to YYYY-MM-DD
    const yourDobStr = format(yourDob, 'yyyy-MM-dd');
    const partnerDobStr = format(partnerDob, 'yyyy-MM-dd');

    // 📦 Create FormData
    const formData = new FormData();
    formData.append("user_id", "7b274190-1893-44df-80aa-20708e94f693"); // Replace if dynamic
    formData.append("user_name", yourName);
    formData.append("dob", yourDobStr);
    formData.append("dob_partner", partnerDobStr);

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

  // 🧮 Generate compatibility score (example logic - adjust as needed)
  const getCompatibilityScore = () => {
    if (!compatibilityResult?.data) return 0;
    // Example: If same sign → high score
    const isSameSign = compatibilityResult.data.sign_main === compatibilityResult.data.sign_partner;
    return isSameSign ? 90 : 75; // You can make this smarter based on API or astrology rules
  };

  // 💬 Render results UI
  const renderResults = () => {
    if (!compatibilityResult) return null;

    const { data } = compatibilityResult;
    const score = getCompatibilityScore();

    return (
      <div className="w-100" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div className="text-center mb-4">
          <div
            className="rounded-circle d-inline-flex justify-content-center align-items-center mb-2"
            style={{ width: 80, height: 80, backgroundColor: "#00B8F8", fontSize: '1.5rem', fontWeight: 'bold' }}
          >
            {score}%
          </div>
          <h2 className="fw-bold">Relationship Compatibility</h2>
          <p className="text-white">
            <strong>{yourName} & {partnerName}</strong> — {data.match_for}
          </p>
        </div>

        {/* Relationship Strengths */}
        <div className="mb-4 p-4 rounded" style={{ backgroundColor: '#121212', border: '1px solid #333' }}>
          <h5 className="mb-3">Relationship Strengths</h5>
          <div className="text-white">
            <p>{data.match_summary}</p>
          </div>
        </div>

        {/* Growth Opportunities */}
        {/* <div className="mb-4 p-4 rounded" style={{ backgroundColor: '#121212', border: '1px solid #333' }}>
          <h5 className="mb-3">Growth Opportunities</h5>
          <ul className="list-unstyled text-muted">
            <li>• Communicate openly about expectations.</li>
            <li>• Respect each other’s need for structure and routine.</li>
            <li>• Schedule regular check-ins to avoid silent resentment.</li>
            <li>• Celebrate small wins together to reinforce connection.</li>
            <li>• Consider joint spiritual or mindfulness practices.</li>
          </ul>
        </div> */}

        {/* Back Button */}
        <div className="d-flex justify-content-center mt-4">
          <button
            className="btn btn-outline-light"
            onClick={() => {
              setCompatibilityResult(null);
              // Optionally reset form too
              // setYourName(''); setYourDob(null); setPartnerName(''); setPartnerDob(null);
            }}
          >
            ← Try Another Pair
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="text-white vh-100 vw-100 d-flex flex-column align-items-center p-4" style={{ backgroundColor: "rgb(5, 5, 5)" }}>
      {/* Header */}
      <div className="d-flex align-items-center mb-4 w-100" style={{ maxWidth: 900 }}>
        <button className="btn btn-link text-white" onClick={() => window.history.back()}>
          &larr;
        </button>
        <h5 className="mb-0 ms-3 flex-grow-1">Harmony Index</h5>
        <button className="btn btn-link text-white" onClick={() => window.location.reload()}>
          &#x21bb;
        </button>
      </div>

      {/* Show Form OR Results */}
      {!compatibilityResult ? (
        <>
          {/* Intro */}
          <div className="text-center mb-4">
            <div
              className="rounded-circle d-inline-flex justify-content-center align-items-center mb-2"
              style={{ width: 60, height: 60, backgroundColor: "#00B8F8" }}
            >
              <i className="bi bi-people-fill fs-3 text-white"></i>
            </div>
            <h2 className="fw-bold">Relationship Compatibility</h2>
            <p className="text-muted" style={{ maxWidth: 600, margin: 'auto' }}>
              Discover your spiritual and emotional compatibility with your partner using vedic astrology
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="d-flex justify-content-between w-100"
            style={{ maxWidth: 900 }}
            noValidate
          >
            <div className="flex-fill me-4">
              <h5 className="mb-3">Enter Your Details</h5>
              <div className="mb-3">
                <label htmlFor="yourName" className="form-label">
                  Enter Your Name
                </label>
                <input
                  type="text"
                  id="yourName"
                  className="form-control"
                  placeholder="Name"
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="yourDob" className="form-label">
                  Date of birth
                </label>
                <DatePicker
                  id="yourDob"
                  className="form-control"
                  selected={yourDob}
                  onChange={(date) => setYourDob(date)}
                  dateFormat="yyyy-MM-dd"
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  maxDate={new Date()}
                  placeholderText="Select your date of birth"
                  required
                />
              </div>
            </div>

            <div className="flex-fill">
              <h5 className="mb-3">Enter Partner’s Detail</h5>
              <div className="mb-3">
                <label htmlFor="partnerName" className="form-label">
                  Enter Name
                </label>
                <input
                  type="text"
                  id="partnerName"
                  className="form-control"
                  placeholder="Name"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="partnerDob" className="form-label">
                  Date of birth
                </label>
                <DatePicker
                  id="partnerDob"
                  className="form-control"
                  selected={partnerDob}
                  onChange={(date) => setPartnerDob(date)}
                  dateFormat="yyyy-MM-dd"
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  maxDate={new Date()}
                  placeholderText="Select partner's date of birth"
                  required
                />
              </div>
            </div>
          </form>

          <div className="w-100 mt-4" style={{ maxWidth: 900 }}>
            <h5>How It Works</h5>
            <ul className="list-unstyled text-muted">
              <li>• Lorem ipsum dolor sit amet consectetur.</li>
              <li>• Lorem ipsum dolor sit amet consectetur.</li>
              <li>• Lorem ipsum dolor sit amet consectetur.</li>
              <li>• Lorem ipsum dolor sit amet consectetur.</li>
              <li>• Lorem ipsum dolor sit amet consectetur.</li>
            </ul>
          </div>

          <button
            type="submit"
            className="btn rounded-pill mt-4 px-5"
            disabled={!yourName || !yourDob || !partnerName || !partnerDob}
            onClick={handleSubmit}
            style={{ maxWidth: 300, backgroundColor: "#00B8F8" }}
          >
            {isLoading ? 'Generating...' : 'Start Palm Reading'}
          </button>
        </>
      ) : (
        // 👇 Show Results
        renderResults()
      )}

      {/* Global Error Message */}
      {error && (
        <div className="alert alert-danger mt-3" style={{ maxWidth: 900 }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default RelationshipCompatibility;