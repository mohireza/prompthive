import React from "react";
import { createHashRouter, RouterProvider } from "react-router-dom";
import Root from "./routes/Root";
import ErrorPage from "./ErrorPage";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.js";
import "react-tooltip/dist/react-tooltip.css";
import "./index.css";

import reportWebVitals from "./reportWebVitals";
import HintViewer from "./components/PromptHive/HintViewer";
import LatexHelper from "./components/PromptHive/LatexHelper";
import PromptTreeVisualiser from "./components/PromptHive/PromptTreeVisualiser";
import PromptManager from "./components/PromptHive/PromptManager";

const router = createHashRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <HintViewer />,
      },
      {
        path: '/oatutor-integration-tree-visualiser',
        element: <PromptTreeVisualiser />,
      },
      {
        path: "/latex-conversion",
        element: <LatexHelper />,
      }
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
