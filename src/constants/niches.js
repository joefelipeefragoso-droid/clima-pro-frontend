export const NICHES = [
  {
    value: 'climatizacao',
    label: 'Climatizacao',
    legacyLabels: ['Ar-condicionado'],
    theme: {
      moduleName: 'ClimaGestor',
      dashboardTitle: 'Operacao de Climatizacao',
      accentLabel: 'Climatizacao',
      saleLabel: 'Novo Orcamento',
      serviceLabel: 'Servicos de Climatizacao',
      materialLabel: 'Pecas e Materiais'
    }
  },
  {
    value: 'terraplanagem',
    label: 'Terraplanagem',
    legacyLabels: [],
    theme: {
      moduleName: 'TerraGestor',
      dashboardTitle: 'Operacao de Terraplanagem',
      accentLabel: 'Terraplanagem',
      saleLabel: 'Nova Obra',
      serviceLabel: 'Servicos de Terraplanagem',
      materialLabel: 'Insumos e Equipamentos'
    }
  },
  {
    value: 'barbearia',
    label: 'Barbearia',
    legacyLabels: [],
    theme: { moduleName: 'Gestor Pro', dashboardTitle: 'Operacao de Barbearia', accentLabel: 'Barbearia' }
  },
  {
    value: 'seguranca_eletronica',
    label: 'Seguranca eletronica',
    legacyLabels: ['Seguranca eletronica'],
    theme: { moduleName: 'SecurityGestor', dashboardTitle: 'Operacao de Seguranca Eletronica', accentLabel: 'Seguranca eletronica' }
  },
  {
    value: 'Geral',
    label: 'Geral',
    legacyLabels: [],
    theme: { moduleName: 'Gestor Pro', dashboardTitle: 'Operacao Geral', accentLabel: 'Geral' }
  },
  {
    value: 'outro',
    label: 'Outro',
    legacyLabels: ['Outros'],
    theme: { moduleName: 'Gestor Pro', dashboardTitle: 'Operacao Personalizada', accentLabel: 'Outro' }
  }
];

export const CORE_NICHES = NICHES.filter((niche) => niche.value !== 'Geral');

export function getNicheByValue(value) {
  return NICHES.find((niche) => niche.value === value) || NICHES[0];
}

export function listNiches({ includeGeneral = true } = {}) {
  return includeGeneral ? NICHES : CORE_NICHES;
}
