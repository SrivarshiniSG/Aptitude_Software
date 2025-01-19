import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import beepSound from "../assets/beep.js";

function useTabVisibility({ onSubmitTest }) {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [alertShown, setAlertShown] = useState(false);
  const [audio] = useState(new Audio(beepSound));
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof document.hidden === "undefined") {
      console.log("Page Visibility API is not supported in this browser.");
      return;
    }

    console.log("Tab and window detection initialized");

    audio.preload = "auto";
    audio.volume = 1.0;

    const playBeep = async () => {
      try {
        audio.currentTime = 0;
        await audio.play();
      } catch (error) {
        console.error("Error playing beep:", error);
      }
    };

    const handleSwitch = async () => {
      console.log("Tab/Window switched away!");
      setTabSwitchCount((prevCount) => {
        const newCount = prevCount + 1;
        console.log("Switch count:", newCount);

        playBeep();

        if (newCount === 1 && !alertShown) {
          alert(
            "Warning: You switched away from the test! This is your first warning."
          );
          setAlertShown(true);
        } else if (newCount === 2) {
          alert("You have switched away twice. The test will now end.");
          onSubmitTest().then(() => {
            navigate("/feedback?t=tabswitch");
          });
        }
        return newCount;
      });
    };

    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleSwitch();
      }
    };

    // Handle window focus changes
    const handleWindowBlur = () => {
      handleSwitch();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    const initAudio = () => {
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch((error) => console.error("Error initializing audio:", error));
      document.removeEventListener("click", initAudio);
    };
    document.addEventListener("click", initAudio);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("click", initAudio);
      audio.pause();
      audio.src = "";
      console.log("Tab and window detection cleanup");
    };
  }, [alertShown, navigate, audio, onSubmitTest]);

  return { tabSwitchCount };
}

const TabDetection = ({ onSubmitTest }) => {
  const { tabSwitchCount } = useTabVisibility({ onSubmitTest });

  return (
    <div style={{ display: "none" }}>
      <span>{tabSwitchCount}</span>
    </div>
  );
};

export default TabDetection;
