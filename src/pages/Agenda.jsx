import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

export default function Agenda() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    cliente_id: '', telefone: '', endereco: '', data: '', hora: '', 
    tipo_servico: '', tecnico_responsavel: '', observacoes: '', status: 'agendado'
  });

  const loadAgendamentos = () => {
    api.get('/agendamentos').then(res => setAgendamentos(res.data)).catch(console.error);
  };
  
  const loadClientes = () => {
    api.get('/clientes').then(res => setClientes(res.data)).catch(console.error);
  };

  useEffect(() => {
    loadAgendamentos();
    loadClientes();
  }, []);

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setForm(item);
    } else {
      setEditingId(null);
      setForm({
        cliente_id: '', telefone: '', endereco: '', data: '', hora: '', 
        tipo_servico: '', tecnico_responsavel: '', observacoes: '', status: 'agendado'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/agendamentos/${editingId}`, form);
      } else {
        await api.post('/agendamentos', form);
      }
      closeModal();
      loadAgendamentos();
    } catch (err) {
      alert('Erro ao salvar agendamento');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Tem certeza que deseja cancelar/excluir?')) {
      await api.delete(`/agendamentos/${id}`);
      loadAgendamentos();
    }
  };

  const handleClienteSelect = (e) => {
    const cid = e.target.value;
    setForm({ ...form, cliente_id: cid });
    const cliente = clientes.find(c => c.id == cid);
    if (cliente) {
      setForm(prev => ({ ...prev, telefone: cliente.telefone || cliente.whatsapp || '', endereco: cliente.endereco || '' }));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Agenda de Serviços</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <PlusCircle size={18} /> Novo Agendamento
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Cliente</th>
                <th>Serviço</th>
                <th>Técnico</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.data.split('-').reverse().join('/')} às {a.hora}</td>
                  <td>{a.cliente_nome || '-'}</td>
                  <td>{a.tipo_servico || '-'}</td>
                  <td>{a.tecnico_responsavel || '-'}</td>
                  <td><span className={`badge badge-blue`}>{a.status}</span></td>
                  <td>
                    <div className="flex gap-2">
                       <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} onClick={() => openModal(a)}>
                         <Edit size={16} />
                       </button>
                       <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(a.id)}>
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {agendamentos.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>Nenhum agendamento encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="mb-6">{editingId ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Cliente *</label>
                  <select className="form-control" value={form.cliente_id} onChange={handleClienteSelect} required>
                    <option value="">Selecione o Cliente</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Data *</label>
                  <input type="date" className="form-control" value={form.data} onChange={e => setForm({...form, data: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora *</label>
                  <input type="time" className="form-control" value={form.hora} onChange={e => setForm({...form, hora: e.target.value})} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Serviço</label>
                  <input type="text" className="form-control" value={form.tipo_servico} onChange={e => setForm({...form, tipo_servico: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Técnico Responsável</label>
                  <input type="text" className="form-control" value={form.tecnico_responsavel} onChange={e => setForm({...form, tecnico_responsavel: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone Contato</label>
                  <input type="text" className="form-control" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="agendado">Agendado</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="em andamento">Em Andamento</option>
                    <option value="finalizado">Finalizado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Endereço de Execução</label>
                  <input type="text" className="form-control" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Observações</label>
                  <textarea className="form-control" value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})}></textarea>
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
