import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import JsonTools from './pages/JsonTools';
import JsonAnalyzer from './pages/JsonAnalyzer';
import TimeTools from './pages/TimeTools';
import UrlTool from './pages/UrlTool';
import DataGenTool from './pages/DataGenTool';
import RegexTool from './pages/RegexTool';
import FormatConvert from './pages/FormatConvert';
import EncodeDecode from './pages/EncodeDecode';
import CryptoTool from './pages/CryptoTool';
import HttpStatusTool from './pages/HttpStatusTool';
import TextDiff from './pages/TextDiff';
import TextTemplating from './pages/TextTemplating';
import FileConverter from './pages/FileConverter';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="tools/json" element={<JsonTools />} />
          <Route path="tools/json-analyze" element={<JsonAnalyzer />} />
          <Route path="tools/time" element={<TimeTools />} />
          <Route path="tools/url" element={<UrlTool />} />
          <Route path="tools/http-status" element={<HttpStatusTool />} />
          <Route path="tools/data-gen" element={<DataGenTool />} />
          <Route path="tools/regex" element={<RegexTool />} />
          <Route path="tools/format-convert" element={<FormatConvert />} />
          <Route path="tools/file-convert" element={<FileConverter />} />
          <Route path="tools/encode" element={<EncodeDecode />} />
          <Route path="tools/crypto" element={<CryptoTool />} />
          <Route path="tools/diff" element={<TextDiff />} />
          <Route path="tools/templating" element={<TextTemplating />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;