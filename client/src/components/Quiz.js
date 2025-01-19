import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { updateResult } from "../redux/result_reducer";
import "../styles/App.css";
import TabDetection from "./TabDetection";
import api from "../axios/axios";
import QuestionNavigation from "./QuestionNavigation";
import DeviceDetection from "./DeviceDetection";

export default function Quiz() {
  const [check, setChecked] = useState(undefined);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [endTime, setEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmitTest = async (timeUp = false) => {
    try {
      const quizState = JSON.parse(sessionStorage.getItem("quizState"));
      if (!quizState || !quizState.results) {
        throw new Error("No quiz results found");
      }

      // Structure the answers according to sections
      const answers = {
        aptitude: quizState.results.slice(0, 10),
        core: quizState.results.slice(10, 30),
        verbal: quizState.results.slice(30, 35),
        comprehension: quizState.results.slice(35, 40),
        programming: quizState.results.slice(40, 50),
      };

      await api.post("/api/users/submit-test", { answers });
      timeUp
        ? navigate("/feedback?t=timeout")
        : navigate("/feedback?t=completed");
    } catch (error) {
      console.error("Error submitting test:", error);
    }
  };

  const {
    result: { result, username, email, regNo, department, departmentId },
  } = useSelector((state) => state);

  useEffect(() => {
    // Get user data from session storage if it exists

    const testTaken = sessionStorage.getItem("testTaken");
    if (testTaken) {
      navigate("/feedback?t=completed");
      return;
    }

    const storedUserData = sessionStorage.getItem("userData");
    if (storedUserData) {
      const userData = JSON.parse(storedUserData);
      dispatch({ type: "SET_USER_DATA", payload: userData });
    } else if (!username) {
      navigate("/");
      return;
    }

    // Load questions from session storage
    const storedQuestions = sessionStorage.getItem("quizQuestions");
    if (!storedQuestions) {
      navigate("/instructions");
      return;
    }

    const parsedQuestions = JSON.parse(storedQuestions);

    // Combine all questions into a single array
    const allQuestions = [
      ...parsedQuestions.aptitude.map((q) => ({ ...q, category: "Aptitude" })),
      ...parsedQuestions.core.map((q) => ({ ...q, category: "Core" })),
      ...parsedQuestions.verbal.map((q) => ({ ...q, category: "Verbal" })),
      // Add comprehension questions
      ...[
        {
          question: parsedQuestions.comprehension[0].q1.question,
          options: parsedQuestions.comprehension[0].q1.options,
          category: "Comprehension",
        },
        {
          question: parsedQuestions.comprehension[0].q2.question,
          options: parsedQuestions.comprehension[0].q2.options,
          category: "Comprehension",
        },
        {
          question: parsedQuestions.comprehension[0].q3.question,
          options: parsedQuestions.comprehension[0].q3.options,
          category: "Comprehension",
        },
        {
          question: parsedQuestions.comprehension[0].q4.question,
          options: parsedQuestions.comprehension[0].q4.options,
          category: "Comprehension",
        },
        {
          question: parsedQuestions.comprehension[0].q5.question,
          options: parsedQuestions.comprehension[0].q5.options,
          category: "Comprehension",
        },
      ],
      ...parsedQuestions.programming.map((q) => ({
        ...q,
        category: "Programming",
      })),
    ];

    // Store the passage separately for comprehension questions
    sessionStorage.setItem(
      "comprehensionPassage",
      parsedQuestions.comprehension[0].passage
    );

    setQuestions(allQuestions);

    // Load saved quiz state if it exists
    const savedQuizState = sessionStorage.getItem("quizState");
    if (savedQuizState) {
      const { currentIndex, results } = JSON.parse(savedQuizState);
      setCurrentQuestionIndex(currentIndex);
      dispatch({ type: "SET_RESULT", payload: results });
      // Set the check state for the current question
      setChecked(results[currentIndex]);
    } else {
      const initialResults = Array(allQuestions.length).fill(undefined);
      dispatch({ type: "SET_RESULT", payload: initialResults });
      setChecked(undefined);
      // Save initial state
      sessionStorage.setItem(
        "quizState",
        JSON.stringify({
          currentIndex: 0,
          results: initialResults,
        })
      );
    }

    enterFullscreen();
  }, []);

  // Save quiz state whenever it changes
  useEffect(() => {
    if (questions && result) {
      const quizState = {
        currentIndex: currentQuestionIndex,
        results: result,
      };
      sessionStorage.setItem("quizState", JSON.stringify(quizState));
      // Update check state whenever result changes
      setChecked(result[currentQuestionIndex]);
    }
  }, [currentQuestionIndex, result]);

  // Update check state whenever current question changes
  useEffect(() => {
    if (result && result.length > 0) {
      setChecked(result[currentQuestionIndex]);
    }
  }, [currentQuestionIndex, result]);

  const enterFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (error) {
      console.log("Fullscreen request failed");
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  useEffect(() => {
    if (questions && questions.length > 0) {
      dispatch({ type: "SET_TRACE", payload: 0 });
    }
  }, [questions]);

  useEffect(() => {
    console.log("Current trace:", currentQuestionIndex);
    console.log("Current result:", result);
    setChecked(result[currentQuestionIndex]);
  }, [currentQuestionIndex]);

  function onNext() {
    if (currentQuestionIndex < questions?.length) {
      if (check !== undefined) {
        dispatch(updateResult({ trace: currentQuestionIndex, checked: check }));
      }

      if (currentQuestionIndex === questions?.length - 1) {
        const unanswered = getUnansweredQuestions();
        setShowConfirmation(true);
        return;
      }

      setCurrentQuestionIndex((prev) => prev + 1);
      setChecked(result[currentQuestionIndex + 1]);
    }
  }

  function onPrev() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setChecked(result[currentQuestionIndex - 1]);
    }
  }

  function onSelect(i) {
    setChecked(i);
    dispatch(updateResult({ trace: currentQuestionIndex, checked: i }));

    // Save quiz state immediately after selecting an answer
    const updatedResults = [...result];
    updatedResults[currentQuestionIndex] = i;
    const quizState = {
      currentIndex: currentQuestionIndex,
      results: updatedResults,
    };
    sessionStorage.setItem("quizState", JSON.stringify(quizState));
  }

  const getUnansweredQuestions = () => {
    return result
      .map((ans, index) => ({
        index: index + 1,
        answered: ans !== undefined && ans !== null,
      }))
      .filter((q) => !q.answered)
      .map((q) => q.index);
  };

  const fetchEndTime = async () => {
    try {
      const response = await api.get("/api/timer/endtime");
      const serverTime = new Date(response.data.endTime);
      const istTime = new Date(serverTime.getTime() + 5.5 * 60 * 60 * 1000);
      setEndTime(istTime);
    } catch (error) {
      console.error("Error fetching timer end time:", error);
      const defaultTime = new Date(
        Date.now() + 90 * 60000 + 5.5 * 60 * 60 * 1000
      );
      setEndTime(defaultTime);
    }
  };

  useEffect(() => {
    fetchEndTime();
  }, []);

  useEffect(() => {
    if (!endTime) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const difference = endTime - now;

      if (difference <= 0) {
        setTimeLeft(0);
        handleTimeUp();
        return;
      }

      setTimeLeft(Math.floor(difference / 1000)); // Convert to seconds
    };

    updateTimeLeft(); // Initial update
    const timer = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const handleTimeUp = async () => {
    try {
      await handleSubmitTest(true);
    } catch (error) {
      console.error("Error handling time up:", error);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const categorizeQuestions = (questions) => {
    return questions.reduce(
      (acc, q, index) => {
        if (index < 10) {
          acc.aptitude.push({ ...q, index });
        } else if (index < 30) {
          acc.core.push({ ...q, index });
        } else if (index < 35) {
          acc.verbal.push({ ...q, index });
        } else if (index < 40) {
          acc.comprehension.push({ ...q, index });
        } else {
          acc.programming.push({ ...q, index });
        }
        return acc;
      },
      {
        aptitude: [],
        core: [],
        verbal: [],
        comprehension: [],
        programming: [],
      }
    );
  };

  const getQuestionsByCategory = () => {
    if (!questions || !Array.isArray(questions)) return null;

    return {
      aptitude: questions.filter((q, i) => i < 10),
      core: questions.filter((q, i) => i >= 10 && i < 30),
      verbal: questions.filter((q, i) => i >= 30 && i < 35),
      comprehension: questions.filter((q, i) => i >= 35 && i < 40),
      programming: questions.filter((q, i) => i >= 40 && i < 50),
    };
  };

  const getCurrentCategoryQuestions = () => {
    const categorizedQuestions = getQuestionsByCategory();
    if (!categorizedQuestions) return [];

    if (currentQuestionIndex < 10) return categorizedQuestions.aptitude;
    if (currentQuestionIndex < 30) return categorizedQuestions.core;
    if (currentQuestionIndex < 35) return categorizedQuestions.verbal;
    if (currentQuestionIndex < 40) return categorizedQuestions.comprehension;
    return categorizedQuestions.programming;
  };

  const getCurrentCategory = () => {
    if (currentQuestionIndex < 10) return "Aptitude";
    if (currentQuestionIndex < 30) return "Core";
    if (currentQuestionIndex < 35) return "Verbal";
    if (currentQuestionIndex < 40) return "Comprehension";
    return "Programming";
  };

  const getCurrentQuestion = () => {
    if (!questions || !Array.isArray(questions)) return null;
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;

    return {
      ...currentQuestion,
      categoryName: getCurrentCategory(),
    };
  };

  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) ||
        /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/i.test(
          navigator.userAgent
        ) ||
        window.innerWidth <= 800 ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0;

      if (isMobileDevice) {
        navigate("/mobile-restriction", { replace: true });
      }
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Add function to get comprehension passage
  const getComprehensionPassage = () => {
    return sessionStorage.getItem("comprehensionPassage");
  };

  if (!questions) return <h3 className="text-light">Loading questions...</h3>;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container" style={{ userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none" }}>
      <DeviceDetection />
      <TabDetection onSubmitTest={handleSubmitTest} />
      <QuestionNavigation
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        onQuestionClick={(index) => setCurrentQuestionIndex(index)}
      />
      <div className="main-content">
        <h2 className="section-title">{currentQuestion.category} Section</h2>
        {!isFullscreen && (
          <div
            className="fullscreen-notice"
            style={{
              backgroundColor: "#17c6e5",
              color: "#856404",
              padding: "10px",
              marginBottom: "15px",
              borderRadius: "4px",
              textAlign: "center",
            }}
          >
            <p>
              You exited fullscreen mode.
              <button
                onClick={enterFullscreen}
                style={{
                  marginLeft: "10px",
                  padding: "5px 10px",
                  border: "none",
                  borderRadius: "3px",
                  backgroundColor: "#136b7f",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Return to Fullscreen
              </button>
            </p>
          </div>
        )}

        <div
          className="timer"
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: timeLeft <= 60 ? "#ff4444" : "#1eb2a6",
            color: "white",
            padding: "10px 20px",
            borderRadius: "5px",
            fontSize: "1.2em",
            fontWeight: "bold",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            transition: "background-color 0.3s ease",
          }}
        >
          Time Left: {formatTime(timeLeft)}
        </div>

        {/* <TabDetection /> */}

        {showConfirmation && (
          <div
            className="confirmation-dialog"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              zIndex: 1000,
              maxWidth: "90%",
              width: "400px",
            }}
          >
            <h3
              style={{
                marginBottom: "15px",
                color: "#007bff",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              {getUnansweredQuestions().length > 0
                ? "Unanswered Questions"
                : "Confirm Submission"}
            </h3>
            {getUnansweredQuestions().length > 0 ? (
              <p
                style={{
                  color: "#000",
                  fontSize: "16px",
                }}
              >
                You have not answered the following questions:
                <br />
                <span
                  style={{
                    fontWeight: "bold",
                    display: "block",
                    marginTop: "10px",
                    color: "#000",
                    fontSize: "16px",
                  }}
                >
                  {getUnansweredQuestions().join(", ")}
                </span>
              </p>
            ) : (
              <p
                style={{
                  color: "#000",
                  fontSize: "16px",
                }}
              >
                Are you sure you want to submit your quiz? You won't be able to
                change your answers after submission.
              </p>
            )}
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <button
                onClick={() => setShowConfirmation(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#0056b3")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "#007bff")}
              >
                Continue Answering
              </button>
              <button
                onClick={handleSubmitTest}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#c82333")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "#dc3545")}
              >
                Submit Anyway
              </button>
            </div>
          </div>
        )}

        {currentQuestion && (
          <div className="questions">
            {currentQuestionIndex >= 35 && currentQuestionIndex <= 39 && (
              <div
                className="comprehension-passage"
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "20px",
                  marginBottom: "20px",
                  borderRadius: "8px",
                  border: "1px solid #dee2e6",
                }}
              >
                <h3 style={{ marginBottom: "15px", color: "#1eb2a6" }}>
                  Reading Comprehension
                </h3>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                  {getComprehensionPassage()}
                </p>
              </div>
            )}
            <h2 className="text-light">
              {"("}
              {currentQuestionIndex + 1}
              {")"} {currentQuestion.question}
            </h2>

            {currentQuestion.image && (
              <div
                className="question-image-container"
                style={{
                  margin: "20px 0",
                  textAlign: "center",
                  maxWidth: "100%",
                  overflow: "hidden",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <img
                  src={currentQuestion.image}
                  alt="Question"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "400px",
                    objectFit: "contain",
                  }}
                />
              </div>
            )}

            <ul key={`question-${currentQuestionIndex}`}>
              {currentQuestion.options?.map((q, i) => (
                <li key={`q${currentQuestionIndex}-${i}`}>
                  <input
                    type="radio"
                    value={i}
                    name={`question-${currentQuestionIndex}`}
                    id={`q${currentQuestionIndex}-${i}`}
                    onChange={() => onSelect(i)}
                    checked={check === i}
                  />
                  <label
                    className="text-primary"
                    htmlFor={`q${currentQuestionIndex}-${i}`}
                  >
                    {q}
                  </label>
                  <div
                    className={`check ${check === i ? "checked" : ""}`}
                  ></div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid">
          {currentQuestionIndex > 0 ? (
            <button
              className="btn prev"
              onClick={onPrev}
              style={{ width: "100px" }}
            >
              Prev
            </button>
          ) : (
            <div></div>
          )}
          <button
            className="btn next"
            onClick={onNext}
            style={{ width: "100px" }}
          >
            {currentQuestionIndex === questions?.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
