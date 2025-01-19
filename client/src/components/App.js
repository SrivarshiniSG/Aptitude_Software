import "../styles/App.css";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import MobileRestriction from "./MobileRestriction";
import DevToolsBlocker from "./DevToolsBlocker";
import DevToolsBlocked from "./DevToolsBlocked";

import Login from "./Login";
import Quiz from "./Quiz";
import Instructions from "./Instructions";
import Result from "./Result";
import Feedback from "./Feedback";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import { CheckUserExist } from "../helper/helper";
import QuestionUpload from "./QuestionUpload";
import Success from "./Success";

// Layout component that includes DevToolsBlocker
const Layout = () => {
  return (
    <>
      <DevToolsBlocker />
      <Outlet />
    </>
  );
};

/** React Routes */
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Login />,
      },
      {
        path: "/instructions",
        element: (
          <CheckUserExist>
            <Instructions />
          </CheckUserExist>
        ),
      },
      {
        path: "/quiz",
        element: <Quiz />,
      },
      {
        path: "/result",
        element: (
          <CheckUserExist>
            <Result />
          </CheckUserExist>
        ),
      },
      {
        path: "/feedback",
        element: <Feedback />,
      },
      {
        path: "/admin-login",
        element: <AdminLogin />,
      },
      {
        path: "/admin-dashboard",
        element: <AdminDashboard />,
      },
      {
        path: "/question-upload",
        element: <QuestionUpload />,
      },
      {
        path: "/success",
        element: <Success />,
      },
      {
        path: "/mobile-restriction",
        element: <MobileRestriction />,
      },
      {
        path: "/dev-tools-blocked",
        element: <DevToolsBlocked />,
      },
    ],
  },
]);

// Scroll restoration
if (typeof window !== "undefined") {
  window.scrollTo(0, 0);
}

function App() {
  return <RouterProvider router={router} />;
}
export default App;
