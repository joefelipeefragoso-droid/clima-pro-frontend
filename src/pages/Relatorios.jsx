import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart2, Download, Filter, TrendingUp, DollarSign, Users, Briefcase, CheckCircle, Clock } from 'lucide-react';

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const STATUS_PAG = {
  recebido:  { label: 'Recebido',  color: 'var(--success)' },
  pendente:  { label: 'Pendente',  color: '#F59E0B' },
  parcial:   { label: 'Parcial',   color: '#3B82F6' },
};

export default function Relatorios() {
  const hoje = new Date().toISOString().split('T')[0];
  const inicioMes = hoje.substring(0, 7) + '-01';

  const [filtros, setFiltros] = useState({ data_inicio: inicioMes, data_fim: hoje, forma_pagamento: '' });
  const [dados, setDados] = useState({ orcamentos: [], totais: {}, topClientes: [], topServicos: [] });
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    api.get('/clientes').then(r => setClientes(r.data)).catch(console.error);
    buscar();
  }, []);

  const buscar = async (f = filtros) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (f.data_inicio)     qs.append('data_inicio', f.data_inicio);
      if (f.data_fim)        qs.append('data_fim', f.data_fim);
      if (f.cliente_id)      qs.append('cliente_id', f.cliente_id);
      if (f.forma_pagamento) qs.append('forma_pagamento', f.forma_pagamento);
      const res = await api.get(`/relatorios/financeiro?${qs}`);
      setDados(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateFiltro = (key, value) => setFiltros(f => ({ ...f, [key]: value }));

  const handleBuscar = (e) => { e.preventDefault(); buscar(); };

  const exportarCSV = () => {
    const rows = [['#', 'Cliente', 'Data', 'Valor Total', 'Recebido', 'Status Pag.', 'Forma']];
    dados.orcamentos.forEach(o => rows.push([
      o.numero_orcamento, o.cliente_nome || '-', o.data_emissao,
      o.valor_total, o.valor_recebido || 0, o.status_pagamento || 'pendente', o.forma_pagamento || '-'
    ]));
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'relatorio_financeiro.csv'; a.click();
  };

  const totais = dados.totais || {};
  const pendente = (totais.faturamento || 0) - (totais.recebido || 0);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Financeiro
          </p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Relatórios</h1>
        </div>
        <button className="btn btn-outline btn-sm" onClick={exportarCSV}>
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="card card-dark mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} color="var(--primary)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Filtros</h3>
        </div>
        <form onSubmit={handleBuscar}>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Data Início</label>
              <input type="date" className="form-control" value={filtros.data_inicio} onChange={e => updateFiltro('data_inicio', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Data Fim</label>
              <input type="date" className="form-control" value={filtros.data_fim} onChange={e => updateFiltro('data_fim', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Forma de Pagamento</label>
              <select className="form-control" value={filtros.forma_pagamento} onChange={e => updateFiltro('forma_pagamento', e.target.value)}>
                <option value="">Todas</option>
                {['Dinheiro','Pix','Cartão de Crédito','Cartão de Débito','Transferência','Boleto'].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cliente</label>
              <select className="form-control" value={filtros.cliente_id || ''} onChange={e => updateFiltro('cliente_id', e.target.value)}>
                <option value="">Todos</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => {
              const f = { data_inicio: inicioMes, data_fim: hoje, forma_pagamento: '', cliente_id: '' };
              setFiltros(f); buscar(f);
            }}>Limpar</button>
          </div>
        </form>
      </div>

      {/* Cards de Totais */}
      <div className="grid grid-cols-4 mb-6" style={{ gap: '1rem' }}>
        {[
          { icon: <TrendingUp size={20} color="var(--primary)" />, label: 'Faturamento', value: `R$ ${fmt(totais.faturamento)}`, bg: 'var(--primary-light)', border: 'rgba(251,191,36,0.2)' },
          { icon: <CheckCircle size={20} color="var(--success)" />, label: 'Recebido', value: `R$ ${fmt(totais.recebido)}`, bg: 'var(--success-bg)', border: 'rgba(16,185,129,0.2)' },
          { icon: <Clock size={20} color="#F59E0B" />, label: 'Pendente', value: `R$ ${fmt(pendente)}`, bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
          { icon: <Briefcase size={20} color="var(--secondary)" />, label: 'Orçamentos', value: totais.quantidade || 0, bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
        ].map(card => (
          <div key={card.label} className="card" style={{ background: card.bg, border: `1px solid ${card.border}`, padding: '1.25rem' }}>
            <div className="flex items-center gap-2 mb-2">{card.icon}<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{card.label}</span></div>
            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Top Clientes + Top Serviços */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card card-dark">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} color="var(--primary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Top Clientes</h3>
          </div>
          {(dados.topClientes || []).length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sem dados no período.</p>}
          {(dados.topClientes || []).map((c, i) => (
            <div key={i} className="flex justify-between items-center" style={{ marginBottom: '0.6rem' }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 7px', borderRadius: '999px' }}>#{i + 1}</span>
                <span style={{ fontSize: '0.85rem' }}>{c.nome || 'Sem nome'}</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>R$ {fmt(c.total)}</span>
            </div>
          ))}
        </div>
        <div className="card card-dark">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} color="var(--primary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Top Serviços</h3>
          </div>
          {(dados.topServicos || []).length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sem dados no período.</p>}
          {(dados.topServicos || []).map((s, i) => (
            <div key={i} className="flex justify-between items-center" style={{ marginBottom: '0.6rem' }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 7px', borderRadius: '999px' }}>#{i + 1}</span>
                <span style={{ fontSize: '0.85rem' }}>{s.nome}</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.total}x · R$ {fmt(s.receita)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de Orçamentos */}
      <div className="card card-dark">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Orçamentos no Período ({dados.orcamentos?.length || 0})
        </h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Recebido</th>
                <th>Forma Pag.</th>
                <th>Status Pag.</th>
              </tr>
            </thead>
            <tbody>
              {(dados.orcamentos || []).length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhum orçamento no período.</td></tr>
              )}
              {(dados.orcamentos || []).map(o => {
                const sp = STATUS_PAG[o.status_pagamento] || STATUS_PAG.pendente;
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>#{o.numero_orcamento}</td>
                    <td>{o.cliente_nome || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{o.data_emissao}</td>
                    <td style={{ fontWeight: 700 }}>R$ {fmt(o.valor_total)}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>R$ {fmt(o.valor_recebido)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{o.forma_pagamento || '—'}</td>
                    <td>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', color: sp.color, background: `${sp.color}18`, textTransform: 'uppercase' }}>
                        {sp.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
