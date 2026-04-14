import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PlusCircle, Edit, Trash2, Search, Package } from 'lucide-react';

export default function Materiais({ defaultNiche = 'climatizacao' }) {
  const [materiais, setMateriais] = useState([]);
  const [categoriasMestre, setCategoriasMestre] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    nome: '', nicho: defaultNiche, categoria: '', unidade: 'un',
    quantidade_estoque: 0, valor_custo: 0, valor_venda: 0, observacoes: ''
  });

  const loadData = async () => {
    try {
      const qs = new URLSearchParams();
      // sempre filtrar pelo nicho da rota — isolamento garantido
      qs.append('nicho', defaultNiche);
      if (search) qs.append('search', search);

      const [resM, resC] = await Promise.all([
        api.get(`/materiais?${qs.toString()}`),
        api.get(`/categorias?nicho=${defaultNiche}`)
      ]);
      setMateriais(resM.data);
      setCategoriasMestre(resC.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, [search, defaultNiche]);

  const openModal = (mat = null) => {
    if (mat) {
      setEditingId(mat.id);
      setForm({ ...mat, nicho: defaultNiche, categoria: mat.categoria || '' });
    } else {
      setEditingId(null);
      setForm({ nome: '', nicho: defaultNiche, categoria: '', unidade: 'un', quantidade_estoque: 0, valor_custo: 0, valor_venda: 0, observacoes: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, nicho: defaultNiche }; // garante o nicho correto
      if (editingId) await api.put(`/materiais/${editingId}`, payload);
      else await api.post('/materiais', payload);
      closeModal();
      loadData();
    } catch (err) { alert('Erro ao salvar'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Excluir peça/material?')) {
      await api.delete(`/materiais/${id}`);
      loadData();
    }
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
              placeholder="Buscar peças/materiais..."
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
          <PlusCircle size={18} /> Cadastrar Nova Peça
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome da Peça/Material</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Estoque</th>
                <th>Preço Venda</th>
                <th style={{ width: '100px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {materiais.map((c) => (
                <tr key={c.id}>
                  <td data-label="Nome" style={{ fontWeight: 500 }}>{c.nome}</td>
                  <td data-label="Categoria">{c.categoria || '-'}</td>
                  <td data-label="Estoque">{c.quantidade_estoque} {c.unidade}</td>
                  <td data-label="Preço">R$ {Number(c.valor_venda).toFixed(2)}</td>
                  <td data-label="Ações">
                    <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => openModal(c)}><Edit size={16} /></button>
                      <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleDelete(c.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {materiais.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum material cadastrado para {nichoLabel}.
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
            <h2 className="mb-6">{editingId ? 'Editar Material' : 'Novo Material'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid-stack cols-2">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Nome *</label>
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

                <div className="form-group">
                  <label className="form-label">Unidade (Ex: un, kg, m)</label>
                  <input type="text" className="form-control" value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Qtd Estoque</label>
                  <input type="number" className="form-control" value={form.quantidade_estoque} onChange={e => setForm({ ...form, quantidade_estoque: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Valor Custo (R$)</label>
                  <input type="number" step="0.01" className="form-control" value={form.valor_custo} onChange={e => setForm({ ...form, valor_custo: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Valor Venda (R$)</label>
                  <input type="number" step="0.01" className="form-control" value={form.valor_venda} onChange={e => setForm({ ...form, valor_venda: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
