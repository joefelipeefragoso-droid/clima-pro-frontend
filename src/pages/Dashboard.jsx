import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../services/api';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  CalendarCheck2,
  CheckCircle,
  Clock3,
  DollarSign,
  Mail,
  MapPin,
  Phone,
  PlusCircle,
  TrendingUp,
  UserRound,
  Wallet,
  Building,
  Building2,
  BadgeCheck,
} from 'lucide-react';
import { getNicheByValue } from '../constants/niches';
import { resolveAssetUrl } from '../utils/nicheTheme';
import { useCompany } from '../context/CompanyContext';

const fmtMoney = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const fmtPercent = (v) => `${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

const STATUS_PAGAMENTO = {
  recebido: { label: 'Recebido', color: 'var(--success)', bg: 'var(--success-bg)' },
  pendente: { label: 'Pendente', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  parcial: { label: 'Parcial', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  cancelado: { label: 'Cancelado', color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' },
};

const EMPTY_FINANCEIRO = {
  faturamentoTotal: 0,
  faturamentoMes: 0,
  recebidoTotal: 0,
  recebidoMes: 0,
  recebidoHoje: 0,
  pendente: 0,
  totalOrcamentos: 0,
  totalClientes: 0,
  ticketMedio: 0,
  topServicos: [],
  formasPagamento: [],
  orcamentosRecentes: [],
  crescimento: {
    recebido_hoje: 0,
    recebido_mes: 0,
    a_receber: 0,
    faturamento_total: 0,
  },
  statusPagamentos: {
    pendentes: 0,
    atrasados: 0,
    em_dia: 0,
  },
  caixaPorColaborador: []
};

function mapCompanyProfile(config = {}) {
  return {
    name: config.nome_empresa || config.companyName || '',
    logoUrl: config.logo_url || config.companyLogo || '',
    cnpj: config.cnpj || '',
    email: config.email || config.companyEmail || '',
    phone: config.telefone || config.companyPhone || '',
    address: config.endereco || config.companyAddress || '',
    city: config.cidade || config.companyCity || '',
  };
}

function hasCompanyProfileConfigured(company = {}) {
  return [
    company.name,
    company.logoUrl,
    company.cnpj,
    company.email,
    company.phone,
    company.address,
    company.city
  ].some((value) => String(value || '').trim() !== '');
}

function Trend({ value, positiveMeansGood = true }) {
  const numeric = Number(value || 0);
  const isPositive = numeric >= 0;
  const good = positiveMeansGood ? isPositive : !isPositive;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: good ? 'var(--success)' : 'var(--danger)'
      }}
    >
      {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {isPositive ? '+' : ''}{fmtPercent(numeric)}
    </span>
  );
}

function MetricCard({ title, value, icon, color, softBg, trend, statusText, trendPositiveMeansGood = true }) {
  return (
    <div
      className="card"
      style={{
        background: softBg,
        border: `1px solid ${color}33`,
        boxShadow: 'var(--shadow-dark)',
        padding: '1.2rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700 }}>{title}</span>
        <div style={{ width: 34, height: 34, borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}22` }}>
          {icon}
        </div>
      </div>

      <div style={{ fontSize: '2rem', lineHeight: 1.05, fontWeight: 900, color: 'var(--text-main)', marginBottom: '0.55rem' }}>
        R$ {fmtMoney(value)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
        <Trend value={trend} positiveMeansGood={trendPositiveMeansGood} />
        {statusText && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{statusText}</span>}
      </div>
    </div>
  );
}

export default function Dashboard({ niche = 'climatizacao', nicheConfig }) {
  const activeNiche = nicheConfig || getNicheByValue(niche);

  const [financeiro, setFinanceiro] = useState(EMPTY_FINANCEIRO);
  const [loadingFinance, setLoadingFinance] = useState(true);

  // Usa o CompanyContext como fonte unica de verdade para dados da empresa
  const { config: rawConfig, loading: loadingCompany } = useCompany();
  const companyProfile = mapCompanyProfile(rawConfig);

  useEffect(() => {
    api.get('/dashboard/financeiro')
      .then((res) => setFinanceiro(res.data || {}))
      .catch(console.error)
      .finally(() => setLoadingFinance(false));
  }, []);

  const company = companyProfile;
  const companyConfigured = hasCompanyProfileConfigured(company);
  const companyName = company.name || 'Nome da sua empresa';
  const companyLogo = company.logoUrl ? resolveAssetUrl(company.logoUrl) : null;

  const companyFields = [
    { key: 'name', label: 'Nome da empresa', value: company.name, icon: <Building size={14} /> },
    { key: 'cnpj', label: 'CNPJ', value: company.cnpj, icon: <BadgeCheck size={14} /> },
    { key: 'email', label: 'E-mail', value: company.email, icon: <Mail size={14} /> },
    { key: 'phone', label: 'Telefone', value: company.phone, icon: <Phone size={14} /> },
    { key: 'address', label: 'Endereco', value: company.address, icon: <MapPin size={14} /> },
    { key: 'city', label: 'Cidade', value: company.city, icon: <Building2 size={14} /> },
  ];

  const financeView = companyConfigured ? financeiro : {
    faturamentoTotal: 0,
    faturamentoMes: 0,
    recebidoTotal: 0,
    recebidoMes: 0,
    recebidoHoje: 0,
    pendente: 0,
    totalOrcamentos: 0,
    totalClientes: 0,
    statusPagamentos: { pendentes: 0, atrasados: 0, em_dia: 0 },
    crescimento: { recebido_hoje: 0, recebido_mes: 0, a_receber: 0, faturamento_total: 0 }
  };

  if (loadingFinance) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <Activity size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  const pctRecebido = financeView.faturamentoTotal > 0
    ? Math.round((Number(financeView.recebidoTotal || 0) / Number(financeView.faturamentoTotal || 0)) * 100)
    : 0;

  return (
    <div>
      {!companyConfigured && (
        <section className="dashboard-onboarding-card mb-6">
          <div className="onboarding-content">
            <div className="onboarding-icon">
              <Building size={48} color="var(--primary)" />
            </div>
            <div className="onboarding-text">
              <h2>Bem-vindo ao seu painel</h2>
              <p>Adicione sua logo, nome da empresa e demais informações para personalizar o sistema com sua identidade.</p>
              <div className="onboarding-badges">
                <span className="onboarding-badge">Identidade SaaS</span>
                <span className="onboarding-badge">Dados Isolados</span>
                <span className="onboarding-badge">Relatórios Profissionais</span>
              </div>
            </div>
            <div className="onboarding-action">
              <NavLink to="/app/configuracoes" className="btn btn-primary">
                Configurar Empresa
              </NavLink>
            </div>
          </div>
        </section>
      )}

      <section className="company-identity-card mb-6">
        {loadingCompany ? (
          <div className="company-identity-loading">Carregando dados da empresa...</div>
        ) : (
          <>
            <div className="company-identity-top">
              {companyLogo ? (
                <img src={companyLogo} alt={`Logo da empresa ${companyName}`} className="company-identity-logo" />
              ) : (
                <div className="company-identity-logo-placeholder">
                  <Building size={22} />
                  <span>Sua Logo</span>
                </div>
              )}

              <div className="company-identity-main">
                <p className="company-identity-kicker">{companyConfigured ? 'Empresa do cliente' : 'Perfil de Negócio'}</p>
                <h2 className="company-identity-name">{companyConfigured ? companyName : 'Não informado'}</h2>
              </div>
            </div>

            <div className="company-identity-grid">
              {companyFields.map((field) => {
                const safeValue = String(field.value || '').trim();
                return (
                  <div className="company-identity-item" key={field.key}>
                    <span className="company-identity-item-icon">{field.icon}</span>
                    <div>
                      <p className="company-identity-item-label">{field.label}</p>
                      <p className="company-identity-item-value">{safeValue || 'Não informado'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="home-system-row mb-6">
        <div className="home-system-title">
          <p className="home-system-kicker">{ (activeNiche.theme?.moduleName || 'Gestor Pro').toUpperCase() }</p>
          <h1>Painel Financeiro SaaS</h1>
        </div>

        <div className="home-system-actions">
          <NavLink to="/app/relatorios" className="btn btn-outline btn-sm">
            <BarChart2 size={16} /> Relatorios
          </NavLink>
          <NavLink to="/app/orcamentos" className="btn btn-primary btn-sm">
            <PlusCircle size={16} /> {activeNiche.theme?.saleLabel || 'Novo Orcamento'}
          </NavLink>
        </div>
      </section>

      <div className="grid-responsive mb-4">
        <MetricCard
          title="Recebido Hoje"
          value={financeView.recebidoHoje}
          icon={<CalendarCheck2 size={18} color="var(--success)" />}
          color="var(--success)"
          softBg="var(--success-bg)"
          trend={financeView.crescimento?.recebido_hoje}
          statusText={`${financeView.statusPagamentos?.em_dia || 0} pendentes em dia`}
        />
        <MetricCard
          title="Recebido no Mes"
          value={financeView.recebidoMes}
          icon={<Wallet size={18} color="#3B82F6" />}
          color="#3B82F6"
          softBg="rgba(59,130,246,0.12)"
          trend={financeView.crescimento?.recebido_mes}
          statusText="Comparado ao mes anterior"
        />
        <MetricCard
          title="A Receber"
          value={financeView.pendente}
          icon={<Clock3 size={18} color="#F59E0B" />}
          color="#F59E0B"
          softBg="rgba(245,158,11,0.12)"
          trend={financeView.crescimento?.a_receber}
          trendPositiveMeansGood={false}
          statusText={`${financeView.statusPagamentos?.pendentes || 0} pendentes - ${financeView.statusPagamentos?.atrasados || 0} atrasados`}
        />
        <MetricCard
          title="Faturamento Total"
          value={financeView.faturamentoTotal}
          icon={<TrendingUp size={18} color="#3B82F6" />}
          color="#3B82F6"
          softBg="rgba(59,130,246,0.12)"
          trend={financeView.crescimento?.faturamento_total}
          statusText={`${financeView.totalOrcamentos || 0} vendas registradas`}
        />
      </div>

      <div className="card card-dark mb-6" style={{ border: '1px solid var(--border-color)' }}>
        <div className="flex justify-between items-center" style={{ gap: '0.8rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Status de Pagamentos</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>{pctRecebido}% recebido do total</span>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
          <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}><CheckCircle size={12} /> Em dia: {financeView.statusPagamentos?.em_dia || 0}</span>
          <span className="badge" style={{ background: 'rgba(245,158,11,0.18)', color: '#F59E0B' }}><Clock3 size={12} /> Pendentes: {financeView.statusPagamentos?.pendentes || 0}</span>
          <span className="badge" style={{ background: 'rgba(239,68,68,0.18)', color: 'var(--danger)' }}><AlertTriangle size={12} /> Atrasados: {financeView.statusPagamentos?.atrasados || 0}</span>
          <span className="badge" style={{ background: 'rgba(59,130,246,0.18)', color: '#60A5FA' }}><DollarSign size={12} /> Ticket medio: R$ {fmtMoney(financeView.ticketMedio)}</span>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${pctRecebido}%`, background: 'linear-gradient(90deg, #3B82F6, #10B981)', height: '100%', borderRadius: '999px', transition: 'width 0.6s ease' }} />
        </div>
      </div>

      <div className="card card-dark mb-6" style={{ border: '1px solid var(--border-color)' }}>
        <div className="flex justify-between items-center" style={{ gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Caixa por Colaborador</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--secondary)', fontWeight: 700 }}>Visao individual de recebido e pendente</span>
        </div>

        {(!financeView.caixaPorColaborador || financeView.caixaPorColaborador.length === 0) ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sem dados de colaboradores ainda.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {financeView.caixaPorColaborador.map((item, index) => {
              const recebido = Number(item.recebido || 0);
              const aReceber = Number(item.a_receber || 0);
              const total = recebido + aReceber;
              const ratio = total > 0 ? Math.max(Math.min((recebido / total) * 100, 100), 0) : 0;

              return (
                <div key={`${item.colaborador}-${index}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserRound size={16} color="#60A5FA" />
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{item.colaborador}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--success)' }}>Recebido: R$ {fmtMoney(recebido)}</span>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#F59E0B' }}>A receber: R$ {fmtMoney(aReceber)}</span>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${ratio}%`, background: 'linear-gradient(90deg, #10B981, #3B82F6)', height: '100%' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid-responsive mb-6">
        <div className="card card-dark">
          <div className="flex justify-between items-center mb-4">
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Orcamentos Recentes</h3>
            <NavLink to="/app/orcamentos" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>Ver todos</NavLink>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {financeView.orcamentosRecentes?.length ? financeView.orcamentosRecentes.map((o) => {
              const sp = STATUS_PAGAMENTO[o.status_pagamento] || STATUS_PAGAMENTO.pendente;
              return (
                <NavLink key={o.id} to={`/app/orcamento/${o.id}`} style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', gap: '0.6rem', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.7rem 0.9rem', borderRadius: '12px' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-main)' }}>#{o.numero_orcamento} - {o.cliente_nome || 'Sem cliente'}</p>
                    <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{o.data_emissao} · {o.forma_pagamento || '-'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '0.88rem' }}>R$ {fmtMoney(o.valor_total)}</p>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', color: sp.color, background: sp.bg, textTransform: 'uppercase' }}>{sp.label}</span>
                  </div>
                </NavLink>
              );
            }) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', fontSize: '0.875rem' }}>Nenhum orcamento ainda.</p>}
          </div>
        </div>

        <div className="grid-stack">
          <div className="card card-dark">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.9rem' }}>Servicos Mais Pedidos</h3>
            {financeView.topServicos?.length ? financeView.topServicos.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--secondary)', background: 'rgba(59,130,246,0.15)', padding: '2px 7px', borderRadius: '999px' }}>#{i + 1}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{s.nome}</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.total}x</span>
              </div>
            )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sem dados ainda.</p>}
          </div>

          <div className="card card-dark">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.9rem' }}>Formas de Pagamento</h3>
            {financeView.formasPagamento?.length ? financeView.formasPagamento.map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{f.forma}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{f.total}x · R$ {fmtMoney(f.valor)}</span>
              </div>
            )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sem dados ainda.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

