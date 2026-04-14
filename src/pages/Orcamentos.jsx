import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PlusCircle, Search, Settings, Trash2, Edit } from 'lucide-react';
import StatusDropdown from '../components/StatusDropdown';

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const q = new URLSearchParams();
      if(search) q.append('search', search);
      if(statusFilter) q.append('status', statusFilter);
      
      const res = await api.get(`/orcamentos?${q.toString()}`);
      setOrcamentos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const handleDelete = async (id) => {
    if(window.confirm('Excluir orçamento permanentemente? Todas as peças, serviços gastos associados serão perdidos.')) {
      await api.delete(`/orcamentos/${id}`);
      loadData();
    }
  };

  const handleUpdateStatusFast = async (id, status) => {
      await api.put(`/orcamentos/${id}/status`, { status });
      loadData();
  }

  const formatBRL = (val) => {
    const num = isNaN(val) || val === '' || val === null ? 0 : Number(val);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  }

  return (
    <div className="content-area">
      <div className="flex justify-between items-center mb-6">
        <h1 style={{ fontSize: '1.75rem', margin: 0, color: 'var(--primary)' }}>Gestão de Orçamentos e Obras</h1>
        <button className="btn btn-primary" onClick={() => navigate('/app/orcamento/novo')}>
          <PlusCircle size={18} /> <span className="hidden md:inline">Novo Projeto Master</span>
        </button>
      </div>

      <div className="card card-dark mb-6">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="form-group mb-0 flex-1 min-w-[200px]">
            <label className="form-label">Buscar Orçamento/Cliente</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ex:#1022 ou João Silva..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>
          
          <div className="form-group mb-0">
            <label className="form-label">Filtro de Etapa</label>
            <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ minWidth: '200px' }}>
              <option value="">Todas as Etapas</option>
              <option value="novo">Novos</option>
              <option value="em aberto">Em Aberto (Antigos)</option>
              <option value="em analise">Em Análise</option>
              <option value="aguardando aprovacao">Aguardando Aval</option>
              <option value="aprovado">Aprovado (Vendido)</option>
              <option value="em andamento">Em Execução</option>
              <option value="finalizado">Finalizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card card-dark" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nº Proposta</th>
                <th>Cliente</th>
                <th>Previsão Bruta (R$)</th>
                <th>Data Base</th>
                <th>Etapa Atual</th>
                <th style={{ textAlign: 'center' }}>Painel Central</th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.map(orc => (
                <tr key={orc.id}>
                  <td style={{ fontWeight: 600 }}>#{orc.numero_orcamento}</td>
                  <td>{orc.cliente_nome || 'Cliente não VINCULADO'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {formatBRL(orc.valor_total || 0)}
                  </td>
                  <td>{orc.data_emissao ? orc.data_emissao.split('-').reverse().join('/') : '-'}</td>
                  <td>
                      <StatusDropdown 
                         currentStatus={orc.etapa_orcamento || orc.status || 'em_aberto'} 
                         onStatusChange={(newStatus) => handleUpdateStatusFast(orc.id, newStatus)} 
                      />

                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="flex gap-2 justify-center">
                      <button 
                        className="btn btn-sm btn-outline"
                        style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)' }}
                        onClick={() => navigate(`/app/orcamento/${orc.id}`)}
                        title="Abrir Central ERP do Orçamento"
                      >
                        <Settings size={16} /> <span className="hidden lg:inline">Acessar Pasta</span>
                      </button>
                      
                      <button 
                         className="btn btn-sm"
                         style={{ color: 'var(--danger)', background: 'transparent' }}
                         onClick={() => handleDelete(orc.id)}
                         title="Lixeira"
                      >
                         <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {orcamentos.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Nenhum projeto encontrado. Mude o filtro ou inicie um novo orçamento mestre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
