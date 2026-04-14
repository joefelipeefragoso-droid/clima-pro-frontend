const AUTH_STORAGE_KEYS = [
  'userLogado',
  'authToken',
  'token',
  'jwt',
  'accessToken',
  'refreshToken'
];

export function getStoredUser() {
  const rawUser = localStorage.getItem('userLogado');
  if (!rawUser) return null;

  try {
    const user = JSON.parse(rawUser);
    
    // Fail-safe de emergencia: Joe Felipe e SEMPRE o administrador principal.
    // Isso evita que cache local antigo "tranque" o acesso dele.
    if (String(user.email || '').toLowerCase() === 'joefelipebarbearia@gmail.com') {
      return {
        ...user,
        role: 'admin',
        onboarding_completed: 1
      };
    }
    
    return user;
  } catch {
    clearAuthData();
    return null;
  }
}

export function clearAuthData() {
  AUTH_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  localStorage.clear();
  sessionStorage.clear();

  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim();
    if (!name) return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });

  window.dispatchEvent(new Event('auth:logout'));
}

export function logout() {
  clearAuthData();
  window.location.replace('/login');
}
