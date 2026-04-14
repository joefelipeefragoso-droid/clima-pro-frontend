import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, Compass, FileText, Loader2, Trash2, Upload, Users } from 'lucide-react';
import api from '../services/api';

const STEPS = ['welcome', 'company', 'guide', 'finish'];
const MAX_LOGO_SIZE = 5 * 1024 * 1024;

const initialCompany = {
  nome_empresa: '',
  owner_name: '',
  cnpj: '',
  telefone: '',
  email: '',
  cep: '',
  endereco: '',
  numero: '',
  cidade: '',
  estado: '',
  cor_primaria: '#FBBF24',
  cor_secundaria: '#3B82F6'
};

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatCnpj(value) {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCep(value) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function isValidCnpj(value) {
  const digits = onlyDigits(value);
  // Onboarding: only basic format validation (optional field, test-friendly).
  return digits.length === 14;
}

export default function Onboarding({ onCompleted }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const saveInFlightRef = useRef(false);

  // Redirecionamento de seguranca: Admins nao devem ver o onboarding de clientes.
  useEffect(() => {
    const rawUser = localStorage.getItem('userLogado');
    if (rawUser) {
      try {
        const user = JSON.parse(rawUser);
        if (String(user.role || '').toLowerCase() === 'admin') {
          console.log('[ONBOARDING] Redirecionando administrador para painel gestor...');
          window.location.href = '/admin/dashboard';
        }
      } catch (e) {
        // Ignora erro de parse
      }
    }
  }, []);

  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [companyDataLoaded, setCompanyDataLoaded] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [company, setCompany] = useState(initialCompany);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [removeLogo, setRemoveLogo] = useState(false);

  const step = STEPS[stepIndex];
  const progress = useMemo(() => `${stepIndex + 1}/4`, [stepIndex]);

  useEffect(() => {
    if (step !== 'company' || companyDataLoaded) return;

    let mounted = true;

    async function loadCompany() {
      setLoadingCompany(true);
      setError('');
      try {
        const res = await api.get('/onboarding/status');
        const profile = res.data?.companyProfile || {};
        if (!mounted) return;

        setCompany({
          nome_empresa: profile.nome_empresa || '',
          owner_name: profile.owner_name || '',
          cnpj: formatCnpj(profile.cnpj || ''),
          telefone: formatPhone(profile.telefone || ''),
          email: profile.email || '',
          cep: formatCep(profile.cep || ''),
          endereco: profile.endereco || '',
          numero: profile.numero || '',
          cidade: profile.cidade || '',
          estado: String(profile.estado || '').toUpperCase(),
          cor_primaria: profile.cor_primaria || '#FBBF24',
          cor_secundaria: profile.cor_secundaria || '#3B82F6'
        });

        if (profile.logo_url) {
          const logoUrl = String(profile.logo_url || '');
          const absolute = logoUrl.startsWith('http') ? logoUrl : `${api.defaults.baseURL?.replace('/api', '')}${logoUrl}`;
          setLogoPreview(absolute);
          setRemoveLogo(false);
        } else {
          setLogoPreview('');
        }
      } catch (err) {
        if (!mounted) return;
        const status = err.response?.status;
        if (status === 404) {
          // Cliente novo: segue com formulario vazio sem erro visual.
          setCompany(initialCompany);
          setLogoPreview('');
        } else {
          setError(err.response?.data?.error || 'Nao foi possivel carregar os dados da empresa.');
        }
      } finally {
        if (!mounted) return;
        setCompanyDataLoaded(true);
        setLoadingCompany(false);
      }
    }

    loadCompany();
    return () => {
      mounted = false;
    };
  }, [step, companyDataLoaded]);

  useEffect(() => {
    // Etapa 1 deve ser sempre limpa, sem mensagem de erro.
    if (step === 'welcome') {
      setError('');
      setFieldErrors({});
    }
  }, [step]);

  const next = () => setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  const prev = () => setStepIndex((current) => Math.max(current - 1, 0));

  const updateField = (field, rawValue) => {
    let value = rawValue;
    if (field === 'cnpj') value = formatCnpj(rawValue);
    if (field === 'telefone') value = formatPhone(rawValue);
    if (field === 'cep') value = formatCep(rawValue);
    if (field === 'estado') value = String(rawValue || '').toUpperCase().slice(0, 2);

    setCompany((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
    setError('');
    setSuccess('');
  };

  const validateCompany = () => {
    const errors = {};
    if (!company.nome_empresa.trim()) errors.nome_empresa = 'Informe o nome da empresa';
    if (!company.telefone.trim() && !company.email.trim()) {
      errors.contato = 'Informe pelo menos um contato: e-mail ou WhatsApp';
    } else if (company.email.trim() && !isValidEmail(company.email)) {
      errors.email = 'Digite um e-mail valido';
    }

    return errors;
  };

  const handleLogoSelect = (file) => {
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setFieldErrors((current) => ({ ...current, logo: 'A logo deve ser PNG, JPG ou WEBP' }));
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setFieldErrors((current) => ({ ...current, logo: 'A logo deve ter no maximo 5MB' }));
      return;
    }

    setFieldErrors((current) => ({ ...current, logo: '' }));
    setLogoFile(file);
    setRemoveLogo(false);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeCurrentLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setRemoveLogo(true);
    setFieldErrors((current) => ({ ...current, logo: '' }));
  };

  const fetchCep = async () => {
    const cepDigits = onlyDigits(company.cep);
    if (cepDigits.length !== 8) return;

    setCepLoading(true);
    setError('');
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await response.json();
      if (data?.erro) throw new Error('CEP nao encontrado');

      setCompany((current) => ({
        ...current,
        endereco: data.logradouro || current.endereco,
        cidade: data.localidade || current.cidade,
        estado: String(data.uf || current.estado || '').toUpperCase()
      }));
    } catch {
      setError('Nao foi possivel buscar o CEP automaticamente. Voce pode preencher manualmente.');
    } finally {
      setCepLoading(false);
    }
  };

  const saveCompany = async () => {
    if (saveInFlightRef.current) return;
    const errors = validateCompany();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    saveInFlightRef.current = true;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const buildFormData = () => {
        const form = new FormData();
        form.append('nome_empresa', company.nome_empresa.trim());
        form.append('owner_name', company.owner_name.trim());
        form.append('cnpj', company.cnpj.trim());
        form.append('whatsapp', company.telefone.trim());
        form.append('email', company.email.trim());
        form.append('cep', company.cep.trim());
        form.append('endereco', company.endereco.trim());
        form.append('numero', company.numero.trim());
        form.append('cidade', company.cidade.trim());
        form.append('estado', company.estado.trim());
        form.append('cor_primaria', company.cor_primaria || '#FBBF24');
        form.append('cor_secundaria', company.cor_secundaria || '#3B82F6');
        form.append('remove_logo', removeLogo ? '1' : '0');
        if (logoFile) form.append('logo', logoFile);
        return form;
      };

      const form = buildFormData();
      if (import.meta.env.DEV) {
        console.debug('[ONBOARDING][SAVE_COMPANY] Request', {
          method: 'POST',
          url: '/onboarding/company-data',
          payload: {
            nome_empresa: company.nome_empresa.trim(),
            owner_name: company.owner_name.trim(),
            cnpj: company.cnpj.trim(),
            whatsapp: company.telefone.trim(),
            email: company.email.trim(),
            cep: company.cep.trim(),
            endereco: company.endereco.trim(),
            numero: company.numero.trim(),
            cidade: company.cidade.trim(),
            estado: company.estado.trim(),
            remove_logo: removeLogo ? '1' : '0',
            has_logo_file: !!logoFile
          }
        });
      }

      const res = await api.post('/onboarding/company-data', buildFormData());

      const updated = res.data?.companyProfile;
      if (updated) {
        setCompany((current) => ({
          ...current,
          nome_empresa: updated.nome_empresa || current.nome_empresa,
          owner_name: updated.owner_name || current.owner_name,
          cnpj: formatCnpj(updated.cnpj || current.cnpj),
          telefone: formatPhone(updated.telefone || current.telefone),
          email: updated.email || current.email,
          cep: formatCep(updated.cep || current.cep),
          endereco: updated.endereco || current.endereco,
          numero: updated.numero || current.numero,
          cidade: updated.cidade || current.cidade,
          estado: String(updated.estado || current.estado || '').toUpperCase()
        }));

        if (updated.logo_url && !logoFile) {
          const absolute = updated.logo_url.startsWith('http')
            ? updated.logo_url
            : `${api.defaults.baseURL?.replace('/api', '')}${updated.logo_url}`;
          setLogoPreview(absolute);
        }
      }

      setSuccess('Dados salvos com sucesso');

      // Finaliza onboarding imediatamente para evitar travas no fluxo.
      try {
        const completionRes = await api.post('/onboarding/complete');
        const updatedUser = completionRes.data?.user;
        if (updatedUser) {
          localStorage.setItem('userLogado', JSON.stringify(updatedUser));
          if (onCompleted) onCompleted(updatedUser);
        }
      } catch (completionErr) {
        // Fallback: evita ficar preso no onboarding por falha transitória no endpoint de conclusão.
        console.error('[ONBOARDING][COMPLETE] Error', {
          status: completionErr.response?.status,
          data: completionErr.response?.data,
          message: completionErr.message
        });
        const currentUser = JSON.parse(localStorage.getItem('userLogado') || 'null');
        if (currentUser) {
          const patchedUser = { ...currentUser, onboarding_completed: true };
          localStorage.setItem('userLogado', JSON.stringify(patchedUser));
          if (onCompleted) onCompleted(patchedUser);
        }
      }

      navigate('/app', { replace: true });
    } catch (err) {
      const apiError = err.response?.data;
      console.error('[ONBOARDING][SAVE_COMPANY] Error', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      const status = err.response?.status;
      if (status === 404) {
        setError('Backend desatualizado: rota /api/onboarding/company-data nao encontrada. Reinicie o servidor correto.');
      } else {
        setError(apiError?.error || err.message || 'Nao foi possivel salvar agora. Tente novamente.');
      }
      if (apiError?.fieldErrors) setFieldErrors(apiError.fieldErrors);
    } finally {
      setSaving(false);
      saveInFlightRef.current = false;
    }
  };

  const complete = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/onboarding/complete');
      const updatedUser = res.data?.user;
      if (updatedUser) {
        localStorage.setItem('userLogado', JSON.stringify(updatedUser));
        if (onCompleted) onCompleted(updatedUser);
      }
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel concluir o onboarding.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // Escuta eventos de storage para sincronizar se o usuario limpar o cache
    const sync = () => {
      const u = JSON.parse(localStorage.getItem('userLogado') || 'null');
      if (u?.role === 'admin') window.location.href = '/admin/dashboard';
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const authenticatedUser = JSON.parse(localStorage.getItem('userLogado') || '{}');
  const userIdentity = `${authenticatedUser.email || 'Nao logado'} (${authenticatedUser.role || 'cliente'})`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '1.5rem', background: 'var(--bg-color)' }}>
      {/* Diagnostic & Recovery Bar */}
      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        border: '1px solid var(--border-color)', 
        padding: '0.6rem 1rem', 
        borderRadius: '10px', 
        marginBottom: '1rem', 
        maxWidth: '980px', 
        margin: '0 auto 1.5rem',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <span>ID Sessao: <strong>{userIdentity}</strong></span>
        <button 
          onClick={() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/admin/login';
          }}
          style={{ 
            background: 'var(--primary)', 
            color: '#000', 
            border: 'none', 
            padding: '4px 10px', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          FORCE RESET (Limpar Cache)
        </button>
      </div>

      <section className="card" style={{ width: 'min(980px, 100%)', padding: '1.4rem', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '0.8rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, color: 'var(--primary)', fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 800 }}>Onboarding inicial</p>
            <h1 style={{ margin: '0.35rem 0 0', fontSize: '1.4rem' }}>Configuracao da sua conta</h1>
          </div>
          <strong style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{progress}</strong>
        </header>

        {error && step !== 'welcome' && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#FCA5A5', borderRadius: '10px', padding: '0.7rem', marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)', color: '#6EE7B7', borderRadius: '10px', padding: '0.7rem', marginBottom: '1rem' }}>{success}</div>}

        {step === 'welcome' && (
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <h2 style={{ margin: 0 }}>Bem-vindo ao sistema</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Vamos configurar sua empresa para voce comecar a usar seu painel.</p>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Em poucos passos voce personaliza o ambiente e ja inicia com seu fluxo comercial.</p>
            <div style={{ marginTop: '0.4rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="btn btn-primary" onClick={next}>Comecar agora</button>
              <button 
                type="button" 
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/admin/login';
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  fontSize: '0.8rem', 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Sou Administrador (Resetar Sessao)
              </button>
            </div>
          </div>
        )}

        {step === 'company' && (
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>Dados da empresa</h2>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Preencha os dados principais para personalizar o painel e continuar.</p>
            </div>

            {loadingCompany ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'var(--text-muted)' }}>
                <Loader2 size={16} className="spin" /> Carregando dados da empresa...
              </div>
            ) : (
              <>
                <section style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '0.85rem', display: 'grid', gap: '0.7rem' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Dados principais</p>
                  <div style={{ display: 'grid', gap: '0.65rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <Field label="Nome da empresa" error={fieldErrors.nome_empresa}>
                      <input className="form-control" value={company.nome_empresa} onChange={(e) => updateField('nome_empresa', e.target.value)} placeholder="Ex: Clima Pro Solucoes" />
                    </Field>
                    <Field label="Nome do responsavel" error={fieldErrors.owner_name}>
                      <input className="form-control" value={company.owner_name} onChange={(e) => updateField('owner_name', e.target.value)} placeholder="Ex: Joao Silva" />
                    </Field>
                    <Field label="CNPJ (opcional)" error={fieldErrors.cnpj}>
                      <input className="form-control" value={company.cnpj} onChange={(e) => updateField('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
                    </Field>
                    <Field label="WhatsApp principal" error={fieldErrors.telefone}>
                      <input className="form-control" value={company.telefone} onChange={(e) => updateField('telefone', e.target.value)} placeholder="(00) 00000-0000" />
                    </Field>
                    <Field label="E-mail da empresa" error={fieldErrors.email}>
                      <input className="form-control" type="email" value={company.email} onChange={(e) => updateField('email', e.target.value)} placeholder="contato@empresa.com" />
                    </Field>
                  </div>
                  {fieldErrors.contato ? <span style={{ color: '#FCA5A5', fontSize: '0.78rem' }}>{fieldErrors.contato}</span> : null}
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                    Voce pode preencher os demais dados depois nas configuracoes.
                  </p>
                </section>

                <section style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '0.85rem', display: 'grid', gap: '0.7rem' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Endereco</p>
                  <div style={{ display: 'grid', gap: '0.65rem', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
                    <Field label="CEP" error={fieldErrors.cep}>
                      <div style={{ display: 'flex', gap: '0.45rem' }}>
                        <input className="form-control" value={company.cep} onChange={(e) => updateField('cep', e.target.value)} onBlur={fetchCep} placeholder="00000-000" />
                        <button type="button" className="btn btn-outline" onClick={fetchCep} disabled={cepLoading || onlyDigits(company.cep).length !== 8}>
                          {cepLoading ? <Loader2 size={14} className="spin" /> : 'Buscar'}
                        </button>
                      </div>
                    </Field>
                    <Field label="Endereco" error={fieldErrors.endereco}>
                      <input className="form-control" value={company.endereco} onChange={(e) => updateField('endereco', e.target.value)} placeholder="Rua / Avenida" />
                    </Field>
                    <Field label="Numero" error={fieldErrors.numero}>
                      <input className="form-control" value={company.numero} onChange={(e) => updateField('numero', e.target.value)} placeholder="123" />
                    </Field>
                    <Field label="Cidade" error={fieldErrors.cidade}>
                      <input className="form-control" value={company.cidade} onChange={(e) => updateField('cidade', e.target.value)} placeholder="Cidade" />
                    </Field>
                    <Field label="Estado" error={fieldErrors.estado}>
                      <input className="form-control" value={company.estado} onChange={(e) => updateField('estado', e.target.value)} placeholder="UF" maxLength={2} />
                    </Field>
                  </div>
                </section>

                <section style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '0.85rem', display: 'grid', gap: '0.7rem' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Identidade visual</p>
                  <div style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'minmax(220px, 340px) 1fr' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        minHeight: '120px',
                        borderRadius: '14px',
                        border: '1px dashed var(--border-color)',
                        background: 'rgba(255,255,255,0.02)',
                        color: 'var(--text-main)',
                        display: 'grid',
                        placeItems: 'center',
                        padding: '0.9rem',
                        cursor: 'pointer'
                      }}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo da empresa" style={{ maxHeight: '88px', maxWidth: '100%', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ display: 'grid', gap: '0.35rem', justifyItems: 'center' }}>
                          <Upload size={18} />
                          <strong style={{ fontSize: '0.9rem' }}>+ Adicionar logo da empresa</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PNG, JPG ou WEBP ate 5MB</span>
                        </div>
                      )}
                    </button>

                    <div style={{ display: 'grid', alignContent: 'center', gap: '0.5rem' }}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        style={{ display: 'none' }}
                        onChange={(e) => handleLogoSelect(e.target.files?.[0] || null)}
                      />

                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>Trocar logo</button>
                        <button type="button" className="btn btn-outline" onClick={removeCurrentLogo} disabled={!logoPreview && !logoFile}>
                          <Trash2 size={14} /> Remover logo
                        </button>
                      </div>
                      {fieldErrors.logo && <span style={{ color: '#FCA5A5', fontSize: '0.78rem' }}>{fieldErrors.logo}</span>}
                    </div>
                  </div>
                </section>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-outline" onClick={prev}>Voltar</button>
                  <button className="btn btn-primary" onClick={saveCompany} disabled={saving || loadingCompany}>
                    {saving ? <><Loader2 size={15} className="spin" /> Salvando...</> : 'Salvar e ir para o painel'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'guide' && (
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <h2 style={{ margin: 0 }}>Orientacao rapida</h2>
            <div style={{ display: 'grid', gap: '0.7rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <GuideCard icon={<Building2 size={16} />} title="Passo 1" text="Configure sua empresa" />
              <GuideCard icon={<Users size={16} />} title="Passo 2" text="Cadastre seu primeiro cliente" />
              <GuideCard icon={<FileText size={16} />} title="Passo 3" text="Monte seu primeiro orcamento" />
              <GuideCard icon={<Compass size={16} />} title="Passo 4" text="Gere seu PDF profissional" />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={prev}>Voltar</button>
              <button className="btn btn-primary" onClick={next}>Continuar</button>
            </div>
          </div>
        )}

        {step === 'finish' && (
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <h2 style={{ margin: 0 }}>Tudo pronto</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Sua conta inicial foi configurada. Agora voce pode acessar o painel e comecar a operar.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={prev}>Voltar</button>
              <button className="btn btn-primary" onClick={complete} disabled={saving}>
                <CheckCircle2 size={16} /> {saving ? 'Finalizando...' : 'Ir para meu painel'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>{label}</span>
      {children}
      {error ? <span style={{ color: '#FCA5A5', fontSize: '0.75rem' }}>{error}</span> : null}
    </label>
  );
}

function GuideCard({ icon, title, text }) {
  return (
    <article style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.8rem', background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', marginBottom: '0.45rem', color: 'var(--primary)' }}>
        {icon}
        <strong>{title}</strong>
      </div>
      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{text}</p>
    </article>
  );
}
