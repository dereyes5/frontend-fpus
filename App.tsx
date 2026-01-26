import { RouterProvider } from 'react-router';
import { router } from './utils/routes.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
