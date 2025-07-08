import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth.tsx';
import { Layout } from '@/components/layout/Layout';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Boards } from '@/pages/Boards';
import { NewBoard } from '@/pages/NewBoard';
import { BoardDetail } from '@/pages/BoardDetail';
import { NewTicket } from '@/pages/NewTicket';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/hooks/useTheme';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <Layout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/boards"
                element={
                  <PrivateRoute>
                    <Boards />
                  </PrivateRoute>
                }
              />
              <Route
                path="/boards/new"
                element={
                  <PrivateRoute>
                    <NewBoard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/boards/:id"
                element={
                  <PrivateRoute>
                    <BoardDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/boards/:id/tickets/new"
                element={
                  <PrivateRoute>
                    <NewTicket />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/boards" />} />
            </Routes>
          </Layout>
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
