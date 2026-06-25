import { createRoot } from "react-dom/client";

import App from "./App";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import UserContextProvider from "./contexts/UserContext";

createRoot(document.getElementById("root")).render(
    <UserContextProvider>
      <App />
    </UserContextProvider>
);
