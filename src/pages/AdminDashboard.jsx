import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Copy,
  CreditCard,
  Eye,
  ExternalLink,
  LogOut,
  Mountain,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  Wind,
  X,
  Book
} from 'lucide-react';
import { listNiches } from '../constants/niches';
import { resolveNicheLinks } from '../constants/adminNicheLinks';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const statusColors = {
  ativo: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.14)' },
  teste: { color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.14)' },
  vencido: { color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.14)' },
  cancelado: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.14)' },
  inadimplente: { color: '#F97316', bg: 'rgba(249, 115, 22, 0.14)' },
  inativo: { color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.14)' },
  primeiro_acesso_pendente: { color: '#C084FC', bg: 'rgba(192, 132, 252, 0.14)' },
  pendente: { color: '#C084FC', bg: 'rgba(192, 132, 252, 0.14)' }
};

const emptyFilters = {
  search: '',
  status: '',
  product: '',
  plan: '',
  billingCycle: '',
  active: '',
  niche: '',
  source: '',
  registrationMonth: '',
  purchaseMonth: '',
  expiringSoon: '',
  sortBy: 'recent',
  sortOrder: 'desc'
};

function formatMoney(value) {
  return brl.format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return 'Nao informado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('pt-BR');
}

function fallback(value, text = 'Nao informado') {
  return value === null || value === undefined || value === '' ? text : value;
}

async function copyTextToClipboard(text) {
  if (!text) return false;
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const input = document.createElement('textarea');
  input.value = text;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.focus();
  input.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(input);
  return copied;
}

function statusBadge(status) {
  const normalized = String(status || 'inativo').toLowerCase();
  const style = statusColors[normalized] || statusColors.inativo;
  return (
    <span style={{ ...styles.badge, color: style.color, background: style.bg }}>
      {normalized.replaceAll('_', ' ')}
    </span>
  );
}

function renderNicheIcon(iconName) {
  if (iconName === 'clima') return <Wind size={18} />;
  if (iconName === 'terra') return <Mountain size={18} />;
  return <Shield size={18} />;
}

function MetricCard({ title, value, subtitle, tone = 'dark', icon }) {
  const cardStyle = tone === 'gold' ? styles.metricGold : styles.metric;
  return (
    <div style={cardStyle}>
      <div style={styles.metricIcon}>{icon}</div>
      <span style={styles.metricTitle}>{title}</span>
      <strong style={styles.metricValue}>{value}</strong>
      {subtitle && <small style={styles.metricSubtitle}>{subtitle}</small>}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={styles.detailRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const manualInitialState = {
  nome: '',
  email: '',
  telefone: '',
  company_name: '',
  tipo_empresa: 'climatizacao',
  access_mode: 'first_access',
  senha_provisoria: '',
  confirmar_senha: '',
  plano: 'mensal',
  valor_venda_inicial: '',
  valor_mensalidade: '',
  periodicidade_cobranca: 'mensal',
  forma_pagamento: 'pix',
  data_venda: new Date().toISOString().split('T')[0],
  dia_vencimento: '',
  proximo_vencimento: '',
  status_assinatura: 'ativo',
  observacoes: ''
};

function ManualCustomerModal({ onClose, onCreated }) {
  const [form, setForm] = useState(manualInitialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [firstAccessResult, setFirstAccessResult] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState('');

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setCopyFeedback('');
    setFirstAccessResult(null);

    if (form.access_mode === 'manual_password') {
      if ((form.senha_provisoria || '').length < 6) {
        setSaving(false);
        setError('Senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (form.senha_provisoria !== form.confirmar_senha) {
        setSaving(false);
        setError('Senha e confirmacao nao conferem.');
        return;
      }
    }

    try {
      const res = await api.post('/admin/customers/manual', form);
      await onCreated();
      if (form.access_mode === 'first_access') {
        setFirstAccessResult(res.data?.first_access || null);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao cadastrar cliente manualmente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    const link = firstAccessResult?.link;
    if (!link) return;
    const copied = await copyTextToClipboard(link);
    setCopyFeedback(copied ? 'Link copiado com sucesso.' : 'Nao foi possivel copiar automaticamente.');
  };

  return (
    <div style={styles.modalOverlay}>
      <form className="admin-manual-form" style={styles.modalContent} onSubmit={submit}>
        <div style={styles.modalHeader}>
          <div>
            <p style={styles.kicker}>Venda manual / Cadastro manual</p>
            <h2 style={styles.modalTitle}>Adicionar cliente manualmente</h2>
          </div>
          <button className="btn btn-outline" type="button" onClick={onClose} style={styles.iconButton}><X size={18} /></button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.detailGrid}>
          <section style={styles.detailSection}>
            <h3>Dados do cliente</h3>
            <input required value={form.nome} onChange={(event) => updateField('nome', event.target.value)} placeholder="Nome do cliente" />
            <input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="E-mail" />
            <input value={form.telefone} onChange={(event) => updateField('telefone', event.target.value)} placeholder="Telefone / WhatsApp" />
            <input value={form.company_name} onChange={(event) => updateField('company_name', event.target.value)} placeholder="Nome da empresa" />
            <select value={form.tipo_empresa} onChange={(event) => updateField('tipo_empresa', event.target.value)}>
              {listNiches({ includeGeneral: false }).map((niche) => <option key={niche.value} value={niche.value}>{niche.label}</option>)}
            </select>
          </section>

          <section style={styles.detailSection}>
            <h3>Dados de acesso</h3>
            <select value={form.access_mode} onChange={(event) => updateField('access_mode', event.target.value)}>
              <option value="first_access">Gerar link de primeiro acesso</option>
              <option value="manual_password">Criar com senha</option>
            </select>

            {form.access_mode === 'manual_password' ? (
              <>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={form.senha_provisoria}
                  onChange={(event) => updateField('senha_provisoria', event.target.value)}
                  placeholder="Senha"
                />
                <input
                  required
                  minLength={6}
                  type="password"
                  value={form.confirmar_senha}
                  onChange={(event) => updateField('confirmar_senha', event.target.value)}
                  placeholder="Confirmar senha"
                />
                <p style={styles.muted}>Neste modo, o cliente ja podera entrar com e-mail e senha.</p>
              </>
            ) : (
              <>
                <p style={styles.muted}>
                  Neste modo, o sistema cria o cliente sem senha e gera um link unico para primeiro acesso.
                </p>
                {firstAccessResult?.link && (
                  <>
                    <label style={styles.muted}>Link de primeiro acesso</label>
                    <div style={styles.firstAccessLinkBox}>{firstAccessResult.link}</div>
                    <div style={styles.actionsRow}>
                      <button className="btn btn-primary" type="button" onClick={handleCopyLink}>Copiar link</button>
                    </div>
                    {copyFeedback && <p style={styles.muted}>{copyFeedback}</p>}
                  </>
                )}
              </>
            )}
          </section>

          <section style={styles.detailSection}>
            <h3>Dados financeiros</h3>
            <select value={form.plano} onChange={(event) => updateField('plano', event.target.value)}>
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
              <option value="teste">Teste</option>
              <option value="personalizado">Personalizado</option>
            </select>
            <input type="number" min="0" step="0.01" value={form.valor_venda_inicial} onChange={(event) => updateField('valor_venda_inicial', event.target.value)} placeholder="Valor da venda inicial" />
            <input required={form.plano !== 'teste'} type="number" min="0" step="0.01" value={form.valor_mensalidade} onChange={(event) => updateField('valor_mensalidade', event.target.value)} placeholder="Valor da mensalidade" />
            <select value={form.periodicidade_cobranca} onChange={(event) => updateField('periodicidade_cobranca', event.target.value)}>
              <option value="mensal">Mensal</option>
              <option value="bimestral">Bimestral</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
              <option value="personalizada">Personalizada</option>
            </select>
            <select value={form.forma_pagamento} onChange={(event) => updateField('forma_pagamento', event.target.value)}>
              <option value="pix">Pix</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartao</option>
              <option value="transferencia">Transferencia</option>
              <option value="boleto">Boleto</option>
              <option value="outro">Outro</option>
            </select>
          </section>

          <section style={styles.detailSection}>
            <h3>Assinatura</h3>
            <input required type="date" value={form.data_venda} onChange={(event) => updateField('data_venda', event.target.value)} />
            <input type="number" min="1" max="31" value={form.dia_vencimento} onChange={(event) => updateField('dia_vencimento', event.target.value)} placeholder="Dia de vencimento" />
            <input required type="date" value={form.proximo_vencimento} onChange={(event) => updateField('proximo_vencimento', event.target.value)} />
            <select value={form.status_assinatura} onChange={(event) => updateField('status_assinatura', event.target.value)}>
              <option value="ativo">Ativa</option>
              <option value="pendente">Pendente</option>
              <option value="teste">Em teste</option>
              <option value="cancelado">Cancelada</option>
              <option value="inadimplente">Inadimplente</option>
            </select>
            <textarea value={form.observacoes} onChange={(event) => updateField('observacoes', event.target.value)} placeholder="Observacoes" rows={4} style={styles.textarea} />
          </section>
        </div>

        <div style={styles.actionsRow}>
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar cliente manual'}</button>
          <button className="btn btn-outline" type="button" onClick={onClose}>Cancelar</button>
        </div>

        {form.access_mode === 'first_access' && firstAccessResult?.link && (
          <div style={styles.actionsRow}>
            <button className="btn btn-outline" type="button" onClick={onClose}>Fechar</button>
          </div>
        )}
      </form>
    </div>
  );
}

function CustomerDetailsModal({ customerId, onClose, onStatusUpdated }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get(`/admin/customers/${customerId}`)
      .then((res) => {
        if (mounted) setDetails(res.data);
      })
      .catch((err) => {
        if (mounted) setError(err.response?.data?.error || 'Erro ao carregar detalhes do cliente.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [customerId]);

  const updateStatus = async (status) => {
    await api.patch(`/admin/customers/${customerId}/status`, { status });
    onStatusUpdated();
    const res = await api.get(`/admin/customers/${customerId}`);
    setDetails(res.data);
  };

  const updateBilling = async () => {
    const valor = prompt('Novo valor da mensalidade:', customer?.valor_mensalidade || finance?.monthly_amount || '');
    if (valor === null) return;
    const vencimento = prompt('Proximo vencimento (YYYY-MM-DD):', customer?.proximo_vencimento || subscription?.expires_at || '');
    if (vencimento === null) return;
    await api.patch(`/admin/customers/${customerId}/billing`, {
      valor_mensalidade: valor,
      proximo_vencimento: vencimento,
      plano: customer?.plano,
      periodicidade_cobranca: customer?.periodicidade_cobranca || subscription?.billing_cycle,
      forma_pagamento: customer?.forma_pagamento,
      status_assinatura: subscription?.status
    });
    onStatusUpdated();
    const res = await api.get(`/admin/customers/${customerId}`);
    setDetails(res.data);
  };

  const resendFirstAccess = async () => {
    try {
      const res = await api.post(`/admin/customers/${customerId}/resend-first-access`);
      const token = res.data?.first_access_token || res.data?.first_access?.token;
      const localFallback = token ? `${window.location.origin}/primeiro-acesso?token=${token}` : null;
      const link = res.data?.first_access?.link || res.data?.first_access_link || localFallback;

      let updatedData;
      try {
        const updated = await api.get(`/admin/customers/${customerId}`);
        updatedData = { ...updated.data };
      } catch (e) {
        // ignora erro silencioso
      }

      if (updatedData) {
        if (!updatedData.first_access && token) {
          updatedData.first_access = {
            link: link,
            token: token,
            status: 'pendente'
          };
        } else if (updatedData.first_access && !updatedData.first_access.link && token) {
          updatedData.first_access.link = link;
          updatedData.first_access.status = 'pendente';
        }
        setDetails(updatedData);
      }

      if (link) {
        const copied = await copyTextToClipboard(link);
        setCopyFeedback(copied ? 'Novo link gerado e copiado!' : 'Novo link gerado. Copie manualmente abaixo.');
      } else {
        setCopyFeedback('Falha: Servidor não retornou o token.');
      }
      onStatusUpdated();
    } catch (err) {
      setCopyFeedback(err.response?.data?.error || 'Erro de conexão ao gerar link.');
    }
  };

  const handleCopyExistingLink = async () => {
    const link = details?.first_access?.link;
    if (!link) return;
    const copied = await copyTextToClipboard(link);
    setCopyFeedback(copied ? 'Link copiado com sucesso.' : 'Nao foi possivel copiar automaticamente.');
  };

  const customer = details?.customer;
  const firstAccess = details?.first_access;
  const subscription = details?.subscription;
  const finance = details?.finance;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <div>
            <p style={styles.kicker}>Detalhes do cliente</p>
            <h2 style={styles.modalTitle}>{customer ? fallback(customer.nome, 'Cliente sem nome') : 'Carregando...'}</h2>
          </div>
          <button className="btn btn-outline" onClick={onClose} style={styles.iconButton}><X size={18} /></button>
        </div>

        {loading && <p style={styles.emptyState}>Carregando historico real do banco...</p>}
        {error && <p style={styles.error}>{error}</p>}

        {customer && (
          <>
            <div style={styles.detailGrid}>
              <section style={styles.detailSection}>
                <h3>Dados do cliente</h3>
                <DetailRow label="Nome" value={fallback(customer.nome)} />
                <DetailRow label="E-mail" value={fallback(customer.email)} />
                <DetailRow label="Telefone" value={fallback(customer.telefone)} />
                <DetailRow label="Empresa" value={fallback(customer.company_name)} />
                <DetailRow label="Nicho" value={fallback(customer.tipo_empresa)} />
                <DetailRow label="Cadastro" value={formatDate(customer.created_at)} />
                <DetailRow label="Origem" value={fallback(customer.source, 'sistema')} />
                <DetailRow label="Status da conta" value={statusBadge(customer.account_status || customer.status)} />
              </section>

              <section style={styles.detailSection}>
                <h3>Assinatura atual</h3>
                <DetailRow label="Produto" value={fallback(subscription.product_name, 'Sem compra')} />
                <DetailRow label="Plano" value={fallback(subscription.plan_name)} />
                <DetailRow label="Ciclo" value={fallback(subscription.billing_cycle)} />
                <DetailRow label="Status" value={statusBadge(subscription.status)} />
                <DetailRow label="Ativacao" value={formatDate(subscription.started_at)} />
                <DetailRow label="Vencimento" value={formatDate(subscription.expires_at)} />
                <DetailRow label="Cancelamento" value={formatDate(subscription.canceled_at)} />
                <DetailRow label="Venda inicial" value={formatMoney(subscription.initial_sale_amount)} />
                <DetailRow label="Mensalidade" value={formatMoney(subscription.current_amount)} />
                <DetailRow label="Forma de pagamento" value={fallback(subscription.payment_method)} />
                <DetailRow label="Data da venda" value={formatDate(subscription.sale_date)} />
                <DetailRow label="Dia de vencimento" value={fallback(subscription.due_day)} />
              </section>
            </div>

            <section style={styles.detailSectionFull}>
              <h3>Primeiro acesso</h3>
              <DetailRow label="Status do link" value={statusBadge(firstAccess?.status || 'indisponivel')} />
              <DetailRow label="Expira em" value={formatDate(firstAccess?.expires_at)} />
              <DetailRow label="Senha criada em" value={formatDate(firstAccess?.used_at)} />
              {firstAccess?.link ? (
                <>
                  <div style={styles.firstAccessLinkBox}>{firstAccess.link}</div>
                  <div style={styles.actionsRow}>
                    <button className="btn btn-primary" onClick={handleCopyExistingLink}>Copiar link</button>
                    <button className="btn btn-outline" onClick={resendFirstAccess}>Gerar novo link</button>
                  </div>
                </>
              ) : (
                <div style={styles.actionsRow}>
                  <button className="btn btn-outline" onClick={resendFirstAccess}>Gerar novo link</button>
                </div>
              )}
              {copyFeedback && <p style={styles.muted}>{copyFeedback}</p>}
            </section>

            <section style={styles.detailSectionFull}>
              <h3>Financeiro</h3>
              <div style={styles.financeGrid}>
                <MetricCard title="Total pago" value={formatMoney(finance.total_paid)} icon={<TrendingUp size={18} />} />
                <MetricCard title="Ultima cobranca" value={formatMoney(finance.last_charge)} subtitle={formatDate(finance.last_charge_at)} icon={<CreditCard size={18} />} />
                <MetricCard title="Mensalidade" value={formatMoney(finance.monthly_amount)} icon={<CalendarClock size={18} />} />
                <MetricCard title="Pendente" value={formatMoney(finance.pending_amount)} icon={<AlertTriangle size={18} />} />
                <MetricCard title="Pagamentos" value={finance.payment_count || 0} icon={<Users size={18} />} />
              </div>

              <h4 style={styles.sectionSubtitle}>Historico de pagamentos</h4>
              <div style={styles.historyList}>
                {finance.payments.length === 0 && <p style={styles.muted}>Sem pagamentos registrados.</p>}
                {finance.payments.map((payment) => (
                  <div key={payment.id} style={styles.historyItem}>
                    <span>{formatDate(payment.paid_at || payment.created_at)}</span>
                    <strong>{formatMoney(payment.amount)}</strong>
                    {statusBadge(payment.status)}
                    <small>{fallback(payment.payment_method, 'Metodo nao informado')}</small>
                  </div>
                ))}
              </div>

              <h4 style={styles.sectionSubtitle}>Historico de compras</h4>
              <div style={styles.historyList}>
                {finance.purchases.length === 0 && <p style={styles.muted}>Sem compras registradas.</p>}
                {finance.purchases.map((purchase) => (
                  <div key={purchase.id} style={styles.historyItem}>
                    <span>{fallback(purchase.product_name, 'Produto nao informado')}</span>
                    <strong>{formatMoney(purchase.amount)}</strong>
                    {statusBadge(purchase.status)}
                    <small>{formatDate(purchase.purchased_at || purchase.created_at)}</small>
                  </div>
                ))}
              </div>

              <h4 style={styles.sectionSubtitle}>Historico de venda manual</h4>
              <div style={styles.historyList}>
                {(!finance.manual_sales || finance.manual_sales.length === 0) && <p style={styles.muted}>Sem venda manual registrada.</p>}
                {(finance.manual_sales || []).map((sale) => (
                  <div key={sale.id} style={styles.historyItem}>
                    <span>{sale.admin_nome || 'Admin nao informado'}</span>
                    <strong>{formatMoney(sale.monthly_amount)}</strong>
                    {statusBadge(sale.status)}
                    <small>{formatDate(sale.sale_date || sale.created_at)}</small>
                  </div>
                ))}
              </div>
            </section>

            <section style={styles.detailSectionFull}>
              <h3>Acoes administrativas</h3>
              <div style={styles.actionsRow}>
                <button className="btn btn-primary" onClick={() => updateStatus('ativo')}>Ativar conta</button>
                <button className="btn btn-outline" onClick={() => updateStatus('inativo')}>Desativar conta</button>
                <button className="btn btn-outline" onClick={() => updateStatus('vencido')}>Marcar vencido</button>
                <button className="btn btn-outline" onClick={() => updateStatus('cancelado')}>Cancelar</button>
                <button className="btn btn-outline" onClick={updateBilling}>Alterar mensalidade/vencimento</button>
                <button className="btn btn-outline" onClick={resendFirstAccess}>Reenviar primeiro acesso</button>
              </div>
              <h4 style={styles.sectionSubtitle}>Historico de alteracoes</h4>
              <div style={styles.historyList}>
                {(!details.audit_logs || details.audit_logs.length === 0) && <p style={styles.muted}>Sem auditoria registrada.</p>}
                {(details.audit_logs || []).map((log) => (
                  <div key={log.id} style={styles.historyItem}>
                    <span>{log.action}</span>
                    <strong>{log.admin_nome || 'Admin'}</strong>
                    <small>{formatDate(log.created_at)}</small>
                    <small>{log.details}</small>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard({ onLogout }) {
  const [dashboard, setDashboard] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [copiedNicheSlug, setCopiedNicheSlug] = useState('');
  const [copyNicheMessage, setCopyNicheMessage] = useState('');
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async (page = pagination.page, filters = appliedFilters) => {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(
        Object.entries({ ...filters, page, limit: pagination.limit }).filter(([, value]) => value !== '')
      );

      const [dashboardRes, customersRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/customers', { params })
      ]);

      setDashboard(dashboardRes.data);
      setCustomers(customersRes.data.data || []);
      setPagination(customersRes.data.pagination || { page, limit: pagination.limit, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar o painel administrativo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1, appliedFilters);
  }, []);

  const applyFilters = (event) => {
    event.preventDefault();
    setAppliedFilters(draftFilters);
    loadData(1, draftFilters);
  };

  const clearFilters = () => {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    loadData(1, emptyFilters);
  };

  const changeFilter = (field, value) => {
    setDraftFilters((current) => ({ ...current, [field]: value }));
  };

  const cards = dashboard?.cards || {};
  const nicheLinks = resolveNicheLinks({
    origin: typeof window !== 'undefined' ? window.location.origin : ''
  });

  const handleOpenNiche = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyNiche = async (niche) => {
    const copied = await copyTextToClipboard(niche.url);
    if (copied) {
      setCopiedNicheSlug(niche.slug);
      setCopyNicheMessage('Link copiado com sucesso');
      setTimeout(() => {
        setCopiedNicheSlug((current) => (current === niche.slug ? '' : current));
      }, 2200);
      return;
    }

    setCopyNicheMessage('Nao foi possivel copiar automaticamente');
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/customers/${customerToDelete.id}`);
      setCustomerToDelete(null);
      // Remove localmente para feedback imediato e recarrega totais
      setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao excluir cliente.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerText}>
          <p style={styles.kicker}>Admin SaaS</p>
          <h1 style={styles.title}><Shield size={34} /> Painel Administrativo</h1>
          <p style={styles.subtitle}>Metricas reais do banco, clientes, assinaturas e faturamento vindo de compras/pagamentos.</p>
        </div>
        <div style={styles.headerActions}>
          <button className="btn btn-primary" onClick={() => window.location.href = '/admin/biblioteca'}><Book size={18} /> Biblioteca de Codigos</button>
          <button className="btn btn-primary" onClick={() => setShowManualModal(true)}><UserPlus size={18} /> Adicionar cliente manualmente</button>
          <button className="btn btn-outline" onClick={() => loadData()} disabled={loading}><RefreshCw size={18} /> Atualizar</button>
          <button className="btn btn-outline" onClick={onLogout}><LogOut size={18} /> Sair</button>
        </div>
      </header>

      {error && <div style={styles.alert}><AlertTriangle size={18} /> {error}</div>}

      <section style={styles.alertsGrid}>
        <div style={styles.alertCard}><strong>{cards.expiringSoon || 0}</strong><span>contas vencendo em 7 dias</span></div>
        <div style={styles.alertCard}><strong>{cards.delinquentCustomers || 0}</strong><span>clientes inadimplentes/vencidos</span></div>
        <div style={styles.alertCard}><strong>{cards.canceledCustomers || 0}</strong><span>clientes cancelados</span></div>
      </section>

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <h2>Links de acesso dos nichos</h2>
            <p style={styles.muted}>Acesso rapido para abrir e compartilhar os nichos disponiveis.</p>
          </div>
        </div>
        <div style={styles.nicheGrid}>
          {nicheLinks.map((niche) => (
            <article key={niche.slug} style={styles.nicheCard}>
              <div style={styles.nicheHeader}>
                <span style={styles.nicheIcon}>{renderNicheIcon(niche.icon)}</span>
                <div style={styles.nicheTitleWrap}>
                  <h3 style={styles.nicheTitle}>{niche.name}</h3>
                  {statusBadge(niche.status)}
                </div>
              </div>
              <p style={styles.nicheDescription}>{fallback(niche.description, 'Sem descricao')}</p>
              <div style={styles.nicheLinkBox}>{niche.url}</div>
              <div style={styles.nicheActions}>
                <button className="btn btn-primary" type="button" onClick={() => handleOpenNiche(niche.url)}>
                  <ExternalLink size={16} /> Abrir nicho
                </button>
                <button className="btn btn-outline" type="button" onClick={() => handleCopyNiche(niche)}>
                  {copiedNicheSlug === niche.slug ? <Check size={16} /> : <Copy size={16} />}
                  {copiedNicheSlug === niche.slug ? 'Copiado' : 'Copiar link'}
                </button>
              </div>
              {copyNicheMessage && copiedNicheSlug === niche.slug && (
                <small style={styles.nicheFeedback}>{copyNicheMessage}</small>
              )}
            </article>
          ))}
        </div>
      </section>

      <section style={styles.metricsGrid}>
        <MetricCard title="Clientes cadastrados" value={cards.totalCustomers || 0} icon={<Users size={18} />} />
        <MetricCard title="Clientes ativos" value={cards.activeCustomers || 0} icon={<Users size={18} />} />
        <MetricCard title="Clientes manuais" value={cards.manualCustomers || 0} icon={<UserPlus size={18} />} />
        <MetricCard title="Clientes Kiwify" value={cards.kiwifyCustomers || 0} icon={<CreditCard size={18} />} />
        <MetricCard title="Clientes inativos" value={cards.inactiveCustomers || 0} icon={<Users size={18} />} />
        <MetricCard title="Assinaturas ativas" value={cards.activeSubscriptions || 0} icon={<CalendarClock size={18} />} />
        <MetricCard title="Assinaturas vencidas" value={cards.expiredSubscriptions || 0} icon={<CalendarClock size={18} />} />
        <MetricCard title="Clientes em teste" value={cards.trialCustomers || 0} icon={<Users size={18} />} />
        <MetricCard title="Cancelados" value={cards.canceledCustomers || 0} icon={<AlertTriangle size={18} />} />
        <MetricCard title="Faturamento total" value={formatMoney(cards.totalRevenue)} tone="gold" icon={<TrendingUp size={18} />} />
        <MetricCard title="Faturamento do mes" value={formatMoney(cards.monthRevenue)} icon={<TrendingUp size={18} />} />
        <MetricCard title="Previsto no mes" value={formatMoney(cards.expectedMonthRevenue)} icon={<CalendarClock size={18} />} />
        <MetricCard title="Valor pendente" value={formatMoney(cards.pendingRevenue)} icon={<AlertTriangle size={18} />} />
        <MetricCard title="Vendas manuais" value={formatMoney(cards.totalManualSales)} icon={<UserPlus size={18} />} />
        <MetricCard title="Compras realizadas" value={cards.totalPurchases || 0} icon={<CreditCard size={18} />} />
        <MetricCard title="Ticket medio" value={formatMoney(cards.averageTicket)} icon={<CreditCard size={18} />} />
        <MetricCard title="Novos no mes" value={cards.newCustomersThisMonth || 0} icon={<Users size={18} />} />
        <MetricCard title="MRR estimado" value={formatMoney(cards.estimatedMrr)} icon={<TrendingUp size={18} />} />
      </section>

      <section style={styles.chartsGrid}>
        <div style={styles.panel}>
          <h3>Novos clientes por periodo</h3>
          <div style={styles.miniChart}>
            {(dashboard?.charts?.newCustomersByPeriod || []).map((item) => (
              <div key={item.period} style={styles.barRow}>
                <span>{item.period}</span>
                <div style={styles.barTrack}><div style={{ ...styles.barFill, width: `${Math.min((item.total || 0) * 20, 100)}%` }} /></div>
                <strong>{item.total}</strong>
              </div>
            ))}
            {!dashboard?.charts?.newCustomersByPeriod?.length && <p style={styles.muted}>Sem dados suficientes ainda.</p>}
          </div>
        </div>
        <div style={styles.panel}>
          <h3>Distribuicao por status</h3>
          <div style={styles.statusList}>
            {(dashboard?.charts?.statusDistribution || []).map((item) => (
              <div key={item.status} style={styles.statusLine}>{statusBadge(item.status)}<strong>{item.total}</strong></div>
            ))}
            {!dashboard?.charts?.statusDistribution?.length && <p style={styles.muted}>Sem clientes cadastrados.</p>}
          </div>
        </div>
        <div style={styles.panel}>
          <h3>Clientes por nicho</h3>
          <div style={styles.statusList}>
            {(dashboard?.charts?.customersByNiche || []).map((item) => (
              <div key={item.niche} style={styles.statusLine}><span>{fallback(item.niche)}</span><strong>{item.total}</strong></div>
            ))}
            {!dashboard?.charts?.customersByNiche?.length && <p style={styles.muted}>Sem clientes cadastrados.</p>}
          </div>
        </div>
        <div style={styles.panel}>
          <h3>Clientes por plano</h3>
          <div style={styles.statusList}>
            {(dashboard?.charts?.customersByPlan || []).map((item) => (
              <div key={item.plan} style={styles.statusLine}><span>{fallback(item.plan)}</span><strong>{item.total}</strong></div>
            ))}
            {!dashboard?.charts?.customersByPlan?.length && <p style={styles.muted}>Sem planos cadastrados.</p>}
          </div>
        </div>
      </section>

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <h2>Clientes e assinaturas</h2>
            <p style={styles.muted}>Busca, filtros e ordenacao executados no backend.</p>
          </div>
          <strong style={styles.resultCount}>{pagination.total || 0} registros</strong>
        </div>

        <form className="admin-filter-grid" style={styles.filters} onSubmit={applyFilters}>
          <label style={styles.searchBox}>
            <Search size={18} />
            <input value={draftFilters.search} onChange={(event) => changeFilter('search', event.target.value)} placeholder="Buscar por nome, email ou empresa" />
          </label>
          <select value={draftFilters.status} onChange={(event) => changeFilter('status', event.target.value)}>
            <option value="">Status da assinatura</option>
            <option value="ativo">Ativo</option>
            <option value="teste">Teste</option>
            <option value="vencido">Vencido</option>
            <option value="cancelado">Cancelado</option>
            <option value="inadimplente">Inadimplente</option>
            <option value="primeiro_acesso_pendente">Primeiro acesso pendente</option>
          </select>
          <input value={draftFilters.product} onChange={(event) => changeFilter('product', event.target.value)} placeholder="Produto" />
          <input value={draftFilters.plan} onChange={(event) => changeFilter('plan', event.target.value)} placeholder="Plano" />
          <input value={draftFilters.billingCycle} onChange={(event) => changeFilter('billingCycle', event.target.value)} placeholder="Ciclo" />
          <select value={draftFilters.niche} onChange={(event) => changeFilter('niche', event.target.value)}>
            <option value="">Nicho</option>
            {listNiches({ includeGeneral: false }).map((niche) => <option key={niche.value} value={niche.value}>{niche.label}</option>)}
          </select>
          <select value={draftFilters.source} onChange={(event) => changeFilter('source', event.target.value)}>
            <option value="">Origem</option>
            <option value="manual">Manual</option>
            <option value="kiwify">Kiwify</option>
            <option value="sistema">Sistema</option>
          </select>
          <select value={draftFilters.active} onChange={(event) => changeFilter('active', event.target.value)}>
            <option value="">Ativos/Inativos</option>
            <option value="true">Conta ativa</option>
            <option value="false">Conta inativa</option>
          </select>
          <input type="month" value={draftFilters.registrationMonth} onChange={(event) => changeFilter('registrationMonth', event.target.value)} title="Mes de cadastro" />
          <input type="month" value={draftFilters.purchaseMonth} onChange={(event) => changeFilter('purchaseMonth', event.target.value)} title="Mes da compra" />
          <select value={draftFilters.expiringSoon} onChange={(event) => changeFilter('expiringSoon', event.target.value)}>
            <option value="">Vencimento</option>
            <option value="true">Proximos 7 dias</option>
          </select>
          <select value={draftFilters.sortBy} onChange={(event) => changeFilter('sortBy', event.target.value)}>
            <option value="recent">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="totalSpent">Maior faturamento</option>
            <option value="lowerSpent">Menor faturamento</option>
            <option value="purchaseCount">Mais pagamentos</option>
            <option value="expiration">Vencimento mais proximo</option>
            <option value="status">Status</option>
          </select>
          <select value={draftFilters.sortOrder} onChange={(event) => changeFilter('sortOrder', event.target.value)}>
            <option value="desc">Descendente</option>
            <option value="asc">Ascendente</option>
          </select>
          <button className="btn btn-primary" type="submit">Filtrar</button>
          <button className="btn btn-outline" type="button" onClick={clearFilters}>Limpar</button>
        </form>

        {loading ? (
          <div style={styles.emptyState}>Carregando dados reais do banco...</div>
        ) : (
          <div className="table-container" style={styles.tableWrap}>
            <table className="table" style={styles.table}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Telefone</th>
                  <th>Empresa/Nicho</th>
                  <th>Produto</th>
                  <th>Plano/Ciclo</th>
                  <th>Status</th>
                  <th>Ultima compra</th>
                  <th>Mensalidade</th>
                  <th>Total gerado</th>
                  <th>Pagamentos</th>
                  <th>Cadastro</th>
                  <th>Ativacao</th>
                  <th>Vencimento</th>
                  <th>Origem</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td><strong>{fallback(customer.nome, 'Cliente sem nome')}</strong><br /><small>{fallback(customer.email)}</small></td>
                    <td>{fallback(customer.telefone)}</td>
                    <td>{fallback(customer.company_name)}<br /><small>{fallback(customer.tipo_empresa)}</small></td>
                    <td>{fallback(customer.product_name, 'Sem compra')}</td>
                    <td>{fallback(customer.plan_name)}<br /><small>{fallback(customer.billing_cycle)}</small></td>
                    <td>{statusBadge(customer.subscription_status || customer.status)}</td>
                    <td>{customer.last_payment_amount ? formatMoney(customer.last_payment_amount) : 'Sem compra'}<br /><small>{formatDate(customer.last_purchase_date)}</small></td>
                    <td><strong>{formatMoney(customer.monthly_amount)}</strong><br /><small>{fallback(customer.forma_pagamento)}</small></td>
                    <td><strong>{formatMoney(customer.total_spent)}</strong></td>
                    <td>{customer.purchase_count || 0}</td>
                    <td>{formatDate(customer.created_at)}</td>
                    <td>{formatDate(customer.activated_at)}</td>
                    <td>{formatDate(customer.subscription_expires_at)}</td>
                    <td>{fallback(customer.source, 'sistema')}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-outline btn-sm" onClick={() => setSelectedCustomerId(customer.id)}>
                          <Eye size={16} /> Ver
                        </button>
                        <button 
                          className="btn btn-outline btn-sm" 
                          style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }}
                          onClick={() => setCustomerToDelete(customer)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr><td colSpan="15" style={{ textAlign: 'center', padding: '2rem' }}>Nenhum cliente encontrado para os filtros atuais.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div style={styles.pagination}>
          <button className="btn btn-outline" disabled={pagination.page <= 1 || loading} onClick={() => loadData(pagination.page - 1)}>Anterior</button>
          <span>Pagina {pagination.page || 1} de {pagination.totalPages || 1}</span>
          <button className="btn btn-outline" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => loadData(pagination.page + 1)}>Proxima</button>
        </div>
      </section>

      {selectedCustomerId && (
        <CustomerDetailsModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
          onStatusUpdated={() => loadData(pagination.page)}
        />
      )}

      {showManualModal && (
        <ManualCustomerModal
          onClose={() => setShowManualModal(false)}
          onCreated={() => loadData(1)}
        />
      )}

      {customerToDelete && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, width: 'min(450px, 90vw)' }}>
            <div style={styles.modalHeader}>
              <h2 style={{ color: '#EF4444' }}>Confirmar exclusão</h2>
              <button className="btn btn-outline" onClick={() => setCustomerToDelete(null)} style={styles.iconButton}><X size={18} /></button>
            </div>
            <p style={{ margin: '1.5rem 0', fontSize: '1.1rem', lineHeight: '1.5' }}>
              Tem certeza que deseja excluir <strong>{customerToDelete.nome}</strong>?
              <br /><br />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Esta ação marcará a conta como excluída e removerá seus dados financeiros dos dashboards. Esta ação não pode ser desfeita.
              </span>
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setCustomerToDelete(null)} disabled={deleting}>Cancelar</button>
              <button 
                className="btn btn-danger" 
                onClick={handleDeleteCustomer} 
                disabled={deleting}
                style={{ background: '#EF4444', borderColor: '#EF4444' }}
              >
                {deleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: '2rem',
    background: 'radial-gradient(circle at top left, rgba(251,191,36,0.12), transparent 30%), var(--bg-color)',
    color: 'var(--text-main)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap'
  },
  headerText: { maxWidth: '760px' },
  headerActions: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  kicker: { color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.75rem', marginBottom: '0.35rem' },
  title: { display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontSize: '2rem' },
  subtitle: { color: 'var(--text-muted)', marginTop: '0.5rem' },
  alert: { display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '1rem', borderRadius: '16px', background: 'rgba(239,68,68,0.12)', color: '#FCA5A5', marginBottom: '1rem' },
  alertsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  alertCard: { display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '18px', color: 'var(--text-muted)' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  metric: { padding: '1.15rem', borderRadius: '24px', background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-dark)' },
  metricGold: { padding: '1.15rem', borderRadius: '24px', background: 'linear-gradient(135deg, #FDE047, #F59E0B)', color: '#111827', boxShadow: 'var(--shadow-gold)' },
  metricIcon: { width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', marginBottom: '0.75rem' },
  metricTitle: { display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem' },
  metricValue: { display: 'block', fontSize: '1.6rem', marginTop: '0.3rem' },
  metricSubtitle: { display: 'block', color: 'var(--text-muted)', marginTop: '0.3rem' },
  chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  panel: { padding: '1.25rem', borderRadius: '24px', background: 'var(--surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-dark)' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' },
  nicheGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' },
  nicheCard: { padding: '1rem', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', display: 'grid', gap: '0.8rem' },
  nicheHeader: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start' },
  nicheIcon: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,130,246,0.2)', color: '#93C5FD' },
  nicheTitleWrap: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' },
  nicheTitle: { margin: 0, fontSize: '1.05rem' },
  nicheDescription: { margin: 0, color: 'var(--text-muted)' },
  nicheLinkBox: { margin: 0, padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', wordBreak: 'break-all', color: 'var(--text-main)', fontSize: '0.9rem' },
  nicheActions: { display: 'flex', gap: '0.65rem', flexWrap: 'wrap' },
  nicheFeedback: { color: '#86EFAC', fontWeight: 600 },
  resultCount: { color: 'var(--primary)' },
  miniChart: { display: 'grid', gap: '0.75rem', marginTop: '1rem' },
  barRow: { display: 'grid', gridTemplateColumns: '84px 1fr 34px', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' },
  barTrack: { height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '999px', background: 'var(--primary)' },
  statusList: { display: 'grid', gap: '0.75rem', marginTop: '1rem' },
  statusLine: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  filters: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1rem' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '260px', padding: '0 0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' },
  tableWrap: { maxHeight: '620px' },
  table: { minWidth: '1600px' },
  badge: { display: 'inline-flex', padding: '0.35rem 0.7rem', borderRadius: '999px', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  muted: { color: 'var(--text-muted)' },
  emptyState: { padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' },
  error: { color: '#FCA5A5', padding: '1rem', background: 'rgba(239,68,68,0.12)', borderRadius: '12px' },
  pagination: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' },
  modalContent: { width: 'min(1100px, 96vw)', maxHeight: '92vh', overflow: 'auto', background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '28px', padding: '1.5rem', boxShadow: '0 28px 80px rgba(0,0,0,0.65)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' },
  modalTitle: { margin: 0 },
  iconButton: { padding: '0.75rem', width: '44px', height: '44px' },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' },
  detailSection: { padding: '1rem', borderRadius: '18px', background: 'rgba(255,255,255,0.035)', border: '1px solid var(--border-color)' },
  detailSectionFull: { padding: '1rem', borderRadius: '18px', background: 'rgba(255,255,255,0.035)', border: '1px solid var(--border-color)', marginTop: '1rem' },
  detailRow: { display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.7rem 0', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' },
  financeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginTop: '1rem' },
  sectionSubtitle: { margin: '1.25rem 0 0.75rem' },
  historyList: { display: 'grid', gap: '0.6rem' },
  historyItem: { display: 'grid', gridTemplateColumns: '1.2fr 1fr auto 1.2fr', gap: '0.75rem', alignItems: 'center', padding: '0.8rem', borderRadius: '14px', background: 'rgba(0,0,0,0.18)' },
  actionsRow: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', margin: '1rem 0' },
  firstAccessLinkBox: { marginTop: '0.8rem', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.22)', wordBreak: 'break-all', color: 'var(--text-main)' },
  textarea: { width: '100%', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.035)', color: 'var(--text-main)', padding: '0.8rem', fontFamily: 'inherit' }
};
