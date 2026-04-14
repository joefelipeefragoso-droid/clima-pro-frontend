import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getStoredUser } from '../auth/authSession';

export default function ClientRoute({ user, children, allowOnboardingPage = false }) {
  const authenticatedUser = user || getStoredUser();
  const location = useLocation();

  if (!authenticatedUser) {
    return <Navigate to="/login" replace />;
  }

  const userRole = String(authenticatedUser.role || '').toLowerCase();
  
  if (userRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  const onboardingCompleted = Boolean(authenticatedUser.onboarding_completed);
  const isOnboardingPath = location.pathname.startsWith('/onboarding');

  if (!onboardingCompleted && !allowOnboardingPage && !isOnboardingPath) {
    return <Navigate to="/onboarding" replace />;
  }

  if (onboardingCompleted && isOnboardingPath) {
    return <Navigate to="/app" replace />;
  }

  return children;
}
