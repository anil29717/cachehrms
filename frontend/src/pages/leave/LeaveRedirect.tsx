import { Navigate } from 'react-router-dom';

export function LeaveRedirect() {
  return <Navigate to="/leave/requests" replace />;
}
