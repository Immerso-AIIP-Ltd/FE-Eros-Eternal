// src/pages/TarotFlow.tsx
import React, { useState, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import TarotCard from "./TarrotCard"; // your third screen
import "./Tarot.css";
import { BsArrowLeft } from "react-icons/bs";
import { PiArrowLeft } from "react-icons/pi";
import TarotCardSelector from "./components/Tarot/TarotCardSelector";
import Stars from "./components/stars";
import { Calendar } from 'lucide-react';

interface TarotReading {
  card_backcover: string;
  dob: string;
  mode: string;
  name: string;
  reading: TarotCard[];
}
const TarotFlow: React.FC = () => {
  const [step, setStep] = useState(1); // 1 = intro, 2 = form, 3 = tarot
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    dob: "",
  });
  const [cardData, setCardData] = useState<TarotReading | null>(null);
  const API_URL = "http://eros-eternal.runai-project-immerso-innnovation-venture-pvt.inferencing.shakticloud.ai";
  const userId = localStorage.getItem("user_id");

  const dateInputRef = useRef(null);

  const openDatePicker = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.gender || !formData.dob) {
      alert("Please fill all fields");
      return;
    }

    // Save to localStorage for TarotCard.tsx to read
    // localStorage.setItem("user_id", "demo-user-001"); // generate/set properly if you have user auth
    localStorage.setItem("username", formData.name);
    localStorage.setItem("date_of_birth", formData.dob);
    fetchTarot();
    setStep(3); // Go to tarot card screen
  };

  const fetchTarot = async () => {

    try {
      const formDataSet = new FormData();
      formDataSet.append("user_id", userId);
      formDataSet.append("user_name", formData.name);
      formDataSet.append("dob", formData.dob); // format: YYYY-MM-DD
      formDataSet.append("mode", "random");

      const response = await fetch(
        `${API_URL}/api/v1/numerology/tarot_reading`,
        {
          method: "POST",
          body: formDataSet, // don't set Content-Type, browser will set boundary
        }
      );

      const data = await response.json();
      console.log("Tarot result:", data?.data?.reading);
      setCardData(data?.data);
    } catch (error) {
      console.error("Error fetching tarot:", error);
    }
  };

  const stepChange = (step: number) => {

    setStep(step);
    setFormData({ name: "", gender: "", dob: "" });
  };

  return (
    <div className="tarot-container d-flex flex-column min-vh-100 min-vw-100 text-white">
      {/* <button
        type="button"
        className="absolute btn"
        style={{
          top: "2%",
          left: "2%",
          fontSize: "large",
          background: "none",
          width: "10%",
        }}
      >
        <i className="bi bi-star-fill"></i> Tarot Reading
      </button> */}

      {step === 1 && (
        <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-around text-center min-vh-100 min-vw-100 tarot-introt">
          {/* Tarot Cards */}
          <a
            href="/result"
            type="button"
            className="btn btn-primary absolute "
            style={{
              top: "2%",
              left: "2%",
              fontSize: "large",
              background: "none",
              width: "10%",
              border: "none",
            }}
          >
            <i className="bi bi-arrow-left m-3"></i> Tarot Reading
          </a>
          {/* Title */}
          <div className="d-flex h-50 flex-column align-items-center justify-content-center">
            <h1 className="fw-bold">Tarot Reading</h1>
            <p className="text-white fw-bold">Unlock the secrets of Life</p>
          </div>

          {/* Bottom */}
          <div className="text-center p-4">
            <h3 className="fw-bold">Unlock the Secrets of Your Life</h3>
            <p className="text-white mt-4">
              Discover insights into your personality, relationship, and future
              with our traot cards
            </p>
            <button
              className="btn btn-primary rounded-pill px-4 py-2 mt-4 w-full"
              style={{ backgroundColor: "#00B8F8" }}
              onClick={() => setStep(2)}
            >
              Start Tarot Reading
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div
          className="d-flex justify-content-center align-items-center flex-grow-1 w-100"
          style={{ backgroundColor: "#000" }}
        >
          <button
            type="button"
            className="btn btn-primary absolute "
            style={{
              top: "2%",
              left: "2%",
              fontSize: "large",
              background: "none",
              width: "10%",
              border: "none",
            }}
            onClick={() => setStep(1)}
          >
            <i className="bi bi-arrow-left m-3"></i> Back
          </button>
          <Stars />
          <div
            className="card p-4 text-white shadow-lg "
            style={{
              width: "600px",
              borderRadius: "15px",
              background: "#000", // dark background
              border: "1px solid #444",
            }}
          >
            <h3 className="fw-bold mb-4" style={{ fontSize: "xxx-large" }}>
              Enter Your Details
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Enter Your Name</label>
                <input
                  type="text"
                  className={`form-control tarot-input ${formData.name ? "has-value" : ""
                    }`}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Name"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Gender</label>
                <select
                  className={`form-select tarot-input ${formData.gender ? "has-value" : ""
                    }`}
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="male">♂ Male</option>
                  <option value="female">♀ Female</option>
                  <option value="other">⚧ Other</option>
                </select>
              </div>

              <div className="mb-3 position-relative">
                <label className="form-label">Date of Birth</label>
                <div className="input-group">
                  <input
                    type="date"
                    className={`form-control tarot-input ${formData.dob ? "has-value" : ""}`}
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    ref={dateInputRef}
                  />
                  <span className="input-group-text" onClick={openDatePicker} style={{ cursor: 'pointer' }}>
                    <Calendar size={20} />
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mt-4 p-2"
                style={{ backgroundColor: "#00B8F8" }}
              >
                Continue
              </button>
            </form>

            <p className="small text-center mt-3">
              By continuing, you agree to our{" "}
              <a href="#" className="text-info">
                terms of service
              </a>
              ,{" "}
              <a href="#" className="text-info">
                privacy policy
              </a>{" "}
              and{" "}
              <a href="#" className="text-info">
                cookie policy
              </a>
              .
            </p>
          </div>
        </div>
      )}

      {/* {step === 3 && <TarotCard />} */}
      {step === 3 && (
        <TarotCardSelector
          cardData={cardData}
          onStepChange={stepChange}
          onShuffle={fetchTarot}
        />
      )}
    </div>
  );
};

export default TarotFlow;
