import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Network from './pages/Network';
import IntroPath from './pages/IntroPath';
import JobsBoard from './pages/JobsBoard';
import JobsReviewQueue from './pages/JobsReviewQueue';
import JobApplication from './pages/JobApplication';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="network" element={<Network />} />
          <Route path="network/:userId/intro" element={<IntroPath />} />
          <Route path="jobs" element={<JobsBoard />} />
          <Route path="jobs/:jobId/apply" element={<JobApplication />} />
          <Route path="admin/jobs" element={<JobsReviewQueue />} />
        </Route>
      </Routes>
    </Router>
  );
}

