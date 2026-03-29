import ReactDOM from "react-dom/client";
import { App as AntApp, ConfigProvider } from "antd";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: "#bd7b2f",
        borderRadius: 14,
        fontFamily: "'Manrope', sans-serif"
      }
    }}
  >
    <AntApp>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AntApp>
  </ConfigProvider>
);
