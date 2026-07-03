import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { useAuthStore } from '../store';

export function useLogout() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  return async () => {
    localStorage.removeItem('mock_bearer_token');
    await auth.signOut().catch(() => {});
    logout();
    navigate('/login');
  };
}
