import React from "react";
import { Link } from "react-router-dom";

const DevToolsBlocked = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        textAlign: "center",
        backgroundColor: "#f5f5f5",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          padding: "30px",
          borderRadius: "10px",
          backgroundColor: "white",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            color: "#dc3545",
            marginBottom: "20px",
          }}
        >
          Access Denied
        </h1>

        <p
          style={{
            fontSize: "18px",
            lineHeight: "1.6",
            marginBottom: "20px",
            color: "#333",
          }}
        >
          Developer tools are not allowed on this page.
        </p>

        <div
          style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeeba",
            borderRadius: "5px",
            padding: "15px",
            marginBottom: "20px",
          }}
        >
          <p style={{ color: "#856404", margin: 0 }}>
            Please close developer tools to continue using the application.
          </p>
        </div>

        <Link
          to="/"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            textDecoration: "none",
            borderRadius: "5px",
            transition: "background-color 0.3s",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#0056b3")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#007bff")}
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default DevToolsBlocked;
