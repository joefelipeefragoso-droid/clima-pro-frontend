export const BUDGET_STATUS = {
  em_aberto: {
    label: 'Em Aberto',
    color: '#64748b', // Slate 500
    bg: 'rgba(100, 116, 139, 0.1)'
  },
  enviado: {
    label: 'Enviado',
    color: '#3b82f6', // Blue 500
    bg: 'rgba(59, 130, 246, 0.1)'
  },
  em_analise: {
    label: 'Em Análise',
    color: '#6366f1', // Indigo 500
    bg: 'rgba(99, 102, 241, 0.1)'
  },
  aguardando_aprovacao: {
    label: 'Aguardando Aprovação',
    color: '#f59e0b', // Amber 500
    bg: 'rgba(245, 158, 11, 0.1)'
  },
  aprovado: {
    label: 'Aprovado',
    color: '#10b981', // Emerald 500
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  em_execucao: {
    label: 'Em Execução',
    color: '#eab308', // Yellow 500
    bg: 'rgba(234, 179, 8, 0.1)'
  },
  finalizado: {
    label: 'Finalizado',
    color: '#047857', // Emerald 700
    bg: 'rgba(4, 120, 87, 0.1)'
  },
  cancelado: {
    label: 'Cancelado',
    color: '#ef4444', // Red 500
    bg: 'rgba(239, 68, 68, 0.1)'
  }
};

export const STATUS_GROUPS = [
  {
    label: 'Sistemas Antigos',
    options: ['em_aberto', 'enviado']
  },
  {
    label: 'Nova Métrica',
    options: ['em_analise', 'aguardando_aprovacao', 'aprovado', 'em_execucao', 'finalizado', 'cancelado']
  }
];

/**
 * Helper para normalizar status vindo do banco (pode estar com espaços ou termos antigos)
 */
export const normalizeStatus = (status) => {
  if (!status) return 'em_aberto';
  const s = status.toLowerCase().replace(/\s+/g, '_');
  if (BUDGET_STATUS[s]) return s;
  
  // Mapeamentos de legados
  if (s === 'novo' || s === 'novo_vazio') return 'em_analise';
  if (s === 'em_andamento') return 'em_execucao';
  
  return 'em_aberto';
};
