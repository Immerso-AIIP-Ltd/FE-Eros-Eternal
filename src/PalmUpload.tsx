// PalmUploadPage.tsx
import React, { useState, useRef, useCallback } from 'react';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Stars from "./components/stars";

const PalmUploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stars] = useState(() =>
    Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: 0.3 + Math.random() * 0.7,
      size: Math.random() * 2 + 1,
    }))
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith('.jpg') && !fileName.endsWith('.jpeg') && !fileName.endsWith('.png')) {
      setError('Only .JPG, .JPEG, and .PNG files are supported.');
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file); // 👈 Store the actual File
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

    if (!fileName.endsWith('.jpg') && !fileName.endsWith('.jpeg') && !fileName.endsWith('.png')) {
      setError('Only .JPG, .JPEG, and .PNG files are supported.');
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file); // 👈 Store the actual File
  }, []);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContinue = async () => {
  if (!selectedFile) {
    setError('Please select a file first.');
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    const userId = localStorage.getItem('user_id');
    const formData = new FormData();
    formData.append("user_id", userId || "");
    formData.append("image_data", selectedFile);

    const response = await fetch(
      'http://164.52.205.108:8500/api/v1/analysis/palm',
      {
        method: 'POST',
        body: formData,
      }
    );

    // Try to read JSON response even if status != 200
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Use backend message if available
      const errMsg = data.message || `HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    if (data.success) {
      navigate('/palm-report', { state: data });
    } else {
      setError(data.message || 'Failed to generate palm reading.');
    }

  } catch (err) {
    console.error('Upload error:', err.message);
    // Show server-provided message
    setError(err.message || 'Failed to generate palm reading.');
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="vh-100 vw-100 d-flex flex-column p-4" style={{ backgroundColor: '#000' }}>

      <Stars />
      <div className="absolute inset-0 overflow-hidden ">
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
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button
          className="btn text-white"
          onClick={() => window.history.back()}
          style={{ fontSize: '1rem', zIndex: 2 }}
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

      {/* Title */}
      <div className="text-center mb-4">
        <h2 className="fw-bold text-white">Capture Your Palm</h2>
        <p className="text-white" style={{ maxWidth: 600, margin: 'auto' }}>
          Discover insights into your personality, relationship, and future with our AI-powered palm reading technology
        </p>
      </div>

      {/* Upload Card */}
      <div className="d-flex align-items-center justify-content-center w-100">
        <Card
          className="p-4"
          style={{
            width: '100%',
            maxWidth: '600px',
            backgroundColor: '#121212',
            border: '1px solid #333',
            borderRadius: '12px',
          }}
        >
          <Card.Body>
            <h6 className="text-info text-center mb-3">Upload file</h6>

            {/* Drag & Drop Area */}
            <div
              className="rounded p-4 text-center"
              style={{
                borderColor: '#00B8F8',
                cursor: 'pointer',
                border: '1px dashed #00B8F8'
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
            >
              <div className="mb-3">
                <i className="bi bi-upload fs-2 text-info"></i>
              </div>
              <p className="mb-1 text-white">Drag and Drop files</p>
              <p className="mb-1 text-white">or</p>
              <span
                className="text-info fw-bold"
                style={{ textDecoration: 'none', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrowseClick();
                }}
              >
                Browse file
              </span>
              <span className="text-white"> from your computer</span>
            </div>

            {/* Supported Formats */}
            <div className="mt-3 text-white">
              <small>Supported format : JPG, JPEG, PNG</small>
            </div>

            {/* Image Preview + Delete Button */}
            {selectedFile && (
              <div className="mt-3 position-relative">
                <div
                  className="rounded overflow-hidden"
                  style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: '#222',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Palm Preview"
                    style={{
                      maxHeight: '100%',
                      maxWidth: '100%',
                      objectFit: 'contain',
                    }}
                  />
                  {/* Delete Button */}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel();
                    }}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      borderRadius: '50%',
                      minWidth: '24px',
                      minHeight: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* File Info */}
                <div className="mt-2 p-2 bg-dark rounded">
                  <p className="mb-1">
                    <strong>Selected:</strong> {selectedFile.name}
                  </p>
                  <p className="mb-0">
                    <small>{(selectedFile.size / 1024).toFixed(1)} KB</small>
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="danger" className="mt-3">
                {error}
              </Alert>
            )}

            {/* Buttons */}
            <div className="d-flex justify-content-end mt-4 gap-2">
              <Button variant="outline-light" onClick={handleCancel} disabled={isLoading}>
                <i className="bi bi-x me-1"></i> Cancel
              </Button>
              <Button
                variant="secondary"
                disabled={!selectedFile || isLoading}
                onClick={handleContinue}
              >
                {isLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Uploading...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default PalmUploadPage;