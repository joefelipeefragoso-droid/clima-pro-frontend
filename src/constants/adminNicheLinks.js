import { listNiches } from './niches';

const nichePresets = {
  climatizacao: {
    slug: 'clima',
    name: 'Clima Gestor',
    description: 'Gestao para climatizacao e servicos relacionados',
    status: 'ativo',
    icon: 'clima',
    nicheValue: 'climatizacao',
    envUrlKey: 'VITE_NICHE_CLIMA_URL',
  },
  terraplanagem: {
    slug: 'terra',
    name: 'Terra Gestor',
    description: 'Gestao para terraplanagem e servicos relacionados',
    status: 'ativo',
    icon: 'terra',
    nicheValue: 'terraplanagem',
    envUrlKey: 'VITE_NICHE_TERRA_URL',
  },
  barbearia: {
    slug: 'barbearia',
    name: 'Gestor Pro',
    description: 'Gestao para barbearia e servicos relacionados',
    status: 'ativo',
    icon: 'barbearia',
    nicheValue: 'barbearia'
  },
  seguranca_eletronica: {
    slug: 'seguranca',
    name: 'Gestor de Seguranca',
    description: 'Gestao para seguranca eletronica e servicos relacionados',
    status: 'ativo',
    icon: 'seguranca',
    nicheValue: 'seguranca_eletronica'
  },
  outro: {
    slug: 'outro',
    name: 'Gestor Outro',
    description: 'Gestao para nichos personalizados',
    status: 'ativo',
    icon: 'outro',
    nicheValue: 'outro'
  }
};

function sanitizeBaseUrl(baseUrl) {
  return String(baseUrl || '').trim().replace(/\/+$/, '');
}

function getFrontendBaseUrl({ origin } = {}) {
  const envBase =
    import.meta.env?.VITE_APP_BASE_URL ||
    import.meta.env?.VITE_FRONTEND_BASE_URL ||
    '';
  return sanitizeBaseUrl(envBase || origin);
}

export function getNicheLoginUrl(nicheValue, { origin } = {}) {
  const preset = nichePresets[nicheValue] || {};
  const envUrl = preset.envUrlKey ? String(import.meta.env?.[preset.envUrlKey] || '').trim() : '';
  if (envUrl) return envUrl;

  const baseUrl = getFrontendBaseUrl({ origin });
  const query = `nicho=${encodeURIComponent(nicheValue)}`;
  const path = `/login?${query}`;
  return baseUrl ? `${baseUrl}${path}` : path;
}

export function resolveNicheLinks({ origin } = {}) {
  return listNiches({ includeGeneral: false }).map((niche) => {
    const preset = nichePresets[niche.value] || {};
    const nicheValue = preset.nicheValue || niche.value;
    const url = getNicheLoginUrl(nicheValue, { origin });

    return {
      slug: preset.slug || niche.value,
      name: preset.name || niche.theme?.moduleName || niche.label,
      description: preset.description || `Acesso rapido ao nicho ${niche.label}`,
      url,
      status: preset.status || 'ativo',
      icon: preset.icon || niche.value
    };
  });
}
