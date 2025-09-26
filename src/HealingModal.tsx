// src/ErosChatUI.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Button, Form } from "react-bootstrap";
import starone from "./star1.png";
import startwo from "./star2.png";
import starthree from "./star3.png";
import starfour from "./star4.png";
import sparkle from "./sparkle.png";
import Stars from "./components/stars";
import VoiceMessage from "./VoiceMessage";
import MicVisualizer from "./MicVisualizer";

interface Message {
  sender: "user" | "ai";
  text?: string;
  imageList?: string[];
  audio?: string; // blob URL for display
  audioBlob?: Blob; // actual blob for API upload
  duration?: number;
}

const HealingModal: React.FC = () => {
  const navigate = useNavigate();
  const [activeModel, setActiveModel] = useState<"gpt1" | "gpt2pro">("gpt1");
  const [inputValue, setInputValue] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  interface Message {
    sender: "user" | "ai";
    text?: string;
    imageList?: string[];
    audio?: string; // blob URL for audio messages
  }

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "⭐Welcome to Eternal AI!⭐\n\nTo begin your personalized healing journey, please upload a clear photo of your face.",
    },
  ]);

  let animationId: number;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [accumulatedData, setAccumulatedData] = useState<any>({});
  const [questionFlow, setQuestionFlow] = useState<
    "challenges" | "spiritual" | "breakthroughs" | "complete" | null
  >(null);
  const [userResponses, setUserResponses] = useState({
    current_challenges: [] as string[],
    spiritual_goals: [] as string[],
    recent_breakthroughs: [] as string[],
  });

//   const baseApiUrl = import.meta.env.VITE_API_BASE_URL;
const baseApiUrl = "http://192.168.29.154:8002";
console.log("baseApiUrl", baseApiUrl);
  const convertToMp3 = async (audioBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const fileReader = new FileReader();

      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // Create a simple WAV file (since MP3 encoding requires external library)
          // For actual MP3, you'd need a library like lamejs
          const wavBlob = audioBufferToWav(audioBuffer);
          resolve(wavBlob);
        } catch (error) {
          console.error("Audio conversion error:", error);
          // If conversion fails, return original blob
          resolve(audioBlob);
        }
      };

      fileReader.onerror = () => {
        console.error("FileReader error");
        resolve(audioBlob); // Fallback to original
      };

      fileReader.readAsArrayBuffer(audioBlob);
    });
  };

  // Helper function to convert AudioBuffer to WAV blob
  const audioBufferToWav = (audioBuffer: AudioBuffer): Blob => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioBuffer.length * blockAlign;
    const bufferSize = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);

    // Convert audio data
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(
          -1,
          Math.min(1, audioBuffer.getChannelData(channel)[i])
        );
        view.setInt16(offset, sample * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
  };

  useEffect(() => {
    const id = localStorage.getItem("user_id");
    setUserId(id);
  }, []);

  const getTimezoneOffset = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset <= 0 ? "+" : "-";
    return `${sign}${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && attachedImages.length === 0) return;

    // Create user message
    const userMsg = {
      sender: "user" as const,
      text: inputValue || "",
      imageList: attachedImages.length > 0 ? [...attachedImages] : [],
    };

    // Add user message to chat immediately
    setMessages((prev) => [...prev, userMsg]);

    // Handle questionnaire flow
    if (questionFlow) {
      await handleQuestionnaireFlow(inputValue);
    } else {
      // Handle regular message flow (image upload, etc.)
      if (attachedImages.length > 0) {
        await handleImageUpload();
      }
    }

    // Clear inputs
    setInputValue("");
    setAttachedImages([]);
    setAttachedFiles([]);

    // Reset textarea height
    const textarea = document.querySelector<HTMLTextAreaElement>(
      "#chat-input-textarea"
    );
    if (textarea) {
      textarea.style.height = "40px";
    }
  };

  const handleQuestionnaireFlow = async (userInput: string) => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput) return;

    switch (questionFlow) {
      case "challenges":
        // Add to current challenges (append to existing if any)
        const newChallenges = [...userResponses.current_challenges];
        if (!newChallenges.includes(trimmedInput)) {
          newChallenges.push(trimmedInput);
        }

        setUserResponses((prev) => ({
          ...prev,
          current_challenges: newChallenges,
        }));

        // Move to next question
        setQuestionFlow("spiritual");
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "Thank you for sharing that. What are your spiritual goals or aspirations? (e.g., more meditation, deeper self-awareness, inner peace)",
          },
        ]);
        break;

      case "spiritual":
        // Add to spiritual goals
        const newSpiritual = [...userResponses.spiritual_goals];
        if (!newSpiritual.includes(trimmedInput)) {
          newSpiritual.push(trimmedInput);
        }

        setUserResponses((prev) => ({
          ...prev,
          spiritual_goals: newSpiritual,
        }));

        // Move to next question
        setQuestionFlow("breakthroughs");
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "What recent breakthroughs or positive changes have you experienced? (e.g., started daily practice, improved sleep, better relationships)",
          },
        ]);
        break;

      case "breakthroughs":
        // Add to recent breakthroughs
        const newBreakthroughs = [...userResponses.recent_breakthroughs];
        if (!newBreakthroughs.includes(trimmedInput)) {
          newBreakthroughs.push(trimmedInput);
        }

        setUserResponses((prev) => ({
          ...prev,
          recent_breakthroughs: newBreakthroughs,
        }));

        // Complete the questionnaire
        setQuestionFlow("complete");
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "Thank you for providing all the information. Generating your personalized healing prescription now...",
          },
        ]);

        // Generate final prescription
        await generateFinalPrescription();
        break;
    }
  };

  const generateFinalPrescription = async () => {
    try {
      // Structure the payload exactly as required by the API
      const finalPayload = {
        face_result_json: {
          success: true,
          message: "Face analysis completed successfully",
          data: accumulatedData.face_data || {},
        },
        astrology_result_json: {
          success: true,
          message: "Astrology data fetched successfully.",
          data: accumulatedData.astrology_data || {},
        },
        voice_result_json: {
          success: true,
          message: "Voice analysis completed and saved successfully",
          data: accumulatedData.voice_data || {},
        },
        user_context: {
          current_challenges: userResponses.current_challenges,
          spiritual_goals: userResponses.spiritual_goals,
          recent_breakthroughs: userResponses.recent_breakthroughs,
        },
      };

      console.log("Final prescription payload:", finalPayload);

      const healingUrl = `${baseApiUrl}/api/v1/healing/generate_healing_prescription`;
      const response = await fetch(healingUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalPayload),
      });

      const healingData = await response.json();

      if (healingData.success) {
        // Reset questionnaire flow
        setQuestionFlow(null);
        setUserResponses({
          current_challenges: [],
          spiritual_goals: [],
          recent_breakthroughs: [],
        });

        // Display the prescription
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text:
              healingData.message ||
              "Your personalized healing prescription has been generated successfully!",
          },
        ]);

        // Display formatted prescription if available
        if (healingData.data && healingData.data.prescription) {
          const prescription = healingData.data.prescription;
          const formattedPrescription = formatPrescription(prescription);

          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: formattedPrescription,
            },
          ]);
        }

        // Show go back button after prescription
        setShowGoBack(true);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text:
              healingData.message ||
              "Failed to generate prescription. Please try again.",
          },
        ]);
      }
    } catch (error) {
      console.error("Final prescription API error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Error occurred while generating your prescription. Please try again.",
        },
      ]);
    }
  };

  const formatPrescription = (prescription: string): string => {
    // The prescription appears to be a long formatted string
    // You can enhance this formatting as needed
    return `🌟 Your Personalized Healing Prescription 🌟\n\n${prescription}`;
  };
  // Fixed handleImageUpload function and file input handler

  // Replace your existing handleImageUpload function with this:
  const handleImageUpload = async () => {
    if (attachedImages.length === 0 || attachedFiles.length === 0) return;

    try {
      const formData = new FormData();
      formData.append("image_data", attachedFiles[0], "image.png");
      formData.append("user_id", userId || "123");

      const faceUrl = `${baseApiUrl}/api/v1/analysis/face`;
      const faceResponse = await fetch(faceUrl, {
        method: "POST",
        body: formData,
      });
      const faceData = await faceResponse.json();

      if (faceData.success && faceData.data) {
        // Store face data properly
        setAccumulatedData((prev) => ({
          ...prev,
          face_data: faceData.data,
        }));

        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: faceData.message },
        ]);
        await handleAstrologyAPI();
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: "Face analysis failed. Please try again." },
        ]);
      }
    } catch (error) {
      console.error("Face API error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Error occurred during face analysis." },
      ]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const imageUrl = URL.createObjectURL(file);

    // Add to attached images and files
    setAttachedImages((prev) => [...prev, imageUrl]);
    setAttachedFiles((prev) => [...prev, file]);
  };

  const handleAstrologyAPI = async () => {
    try {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Getting astrology data..." },
      ]);

      const astrologyData = {
        location: localStorage.getItem("location") || "Chennai, India",
        dob: localStorage.getItem("dob") || "07/04/2002",
        tob: localStorage.getItem("tob") || "01:55",
        timezone: getTimezoneOffset(),
      };

      const astrologyUrl = `${baseApiUrl}/api/v1/vedastro/get_astrology_data`;
      const response = await fetch(astrologyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(astrologyData),
      });

      const astrologyResult = await response.json();

      if (astrologyResult.success && astrologyResult.data) {
        // Store astrology data properly
        setAccumulatedData((prev) => ({
          ...prev,
          astrology_data: astrologyResult.data,
        }));

        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "Great! Now please upload a voice message to continue the analysis.",
          },
        ]);
      }
    } catch (error) {
      console.error("Astrology API error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Error occurred during astrology analysis." },
      ]);
    }
  };

  const [showGoBack, setShowGoBack] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
        const audioUrl = URL.createObjectURL(audioBlob);

        console.log(
          "Original audio blob:",
          audioBlob.size,
          "bytes, type:",
          audioBlob.type
        );

        try {
          // Convert to WAV/MP3 format
          console.log("Converting audio to WAV format...");
          const convertedBlob = await convertToMp3(audioBlob);
          console.log(
            "Converted audio blob:",
            convertedBlob.size,
            "bytes, type:",
            convertedBlob.type
          );

          // Store audio message in chat with original URL for playback
          setMessages((prev) => [
            ...prev,
            {
              sender: "user",
              audio: audioUrl, // Keep original for playback
              audioBlob: convertedBlob, // Use converted for API
              duration: recordingTime,
            },
          ]);

          // Send converted audio to API
          await handleVoiceAnalysis(convertedBlob, audioUrl);
        } catch (conversionError) {
          console.error(
            "Audio conversion failed, using original:",
            conversionError
          );

          // Fallback to original audio
          setMessages((prev) => [
            ...prev,
            {
              sender: "user",
              audio: audioUrl,
              audioBlob: audioBlob,
              duration: recordingTime,
            },
          ]);

          await handleVoiceAnalysis(audioBlob, audioUrl);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Could not access microphone. Please check permissions and try again.",
        },
      ]);
    }
  };
  const handleVoiceAnalysis = async (audioBlob: Blob, audioUrl: string) => {
    try {
      console.log("=== Voice Analysis Debug Info ===");
      console.log("Audio URL:", audioUrl);
      console.log("Audio blob size:", audioBlob.size, "bytes");
      console.log("Audio blob type:", audioBlob.type);
      console.log("Recording duration:", recordingTime, "seconds");

      const formData = new FormData();
      const fileExtension = audioBlob.type.includes("wav")
        ? ".wav"
        : audioBlob.type.includes("mp3")
        ? ".mp3"
        : ".webm";
      const fileName = `voice_recording${fileExtension}`;

      formData.append("audio_data", audioBlob, fileName);
      formData.append("user_id", userId || "123");

      console.log("Sending converted audio file:", fileName);
      console.log("File size:", audioBlob.size, "bytes");

      const voiceUrl = `${baseApiUrl}/api/v1/analysis/voice`;
      const response = await fetch(voiceUrl, {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);
      const voiceData = await response.json();
      console.log("Voice API response:", voiceData);

      if (voiceData.success && voiceData.data) {
        // Store voice data properly
        setAccumulatedData((prev) => ({
          ...prev,
          voice_data: voiceData.data,
        }));

        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: voiceData.message },
        ]);

        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "Perfect! Now I need to ask you a few questions to complete your healing prescription.",
          },
        ]);

        // Start the questionnaire flow
        await generateHealingPrescription();
      } else {
        console.error("Voice analysis failed:", voiceData);
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text:
              voiceData.message ||
              "Voice analysis failed. Please try a longer recording with clear speech.",
          },
        ]);
      }
    } catch (error) {
      console.error("Voice API error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Network error during voice analysis. Please try again.",
        },
      ]);
    }
  };

  const debugAccumulatedData = () => {
    console.log("Current accumulated data structure:", {
      face_data: accumulatedData.face_data || "Not yet collected",
      astrology_data: accumulatedData.astrology_data || "Not yet collected",
      voice_data: accumulatedData.voice_data || "Not yet collected",
    });
  };

  const handleVoiceAnalysisFormData = async (audioUrl: string) => {
    try {
      console.log("Sending audio URL:", audioUrl);

      const formData = new FormData();
      formData.append("audio_url", audioUrl); // Send URL as string
      formData.append("user_id", userId || "123");

      const voiceUrl = `${baseApiUrl}/api/v1/analysis/voice`;
      const response = await fetch(voiceUrl, {
        method: "POST",
        body: formData,
      });

      const voiceData = await response.json();
      console.log("Voice API response:", voiceData);

      if (voiceData.success && voiceData.data) {
        setAccumulatedData((prev) => ({ ...prev, ...voiceData.data }));
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: voiceData.message },
        ]);

        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "Generating your personalized healing prescription...",
          },
        ]);

        await generateHealingPrescription();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text:
              voiceData.message || "Voice analysis failed. Please try again.",
          },
        ]);
      }
    } catch (error) {
      console.error("Voice API error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Error occurred during voice analysis." },
      ]);
    }
  };
  const generateHealingPrescription = async () => {
    try {
      // Start the questionnaire flow
      setQuestionFlow("challenges");
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "To create your personalized healing prescription, I need to understand you better. What are your current challenges? (e.g., work stress, relationship issues, health concerns)",
        },
      ]);
    } catch (error) {
      console.error("Error starting prescription flow:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Error occurred while starting the prescription process.",
        },
      ]);
    }
  };

  useEffect(() => {
    console.log("messages:", messages);
  }, [messages]);

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
      }
    }
    cancelAnimationFrame(animationId);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const [stars] = useState(() =>
    Array.from({ length: 12 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: 0.3 + Math.random() * 0.5,
    }))
  );

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setShowCamera(true);
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        const userMsg = {
          sender: "user",
          text: inputValue || "",
          imageList: [imageUrl],
        };
        setMessages((prev) => [...prev, userMsg]);

        if (nextApiUrl && nextApiUrl.endsWith("/face")) {
          const formData = new FormData();
          formData.append("image_data", blob, "face.png");
          await sendFormData(formData);
        }

        setInputValue("");
      }
    }, "image/png");

    setShowCamera(false);

    // Stop stream
    const stream = video.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((t) => t.stop());
    }
    setShowCamera(false);
  };

  const cancelRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
    }
    cancelAnimationFrame(animationId);
    setIsRecording(false);
  };

  const handleSuggestionClick = (question: string) => {
  
    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text: question }]);

    // Call same sendMessage logic or API trigger
    // sendMessage(question);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const audioUrl = URL.createObjectURL(file);

    // Add message with audio preview
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        audio: audioUrl,
        audioBlob: file,
        duration: 0, // no duration for uploads
      },
    ]);

    // Call same API as mic recording
    await handleVoiceAnalysis(file, audioUrl);
  };

  return (
    <div className="d-flex w-100 h-100 min-vh-100 min-vw-100 bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <Stars />

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column position-relative">
        <div className="position-relative z-10 d-flex justify-content-between align-items-center p-4">
          <div className="d-flex align-items-center">
            {/* Go Back Button */}
            <button
              type="button"
              className="btn btn-info rounded-pill me-3"
              onClick={() => navigate(-1)} // goes back one step in history
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.9rem",
                fontWeight: 500,
                borderColor: "#00A2FF",
                color: "#fbfcfdff",
              }}
            >
              <i className="bi bi-arrow-left"></i>
              Go Back
            </button>

            {/* Title */}
            <h2 className="h4 fw-bold mb-0" style={{ color: "#00A2FF" }}>
              Eternal AI
            </h2>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center position-relative z-10 px-3">
          {/* Only show if input is empty */}
          {inputValue === "" && messages.length === 0 && (
            <>
              <div className="text-center mb-5">
                <div className="d-flex flex-column align-items-center mb-3">
                  {/* Main Sparkle Logo */}
                  <img
                    src={sparkle}
                    alt="Sparkle Logo"
                    style={{
                      width: "48px",
                      height: "48px",
                      objectFit: "cover",
                      filter: "drop-shadow(0 0 8px rgba(0, 184, 248, 0.5))",
                    }}
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    style={{
                      position: "absolute",
                      top: "-12px",
                      right: "12px",
                      filter: "drop-shadow(0 0 4px rgba(100, 255, 100, 0.6))",
                    }}
                  >
                    <polygon
                      points="12,2 16,8 12,14 8,8"
                      fill="#00ff00"
                      opacity="0.8"
                    />
                  </svg>
                </div>
                <h3 className="h5 fw-semibold">Your Daily AI Assistant</h3>
              </div>

              {/* Feature Cards - Responsive Grid */}
              <Row
                className="g-3 mb-5 w-100 justify-content-center h-45"
                style={{ maxWidth: "1200px" }}
              >
                {[
                  { icon: starone, label: "Eternal Echo", color: "yellow" },
                  { icon: startwo, label: "Aether Chat", color: "red" },
                  { icon: starthree, label: "Nexus Eternal", color: "blue" },
                  { icon: starfour, label: "Timeless Words", color: "green" },
                ].map((card, idx) => (
                  <Col
                    key={idx}
                    xs={12}
                    sm={6}
                    md={3}
                    style={{ height: "200px" }}
                  >
                    <div
                      className="bg-dark bg-opacity-75 text-white p-3 rounded-4 d-flex flex-column align-items-center justify-content-center h-100"
                      style={{
                        width: "100%",
                        height: "100px",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        border: "none",
                      }}
                      onClick={() => console.log(`${card.label} clicked!`)}
                    >
                      {/* Icon with Color */}
                      <div className="d-flex flex-column align-items-center">
                        <img
                          src={card.icon}
                          alt={card.label}
                          style={{
                            width: "24px",
                            height: "24px",
                            marginBottom: "6px",
                          }}
                        />
                        <p
                          className="text-secondary small m-0"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {card.label}
                        </p>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </>
          )}
        </div>

        {messages.length > 0 && (
          <div
            className="flex-grow-1 container d-flex flex-column px-3 mb-3 overflow-auto"
            style={{ maxHeight: "100%" }} // Optional: Ensures overflow works as expected
          >
            {messages.map((msg, i) => {
              const isUser = msg.sender === "user";
              const isSuggestion = Boolean(msg.isSuggestion); // Safeguard against undefined

              return (
                <div
                  key={i}
                  className={`d-flex mb-2 ${
                    isUser ? "justify-content-end" : "justify-content-start"
                  }`}
                >
                  <div
                    className="px-3 py-2 rounded-3"
                    style={{
                      maxWidth: "70%",
                      whiteSpace: "pre-wrap",
                      background: isUser
                        ? "#00b8f8"
                        : isSuggestion
                        ? "#e9ecef"
                        : "#6c757d",
                      color: isUser
                        ? "white"
                        : isSuggestion
                        ? "black"
                        : "white",
                      cursor: isSuggestion ? "pointer" : "default",
                      userSelect: "none",
                    }}
                    onClick={() => {
                      if (isSuggestion && msg.text) {
                        console.log("Suggestion clicked:", msg.text);
                        handleSuggestionClick(msg.text);
                      }
                    }}
                  >
                    {/* Render images if present */}
                    {msg.imageList && msg.imageList.length > 0 && (
                      <div
                        className="d-flex flex-wrap gap-2 mb-2"
                        style={{ maxWidth: "100%" }}
                      >
                        {msg.imageList.map((img, j) => (
                          <img
                            key={j}
                            src={img}
                            alt="attachment"
                            className="rounded"
                            style={{
                              width: "120px",
                              height: "120px",
                              objectFit: "cover",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(img);
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Render text if present */}
                    {msg.text && <div>{msg.text}</div>}

                    {/* Render audio if present */}
                    {msg.audio && (
                      <VoiceMessage
                        url={msg.audio}
                        duration={msg.duration ?? 0}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showGoBack && (
          <div className="d-flex justify-content-center mt-3">
            <Button variant="secondary" onClick={() => navigate("/result")}>
              Go Back
            </Button>
          </div>
        )}

        {/* Chat Input */}
        <div className="position-relative z-10 p-3">
          <div className="d-flex justify-content-center w-100">
            <div
              className="bg-dark bg-opacity-75 rounded-4 p-2 shadow-sm"
              style={{ width: "100%", maxWidth: "1000px" }}
            >
              {attachedImages.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {attachedImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="position-relative"
                      style={{ width: "80px", height: "80px" }}
                    >
                      <img
                        src={img}
                        alt="preview"
                        className="rounded"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <Button
                        variant="light"
                        size="sm"
                        className="position-absolute top-0 end-0 rounded-circle p-0"
                        style={{
                          width: "20px",
                          height: "20px",
                          lineHeight: "1",
                        }}
                        onClick={() =>
                          setAttachedImages((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="d-flex align-items-end w-100">
                {!isRecording ? (
                  <>
                    <Form.Control
                      id="chat-input-textarea"
                      as="textarea"
                      rows={1}
                      placeholder="Enter a prompt here"
                      className="bg-transparent text-white border-0 shadow-none flex-grow-1"
                      style={{
                        resize: "none",
                        overflow: "hidden",
                        minHeight: "40px",
                        maxHeight: "150px",
                      }}
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        e.currentTarget.style.height = "40px";
                        e.currentTarget.style.height =
                          e.currentTarget.scrollHeight + "px";
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        (e.preventDefault(), sendMessage())
                      }
                    />
                    <div className="d-flex align-items-center ms-2">
                      <Button
                        as="label"
                        variant="link"
                        className="border-0 p-2"
                        style={{
                          color: "#ccc",
                          fontSize: "1.2rem",
                          cursor: "pointer",
                        }}
                      >
                        <i className="bi bi-image"></i>
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          multiple
                          onChange={handleFileSelect}
                        />
                      </Button>
                      <Button
                        variant="link"
                        className="border-0 p-2"
                        style={{ color: "#ccc", fontSize: "1.2rem" }}
                        onClick={openCamera}
                      >
                        <i className="bi bi-camera"></i>
                      </Button>
                      {/* <Button
                        variant="link"
                        className="border-0 p-2"
                        style={{ color: "#ccc", fontSize: "1.2rem" }}
                        onClick={startRecording}
                      >
                        <i className="bi bi-mic"></i>
                      </Button> */}
                      <Button
                        as="label"
                        variant="link"
                        className="border-0 p-2"
                        style={{
                          color: "#ccc",
                          fontSize: "1.2rem",
                          cursor: "pointer",
                        }}
                      >
                        <i className="bi bi-music-note"></i>
                        <input
                          type="file"
                          accept=".mp3,.wav"
                          hidden
                          onChange={handleAudioUpload}
                        />
                      </Button>

                      <Button
                        variant="info"
                        className="rounded-pill px-3 py-2 ms-2"
                        style={{
                          backgroundColor: "#00b8f8",
                          borderColor: "#00b8f8",
                          color: "white",
                          fontSize: "1.1rem",
                          fontWeight: "600",
                          minWidth: "40px",
                          height: "40px",
                        }}
                        onClick={sendMessage}
                        disabled={
                          !inputValue.trim() && attachedImages.length === 0
                        }
                      >
                        <i className="bi bi-send"></i>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="d-flex align-items-center bg-dark rounded-3 px-3 py-2 flex-grow-1">
                    <MicVisualizer stream={micStream} height={40} />
                    <span className="ms-3 text-danger fw-bold">
                      {formatTime(recordingTime)}
                    </span>
                    <Button
                      variant="success"
                      className="ms-3 rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: 36, height: 36 }}
                      onClick={stopRecording}
                    >
                      <i className="bi bi-check-lg"></i>
                    </Button>
                    <Button
                      variant="danger"
                      className="ms-2 rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: 36, height: 36 }}
                      onClick={cancelRecording}
                    >
                      <i className="bi bi-x-lg"></i>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {previewImage && (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content bg-transparent border-0 shadow-none">
                <div className="modal-body text-center p-0">
                  <img
                    src={previewImage}
                    alt="preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "80vh",
                      borderRadius: "8px",
                    }}
                  />
                </div>
                <div className="modal-footer border-0 d-flex justify-content-center">
                  <Button variant="light" onClick={() => setPreviewImage(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCamera && (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            style={{ background: "rgba(0,0,0,0.8)" }}
            onClick={closeCamera}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content bg-dark text-white rounded-3">
                <div className="modal-body text-center">
                  <video
                    ref={videoRef}
                    style={{ width: "100%", borderRadius: "8px" }}
                  />
                  <canvas ref={canvasRef} style={{ display: "none" }} />
                </div>
                <div className="modal-footer border-0 d-flex justify-content-between">
                  <Button variant="secondary" onClick={closeCamera}>
                    Cancel
                  </Button>
                  <Button variant="info" onClick={capturePhoto}>
                    Capture
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="position-relative z-10 px-3 pb-3">
          <div className="d-flex flex-wrap justify-content-center align-items-center text-secondary small">
            <span className="mb-2 mb-md-0">
              © 2025 EROS Universe. All Rights Reserved.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealingModal;
