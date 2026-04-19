import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "@/context/ThemeContext";
import { APP_INFO } from "@/data/app.constants";
import "./index.css";

if (typeof document !== "undefined") {
	document.title = APP_INFO.fullName;
}

createRoot(document.getElementById("root")).render(
	<ThemeProvider>
		<App />
	</ThemeProvider>
);
