import React, { useState, useEffect } from 'react';
import { Search, Book, AlertTriangle, CheckCircle, Info, ChevronRight, XCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const URGENCY_MODES = {
  baixa: { label: 'Baixa', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  media: { label: 'Media', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  alta: { label: 'Alta', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  critica: { label: 'Critica', color: '#991B1B', bg: 'rgba(153,27,27,0.1)' },
};

export default function ErrorCodes() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await api.get(`/error-codes/search?q=${encodeURIComponent(query)}`);
      setResults(res.data || []);
      setHasSearched(true);
      setSelectedCode(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderDetail = (item) => {
    const urgency = URGENCY_MODES[item.urgency] || URGENCY_MODES.media;

    return (
      <div className="card animate-fade-in" style={{ marginTop: '1.5rem', borderLeft: `5px solid ${urgency.color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>{item.brand} - {item.code}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{item.title}</p>
          </div>
          <span style={{ 
            padding: '0.4rem 0.8rem', 
            borderRadius: '6px', 
            fontSize: '0.8rem', 
            fontWeight: 700, 
            background: urgency.bg, 
            color: urgency.color,
            textTransform: 'uppercase'
          }}>
            Urgência {urgency.label}
          </span>
        </div>

        <div className="grid-2" style={{ gap: '2rem' }}>
          <div>
            <section style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.6rem' }}>
                <Info size={18} /> Descricao do Problema
              </h4>
              <p style={{ lineHeight: 1.6 }}>{item.description || 'Nenhuma descricao informada.'}</p>
            </section>

            <section style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444', marginBottom: '0.6rem' }}>
                <AlertTriangle size={18} /> Possíveis Causas
              </h4>
              <ul style={{ paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                {String(item.causes || '').split(';').map((c, i) => <li key={i}>{c.trim()}</li>)}
              </ul>
            </section>
          </div>

          <div>
            <section style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3B82F6', marginBottom: '0.6rem' }}>
                <Search size={18} /> Passos de Diagnóstico
              </h4>
              <div style={{ whiteSpace: 'pre-line', lineHeight: 1.6, background: 'var(--bg-light)', padding: '1rem', borderRadius: '8px' }}>
                {item.diagnosis_steps || 'Consulte o manual do fabricante.'}
              </div>
            </section>

            <section>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', marginBottom: '0.6rem' }}>
                <CheckCircle size={18} /> Solucao Recomendada
              </h4>
              <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.solution || 'Substituicao de peca ou reparo na placa.'}</p>
            </section>
          </div>
        </div>

        {item.related_parts && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <strong>Pecas Relacionadas:</strong> {item.related_parts}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container-fluid">
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 3rem auto' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', background: 'linear-gradient(90deg, var(--primary), #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Livraria Inteligante de Codigos de Erro
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Busque por marca, codigo ou sintoma. Receba diagnosticos precisos na palma da mão.
        </p>

        <form onSubmit={handleSearch} style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Ex: E1 LG, Ar nao gela Samsung, P03..." 
            className="form-control"
            style={{ 
              height: '65px', 
              padding: '0 4rem 0 1.5rem', 
              fontSize: '1.2rem', 
              borderRadius: '16px', 
              boxShadow: 'var(--shadow-lg)',
              border: '2px solid transparent',
              transition: 'all 0.3s'
            }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              position: 'absolute', 
              right: '8px', 
              top: '8px', 
              height: '49px', 
              width: '49px', 
              padding: 0, 
              borderRadius: '12px' 
            }}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
          </button>
        </form>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {hasSearched && results.length === 0 && !loading && (
          <div className="card text-center" style={{ padding: '4rem' }}>
            <XCircle size={60} style={{ color: 'var(--danger)', marginBottom: '1.5rem', opacity: 0.5 }} />
            <h3>Nenhum resultado encontrado</h3>
            <p style={{ color: 'var(--text-muted)' }}>Tente buscar apenas pelo codigo ou verifique se a marca foi digitada corretamente.</p>
          </div>
        )}

        <div className="grid-2" style={{ gap: '1rem' }}>
          {!selectedCode && results.map((item) => (
            <div 
              key={item.id} 
              className="card card-hover" 
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}
              onClick={() => setSelectedCode(item)}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>{item.brand}</span>
                <h3 style={{ margin: '0.2rem 0' }}>{item.code}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>{item.title}</p>
              </div>
              <ChevronRight size={20} style={{ color: 'var(--border-color)' }} />
            </div>
          ))}
        </div>

        {selectedCode && (
          <div>
            <button className="btn btn-ghost" style={{ marginBottom: '1rem' }} onClick={() => setSelectedCode(null)}>
              &larr; Voltar para a lista
            </button>
            {renderDetail(selectedCode)}
          </div>
        )}
      </div>
    </div>
  );
}
