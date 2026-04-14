import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { applyNicheTheme } from '../utils/nicheTheme';

const CompanyContext = createContext(null);

const EMPTY_CONFIG = {
  nicho: '',
  nome_empresa: '',
  owner_name: '',
  cnpj: '',
  telefone: '',
  email: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  numero: '',
  rodape_pdf: '',
  logo_url: '',
  background_url: '',
  cor_primaria: '#FBBF24',
  cor_secundaria: '#3B82F6',
  pix_key: '',
  pix_tipo: 'chave_aleatoria',
  pix_beneficiario: '',
  pix_cidade: '',
  pix_qrcode_url: '',
};

export function CompanyProvider({ children }) {
  const [config, setConfig] = useState(EMPTY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/config');
      const data = { ...EMPTY_CONFIG, ...(res.data || {}) };
      setConfig(data);
      applyNicheTheme(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar configurações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = useCallback((partial) => {
    setConfig((prev) => {
      const next = { ...prev, ...partial };
      applyNicheTheme(next);
      return next;
    });
  }, []);

  return (
    <CompanyContext.Provider value={{ config, loading, error, fetchConfig, updateConfig }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used inside <CompanyProvider>');
  return ctx;
}
