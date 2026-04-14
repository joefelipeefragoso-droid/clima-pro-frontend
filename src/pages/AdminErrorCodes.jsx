import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Download, Upload, BarChart2, Check, X, AlertCircle, ChevronLeft } from 'lucide-react';
import api from '../services/api';

export default function AdminErrorCodes() {
  const [codes, setCodes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    brand: '',
    model: '',
    code: '',
    title: '',
    description: '',
    causes: '',
    diagnosis_steps: '',
    solution: '',
    urgency: 'media',
    tags: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [codesRes, statsRes] = await Promise.all([
        api.get('/error-codes'),
        api.get('/error-codes/stats')
      ]);
      setCodes(codesRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (code = null) => {
    if (code) {
      setEditingCode(code);
      setForm({ ...code });
    } else {
      setEditingCode(null);
      setForm({
        brand: '',
        model: '',
        code: '',
        title: '',
        description: '',
        causes: '',
        diagnosis_steps: '',
        solution: '',
        urgency: 'media',
        tags: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCode) {
        await api.put(`/error-codes/${editingCode.id}`, form);
      } else {
        await api.post('/error-codes', form);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Erro ao salvar codigo.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este codigo?')) return;
    try {
      await api.delete(`/error-codes/${id}`);
      fetchData();
    } catch (err) {
      alert('Erro ao excluir.');
    }
  };

  const filteredCodes = codes.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button className="btn btn-ghost mb-2" onClick={() => window.location.href = '/admin/dashboard'} style={{ padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ChevronLeft size={16} /> Voltar ao Dashboard
          </button>
          <h1 className="h2 mb-1">Gerenciamento de Codigos de Erro</h1>
          <p className="text-muted">Administracao da biblioteca técnica do ClimaGestor</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Adicionar Novo Codigo
        </button>
      </div>

      {stats && (
        <div className="grid-4 mb-6">
          <div className="card">
            <p className="text-muted small uppercase fw-bold mb-1">Total de Codigos</p>
            <h3 className="h2 mb-0">{stats.totalCodes}</h3>
          </div>
          {stats.brands.slice(0, 3).map(b => (
            <div className="card" key={b.brand}>
              <p className="text-muted small uppercase fw-bold mb-1">{b.brand}</p>
              <h3 className="h2 mb-0">{b.count}</h3>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Filtrar por marca ou codigo..." 
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Marca</th>
                <th>Codigo</th>
                <th>Titulo do Erro</th>
                <th>Urgência</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCodes.map(c => (
                <tr key={c.id}>
                  <td><span className="badge badge-primary">{c.brand}</span></td>
                  <td><strong>{c.code}</strong></td>
                  <td>{c.title}</td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem', 
                      fontWeight: 700, 
                      textTransform: 'uppercase',
                      background: c.urgency === 'alta' || c.urgency === 'critica' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                      color: c.urgency === 'alta' || c.urgency === 'critica' ? '#EF4444' : '#10B981'
                    }}>
                      {c.urgency}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpenModal(c)}><Edit2 size={16} /></button>
                      <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(c.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCodes.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">Nenhum codigo cadastrado ou encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingCode ? 'Editar Codigo' : 'Novo Codigo de Erro'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Marca*</label>
                  <input type="text" className="form-control" required value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="Ex: LG, Samsung..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Codigo*</label>
                  <input type="text" className="form-control" required value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="Ex: E1, CH01..." />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Titulo do Erro*</label>
                <input type="text" className="form-control" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ex: Falha no sensor de degelo" />
              </div>

              <div className="form-group">
                <label className="form-label">Descricao</label>
                <textarea className="form-control" rows="2" value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Possíveis Causas (separar por ;)</label>
                  <textarea className="form-control" rows="3" value={form.causes} onChange={e => setForm({...form, causes: e.target.value})} placeholder="Causa 1; Causa 2..."></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Passos de Diagnóstico</label>
                  <textarea className="form-control" rows="3" value={form.diagnosis_steps} onChange={e => setForm({...form, diagnosis_steps: e.target.value})}></textarea>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Solucao Recomendada</label>
                  <input type="text" className="form-control" value={form.solution} onChange={e => setForm({...form, solution: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Urgência</label>
                  <select className="form-control" value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})}>
                    <option value="baixa">Baixa</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Critica</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingCode ? 'Atualizar' : 'Salvar Codigo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
