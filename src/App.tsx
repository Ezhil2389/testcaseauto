import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import DocumentUpload from './pages/DocumentUpload/DocumentUpload';
import SummaryPreview from './pages/SummaryPreview/SummaryPreview';
import TestCaseGeneration from './pages/TestCaseGeneration/TestCaseGeneration';
import TestCaseManagement from './pages/TestCaseManagement/TestCaseManagement';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DocumentUpload />} />
        <Route path="summary" element={<SummaryPreview />} />
        <Route path="generate-tests" element={<TestCaseGeneration />} />
        <Route path="test-management" element={<TestCaseManagement />} />
      </Route>
    </Routes>
  );
}

export default App;