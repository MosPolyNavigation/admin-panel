import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface RequirePermissionProps {
  goal: string;
  right: string;
  children: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({ goal, right, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  const userRights = user.rights_by_goals[goal] ?? [];
  const hasPermission = userRights.includes(right);

  if (!hasPermission) {
    return null;
  }

  return <>{children}</>;
};
