import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './features/dashboard/DashboardPage';
import LogListPage from './features/log-list/LogListPage';
import LogDetailPage from './features/log-detail/LogDetailPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/logs" element={<LogListPage />} />
        <Route path="/logs/:id" element={<LogDetailPage />} />
        <Route path="/anomalies/:id" element={<LogDetailPage />} />
      </Routes>
    </Layout>
  );
}