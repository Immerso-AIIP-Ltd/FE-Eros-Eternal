// FaceUploadPage.tsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Card, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Stars from "./components/stars";

type PageState = "upload" | "preview" | "loading";

const FaceUploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stars] = useState(() =>
    Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: 0.3 + Math.random() * 0.7,
      size: Math.random() * 2 + 1,
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const [pageState, setPageState] = useState<PageState>("upload");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isApiCalling, setIsApiCalling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileName = file.name.toLowerCase();

    if (
      !fileName.endsWith(".jpg") &&
      !fileName.endsWith(".jpeg") &&
      !fileName.endsWith(".png")
    ) {
      setError("Only .JPG, .JPEG, and .PNG files are supported.");
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPageState("preview");
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileName = file.name.toLowerCase();

    if (
      !fileName.endsWith(".jpg") &&
      !fileName.endsWith(".jpeg") &&
      !fileName.endsWith(".png")
    ) {
      setError("Only .JPG, .JPEG, and .PNG files are supported.");
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPageState("preview");
  }, []);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setError(null);
    setPageState("upload");
    setUploadProgress(0);
    setIsApiCalling(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleStartFaceAnalysis = () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }

    setPageState("loading");
    setUploadProgress(0);
  };

  const handleContinue = async () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }

    setIsApiCalling(true);
    setError(null);

    try {
      // Convert image to base64
      const imageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(selectedFile);
      });

      const userId = localStorage.getItem("user_id");

      if (!userId) {
        setError("User ID not found. Please log in again.");
        setIsApiCalling(false);
        return;
      }

      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("image", selectedFile);

      const response = await fetch(
        "http://164.52.205.108:8500/api/v1/face_reading/analyze",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errMsg = data.message || `HTTP ${response.status}`;
        throw new Error(errMsg);
      }

      if (data.success) {
        navigate("/face-analyse", {
          state: {
            ...data,
            uploadedImage: imageBase64,
          },
        });
      } else {
        setError(data.message || "Failed to generate face reading.");
        setPageState("upload");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setPageState("upload");
    } finally {
      setIsApiCalling(false);
    }
  };

  // Progress simulation and API call
  useEffect(() => {
    if (pageState !== "loading") return;

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          handleContinue();
        }, 300);
        // Call API when progress reaches 100%
        // setTimeout(() => {
        //   callFaceAPI();
        // }, 300);
      }
      setUploadProgress(Math.min(progress, 100));
    }, 200);

    return () => clearInterval(interval);
  }, [pageState]);

  // const callFaceAPI = async () => {
  //   if (!selectedFile) return;

  //   setIsApiCalling(true);

  //   try {
  //     const userId = localStorage.getItem("user_id");
  //     const formData = new FormData();
  //     formData.append("user_id", userId || "");
  //     formData.append("image_data", selectedFile);

  //     const response = await fetch(
  //       "http://164.52.205.108:8500/api/v1/face_reading/analyze", // CHANGED TO FACE ENDPOINT
  //       {
  //         method: "POST",
  //         body: formData,
  //       },
  //     );

  //     const data = await response.json().catch(() => ({}));

  //     if (!response.ok) {
  //       const errMsg = data.message || `HTTP ${response.status}`;
  //       throw new Error(errMsg);
  //     }

  //     if (data.success) {
  //       navigate("/face-analyse", { state: data }); // CHANGED TO FACE REPORT ROUTE
  //     } else {
  //       setError(data.message || "Failed to generate face analysis.");
  //       setPageState("upload");
  //       setUploadProgress(0);
  //       setIsApiCalling(false);
  //     }
  //   } catch (err) {
  //     console.error("Upload error:", err.message);
  //     setError(err.message || "Failed to generate face analysis.");
  //     setPageState("upload");
  //     setUploadProgress(0);
  //     setIsApiCalling(false);
  //   }
  // };

  const getPageTitle = () => {
    switch (pageState) {
      case "upload":
        return "Upload Your Face";
      case "preview":
        return "Face Preview";
      case "loading":
        return "Analyzing Your Facial Features";
      default:
        return "Upload Your Face";
    }
  };

  const getPageSubtitle = () => {
    switch (pageState) {
      case "upload":
        return "Discover insights into your personality, emotions, and traits with our AI-powered face analysis technology";
      case "preview":
        return "Discover insights into your personality, emotions, and traits with our AI-powered face analysis technology";
      case "loading":
        return "Please wait while our AI generates your personalized analysis.";
      default:
        return "";
    }
  };

  return (
    <div
      className="viewport-container"
      style={{
        background:
          "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 40%, #FFFFFF 60%)",
        color: "#000",
      }}
    >
      {/* Header */}
      <div className="viewport-header px-4 py-3">
        <button
          className="btn"
          onClick={() => window.history.back()}
          style={{ fontSize: "1rem", zIndex: 2 }}
        >
          ← Back
        </button>
      </div>

      <div className="viewport-content">
        <div className="text-center px-4 mb-2">
          <h2 className="fw-bold fs-4">{getPageTitle()}</h2>
          <p
            className="text-muted"
            style={{ maxWidth: 500, margin: "auto", fontSize: "0.85rem" }}
          >
            {getPageSubtitle()}
          </p>
        </div>

        {/* UPLOAD STATE */}
        {pageState === "upload" && (
          <Card
            className="responsive-card shadow-sm"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #00B8F8",
            }}
          >
            <Card.Body>
              <h6 className="text-info text-center mb-3" style={{ fontSize: '0.9rem' }}>Upload file</h6>

              {/* Drag & Drop Area */}
              <div
                className="dynamic-area rounded"
                style={{
                  border: "2px dashed #00B8F8",
                  cursor: "pointer",
                  backgroundColor: "#00B8F80D",
                  padding: "20px",
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
              >
                <div className="mb-2">
                  <i
                    className="bi bi-upload text-info"
                    style={{ fontSize: "1.5rem" }}
                  ></i>
                </div>
                <p className="mb-1" style={{ fontSize: "0.95rem" }}>
                  Drag and Drop files
                </p>
                <p className="mb-1" style={{ fontSize: "0.95rem" }}>
                  or
                </p>
                <div>
                  <span
                    className="text-info fw-bold"
                    style={{
                      textDecoration: "none",
                      cursor: "pointer",
                      fontSize: "0.95rem",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBrowseClick();
                    }}
                  >
                    Browse file
                  </span>
                  <span className="" style={{ fontSize: "0.95rem" }}>
                    {" "}
                    from computer
                  </span>
                </div>
              </div>

              {/* Supported Formats */}
              <div className="mt-2 text-center">
                <small style={{ fontSize: "0.8rem" }}>
                  JPG, JPEG, PNG
                </small>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="danger" className="mt-2 py-1 px-2" style={{ fontSize: '0.8rem' }}>
                  {error}
                </Alert>
              )}

              {/* Buttons */}
              <div className="d-flex justify-content-end mt-auto gap-2 pt-3">
                <Button
                  variant=""
                  onClick={handleCancel}
                  style={{
                    borderColor: "#dc3545",
                    color: "#dc3545",
                    padding: "6px 16px",
                    fontSize: '0.9rem'
                  }}
                >
                  Cancel
                </Button>
                <Button
                  style={{
                    backgroundColor: "#00B8F8",
                    border: "none",
                    color: "#fff",
                    padding: "6px 16px",
                    fontSize: '0.9rem'
                  }}
                  disabled
                >
                  Start Face Analysis
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* PREVIEW STATE */}
        {pageState === "preview" && selectedFile && (
          <Card
            className="responsive-card shadow-sm"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #00B8F8",
            }}
          >
            <Card.Body>
              <h6 className="text-info text-center mb-3" style={{ fontSize: '0.9rem' }}>Face Preview</h6>

              {/* Image Preview Area */}
              <div
                className="dynamic-area rounded overflow-hidden"
                style={{
                  width: "100%",
                  backgroundColor: "#ffffff",
                  border: "1px solid #00B8F8",
                }}
              >
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Face Preview"
                  style={{
                    maxHeight: "100%",
                    maxWidth: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="danger" className="mt-2 py-1 px-2" style={{ fontSize: '0.8rem' }}>
                  {error}
                </Alert>
              )}

              {/* Buttons */}
              <div className="d-flex justify-content-end mt-auto gap-2 pt-3">
                <Button
                  variant=""
                  onClick={handleCancel}
                  style={{
                    borderColor: "#dc3545",
                    color: "#dc3545",
                    padding: "6px 16px",
                    fontSize: '0.9rem'
                  }}
                >
                  Cancel
                </Button>
                <Button
                  style={{
                    backgroundColor: "#00B8F8",
                    border: "none",
                    color: "#fff",
                    padding: "6px 16px",
                    fontSize: '0.9rem'
                  }}
                  onClick={handleStartFaceAnalysis}
                >
                  Start Analysis
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* LOADING STATE */}
        {pageState === "loading" && selectedFile && (
          <Card
            className="responsive-card shadow-sm"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #00B8F8",
            }}
          >
            <Card.Body>
              <h6 className="text-info text-center mb-3" style={{ fontSize: '0.9rem' }}>
                Analyzing Face
              </h6>

              {/* Loading Container */}
              <div
                className="dynamic-area rounded p-3"
                style={{
                  border: "2px dashed #00B8F8",
                  backgroundColor: "#ffffff",
                }}
              >
                <div className="w-100 text-center mb-2">
                  <p className="mb-1" style={{ fontSize: '0.9rem' }}>
                    <strong>{selectedFile.name}</strong>
                  </p>
                  <p className="mb-2" style={{ fontSize: "0.8rem" }}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>

                {/* Progress Bar */}
                <div
                  className="progress w-100"
                  style={{ height: "6px", backgroundColor: "#333" }}
                >
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                      width: `${uploadProgress}%`,
                      backgroundColor: "#00B8F8",
                      transition: "width 0.2s ease",
                    }}
                    aria-valuenow={uploadProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
                <p
                  className="text-end w-100 mt-1 mb-0"
                  style={{ fontSize: "0.8rem" }}
                >
                  {Math.round(uploadProgress)}%
                </p>
              </div>

              {/* Buttons */}
              <div className="d-flex justify-content-end mt-auto gap-2 pt-3">
                <Button
                  variant="outline-danger"
                  onClick={handleCancel}
                  disabled={uploadProgress === 100 || isApiCalling}
                  style={{
                    padding: "6px 16px",
                    fontSize: '0.9rem'
                  }}
                >
                  Cancel
                </Button>
                <Button
                  style={{
                    backgroundColor:
                      uploadProgress === 100 || isApiCalling
                        ? "#00B8F8"
                        : "#555",
                    border: "none",
                    color: "#fff",
                    padding: "6px 16px",
                    fontSize: '0.9rem'
                  }}
                  disabled
                >
                  {isApiCalling ? "Processing..." : "Continue"}
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <style>{`
        @media (max-width: 768px) {
          .card-container {
            margin-top: 20px !important;
          }
          .upload-card {
            border-radius: 12px !important;
          }
          .upload-card .card-body {
            padding: 20px !important;
          }
          .upload-card h6 {
            font-size: 1rem !important;
          }
          .upload-card i.bi-upload {
            font-size: 2.5rem !important;
          }
          .upload-card p {
            font-size: 0.95rem !important;
          }
          .upload-card span {
            font-size: 0.95rem !important;
          }
          .upload-card .btn {
            padding: 8px 16px !important;
            font-size: 0.9rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FaceUploadPage;
