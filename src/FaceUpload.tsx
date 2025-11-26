// FaceUploadPage.tsx
import React, { useState, useRef, useCallback } from 'react';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Stars from "./components/stars";

const FaceUploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [stars] = useState(() =>
    Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: 0.3 + Math.random() * 0.7,
      size: Math.random() * 2 + 1,
    }))
  );

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
    setSelectedFile(file);
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
    setSelectedFile(file);
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
    // Convert image to base64 for storage (to show later)
    const imageBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(selectedFile);
    });

    const userId = localStorage.getItem('user_id');

    if (!userId) {
      setError('User ID not found. Please log in again.');
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('image', selectedFile);

    const response = await fetch(
      'http://eros-eternal.runai-project-immerso-innnovation-venture-pvt.inferencing.shakticloud.ai/api/v1/face_reading/analyze',
      {
        method: 'POST',
        body: formData,
      }
    );

    // Try to parse backend error message even when response is not OK
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = data.message || `HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    if (data.success) {
      navigate('/face-report', {
        state: {
          ...data,
          uploadedImage: imageBase64,
        },
      });
    } else {
      setError(data.message || 'Failed to generate face reading.');
    }
  } catch (err: any) {
    console.error('Upload error:', err);
    // ✅ Show backend message if available
    setError(err.message || 'Something went wrong. Please try again.');
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="vw-100 vh-100 d-flex flex-column">
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

      {/* Header - Fixed at top */}
      <div className="d-flex justify-content-between align-items-center p-4">
        <button
          className="btn text-white"
          onClick={() => window.history.back()}
          style={{ fontSize: '1rem', zIndex: 2 }}
        >
          ← Back
        </button>
        {/* <button
          className="btn text-white"
          onClick={() => window.location.reload()}
          style={{ fontSize: '1.2rem' }}
        >
          ↻
        </button> */}
      </div>

      {/* Centered Content Container */}
      <div className="d-flex flex-column justify-content-center align-items-center px-4 mt-5 py-5">
        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="fw-bold text-white">Capture Your Face</h2>
          <p className="text-white" style={{ maxWidth: 600, margin: 'auto' }}>
            Discover insights into your energy, emotion, and spiritual wellness with our AI-powered face reading technology
          </p>
        </div>

        {/* Upload Card */}
        <div className="d-flex justify-content-center w-100">
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
                className="border rounded p-4 text-center"
                style={{
                  borderStyle: 'dashed',
                  borderColor: '#00B8F8',
                  cursor: 'pointer',
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
                  style={{ textDecoration: 'underline', cursor: 'pointer' }}
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
                      alt="Face Preview"
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
                <Button className='bg-white' onClick={handleCancel} disabled={isLoading}>
                  <i className="bi bi-x me-1 text-danger"></i>
                  <span className='text-dark'> Cancel </span>
                </Button>
                <Button
                  className={selectedFile ? "btn btn-info text-white" : "btn btn-secondary"}
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

export default FaceUploadPage;