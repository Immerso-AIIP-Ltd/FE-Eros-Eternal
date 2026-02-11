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
import { useNavigate } from "react-router-dom";
// import Tarrot from "../src/images/final-tarrot.png"
import Tarrot from "../src/images/lighttarrot.png"

interface TarotReading {
  card_backcover: string;
  dob: string;
  mode: string;
  name: string;
  reading: TarotCard[];
}
const TarotFlow: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = intro, 2 = form, 3 = tarot
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    dob: "",
  });
  const [cardData, setCardData] = useState<TarotReading | null>(null);
  const API_URL = "http://164.52.205.108:8500";
  // const API_URL = "http://192.168.18.5:7001";
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

    <div className="tarot-container d-flex flex-column min-vh-100 min-vw-100" style={{ backgroundColor: "rgb(255, 255, 255)" }}>

      {step === 1 && (
        <div className="d-flex flex-column min-vh-100 min-vw-100 position-relative overflow-hidden" style={{ backgroundColor: 'rgb(255, 255, 255)' }}>
          {/* Back button */}
          <button
            onClick={() => navigate("/result")}
            className="position-absolute top-0 start-0 btn btn-link"
            style={{ 
              fontSize: '1.2rem', 
              zIndex: 10, 
              textDecoration: 'none', 
              // color: '#000',
              color: 'black',
              background: 'none',
              border: 'none',
              backgroundColor: 'white',
              width: '100%',
              textAlign: 'left',
              height: '7%',
              padding: '0 3%',
            }}
          >
            <i className="bi bi-arrow-left me-2"></i> Tarot Reading
          </button>

          {/* Tarot card image section - top 75% */}
          <div className="position-relative" style={{ height: '75vh', overflow: 'hidden' }}>
            <img
              src={Tarrot}
              alt="Tarot Cards"
              className="w-100 h-100"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
            {/* Gradient overlay at bottom of image */}
            <div 
              className="position-absolute bottom-0 w-100" 
              style={{ 
                height: '150px', 
                background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1))' 
              }}
            ></div>
          </div>

          {/* Content section - bottom 25% */}
          <div 
            className="d-flex flex-column align-items-center justify-content-center text-center px-4" 
            style={{ 
              backgroundColor: 'rgb(255, 255, 255)', 
              height: '25vh',
              paddingTop: '1rem',
              paddingBottom: '2rem'
            }}
          >
            <h3 className="fw-semibold mb-3" style={{ fontSize: '1.8rem', color: '#000' }}>
              Unlock the Secrets of Your life
            </h3>
            <p className="mb-4" style={{ color: '#6B7280', fontSize: '0.9rem', maxWidth: '600px' }}>
              Discover insights into your personality, relationship, and future with our tarot cards
            </p>
            <button
              className="btn btn-primary rounded-pill px-5 py-3"
              style={{ 
                backgroundColor: '#00B8F8', 
                border: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                minWidth: '22%'
              }}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div
          className="d-flex justify-content-center align-items-center flex-grow-1 w-100"
          style={{ 
            background: "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 40%, #FFFFFF 60%)",
            minHeight: "100vh"
          }}
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
              color: "#000"
            }}
            onClick={() => navigate("/result")}
          >
            <i className="bi bi-arrow-left m-3"></i> Back
          </button>
          <div
            className="card p-4 shadow-lg "
            style={{
              width: "600px",
              borderRadius: "15px",
              background: "#FFFFFF",
              border: "none",
            }}
          >
            <h3 className="fw-bold mb-4" style={{ fontSize: "xxx-large", color: "#000" }}>
              Enter Your Details
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label" style={{ color: "#000" }}>Enter Your Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Name"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    padding: "12px",
                    color: "#000"
                  }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ color: "#000" }}>Gender</label>
                <select
                  className="form-select"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    padding: "12px",
                    color: formData.gender ? "#000" : "#9CA3AF"
                  }}
                >
                  <option value="">♂</option>
                  <option value="male">♂ Male</option>
                  <option value="female">♀ Female</option>
                  <option value="other">⚧ Other</option>
                </select>
              </div>

              <div className="mb-3 position-relative">
                <label className="form-label" style={{ color: "#000" }}>Date of birth</label>
                <div className="input-group">
                  <input
                    type="date"
                    className="form-control"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    ref={dateInputRef}
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #D1D5DB",
                      borderRadius: "8px",
                      padding: "12px",
                      color: "#000"
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mt-4 p-3"
                style={{ 
                  backgroundColor: "#7DD3FC", 
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "500",
                  color: "#FFFFFF"
                }}
              >
                Start Your Tarot Reading
              </button>
            </form>

            {/* <p className="small text-center mt-3">
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
            </p> */}
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