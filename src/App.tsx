import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import HomePage    from './pages/HomePage';
import AdminPage   from './pages/AdminPage';
import SessionPage from './pages/SessionPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"                    element={<HomePage />} />
          <Route path="/admin"               element={<AdminPage />} />
          <Route path="/session/:sessionId"  element={<SessionPage />} />
          <Route path="*"                    element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
