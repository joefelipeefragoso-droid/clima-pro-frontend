import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function SetPassword() {
  const location = useLocation();

  // Pegar o token da URL (?token=...)
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [validating, setValidating] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Validar token ao abrir a pagina
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('Token de acesso nao encontrado. Verifique o link no seu e-mail.');
        setValidating(false);
        return;
      }

      try {
        const res = await api.get(`/auth/validate-token?token=${token}`);
        setEmail(res.data.email);
        setNome(res.data.nome);
        setValidating(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Link invalido ou expirado.');
        setValidating(false);
      }
    }
    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setError('As senhas nao coincidem.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/auth/set-password`, { token, password: senha });
      const { token: sessionToken, user } = res.data;

      if (!sessionToken || !user) {
        throw new Error('Resposta de autenticacao incompleta.');
      }

      localStorage.setItem('authToken', sessionToken);
      localStorage.setItem('userLogado', JSON.stringify(user));
      window.dispatchEvent(new Event('storage'));
      setSuccess(true);

      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erro ao definir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-color)' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
        <p>Validando seu link de acesso...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-color)' }}>
        <div className="card" style={{ width: '450px', padding: '2.5rem', textAlign: 'center' }}>
          <CheckCircle size={60} style={{ color: 'var(--success)', marginBottom: '1.5rem', display: 'inline-block' }} />
          <h2 style={{ marginBottom: '1rem' }}>Sua conta esta ativa!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Ola <strong>{nome}</strong>, sua senha foi criada com sucesso.
            Voce ja pode acessar o sistema com seu e-mail: <strong>{email}</strong>.
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>Redirecionando para o dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <div className="card" style={{ width: '450px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--primary-light)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Lock size={30} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Definir sua Senha</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Ola {nome}, este e seu primeiro acesso. <br />
            Crie uma senha segura para sua conta.
          </p>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {!error && (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">E-mail de Acesso</label>
              <input
                type="text"
                className="form-control"
                value={email}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Nova Senha</label>
              <input
                type="password"
                className="form-control"
                placeholder="Minimo 6 caracteres"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Confirmar Senha</label>
              <input
                type="password"
                className="form-control"
                placeholder="Repita a senha"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" style={{ marginRight: '0.5rem', display: 'inline' }} />
                  Ativando...
                </>
              ) : 'Ativar Minha Conta'}
            </button>
          </form>
        )}

        {error && (
          <button onClick={() => { window.location.href = '/'; }} className="btn btn-outline" style={{ width: '100%', marginTop: '1rem' }}>
            Voltar ao Inicio
          </button>
        )}
      </div>
    </div>
  );
}
