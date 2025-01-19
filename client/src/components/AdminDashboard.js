import React, { useState, useEffect } from "react";
import api from "../axios/axios";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";

export default function AdminDashboard() {
  const [email, setEmail] = useState("");
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [currentCode, setCurrentCode] = useState("");
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [endTime, setEndTime] = useState(new Date());

  const navigate = useNavigate();
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/");
    }

    const role = sessionStorage.getItem("role");
    if (role !== "admin") {
      navigate("/");
    }
  }, []);

  const convertToIST = (date) => {
    // IST is UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000;
    const utcDate = new Date(date);
    const istDate = new Date(utcDate.getTime() + istOffset);
    return istDate;
  };

  const convertFromIST = (istDate) => {
    // Convert IST back to UTC
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(istDate.getTime() - istOffset);
  };

  const searchUser = async () => {
    setError("");
    setUserData(null);
    setLoading(true);
    setHasActiveSession(false);

    try {
      if (!email?.trim()) {
        setError("Please enter an email");
        return;
      }

      // First check if the user has completed the test
      try {
        const completedResponse = await api.get("/api/users/search", {
          params: { email: email.trim() },
        });

        if (
          completedResponse.data &&
          completedResponse.data.status === "completed"
        ) {
          setUserData(completedResponse.data);
          setHasActiveSession(false);
          return;
        }
      } catch (searchError) {
        // If no completed test found, continue to check for active session
        if (searchError.response?.status !== 404) {
          throw searchError;
        }
      }

      // Then check for active session
      const sessionResponse = await api.get("/api/users/check-active-session", {
        params: { email: email.trim() },
      });

      const hasActiveSession = sessionResponse.data.hasActiveSession;
      setHasActiveSession(hasActiveSession);

      if (hasActiveSession) {
        const sessionDetails = sessionResponse.data.sessionDetails;
        setUserData({
          email: email.trim(),
          status: "in_progress",
          regNo: sessionDetails.regNo,
          startTime: sessionDetails.startTime,
          sessionExpiresAt: sessionDetails.expiresAt,
        });
      } else if (!hasActiveSession && !userData) {
        setError("No test data found for this user");
      }
    } catch (error) {
      console.error("Search error:", error);
      setError(error.response?.data?.message || "Error searching for user");
    } finally {
      setLoading(false);
    }
  };

  const resetTest = async () => {
    try {
      if (!userData?.email) {
        console.error("No email found");
        return;
      }

      if (
        !window.confirm(
          "Are you sure you want to reset this user's test? This action cannot be undone."
        )
      ) {
        return;
      }

      setResetLoading(true);
      console.log("Resetting test for email:", userData.email);

      const response = await api.post(
        "/api/users/reset-test",
        { email: userData.email },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Reset response:", response.data);

      if (response.data.status === "success") {
        alert("Test reset successfully");
        // Refresh user data
        await searchUser();
      }
    } catch (error) {
      console.error("Reset error:", error);
      alert(error.response?.data?.message || "Error resetting test");
    } finally {
      setResetLoading(false);
    }
  };

  const getCurrentCode = async () => {
    try {
      const response = await api.get("/api/admin/current-code");
      setCurrentCode(response.data.code);
    } catch (error) {
      console.error("Error fetching code:", error);
    }
  };

  const updateAccessCode = async () => {
    try {
      if (!newCode.trim()) {
        alert("Please enter a new access code");
        return;
      }

      const response = await api.post("/api/admin/update-code", {
        code: newCode.trim(),
      });

      if (response.data.success) {
        alert("Access code updated successfully");
        setNewCode("");
        getCurrentCode();
      }
    } catch (error) {
      console.error("Error updating code:", error);
      if (error.response?.data?.message?.includes("already exists")) {
        alert(
          "This access code has already been used. Please try a different code."
        );
      } else {
        alert(error.response?.data?.message || "Error updating access code");
      }
    }
  };

  const clearActiveSession = async () => {
    try {
      if (!userData?.email) return;

      if (
        !window.confirm(
          "Are you sure you want to clear this user's active session? This will allow them to start a new test."
        )
      ) {
        return;
      }

      await api.post("/api/users/admin-clear-session", {
        email: userData.email,
      });

      alert("Active session cleared successfully");
      setHasActiveSession(false);
      // Instead of searching again, just clear the user data
      setUserData(null);
      setEmail(""); // Optional: clear the search field
    } catch (error) {
      console.error("Error clearing session:", error);
      alert(error.response?.data?.message || "Error clearing session");
    }
  };

  const fetchEndTime = async () => {
    try {
      const response = await api.get("/api/timer/endtime");
      const serverTime = new Date(response.data.endTime);
      const istTime = convertToIST(serverTime);
      setEndTime(istTime);
    } catch (error) {
      console.error("Error fetching timer end time:", error);
    }
  };

  const updateEndTime = async () => {
    try {
      const utcTime = convertFromIST(endTime);
      await api.post("/api/timer/update", {
        endTime: utcTime.toISOString(),
      });
      alert("Timer end time updated successfully");
    } catch (error) {
      console.error("Error updating timer end time:", error);
      alert("Error updating timer end time");
    }
  };

  const formatDateTimeLocal = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    fetchEndTime();
    getCurrentCode();
  }, []);

  return (
    <div className="container">
      <h1 className="title text-light">Admin Dashboard</h1>

      <div className="search-section">
        <input
          type="text"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="search-input"
        />

        <button onClick={searchUser} className="search-btn" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {userData && (
        <div className="user-details">
          <h2>User Details</h2>
          <div className="details-grid">
            <div className="detail-item">
              <strong>Email:</strong>
              <span>{userData.email}</span>
            </div>
            <div className="detail-item">
              <strong>Registration Number:</strong>
              <span>{userData.regNo}</span>
            </div>
            {userData.department && (
              <div className="detail-item">
                <strong>Department:</strong>
                <span>{userData.department}</span>
              </div>
            )}
            <div className="detail-item">
              <strong>Status:</strong>
              <span className={`status-${userData.status}`}>
                {userData.status === "in_progress"
                  ? "Test In Progress"
                  : userData.status}
              </span>
            </div>
            {userData.status === "completed" && (
              <>
                <div className="detail-item">
                  <strong>Score:</strong>
                  <span>{userData.score}</span>
                </div>
                <div className="detail-item">
                  <strong>Total Questions:</strong>
                  <span>{userData.totalQuestions}</span>
                </div>
              </>
            )}
            {userData.status === "in_progress" && (
              <div className="detail-item">
                <strong>Started At:</strong>
                <span>{new Date(userData.startTime).toLocaleString()}</span>
              </div>
            )}
          </div>

          {userData.status === "in_progress" && (
            <div
              className="warning-message"
              style={{
                backgroundColor: "#fff3cd",
                color: "#856404",
                padding: "10px",
                marginTop: "10px",
                borderRadius: "4px",
              }}
            >
              <p>This user has an active test session.</p>
              <button
                onClick={clearActiveSession}
                className="warning-btn"
                style={{
                  backgroundColor: "#856404",
                  color: "white",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "3px",
                  marginTop: "5px",
                  cursor: "pointer",
                }}
              >
                Clear Active Session
              </button>
            </div>
          )}

          {userData.status === "completed" && (
            <div className="action-buttons">
              <button
                onClick={resetTest}
                className="reset-btn"
                disabled={resetLoading}
              >
                {resetLoading ? "Resetting..." : "Reset Test"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="access-code-section">
        <h2>Access Code Management</h2>
        <div className="current-code">
          Current Access Code: <strong>{currentCode}</strong>
        </div>
        <div className="code-update-form">
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="Enter new access code"
            className="search-input"
          />
          <button onClick={updateAccessCode} className="search-btn">
            Update Access Code
          </button>
        </div>
      </div>

      <div className="timer-settings-section">
        <h2>Timer Settings</h2>
        <div className="timer-update-form">
          <input
            type="datetime-local"
            value={formatDateTimeLocal(endTime)}
            onChange={(e) => {
              const selectedDate = new Date(e.target.value);
              setEndTime(selectedDate);
            }}
            className="search-input"
          />
          {/* <div style={{ marginTop: '10px', fontSize:'0.9em', color: '#666' }}>
                        Selected End Time (IST): {endTime.toLocaleString('en-IN', { 
                            timeZone: 'Asia/Kolkata',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        })}
                    </div> */}
          <button onClick={updateEndTime} className="search-btn">
            Update End Time
          </button>
        </div>
      </div>
    </div>
  );
}
