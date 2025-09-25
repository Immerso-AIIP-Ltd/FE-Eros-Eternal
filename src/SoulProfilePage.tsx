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
  SelectChangeEvent,
  InputAdornment,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import backgroundImg from "./background.png";
import Stars from "./components/stars";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const API_URL = "http://192.168.29.154:6001";

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
  marginBottom: "1rem",
  ".MuiInputLabel-root": {
    color: "#fff",
  },
  ".MuiSelect-root": {
    paddingLeft: "32px", // space for icon on left
    color: "#fff",
  },
  ".MuiOutlinedInput-notchedOutline": {
    borderColor: "#6c757d",
    transition: "border-color 0.3s ease",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#6c757d",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#00B8F8",
    boxShadow: "0 0 8px #00B8F8",
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
  color: "#fff",
  zIndex: 1,
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "transparent",
      paper: "transparent",
    },
    primary: {
      main: "#00B8F8",
    },
    text: {
      primary: "#fff",
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          height: "3.5rem",
          "& input": {
            color: "#fff",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#fff",
          fontSize: "0.875rem",
          "&.Mui-focused": {
            color: "#00B8F8",
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          backgroundColor: "#000",
          color: "#fff",
          "&:hover": {
            backgroundColor: "#333",
          },
          "&.Mui-selected": {
            backgroundColor: "#00B8F8",
            "&:hover": {
              backgroundColor: "#0099d4",
            },
          },
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
    const savedData = localStorage.getItem('soulProfile');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);

        // Validate date format: YYYY-MM-DD
        const isValidDate = (str: string): boolean => {
          if (!str || typeof str !== 'string') return false;
          return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime());
        };

        // Validate time format: HH:mm or HH:mm:ss
        const isValidTime = (str: string): boolean => {
          if (!str || typeof str !== 'string') return false;
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
          dateOfBirth: isValidDate(parsed.dateOfBirth) ? parsed.dateOfBirth : "",
          timeOfBirth: isValidTime(parsed.timeOfBirth) ? normalizeTime(parsed.timeOfBirth) : "",
        });
      } catch (e) {
        console.error("Failed to parse saved profile:", e);
        localStorage.removeItem('soulProfile');
      }
    }
  }, []);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      localStorage.setItem('soulProfile', JSON.stringify(updated));
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

  if (!formData.firstName.trim()) {
    alert("Please enter your first name.");
    return;
  }
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
          .map(err => err.msg || err.message || err.detail || "Unknown error")
          .join("; ");
      } else if (errorResponse && typeof errorResponse === "object") {
        errorMessage = errorResponse.message || errorResponse.error || JSON.stringify(errorResponse);
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
      localStorage.setItem("gender",result.data.gender);
      localStorage.setItem("place_of_birth",result.data.place_of_birth);
      localStorage.setItem("current_location",result.data.current_location);
      localStorage.setItem("time_of_birth",result.data.time_of_birth)
      alert(result.message);
      navigate("/aipage");
    } else {
      throw new Error(result.message || "Profile creation failed");
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "An unknown error occurred";
    setError(errorMsg);
    alert(`Error: ${errorMsg}`);
  } finally {
    setLoading(false);
  }
};

  return (
    <ThemeProvider theme={darkTheme}>
      <div style={{ height: "100vh", width: "100vw", background: "#000", color: "#fff", position: "relative", overflow: "hidden" }}>
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
        >
          {/* Left Side - Background and Logo */}
          <div style={{ flex: "1 1 50%", position: "relative", textAlign: "center" }}>
            <img
              src={backgroundImg}
              alt="Rotating Cosmic Background"
              className="rotate-image-bg position-absolute"
              style={{
                zIndex: 0,
                opacity: 3.15,
                pointerEvents: "none",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) rotate(0deg)",
                width: "800px",
                height: "800px",
                filter:
                  "brightness(4) saturate(0%) contrast(150%) invert(1) hue-rotate(0deg)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "calc(50% + 3rem)",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "24px",
                color: "rgba(255, 255, 255, 1)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              EROS UNIVERSE
            </div>
            <h2 style={{ color: "rgba(0, 184, 248, 1)", fontSize: "64px",fontFamily:"Montserrat" ,}}> Eternal AI</h2>
          </div>

          {/* Right Side - Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              flex: "1 1 40%",
              backgroundColor: "#000",
              padding: "2rem",
              borderRadius: "16px",
              border: "1px solid #2a2a2a",
              boxShadow: "0 0 15px #00B8F8",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              fontFamily:"Inter"
            }}
          >
            <h1 style={{ marginBottom: "1rem",fontFamily:"Montserrat",fontWeight:"700"}}>Create Your Soul Profile</h1>

            <TextField
              label="First Name"
              variant="outlined"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              required
              InputLabelProps={{ style: { color: "#fff" } }}
              inputProps={{ style: { color: "#fff" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#6c757d",
                  },
                  "&:hover fieldset": {
                    borderColor: "#6c757d",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#00B8F8",
                    boxShadow: "0 0 8px #00B8F8",
                  },
                },
              }}
            />

            <TextField
              label="Name"
              variant="outlined"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              InputLabelProps={{ style: { color: "#fff" } }}
              inputProps={{ style: { color: "#fff" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#6c757d",
                  },
                  "&:hover fieldset": {
                    borderColor: "#6c757d",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#00B8F8",
                    boxShadow: "0 0 8px #00B8F8",
                  },
                },
              }}
            />

            {/* Gender */}
            <StyledFormControl variant="outlined">
              <IconLeftWrapper>
                <ArrowDropDownIcon />
              </IconLeftWrapper>
              <Select
                value={formData.gender}
                onChange={(e: SelectChangeEvent) => handleChange("gender", e.target.value)}
                displayEmpty
                IconComponent={() => null}
              >
                <MenuItem value="" disabled>
                  Select Gender
                </MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </StyledFormControl>

            {/* Place of Birth */}
            <StyledFormControl variant="outlined">
              <IconLeftWrapper>
                <LocationOnIcon />
              </IconLeftWrapper>
              <Select
                value={formData.placeOfBirth}
                onChange={(e: SelectChangeEvent) => handleChange("placeOfBirth", e.target.value)}
                displayEmpty
                IconComponent={() => null}
                required
              >
                <MenuItem value="" disabled>
                  Select Place of Birth
                </MenuItem>
                {indianStates.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </Select>
            </StyledFormControl>

            {/* Current Location */}
            <StyledFormControl variant="outlined">
              <IconLeftWrapper>
                <LocationOnIcon />
              </IconLeftWrapper>
              <Select
                value={formData.currentLocation}
                onChange={(e: SelectChangeEvent) => handleChange("currentLocation", e.target.value)}
                displayEmpty
                IconComponent={() => null}
                required
              >
                <MenuItem value="" disabled>
                  Select Current Location
                </MenuItem>
                {indianStates.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </Select>
            </StyledFormControl>

            {/* Date of Birth */}
            <TextField
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              required
              inputRef={dobInputRef}
              InputLabelProps={{ shrink: true, style: { color: "#fff" } }}
              inputProps={{
                style: { color: "#fff" },
                sx: {
                  '&::-webkit-calendar-picker-indicator': {
                    opacity: 0,
                    pointerEvents: 'none',
                  },
                  '&::-webkit-inner-spin-button': {
                    display: 'none',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment
                    position="start"
                    onClick={handleIconClick}
                    sx={{ cursor: 'pointer' }}
                  >
                    <CalendarTodayIcon sx={{ color: '#fff' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  cursor: "pointer",
                  "& fieldset": {
                    borderColor: "#6c757d",
                  },
                  "&:hover fieldset": {
                    borderColor: "#6c757d",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#00B8F8",
                    boxShadow: "0 0 8px #00B8F8",
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
              InputLabelProps={{ shrink: true, style: { color: "#fff" } }}
              inputProps={{
                style: { color: "#fff" },
                sx: {
                  '&::-webkit-calendar-picker-indicator': {
                    opacity: 0,
                    pointerEvents: 'none',
                  },
                  '&::-webkit-inner-spin-button': {
                    display: 'none',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment
                    position="start"
                    onClick={handleTimeIconClick}
                    sx={{ cursor: 'pointer' }}
                  >
                    <AccessTimeIcon sx={{ color: '#fff' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  cursor: "pointer",
                  "& fieldset": {
                    borderColor: "#6c757d",
                  },
                  "&:hover fieldset": {
                    borderColor: "#6c757d",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#00B8F8",
                    boxShadow: "0 0 8px #00B8F8",
                  },
                },
                "& .MuiInputBase-input": {
                  cursor: "pointer",
                  paddingLeft: "8px",
                },
              }}
            />

            <button
              type="submit"
              style={{
                backgroundColor: "#00B8F8",
                color: "#fff",
                border: "none",
                padding: "1rem",
                fontSize: "1.2rem",
                fontWeight: "600",
                cursor: "pointer",
                marginTop: "1rem",
                fontFamily:"Inter"
              }}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create your soul profile"}
            </button>
          </form>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default SoulProfilePage;