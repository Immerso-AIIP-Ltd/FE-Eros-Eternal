// src/pages/TarotFlow.tsx
import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from 'react-router-dom';
import TarotCard from "../tarot/TarrotCard";
import "./harmony.css";
import "./HarmonyIndex.css";
import { BsArrowLeft } from "react-icons/bs";
import { PiArrowLeft } from "react-icons/pi";
import TarotCardSelector from "@/components/Tarot/TarotCardSelector";
import Stars from "@/components/ui/stars";
import Harmony from "@/assets/images/lightharmony.png";
import { baseApiUrl } from "@/config/api";

interface TarotReading {
  card_backcover: string;
  dob: string;
  mode: string;
  name: string;
  reading: TarotCard[];
}
const HarmonyIndex: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = intro, 2 = form, 3 = tarot
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    dob: "",
  });
  const [cardData, setCardData] = useState<TarotReading | null>(null);
  const userId = localStorage.getItem("user_id");

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
        `https://unrefrangible-eddy-magnanimously.ngrok-free.dev/aitools/wellness/v2/numerology/tarot_reading`,
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
    <div className="tarot-container d-flex flex-column min-vh-100 min-vw-100 text-white overflow-hidden">
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

      {/* {step === 1 && (
        <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-around text-center min-vh-100 min-vw-100 ">
         

           <img 
      src={Harmony}
      alt="Tarot" 
      style={{ 
        width:"100%",
        
      }} 
    />
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
            <i className="bi bi-arrow-left m-3"></i> Harmony Index
          </a>
        
          <div className="d-flex h-50 flex-column align-items-center justify-content-center">
          
          </div>

        
          <div className="text-center p-4">
            <h3 className="fw-bold">Unlock the Secrets of Relationship</h3>
            <p className="text-white mt-4">
              Discover insights into your personality, relationship, and future with our AI-powered
            </p>
            <button
              className="btn btn-primary rounded-pill px-4 py-2 mt-4 w-full"
              style={{ backgroundColor: "#00B8F8" }}
           onClick={() => navigate('/relation')}
            >
              Start Harmoney Index Reading
            </button>
          </div>
        </div>
      )} */}
      {/* {step === 1 && (
        <div className="d-flex flex-column min-vh-100 min-vw-100 position-relative overflow-hidden">
         
          <img
            src={Harmony}
            alt="Face Reading Background"
            className="position-absolute top-0 start-0 w-100  h-75 object-fit-cover"
          />

        
          <a
            href="/result"
            className="position-absolute top-0 start-0 btn btn-link text-white p-3"
            style={{ fontSize: '1.5rem', zIndex: 10, textDecoration: 'none' }}
          >
            <i className="bi bi-arrow-left mr-3"></i> Harmony Index
          </a>

        
          <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-end text-center text-white position-relative pb-5" style={{ zIndex: 5 }}>
            <h3 className="fw-semibold display-5 mb-3">Unlock the Secrets of Your Relationship</h3>
           <p className="text-white-50 mb-4 text-xl">
              Discover insights into your personality, relationship, and future with our AI-powered
            </p>
            <button
              className="btn btn-primary rounded-pill px-5 py-3 fs-5 w-25"
              style={{ backgroundColor: '#00B8F8', border: 'none' }}
              onClick={() => navigate('/relation')}
            >
              Continue
            </button>
          </div>
        </div>
      )} */}

      {step === 1 && (

        <div className="d-flex flex-column min-vh-100 min-vw-100 position-relative" style={{ backgroundColor: 'rgb(255, 255, 255)' }}>
          {/* Back button */}
          <div className="position-absolute top-0 start-0 w-100" style={{ zIndex: 10, padding: '15px 20px' }}>
            <button
              onClick={() => navigate("/result")}
              className="btn btn-link p-0 fw-medium"
              style={{
                fontSize: '1.2rem',
                textDecoration: 'none',
                color: 'black',
                background: 'none',
                border: 'none',
              }}
            >
              <i className="bi bi-arrow-left me-2"></i> Harmony Index
            </button>
          </div>

          {/* Harmony image section - flex-grow-1 and absolute positioning for responsive magic */}
          <div className="position-relative flex-grow-1" style={{ minHeight: '50vh', overflow: 'hidden' }}>
            <img
              src={Harmony}
              alt="Harmony Index Background"
              className="w-100 h-100 position-absolute"
              style={{ objectFit: 'cover', objectPosition: 'center', top: 0, left: 0 }}
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

          {/* Content section - automatically adjusts height based on its content naturally */}
          <div

            className="d-flex flex-column align-items-center justify-content-center flex-shrink-0 text-center px-4"
            style={{
              backgroundColor: 'rgb(255, 255, 255)',
              paddingTop: '0.5rem',
              paddingBottom: '2.5rem',
              zIndex: 5
            }}
          >

            <h3 className="fw-semibold mb-3 hero-title" style={{ fontSize: 'clamp(1.5rem, 4vw, 1.8rem)', color: '#000' }}>
              Unlock the Secrets of Your Relationship
            </h3>
            <p className="mb-4" style={{ color: '#6B7280', fontSize: '0.95rem', maxWidth: '600px', lineHeight: '1.5' }}>
              Discover insights into your personality, relationship, and future with our AI-powered
            </p>
            <button
              className="btn btn-primary rounded-pill px-5 py-3 shadow-sm"
              style={{
                backgroundColor: '#00B8F8',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                minWidth: '220px'
              }}
              onClick={() => navigate('/relation')}
            >
              Continue
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

              <div className="mb-3">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className={`form-control tarot-input ${formData.dob ? "has-value" : ""
                    }`}
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                />
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

export default HarmonyIndex;
