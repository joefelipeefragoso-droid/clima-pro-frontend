import React, { useEffect, useRef, useState } from 'react';
import { LogOut, Save, Upload } from 'lucide-react';
import api from '../services/api';
import { logout } from '../auth/authSession';
import { applyNicheTheme, resolveAssetUrl } from '../utils/nicheTheme';
import { useCompany } from '../context/CompanyContext';

const emptyConfig = {
  nicho: '',
  nome_empresa: '',
  cnpj: '',
  telefone: '',
  email: '',
  endereco: '',
  cidade: '',
  rodape_pdf: '',
  logo_url: '',
  background_url: '',
  cor_primaria: '#FBBF24',
  cor_secundaria: '#3B82F6',
  pix_key: '',
  pix_tipo: 'chave_aleatoria',
  pix_beneficiario: '',
  pix_cidade: '',
  pix_qrcode_url: ''
};

export default function Configuracoes() {
  const { config: contextConfig, fetchConfig } = useCompany();
  const [config, setConfig] = useState(emptyConfig);
  const [loading, setLoading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [previewBackground, setPreviewBackground] = useState(null);
  const [previewQrCode, setPreviewQrCode] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const logoInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const qrCodeInputRef = useRef(null);

  // Sincroniza formulario com dados do context (fonte unica de verdade)
  useEffect(() => {
    const nextConfig = { ...emptyConfig, ...contextConfig };
    setConfig(nextConfig);
    applyNicheTheme(nextConfig);
    setPreviewLogo(resolveAssetUrl(nextConfig.logo_url) || null);
    setPreviewBackground(resolveAssetUrl(nextConfig.background_url) || null);
    if (nextConfig.pix_qrcode_url) setPreviewQrCode(resolveAssetUrl(nextConfig.pix_qrcode_url));
  }, [contextConfig]);

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const readPreview = (file, setter) => {
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result);
    reader.readAsDataURL(file);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setConfig({ ...config, logoFile: file });
    readPreview(file, setPreviewLogo);
  };

  const handleBackgroundChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setConfig({ ...config, backgroundFile: file });
    readPreview(file, setPreviewBackground);
  };

  const handleQrCodeChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setConfig({ ...config, qrCodeFile: file });
    readPreview(file, setPreviewQrCode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);

    try {
      const formData = new FormData();
      formData.append('nome_empresa', config.nome_empresa || '');
      formData.append('cnpj', config.cnpj || '');
      formData.append('telefone', config.telefone || '');
      formData.append('email', config.email || '');
      formData.append('endereco', config.endereco || '');
      formData.append('cidade', config.cidade || '');
      formData.append('rodape_pdf', config.rodape_pdf || '');
      formData.append('cor_primaria', config.cor_primaria || '#FBBF24');
      formData.append('cor_secundaria', config.cor_secundaria || '#3B82F6');
      formData.append('pix_key', config.pix_key || '');
      formData.append('pix_tipo', config.pix_tipo || 'chave_aleatoria');
      formData.append('pix_beneficiario', config.pix_beneficiario || '');
      formData.append('pix_cidade', config.pix_cidade || '');

      if (config.logoFile) formData.append('logo', config.logoFile);
      if (config.backgroundFile) formData.append('background', config.backgroundFile);
      if (config.qrCodeFile) formData.append('pix_qrcode', config.qrCodeFile);

      await api.put('/config', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Atualiza o CompanyContext para sincronizar Dashboard, Sidebar e Configuracoes
      await fetchConfig();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Erro ao salvar configuracoes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>Configuracoes</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Gerencie os dados e a identidade visual do nicho {config.nicho || 'atual'}.
          </p>
        </div>
        <button type="button" className="btn btn-outline" onClick={logout} style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.35)' }}>
          <LogOut size={16} /> Sair da conta
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Logo do nicho</label>
            <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
              {previewLogo ? (
                <img src={previewLogo} alt="Pre-visualizacao da logo" style={{ width: '110px', height: '70px', objectFit: 'contain', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.04)' }} />
              ) : (
                <div style={{ width: '110px', height: '70px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', color: 'var(--text-muted)' }}>Sem logo</div>
              )}
              <input type="file" accept="image/*" ref={logoInputRef} style={{ display: 'none' }} onChange={handleLogoChange} />
              <button type="button" className="btn btn-outline" onClick={() => logoInputRef.current?.click()}>
                <Upload size={16} /> Enviar logo
              </button>
            </div>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Imagem de fundo / marca d'agua do nicho</label>
            <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
              {previewBackground ? (
                <img src={previewBackground} alt="Pre-visualizacao do fundo" style={{ width: '180px', height: '90px', objectFit: 'cover', borderRadius: '14px', border: '1px solid var(--border-color)' }} />
              ) : (
                <div style={{ width: '180px', height: '90px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', color: 'var(--text-muted)' }}>Sem fundo</div>
              )}
              <input type="file" accept="image/*" ref={backgroundInputRef} style={{ display: 'none' }} onChange={handleBackgroundChange} />
              <button type="button" className="btn btn-outline" onClick={() => backgroundInputRef.current?.click()}>
                <Upload size={16} /> Enviar fundo
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Cor primaria</label>
            <input type="color" className="form-control" name="cor_primaria" value={config.cor_primaria || '#FBBF24'} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Cor secundaria</label>
            <input type="color" className="form-control" name="cor_secundaria" value={config.cor_secundaria || '#3B82F6'} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Nome da empresa</label>
            <input type="text" className="form-control" name="nome_empresa" value={config.nome_empresa || ''} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">CNPJ</label>
            <input type="text" className="form-control" name="cnpj" value={config.cnpj || ''} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Telefone</label>
            <input type="text" className="form-control" name="telefone" value={config.telefone || ''} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input type="email" className="form-control" name="email" value={config.email || ''} onChange={handleChange} />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Endereco</label>
            <input type="text" className="form-control" name="endereco" value={config.endereco || ''} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Cidade</label>
            <input type="text" className="form-control" name="cidade" value={config.cidade || ''} onChange={handleChange} />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Rodape padrao para PDF</label>
            <textarea className="form-control" name="rodape_pdf" value={config.rodape_pdf || ''} onChange={handleChange} />
          </div>
        </div>

        <div className="flex" style={{ justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
          {saveSuccess && (
            <span style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600 }}>✓ Salvo com sucesso!</span>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={16} /> {loading ? 'Salvando...' : 'Salvar configuracoes'}
          </button>
        </div>

        {/* SEÇÃO PIX */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '2rem 0' }} />
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 700 }}>💳 Configuração do Pix</h3>
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="form-group">
            <label className="form-label">Tipo de Chave Pix</label>
            <select className="form-control" name="pix_tipo" value={config.pix_tipo || 'chave_aleatoria'} onChange={handleChange}>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="telefone">Telefone</option>
              <option value="chave_aleatoria">Chave Aleatória</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Chave Pix</label>
            <input type="text" className="form-control" name="pix_key" value={config.pix_key || ''} onChange={handleChange} placeholder="Digite a chave Pix..." />
          </div>
          <div className="form-group">
            <label className="form-label">Nome do Beneficiário</label>
            <input type="text" className="form-control" name="pix_beneficiario" value={config.pix_beneficiario || ''} onChange={handleChange} placeholder="Nome completo ou razão social" />
          </div>
          <div className="form-group">
            <label className="form-label">Cidade (opcional)</label>
            <input type="text" className="form-control" name="pix_cidade" value={config.pix_cidade || ''} onChange={handleChange} placeholder="Cidade do beneficiário" />
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">QR Code do Pix (imagem opcional)</label>
            <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
              {previewQrCode ? (
                <img src={previewQrCode} alt="QR Code Pix" style={{ width: '120px', height: '120px', objectFit: 'contain', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#fff', padding: '4px' }} />
              ) : (
                <div style={{ width: '120px', height: '120px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>Sem QR Code</div>
              )}
              <input type="file" accept="image/*" ref={qrCodeInputRef} style={{ display: 'none' }} onChange={handleQrCodeChange} />
              <button type="button" className="btn btn-outline" onClick={() => qrCodeInputRef.current?.click()}>
                <Upload size={16} /> Enviar QR Code
              </button>
            </div>
          </div>
        </div>
        <div className="flex" style={{ justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={16} /> {loading ? 'Salvando...' : 'Salvar Pix'}
          </button>
        </div>
      </form>
    </div>
  );
}
