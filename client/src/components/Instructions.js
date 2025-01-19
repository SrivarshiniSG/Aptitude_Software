import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import "../styles/Instructions.css";
import DeviceDetection from "./DeviceDetection";
import api from "../axios/axios";

export default function Instructions() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { username } = useSelector((state) => state.result);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const role = sessionStorage.getItem("role");
    if (!role) {
      navigate("/");
      return;
    }
    sessionStorage.removeItem("quizState");
  }, []);

  useEffect(() => {
    const preventBackNavigation = () => {
      alert(
        "Please use the provided buttons to navigate. Don't use browser navigation."
      );
      navigate("/instructions", { replace: true });
    };

    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener("popstate", preventBackNavigation);

    return () => {
      window.removeEventListener("popstate", preventBackNavigation);
    };
  }, [navigate]);

  const startQuiz = async () => {
    if (!username) {
      navigate("/");
      return;
    }

    try {
      setIsLoading(true);
      // Reset trace before starting quiz
      dispatch({ type: "SET_TRACE", payload: 0 });

      // Fetch questions from server
      const response = await api.post("/api/users/create-session");
      const { questions } = response.data;

      // Store questions in session storage
      sessionStorage.setItem("quizQuestions", JSON.stringify(questions));

      // Navigate to quiz after storing questions
      navigate("/quiz");
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <DeviceDetection />
      {/* <h1 className='title'>Instructions</h1> */}

      <div className="instructions">
        <h2>Please read the following instructions carefully:</h2>
        <ul>
          <li>The quiz contains multiple choice questions.</li>
          <li>Each question has only one correct answer.</li>
          <li>You cannot go back to previous questions once answered.</li>
          <li>Each correct answer will earn you points.</li>
          <li>There is no negative marking.</li>
          <li>Do not refresh the page during the quiz.</li>
        </ul>
      </div>

      <div className="btn-container">
        <button onClick={startQuiz} className="btn" disabled={isLoading}>
          {isLoading ? "Loading Questions..." : "Start Quiz"}
        </button>
      </div>
    </div>
  );
}
