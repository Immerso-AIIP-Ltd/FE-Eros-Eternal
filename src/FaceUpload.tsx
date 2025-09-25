// FaceUploadPage.tsx
import React, { useState, useRef, useCallback } from 'react';
import { Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

interface FileData {
  name: string;
  size: number;
  type: string;
}

const FaceUploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
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
    setSelectedFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });
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
    setSelectedFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });
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
      const formData = new FormData();
      formData.append("user_id", "7b274190-1893-44df-80aa-20708e94f693"); // Replace with real user ID if available
      formData.append("image", fileInputRef.current?.files?.[0] as File);

      const response = await fetch(
        'http://192.168.29.154:6001/api/v1/face_reading/analyze',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();

      if (result.success) {
        // Navigate to report page with data
        navigate('/face-report', { state: result });
      } else {
        setError(result.message || 'Failed to generate face reading.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="vh-100 vw-100 d-flex flex-column p-4" style={{ backgroundColor: '#000', backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.02) 75%, rgba(255,255,255,0.02) 25%), linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.02) 75%, rgba(255,255,255,0.02) 25%)', backgroundSize: '20px 20px' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button
          className="btn btn-link text-white"
          onClick={() => window.history.back()}
          style={{ fontSize: '1rem' }}
        >
          ← Back
        </button>
        <button
          className="btn btn-link text-white"
          onClick={() => window.location.reload()}
          style={{ fontSize: '1.2rem' }}
        >
          ↻
        </button>
      </div>

      {/* Title */}
      <div className="text-center mb-4">
        <h2 className="fw-bold text-white">Capture Your Face</h2>
        <p className="text-muted" style={{ maxWidth: 600, margin: 'auto' }}>
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
              <p className="mb-1">Drag and Drop files</p>
              <p className="mb-1">or</p>
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
              <span className="text-muted"> from your computer</span>
            </div>

            {/* Supported Formats */}
            <div className="mt-3 text-muted">
              <small>Supported format : JPG, JPEG, PNG</small>
            </div>

            {/* Selected File Info */}
            {selectedFile && (
              <div className="mt-3 p-2 bg-dark rounded">
                <p className="mb-1">
                  <strong>Selected:</strong> {selectedFile.name}
                </p>
                <p className="mb-0">
                  <small>{(selectedFile.size / 1024).toFixed(1)} KB</small>
                </p>
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

export default FaceUploadPage;