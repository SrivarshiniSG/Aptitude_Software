import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { resetResultAction, setUserDetails } from "../redux/result_reducer";
import { resetAllAction } from "../redux/question_reducer";
import "../styles/Login.css";
import api from "../axios/axios";
import DeviceDetection from "./DeviceDetection";

const departments = [
  // { id: 'cs', name: 'Computer Science and Engineering', coreCategory: 'cs' },
  // { id: 'it', name: 'Information Technology', coreCategory: 'it' },
  // { id: 'ec', name: 'Electronics and Communication Engineering', coreCategory: 'ec' },
  // { id: 'ee', name: 'Electrical and Electronics Engineering', coreCategory: 'ee' },
  // { id: 'mech', name: 'Mechanical Engineering', coreCategory: 'mech' },
  // { id: 'civil', name: 'Civil Engineering', coreCategory: 'civil' },
  // { id: 'chem', name: 'Chemical Engineering', coreCategory: 'chem' },
  // { id: 'bio', name: 'Biotechnology', coreCategory: 'bio' },
  // { id: 'aids', name: 'Artificial Intelligence and Data Science', coreCategory: 'aids' },
  // { id: 'auto', name: 'Automobile Engineering', coreCategory: 'auto' },
  // // { id: 'marine', name: 'Marine Engineering', coreCategory: 'marine' }
  // { id: 'marine', name: 'Mechanical and Automobile Engineering', coreCategory: 'marine' }

  {
    id: "aids",
    name: "Artificial Intelligence and Data Science",
    coreCategory: "aids",
  },
  { id: "auto", name: "Automobile Engineering", coreCategory: "auto" },
  { id: "bio", name: "Biotechnology", coreCategory: "bio" },
  { id: "chem", name: "Chemical Engineering", coreCategory: "chem" },
  { id: "civil", name: "Civil Engineering", coreCategory: "civil" },
  { id: "cs", name: "Computer Science and Engineering", coreCategory: "cs" },
  {
    id: "ee",
    name: "Electrical and Electronics Engineering",
    coreCategory: "ee",
  },
  {
    id: "ec",
    name: "Electronics and Communication Engineering",
    coreCategory: "ec",
  },
  {
    id: "marine",
    name: "Mechanical and Automobile Engineering",
    coreCategory: "marine",
  },
  { id: "mech", name: "Mechanical Engineering", coreCategory: "mech" },
  { id: "it", name: "Information Technology", coreCategory: "it" },
];

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [isTestTimeValid, setIsTestTimeValid] = useState(true);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    regNo: "",
    department: "",
    accessCode: "",
  });

  useEffect(() => {
    sessionStorage.clear();
    checkTestTime();
  }, []);

  const checkTestTime = async () => {
    try {
      const response = await api.get("/api/timer/endtime");
      const serverTime = new Date(response.data.endTime);
      // Convert to IST (UTC+5:30)
      const istTime = new Date(serverTime.getTime() + 5.5 * 60 * 60 * 1000);
      const now = new Date();

      if (now > istTime) {
        setError("The test time has ended. You can no longer start the test.");
        setIsTestTimeValid(false);
        return false;
      }
      setIsTestTimeValid(true);
      return true;
    } catch (error) {
      console.error("Error checking test time:", error);
      // Use default time of 90 minutes from now + IST conversion, matching Quiz.js behavior
      const defaultTime = new Date(
        Date.now() + 90 * 60000 + 5.5 * 60 * 60 * 1000
      );
      const now = new Date();

      if (now > defaultTime) {
        setError("The test time has ended. You can no longer start the test.");
        setIsTestTimeValid(false);
        return false;
      }
      setIsTestTimeValid(true);
      return true;
    }
  };

  const validateEmail = (email) => {
    const emailPattern = /^2022[a-zA-Z]{2}\d{4}@svce\.ac\.in$/;
    return emailPattern.test(email);
  };

  const validateRegNo = (regNo) => {
    const regNoPattern = /^212722\d{7}$/; // Must start with 212722 and have 7 more digits
    return regNoPattern.test(regNo);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "department") {
      const selectedDept = departments.find((dept) => dept.id === value);
      setFormData((prev) => ({
        ...prev,
        department: selectedDept || "",
      }));
    } else if (name === "email" && value && !validateEmail(value)) {
      setErrors((prev) => ({
        ...prev,
        email: "Please use your college email",
      }));
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else if (name === "regNo" && value && !validateRegNo(value)) {
      setErrors((prev) => ({
        ...prev,
        regNo: "Registration number must be 13 digits and start with 212722",
      }));
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const isFormValid = () => {
    return (
      formData.username?.trim() &&
      formData.email?.trim() &&
      validateEmail(formData.email) &&
      formData.regNo?.trim() &&
      validateRegNo(formData.regNo) &&
      formData.department &&
      formData.accessCode?.trim() &&
      isTestTimeValid
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setError("");

    // Check if test time is up
    const isTestTimeValid = await checkTestTime();
    if (!isTestTimeValid) {
      return;
    }

    let newErrors = {};
    if (!formData.username?.trim()) newErrors.username = "Name is required";
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please use your college email";
    }
    if (!formData.regNo?.trim()) {
      newErrors.regNo = "Registration number is required";
    } else if (!validateRegNo(formData.regNo)) {
      newErrors.regNo =
        "Registration number must be 13 digits and start with 212722";
    }
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.accessCode?.trim())
      newErrors.accessCode = "Access code is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      dispatch(resetAllAction());
      dispatch(resetResultAction());

      const sessionResponse = await api.post("/api/users/check-session", {
        email: formData.email,
        regNo: formData.regNo,
        department: formData.department.id,
        accessCode: formData.accessCode,
        username: formData.username,
      });

      // check for access code error
      if (sessionResponse.data.message === "Invalid access code") {
        setErrors({ accessCode: "Invalid access code" });
        return;
      }

      if (sessionResponse.data.hasActiveSession) {
        setError(
          "This user already has an active test session in another window/browser. Please complete the test in the original session."
        );
        return;
      }

      if (!sessionResponse.data.canTakeTest) {
        setError(
          "You have already taken this test. Each user is allowed only one attempt."
        );
        return;
      }

      // await api.post('/api/users/create-session', {
      //     email: formData.email,
      //     regNo: formData.regNo
      // });
      sessionStorage.setItem("token", sessionResponse.data.token);
      sessionStorage.setItem("role", sessionResponse.data.role);
      dispatch(
        setUserDetails({
          username: formData.username,
          email: formData.email,
          regNo: formData.regNo,
          department: formData.department.name,
          departmentId: formData.department.id,
        })
      );

      // Store user data in session storage
      sessionStorage.setItem(
        "userData",
        JSON.stringify({
          username: formData.username,
          email: formData.email,
          regNo: formData.regNo,
          department: formData.department.name,
          departmentId: formData.department.id,
        })
      );

      navigate("/instructions");
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.response?.data?.message || "An error occurred. Please try again."
      );
    }
  };

  return (
    <div className="container">
      <DeviceDetection />
      <h1 className="title text-light">Login</h1>

      <form className="textbox" onSubmit={handleSubmit}>
        {error && (
          <div
            className="error-msg"
            style={{
              backgroundColor: "#ffebee",
              color: "#c62828",
              padding: "10px",
              borderRadius: "5px",
              marginBottom: "15px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            {error}
          </div>
        )}
        <div className="input-group">
          <input
            type="text"
            name="username"
            placeholder="Name"
            value={formData.username}
            onChange={handleChange}
          />
          {errors.username && <div className="error">{errors.username}</div>}
        </div>

        <div className="input-group">
          <input
            type="text"
            name="regNo"
            placeholder="Registration Number"
            value={formData.regNo}
            onChange={handleChange}
            maxLength={13}
            pattern="\d{13}"
          />
          {errors.regNo && <div className="error">{errors.regNo}</div>}
        </div>

        <div className="input-group">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <div className="error">{errors.email}</div>}
        </div>

        <div className="input-group">
          <select
            name="department"
            value={formData.department ? formData.department.id : ""}
            onChange={handleChange}
          >
            <option value="" disabled>
              Select Department
            </option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          {errors.department && (
            <div className="error">{errors.department}</div>
          )}
        </div>

        <div className="input-group">
          <input
            type="text"
            name="accessCode"
            placeholder="Access Code"
            value={formData.accessCode}
            onChange={handleChange}
          />
          {errors.accessCode && (
            <div className="error">{errors.accessCode}</div>
          )}
        </div>

        <button
          type="submit"
          className="btn"
          disabled={!isFormValid()}
          style={{
            opacity: isFormValid() ? 1 : 0.6,
            cursor: isFormValid() ? "pointer" : "not-allowed",
          }}
        >
          Start Quiz
        </button>
      </form>

      <div className="auth-links">
        <Link to="/admin-login" className="auth-link">
          Admin Login
        </Link>
      </div>
    </div>
  );
}
