import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import JsonTools from './pages/JsonTools';
import TimeTools from './pages/TimeTools';
import UrlTool from './pages/UrlTool';
import DataGenTool from './pages/DataGenTool';
import RegexTool from './pages/RegexTool';
import FormatConvert from './pages/FormatConvert';
import EncodeDecode from './pages/EncodeDecode';
import HttpStatusTool from './pages/HttpStatusTool';
import TextDiff from './pages/TextDiff';
import TextTemplating from './pages/TextTemplating';

// Placeholder for tools not fully implemented in this demo
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-96 text-gray-400">
    <div className="text-4xl mb-4">🚧</div>
    <h2 className="text-xl font-bold">{title}</h2>
    <p>功能即将上线...</p>
  </div>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="tools/json" element={<JsonTools />} />
          <Route path="tools/time" element={<TimeTools />} />
          <Route path="tools/url" element={<UrlTool />} />
          <Route path="tools/http-status" element={<HttpStatusTool />} />
          <Route path="tools/data-gen" element={<DataGenTool />} />
          <Route path="tools/regex" element={<RegexTool />} />
          <Route path="tools/format-convert" element={<FormatConvert />} />
          <Route path="tools/encode" element={<EncodeDecode />} />
          <Route path="tools/diff" element={<TextDiff />} />
          <Route path="tools/templating" element={<TextTemplating />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;