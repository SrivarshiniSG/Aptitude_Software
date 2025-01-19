import { useEffect } from "react";
import { useNavigationType } from "react-router-dom";

const ScrollToTop = () => {
  const navigationType = useNavigationType();

  useEffect(() => {
    // Scroll to top only on PUSH navigation (not on browser back/forward)
    if (navigationType === "PUSH") {
      window.scrollTo(0, 0);
    }
  }, [navigationType]);

  return null;
};

export default ScrollToTop;