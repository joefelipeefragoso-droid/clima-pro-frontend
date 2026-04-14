import api from '../services/api';

export function resolveAssetUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;

  const apiBase = api.defaults.baseURL || '';
  const baseUrl = apiBase.replace(/\/api\/?$/, '');
  return `${baseUrl}${url}`;
}

export function applyNicheTheme(config = {}) {
  const root = document.documentElement;
  const primary = config.cor_primaria || '#FBBF24';
  const secondary = config.cor_secundaria || '#3B82F6';
  const backgroundUrl = resolveAssetUrl(config.background_url);

  root.style.setProperty('--primary', primary);
  root.style.setProperty('--primary-hover', primary);
  root.style.setProperty('--secondary', secondary);
  root.style.setProperty('--niche-background-image', backgroundUrl ? `url("${backgroundUrl}")` : 'none');
}
