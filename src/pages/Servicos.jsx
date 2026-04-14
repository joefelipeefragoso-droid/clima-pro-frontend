import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PlusCircle, Edit, Trash2, Search, Briefcase, Copy } from 'lucide-react';

const UNIDADES_COBRANCA = ['por hora', 'por diária', 'por m²', 'por m³', 'por viagem', 'valor fixo'];

export default function Servicos({ defaultNiche = 'climatizacao' }) {
  const [servicos, setServicos] = useState([]);
  const [categoriasMestre, setCategoriasMestre] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    nome: '', descricao: '', nicho: defaultNiche, categoria: '', valor_padrao: 0, unidade_cobranca: 'valor fixo', status: 'ativo', observacoes: ''
  });

  const loadData = async () => {
    try {
      const qs = new URLSearchParams();
      // sempre filtrar pelo nicho da rota — isolamento garantido
      qs.append('nicho', defaultNiche);
      if (search) qs.append('search', search);

      const [resS, resC] = await Promise.all([
        api.get(`/servicos?${qs.toString()}`),
        api.get(`/categorias?nicho=${defaultNiche}`)
      ]);
      setServicos(resS.data);
      setCategoriasMestre(resC.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, [search, defaultNiche]);

  const openModal = (serv = null) => {
    if (serv) {
      setEditingId(serv.id);
      setForm({
        ...serv,
        nicho: defaultNiche, // sempre força o nicho da rota
        categoria: serv.categoria || '',
        unidade_cobranca: serv.unidade_cobranca || 'valor fixo',
        status: serv.status || 'ativo'
      });
    } else {
      setEditingId(null);
      setForm({ nome: '', descricao: '', nicho: defaultNiche, categoria: '', valor_padrao: 0, unidade_cobranca: 'valor fixo', status: 'ativo', observacoes: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, nicho: defaultNiche }; // garante o nicho correto
      if (editingId) await api.put(`/servicos/${editingId}`, payload);
      else await api.post('/servicos', payload);
      closeModal();
      loadData();
    } catch (err) { alert('Erro ao salvar serviço'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir?')) {
      await api.delete(`/servicos/${id}`);
      loadData();
    }
  };

  const handleDuplicate = async (servico) => {
    const payload = {
      ...servico,
      nome: `${servico.nome} - Cópia`,
      nicho: defaultNiche,
      is_default_niche_service: 0
    };
    delete payload.id;
    await api.post('/servicos', payload);
    loadData();
  };

  const nichoLabel = defaultNiche.charAt(0).toUpperCase() + defaultNiche.slice(1).replace(/_/g, ' ');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar serviços..."
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span style={{
            fontSize: '0.8rem', fontWeight: 700, padding: '0.4rem 1rem',
            borderRadius: '999px', background: 'rgba(var(--primary-rgb, 251,191,36),0.15)',
            color: 'var(--primary)', border: '1px solid rgba(var(--primary-rgb,251,191,36),0.3)'
          }}>
            ✦ {nichoLabel}
          </span>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <PlusCircle size={18} /> Novo Serviço
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome do Serviço</th>
                <th>Categoria</th>
                <th>Unidade</th>
                <th>Valor Padrão (Mão de Obra)</th>
                <th style={{ width: '120px' }}>Ações</th>
                <th>Descrição</th>
                <th>Mão de Obra</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {servicos.map((s) => (
                <tr key={s.id}>
                  <td data-label="Nome">{s.nome}</td>
                  <td data-label="Categoria">{s.categoria}</td>
                  <td data-label="Descrição">{s.descricao}</td>
                  <td data-label="Valor"><span className="badge badge-gold">R$ {Number(s.valor_padrao).toFixed(2)}</span></td>
                  <td data-label="Ações">
                    <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => handleDuplicate(s)}><Copy size={16} /></button>
                      <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => openModal(s)}><Edit size={16} /></button>
                      <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleDelete(s.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {servicos.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum serviço cadastrado para {nichoLabel}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="mb-6">{editingId ? 'Editar Serviço' : 'Novo Serviço'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid-stack cols-2">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Nome do Serviço *</label>
                  <input type="text" className="form-control" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Nicho de Mercado</label>
                  <input
                    type="text"
                    className="form-control"
                    value={nichoLabel}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Categoria Específica</label>
                  <select className="form-control" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                    <option value="">Selecione...</option>
                    {categoriasMestre.map(cv => <option key={cv.id} value={cv.nome_categoria}>{cv.nome_categoria}</option>)}
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Descrição Padrão</label>
                  <input type="text" className="form-control" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
                </div>

                <div className="form-group" style={{ gridColumn: window.innerWidth > 640 ? 'span 2' : 'span 1' }}>
                  <label className="form-label">Valor Mão de Obra Padrão (R$)</label>
                  <input type="number" step="0.01" className="form-control" value={form.valor_padrao} onChange={e => setForm({ ...form, valor_padrao: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Unidade de Cobrança</label>
                  <select className="form-control" value={form.unidade_cobranca || 'valor fixo'} onChange={e => setForm({ ...form, unidade_cobranca: e.target.value })}>
                    {UNIDADES_COBRANCA.map((unidade) => <option key={unidade} value={unidade}>{unidade}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status || 'ativo'} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Serviço</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
