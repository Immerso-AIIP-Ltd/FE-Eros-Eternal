import React, { useState, useEffect, useRef } from "react";
import {
  Select,
  MenuItem,
  FormControl,
  TextField,
  InputLabel,
  ThemeProvider,
  createTheme,
  styled,
  InputAdornment,
} from "@mui/material";

import type { SelectChangeEvent } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import backgroundImg from "./background.png";
import Stars from "./components/stars";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LogoEros from '../src/assets/LogoEros.png';

const API_URL =
  "http://164.52.205.108:8500";
// const API_URL =
//   "http://192.168.18.5:7001";

interface FormData {
  firstName: string;
  name: string;
  gender: string;
  placeOfBirth: string;
  currentLocation: string;
  dateOfBirth: string; // YYYY-MM-DD
  timeOfBirth: string; // HH:mm or HH:mm:ss
}


const indianStates = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Pune",
  "Jaipur",
  "Surat",
  "Lucknow",
  "Kanpur",
  "Nagpur",
  "Indore",
  "Thane",
  "Bhopal",
  "Visakhapatnam",
  "Patna",
  "Vadodara",
  "Ghaziabad",
  "Ludhiana",
  "Agra",
  "Nashik",
  "Faridabad",
  "Meerut",
  "Rajkot",
  "Varanasi",
  "Srinagar",
  "Aurangabad",
  "Dhanbad",
  "Amritsar",
  "Navi Mumbai",
  "Allahabad (Prayagraj)",
  "Ranchi",
  "Howrah",
  "Coimbatore",
  "Jabalpur",
  "Gwalior",
  "Vijayawada",
  "Jodhpur",
  "Madurai",
  "Raipur",
  "Kochi",
  "Chandigarh",
  "Guwahati",
  "Bhubaneswar",
  "Dehradun",
  "Mysore",
  "Tiruchirappalli",
  "Salem",
];

// Custom styled Select with icon left side and blue border glow on focus/filled
const StyledFormControl = styled(FormControl)(({ theme }) => ({
  width: "100%",
  marginBottom: "0",
  ".MuiInputLabel-root": {
    color: "#666",
  },
  ".MuiSelect-root": {
    paddingLeft: "32px", // space for icon on left
    color: "#000",
  },
  ".MuiOutlinedInput-notchedOutline": {
    borderColor: "#d1d5db",
    transition: "border-color 0.3s ease",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#d1d5db",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#60a5fa",
    boxShadow: "none",
  },
  position: "relative",
}));

// Icon wrapper for left icon inside Select input
const IconLeftWrapper = styled("div")({
  position: "absolute",
  left: 8,
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
  color: "#666",
  zIndex: 1,
});

const lightTheme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "transparent",
      paper: "#fff",
    },
    primary: {
      main: "#60a5fa",
    },
    text: {
      primary: "#000",
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          height: "3.5rem",
          "& input": {
            color: "#000",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#666",
          fontSize: "0.875rem",
          "&.Mui-focused": {
            color: "#60a5fa",
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
          color: "#000",
          "&:hover": {
            backgroundColor: "#f5f5f5",
          },
          "&.Mui-selected": {
            backgroundColor: "#00B8F8",
            color: "#fff",
            "&:hover": {
              backgroundColor: "#0099d4",
            },
          },
        },
      },
    },
    MuiPickersDay: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
          color: "#000",
          "&:hover": {
            backgroundColor: "#f5f5f5",
          },
          "&.Mui-selected": {
            backgroundColor: "#00B8F8",
            color: "#fff",
            "&:hover": {
              backgroundColor: "#0099d4",
            },
          },
        },
      },
    },
    MuiPickersCalendarHeader: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
          color: "#000",
        },
      },
    },
    MuiPickersLayout: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
        },
      },
    },
    MuiClock: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
        },
        pin: {
          backgroundColor: "#00B8F8",
        },
      },
    },
    MuiClockPointer: {
      styleOverrides: {
        root: {
          backgroundColor: "#00B8F8",
        },
        thumb: {
          backgroundColor: "#00B8F8",
          borderColor: "#00B8F8",
        },
      },
    },
    MuiClockNumber: {
      styleOverrides: {
        root: {
          color: "#000",
          "&.Mui-selected": {
            backgroundColor: "#00B8F8",
            color: "#fff",
          },
        },
      },
    },
    MuiPickersYear: {
      styleOverrides: {
        yearButton: {
          color: "#000",
          "&.Mui-selected": {
            backgroundColor: "#00B8F8",
            color: "#fff",
          },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
          color: "#000",
        },
      },
    },
  },
});

const SoulProfilePage: React.FC = () => {

  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    name: "",
    gender: "",
    placeOfBirth: "",
    currentLocation: "",
    dateOfBirth: "",
    timeOfBirth: "",
  });

  // ✅ FIXED: Validate & sanitize data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("soulProfile");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);

        // Validate date format: YYYY-MM-DD
        const isValidDate = (str: string): boolean => {
          if (!str || typeof str !== "string") return false;
          return (
            /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime())
          );
        };

        // Validate time format: HH:mm or HH:mm:ss
        const isValidTime = (str: string): boolean => {
          if (!str || typeof str !== "string") return false;
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(str);
        };

        // Normalize time to HH:mm (MUI prefers this)
        const normalizeTime = (timeStr: string): string => {
          if (!timeStr) return "";
          if (timeStr.length >= 5) {
            return timeStr.substring(0, 5); // "14:30:00" → "14:30"
          }
          return "";
        };

        setFormData({
          firstName: parsed.firstName || "",
          name: parsed.name || "",
          gender: parsed.gender || "",
          placeOfBirth: parsed.placeOfBirth || "",
          currentLocation: parsed.currentLocation || "",
          dateOfBirth: isValidDate(parsed.dateOfBirth)
            ? parsed.dateOfBirth
            : "",
          timeOfBirth: isValidTime(parsed.timeOfBirth)
            ? normalizeTime(parsed.timeOfBirth)
            : "",
        });
      } catch (e) {
        console.error("Failed to parse saved profile:", e);
        localStorage.removeItem("soulProfile");
      }
    }
  }, []);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      localStorage.setItem("soulProfile", JSON.stringify(updated));
      return updated;
    });
  };

  const [loading, setLoading] = useState(false); // ✅ fixed: was always true
  const [error, setError] = useState<string | null>(null);
  const dobInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  const handleIconClick = () => {
    dobInputRef.current?.showPicker?.();
    dobInputRef.current?.click();
  };

  const handleTimeIconClick = () => {
    timeInputRef.current?.showPicker?.();
    timeInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // if (!formData.firstName.trim()) {
    //   alert("Please enter your first name.");
    //   return;
    // }
    if (!formData.name.trim()) {
      alert("Please enter your name.");
      return;
    }
    if (!formData.dateOfBirth) {
      alert("Please select a valid date of birth.");
      return;
    }
    if (!formData.timeOfBirth) {
      alert("Please select a valid time of birth.");
      return;
    }

    const [year, month, day] = formData.dateOfBirth.split("-");
    const formattedDate = `${day}-${month}-${year}`;

    // ✅ Create FormData instead of a plain object
    const payload = new FormData();
    payload.append("gender", formData.gender);
    payload.append("username", formData.name);
    payload.append("place_of_birth", formData.placeOfBirth);
    payload.append("current_location", formData.currentLocation);
    payload.append("date_of_birth", formattedDate);
    payload.append("time_of_birth", formData.timeOfBirth);

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/users/profile/`, {
        method: "POST",
        // ⚠️ DO NOT set Content-Type — let the browser handle it
        // headers: { "Content-Type": "application/json" }, ← REMOVE THIS
        body: payload, // ← FormData goes here
      });

      if (!response.ok) {
        // ⚠️ Important: When using FormData, the server might still return JSON errors
        // So we try to parse as JSON, but be cautious
        let errorResponse;
        const text = await response.text();
        try {
          errorResponse = JSON.parse(text);
        } catch {
          errorResponse = text; // fallback to raw text
        }

        let errorMessage = "Server error occurred";

        if (Array.isArray(errorResponse)) {
          errorMessage = errorResponse
            .map(
              (err) => err.msg || err.message || err.detail || "Unknown error"
            )
            .join("; ");
        } else if (errorResponse && typeof errorResponse === "object") {
          errorMessage =
            errorResponse.message ||
            errorResponse.error ||
            JSON.stringify(errorResponse);
        } else if (typeof errorResponse === "string") {
          errorMessage = errorResponse;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("user_id", result.data.user_id);
        localStorage.setItem("username", result.data.username);
        localStorage.setItem("date_of_birth", result.data.date_of_birth);
        localStorage.setItem("gender", result.data.gender);
        localStorage.setItem("place_of_birth", result.data.place_of_birth);
        localStorage.setItem("current_location", result.data.current_location);
        localStorage.setItem("time_of_birth", result.data.time_of_birth);
        // alert(result.message);
        navigate("/eros-home");
      } else {
        throw new Error(result.message || "Profile creation failed");
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMsg);
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <style>
        {`
  /* Mobile devices (320px - 480px) */
  @media (max-width: 480px) {
    .responsive-container {
      flex-direction: column !important;
      padding: 0.5rem !important;
      gap: 0 !important;
    }
    
    .left-side {
      display: none !important;
    }
    
    .right-side {
      flex: 1 1 100% !important;
      padding: 0.5rem !important;
    }
    
    .soul-profile-form {
      width: 100% !important;
      padding: 1.25rem !important;
      gap: 1rem !important;
      max-width: 100% !important;
      border-radius: 12px !important;
    }

    .rotate-image-bg {
      width: 300px !important;
      height: 300px !important;
    }
    
    .logo-eros {
      width: 180px !important;
    }

    .bubble-1 {
      width: 200px !important;
      height: 200px !important;
      filter: blur(40px) !important;
    }

    .bubble-2 {
      width: 180px !important;
      height: 180px !important;
      filter: blur(35px) !important;
    }

    .bubble-3 {
      width: 150px !important;
      height: 150px !important;
      filter: blur(30px) !important;
    }

    .bubble-4 {
      width: 220px !important;
      height: 220px !important;
      filter: blur(45px) !important;
    }
  }

  /* Mobile landscape and small tablets (481px - 768px) */
  @media (min-width: 481px) and (max-width: 768px) {
    .responsive-container {
      flex-direction: column !important;
      padding: 1rem !important;
      gap: 1rem !important;
    }
    
    .left-side {
      display: none !important;
    }
    
    .right-side {
      flex: 1 1 100% !important;
      padding: 1rem !important;
    }
    
    .soul-profile-form {
      width: 100% !important;
      padding: 1.75rem !important;
      max-width: 600px !important;
    }

    .rotate-image-bg {
      width: 400px !important;
      height: 400px !important;
    }
    
    .logo-eros {
      width: 220px !important;
    }

    .bubble-1 {
      width: 280px !important;
      height: 280px !important;
      filter: blur(55px) !important;
    }

    .bubble-2 {
      width: 250px !important;
      height: 250px !important;
      filter: blur(50px) !important;
    }

    .bubble-3 {
      width: 220px !important;
      height: 220px !important;
      filter: blur(45px) !important;
    }

    .bubble-4 {
      width: 320px !important;
      height: 320px !important;
      filter: blur(60px) !important;
    }
  }

  /* Tablets (769px - 1024px) */
  @media (min-width: 769px) and (max-width: 1024px) {
    .responsive-container {
      gap: 1.5rem !important;
      padding: 1.5rem !important;
    }

    .left-side {
      flex: 1 1 40% !important;
    }

    .right-side {
      flex: 1 1 60% !important;
    }

    .soul-profile-form {
      width: 100% !important;
      max-width: 550px !important;
      padding: 2rem !important;
    }

    .rotate-image-bg {
      width: 500px !important;
      height: 500px !important;
    }
    
    .logo-eros {
      width: 240px !important;
    }
  }

  /* Small laptops (1025px - 1366px) */
  @media (min-width: 1025px) and (max-width: 1366px) {
    .responsive-container {
      gap: 2rem !important;
    }

    .left-side {
      flex: 1 1 45% !important;
    }

    .right-side {
      flex: 1 1 55% !important;
    }

    .soul-profile-form {
      max-width: 600px !important;
      padding: 2.25rem !important;
    }

    .rotate-image-bg {
      width: 600px !important;
      height: 600px !important;
    }
    
    .logo-eros {
      width: 260px !important;
    }
  }

  /* Standard laptops and desktops (1367px - 1920px) */
  @media (min-width: 1367px) and (max-width: 1920px) {
    .soul-profile-form {
      max-width: 650px !important;
    }

    .rotate-image-bg {
      width: 700px !important;
      height: 700px !important;
    }
    
    .logo-eros {
      width: 280px !important;
    }
  }

  /* Large desktops (1921px+) */
  @media (min-width: 1921px) {
    .responsive-container {
      gap: 3rem !important;
    }

    .soul-profile-form {
      max-width: 750px !important;
      padding: 3rem !important;
    }

    .rotate-image-bg {
      width: 900px !important;
      height: 900px !important;
    }
    
    .logo-eros {
      width: 320px !important;
    }
  }
`}
      </style>
      <div
        style={{
          height: "100vh",
          width: "100vw",
          background: "rgb(255, 255, 255)",
          color: "#000",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Blurred bubbles background */}
        <div style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          zIndex: 0,
        }}>
          <div className="bubble-1" style={{
            position: "absolute",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(0, 184, 248, 0.15), rgba(135, 206, 250, 0.1))",
            filter: "blur(80px)",
            top: "10%",
            left: "10%",
          }} />
          <div className="bubble-2" style={{
            position: "absolute",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(197, 245, 245, 0.2), rgba(176, 224, 230, 0.15))",
            filter: "blur(70px)",
            top: "60%",
            right: "15%",
          }} />
          <div className="bubble-3" style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(135, 206, 250, 0.12), rgba(173, 216, 230, 0.08))",
            filter: "blur(60px)",
            bottom: "15%",
            left: "20%",
          }} />
          <div className="bubble-4" style={{
            position: "absolute",
            width: "450px",
            height: "450px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(0, 184, 248, 0.1), rgba(135, 206, 250, 0.08))",
            filter: "blur(90px)",
            top: "30%",
            right: "5%",
          }} />
        </div>
        <Stars />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            gap: "2rem",
            position: "relative",
            zIndex: 1,
          }}
          className="responsive-container"
        >
          {/* Left Side - Background and Logo */}
          <div
            style={{
              flex: "1 1 50%",
              position: "relative",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="left-side"
          >
            <img
              src={backgroundImg}
              alt="Rotating Cosmic Background"
              className="rotate-image-bg position-absolute"
              style={{
                zIndex: 0,
                // opacity: 0.3,
                pointerEvents: "none",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) rotate(0deg)",
                width: "800px",
                height: "800px",
                // filter:"brightness(1) saturate(50%) contrast(100%)",
                aspectRatio: "1 / 1", // ✅ Ensures the image stays perfectly square
                objectFit: "contain", // ✅ Prevents stretching/distortion
              }}
            />
            <img
              src={LogoEros}
              alt="EROS Wellness Logo"
              className="logo-eros"
              style={{
                width: "300px",
                height: "auto",
                objectFit: "contain",
                zIndex: 1,
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>

          {/* Right Side - Form */}
          <div
            style={{
              flex: "1 1 50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem", // Added padding to the container
            }}
            className="right-side"
          >
            <form
              onSubmit={handleSubmit}
              style={{
                width: "100%",
                maxWidth: "700px", // Better than percentage for readability
                backgroundColor: "#fff",
                padding: "2.5rem", // Increased padding
                borderRadius: "16px",
                border: "1px solid #e0e0e0",
                borderTop: "3px solid rgb(0, 184, 248)",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem", // Increased gap between fields
                fontFamily: "Inter,sans-serif",
                boxSizing: "border-box",
              }}
              className="soul-profile-form"
            >
              <h1
                style={{
                  margin: "0", // Remove all margins for even spacing
                  fontFamily: "Montserrat,sans-serif",
                  fontWeight: "700",
                  fontSize: "1.75rem",
                  lineHeight: "1.2",
                  color: "#000",
                }}
              >
                Create Your Soul Profile
              </h1>

              {/* Name Field */}
              <TextField
                label="Name"
                variant="outlined"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                InputLabelProps={{ style: { color: "#666" } }}
                inputProps={{ style: { color: "#000" } }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#60a5fa",
                      boxShadow: "none",
                    },
                  },
                }}
              />

              {/* Gender */}
              <StyledFormControl variant="outlined">
                <InputLabel id="gender-label" shrink>Gender</InputLabel>
                <IconLeftWrapper>
                  <ArrowDropDownIcon />
                </IconLeftWrapper>
                <Select
                  labelId="gender-label"
                  value={formData.gender}
                  onChange={(e: SelectChangeEvent) =>
                    handleChange("gender", e.target.value)
                  }
                  displayEmpty
                  IconComponent={() => null}
                  label="Gender"
                >
                  <MenuItem value="" disabled style={{ opacity: "1" }}>
                    Select Gender
                  </MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </StyledFormControl>

              {/* Place of Birth */}
              <StyledFormControl variant="outlined">
                <TextField
                  label="Place of Birth"
                  value={formData.placeOfBirth}
                  onChange={(e) => handleChange("placeOfBirth", e.target.value)}
                  placeholder="Enter Place of Birth"
                  variant="outlined"
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnIcon sx={{ color: "#666" }} />
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{ style: { color: "#666" } }}
                  inputProps={{ style: { color: "#000" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: "#d1d5db",
                      },
                      "&:hover fieldset": {
                        borderColor: "#d1d5db",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#60a5fa",
                        boxShadow: "none",
                      },
                    },
                  }}
                />
              </StyledFormControl>

              {/* Current Location */}
              <StyledFormControl variant="outlined">
                <TextField
                  label="Current Location"
                  value={formData.currentLocation}
                  onChange={(e) =>
                    handleChange("currentLocation", e.target.value)
                  }
                  placeholder="Enter Current Location"
                  variant="outlined"
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnIcon sx={{ color: "#666" }} />
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{ style: { color: "#666" } }}
                  inputProps={{ style: { color: "#000" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: "#d1d5db",
                      },
                      "&:hover fieldset": {
                        borderColor: "#d1d5db",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#60a5fa",
                        boxShadow: "none",
                      },
                    },
                  }}
                />
              </StyledFormControl>

              {/* Date of Birth */}
              <TextField
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                required
                inputRef={dobInputRef}
                InputLabelProps={{ shrink: true, style: { color: "#666" } }}
                inputProps={{
                  style: { color: "#000" },
                  sx: {
                    "&::-webkit-calendar-picker-indicator": {
                      opacity: 0,
                      pointerEvents: "none",
                    },
                    "&::-webkit-inner-spin-button": {
                      display: "none",
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      onClick={handleIconClick}
                      sx={{ cursor: "pointer" }}
                    >
                      <CalendarTodayIcon sx={{ color: "#666" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    cursor: "pointer",
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#60a5fa",
                      boxShadow: "none",
                    },
                  },
                  "& .MuiInputBase-input": {
                    cursor: "pointer",
                    paddingLeft: "8px",
                  },
                }}
              />

              {/* Time of Birth */}
              <TextField
                label="Time of Birth"
                type="time"
                value={formData.timeOfBirth}
                onChange={(e) => handleChange("timeOfBirth", e.target.value)}
                required
                inputRef={timeInputRef}
                InputLabelProps={{ shrink: true, style: { color: "#666" } }}
                inputProps={{
                  style: { color: "#000" },
                  sx: {
                    "&::-webkit-calendar-picker-indicator": {
                      opacity: 0,
                      pointerEvents: "none",
                    },
                    "&::-webkit-inner-spin-button": {
                      display: "none",
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      onClick={handleTimeIconClick}
                      sx={{ cursor: "pointer" }}
                    >
                      <AccessTimeIcon sx={{ color: "#666" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    cursor: "pointer",
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#60a5fa",
                      boxShadow: "none",
                    },
                  },
                  "& .MuiInputBase-input": {
                    cursor: "pointer",
                    paddingLeft: "8px",
                  },
                }}
              />

              {/* Submit Button */}
              <button
                type="submit"
                style={{
                  backgroundColor: "#00B8F8",
                  color: "#fff",
                  border: "none",
                  padding: "1rem 1.5rem",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  marginTop: "0.5rem", // Reduced from 1rem since gap already provides spacing
                  fontFamily: "Inter,sans-serif",
                  borderRadius: "8px",
                  transition: "background-color 0.2s ease",
                }}
                disabled={loading}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = "#0099d6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#00B8F8";
                }}
              >
                {loading ? "Creating..." : "Create your soul profile"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </ThemeProvider >
  );
};

export default SoulProfilePage;