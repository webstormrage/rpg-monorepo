import { Layout } from "antd";
import { Route, Routes } from "react-router-dom";

import { SceneEditorPage } from "./pages/SceneEditorPage";
import { ScenesListPage } from "./pages/ScenesListPage";

export default function App() {
  return (
    <Layout className="app-shell">
      <Layout.Content className="app-content">
        <Routes>
          <Route path="/" element={<ScenesListPage />} />
          <Route path="/scenes/:slug" element={<SceneEditorPage />} />
        </Routes>
      </Layout.Content>
    </Layout>
  );
}
