import type { NavigateFunction } from 'react-router-dom';

export function navigateByRole(role: string, navigate: NavigateFunction) {
  if (role === 'admin' || role === 'super_admin') {
    navigate('/admin/dashboard');
  } else if (role === 'instructor') {
    navigate('/instructor/dashboard');
  } else {
    navigate('/student/dashboard');
  }
}
