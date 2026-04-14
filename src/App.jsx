import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, Briefcase, Settings, Package, Wrench, BarChart2, Book, Menu, X } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Agenda from './pages/Agenda';
import Materiais from './pages/Materiais';
import Servicos from './pages/Servicos';
import Orcamentos from './pages/Orcamentos';
import OrcamentoDetalhe from './pages/OrcamentoDetalhe';
import Categorias from './pages/Categorias';
import Configuracoes from './pages/Configuracoes';
import Relatorios from './pages/Relatorios';
import ErrorCodes from './pages/ErrorCodes';
import AdminErrorCodes from './pages/AdminErrorCodes';
import SetPassword from './pages/SetPassword';
import AdminDashboard from './pages/AdminDashboard';
import Onboarding from './pages/Onboarding';
import AdminRoute from './routes/AdminRoute';
import ClientRoute from './routes/ClientRoute';
import { clearAuthData, getStoredUser, logout } from './auth/authSession';
import { getNicheByValue } from './constants/niches';
import { resolveAssetUrl } from './utils/nicheTheme';
import { CompanyProvider, useCompany } from './context/CompanyContext';
import api from './services/api';

function Sidebar({ nicheConfig, isOpen, onClose }) {
  const storedUser = getStoredUser();
  const { config } = useCompany();
  const location = useLocation();
  const companyName = config.nome_empresa || 'Nome da sua empresa';
  const logo = config.logo_url ? resolveAssetUrl(config.logo_url) : null;

  const brandTitle = nicheConfig?.theme?.moduleName || 'Gestor Pro';
  const brandSubtitle = nicheConfig?.theme?.accentLabel || 'Sistema de Gestao';
  const planLabel = storedUser?.plano ? `Plano ${String(storedUser.plano).toUpperCase()}` : 'Plano PRO';

  // Fecha o menu ao clicar em um link no mobile
  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  const initials = String(companyName || 'SL')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'SL';

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', width: '100%' }}>
          <div className="sidebar-client-card" style={{ flex: 1 }}>
            {logo ? (
              <img src={logo} alt="Logo da empresa" className="sidebar-client-logo" />
            ) : (
              <div className="sidebar-client-placeholder">{initials}</div>
            )}
            <div className="sidebar-client-meta">
              <p className="sidebar-client-name">{companyName}</p>
              <span className="sidebar-client-plan">{planLabel}</span>
            </div>
          </div>
          <button className="hamburger-btn" onClick={onClose} style={{ display: window.innerWidth <= 768 ? 'flex' : 'none' }}>
            <X size={24} />
          </button>
        </div>

        <div className="sidebar-brand">
          <p className="sidebar-brand-title">{brandTitle}</p>
          <p className="sidebar-brand-subtitle">{brandSubtitle}</p>
        </div>

        <div className="sidebar-menu-groups">
          <div className="sidebar-group">
            <p className="sidebar-group-title">Principal</p>
            <ul className="nav-menu">
              <li><NavLink to="/app" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleLinkClick} end><Home size={20} /> Inicio</NavLink></li>
              <li><NavLink to="/app/agenda" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleLinkClick}><Calendar size={20} /> Agenda</NavLink></li>
              <li><NavLink to="/app/clientes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleLinkClick}><Users size={20} /> Clientes</NavLink></li>
              <li><NavLink to="/app/orcamentos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleLinkClick}><Briefcase size={20} /> Orcamentos</NavLink></li>
              <li><NavLink to="/app/relatorios" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleLinkClick}><BarChart2 size={20} /> Relatorios</NavLink></li>
            </ul>
          </div>

          <div className="sidebar-group">
            <p className="sidebar-group-title">Gestao</p>
            <ul className="nav-menu">
              <li><NavLink to="/app/servicos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleLinkClick}><Wrench size={20} /> Servicos Padrao</NavLink></li>
              <li><NavLink to="/app/materiais" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleLinkClick}><Package size={20} /> Materiais</NavLink></li>
              {nicheConfig?.value === 'climatizacao' && (
                <li><NavLink to="/app/codigos-erro" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleLinkClick}><Book size={20} /> Livraria de Codigos</NavLink></li>
              )}
            </ul>
          </div>

          <div className="sidebar-group">
            <p className="sidebar-group-title">Sistema</p>
            <ul className="nav-menu">
              <li><NavLink to="/app/configuracoes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleLinkClick}><Settings size={20} /> Configuracoes</NavLink></li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function BottomNav() {
  return (
    <div className="bottom-nav">
      <NavLink to="/app" className={({ isActive }) => isActive ? 'bottom-nav-link active' : 'bottom-nav-link'} end><Home size={22} /><span>Inicio</span></NavLink>
      <NavLink to="/app/agenda" className={({ isActive }) => isActive ? 'bottom-nav-link active' : 'bottom-nav-link'}><Calendar size={22} /><span>Agenda</span></NavLink>
      <NavLink to="/app/clientes" className={({ isActive }) => isActive ? 'bottom-nav-link active' : 'bottom-nav-link'}><Users size={22} /><span>Clientes</span></NavLink>
      <NavLink to="/app/orcamentos" className={({ isActive }) => isActive ? 'bottom-nav-link active' : 'bottom-nav-link'}><Briefcase size={22} /><span>Orcamentos</span></NavLink>
      <NavLink to="/app/relatorios" className={({ isActive }) => isActive ? 'bottom-nav-link active' : 'bottom-nav-link'}><BarChart2 size={22} /><span>Relatorios</span></NavLink>
      <NavLink to="/app/configuracoes" className={({ isActive }) => isActive ? 'bottom-nav-link active' : 'bottom-nav-link'}><Settings size={22} /><span>Perfil</span></NavLink>
    </div>
  );
}

function Layout({ children, title, nicheConfig }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar 
        nicheConfig={nicheConfig} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-brand">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="topbar-title">{title}</div>
          </div>
        </header>
        <main className="content-area">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}

function LoginPainel({ onLogin, mode = 'client' }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const isAdminMode = mode === 'admin';

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await api.post('/login', { email, senha });
      const userData = res.data;

      if (!userData.role) {
        setErro('Erro interno: perfil de acesso nao definido.');
        return;
      }

      if (isAdminMode && userData.role !== 'admin') {
        setErro('Este acesso e exclusivo para administradores.');
        return;
      }

      clearAuthData();
      localStorage.setItem('userLogado', JSON.stringify(userData));
      onLogin(userData);

      if (userData.role === 'admin') {
        window.location.href = '/admin/dashboard';
      } else if (!userData.onboarding_completed) {
        window.location.href = '/onboarding';
      } else {
        window.location.href = '/app';
      }
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao conectar no servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <div className="card" style={{ width: '400px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Briefcase size={40} style={{ color: 'var(--primary)' }} />
          <h2 style={{ marginTop: '1rem', color: 'var(--text-color)' }}>{isAdminMode ? 'Login Administrativo' : 'Acesso ao Sistema'}</h2>
        </div>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" required className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input type="password" required className="form-control" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
          {erro && <p style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{erro}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AppEntry({ user }) {
  if (!user) return <Navigate to="/login" replace />;
  const role = String(user.role || '').toLowerCase();
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (!user.onboarding_completed) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/app" replace />;
}

function LoginRoute({ user, onLogin }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const niche = params.get('nicho');
  const forceLogin = params.get('forceLogin') === '1';

  if (niche || forceLogin) {
    return <LoginPainel onLogin={onLogin} mode="client" />;
  }

  return user ? <AppEntry user={user} /> : <LoginPainel onLogin={onLogin} mode="client" />;
}

function AdminEntry({ user }) {
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />;
  return <Navigate to="/admin/dashboard" replace />;
}

function AdminLoginRoute({ user, onLogin }) {
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user && user.role !== 'admin') return <AppEntry user={user} />;
  return <LoginPainel onLogin={onLogin} mode="admin" />;
}

function ModuleRoutes({ niche }) {
  const config = getNicheByValue(niche);
  const titlePrefix = config.label;

  return (
    <Routes>
      <Route path="/" element={<Layout title={`Dashboard ${titlePrefix}`} nicheConfig={config}><Dashboard niche={config.value} nicheConfig={config} /></Layout>} />
      <Route path="agenda" element={<Layout title={`Agenda ${titlePrefix}`} nicheConfig={config}><Agenda /></Layout>} />
      <Route path="clientes" element={<Layout title={`Clientes ${titlePrefix}`} nicheConfig={config}><Clientes /></Layout>} />
      <Route path="orcamentos" element={<Layout title={`Orcamentos ${titlePrefix}`} nicheConfig={config}><Orcamentos niche={config.value} nicheConfig={config} /></Layout>} />
      <Route path="orcamento/:id" element={<Layout title={`Central do Projeto ${titlePrefix}`} nicheConfig={config}><OrcamentoDetalhe niche={config.value} nicheConfig={config} /></Layout>} />
      <Route path="categorias" element={<Layout title="Nichos e Categorias" nicheConfig={config}><Categorias /></Layout>} />
      <Route path="servicos" element={<Layout title={config.theme?.serviceLabel || 'Servicos'} nicheConfig={config}><Servicos defaultNiche={config.value} /></Layout>} />
      <Route path="materiais" element={<Layout title={config.theme?.materialLabel || 'Materiais'} nicheConfig={config}><Materiais defaultNiche={config.value} /></Layout>} />
      <Route path="relatorios" element={<Layout title="Relatorios Financeiros" nicheConfig={config}><Relatorios /></Layout>} />
      <Route path="configuracoes" element={<Layout title="Configuracoes & Perfil" nicheConfig={config}><Configuracoes /></Layout>} />
      {config.value === 'climatizacao' && (
        <Route path="codigos-erro" element={<Layout title="Livraria de Codigos de Erro" nicheConfig={config}><ErrorCodes /></Layout>} />
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ClienteApp({ user, onLogout }) {
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const tipo = user?.tipo_empresa?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const content = (() => {
    switch (tipo) {
      case 'climatizacao':
      case 'terraplanagem':
        return <ModuleRoutes niche={tipo} />;
      default:
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Empresa nao catalogada</h1>
            <p>Tipo: "{user?.tipo_empresa}" nao possui modulo mapeado.</p>
            <button className="btn btn-primary" onClick={onLogout}>Voltar p/ Login</button>
          </div>
        );
    }
  })();

  return <CompanyProvider>{content}</CompanyProvider>;
}

function AppRouter({ user, setUser }) {
  const handleLogout = () => {
    setUser(null);
    logout();
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppEntry user={user} />} />
        <Route path="/login" element={<LoginRoute user={user} onLogin={setUser} />} />
        <Route path="/admin/login" element={<AdminLoginRoute user={user} onLogin={setUser} />} />
        <Route path="/admin" element={<AdminEntry user={user} />} />
        <Route path="/set-password/:token" element={<SetPassword />} />
        <Route path="/primeiro-acesso" element={<SetPassword />} />
        <Route
          path="/onboarding"
          element={(
            <ClientRoute user={user} allowOnboardingPage>
              <Onboarding onCompleted={setUser} />
            </ClientRoute>
          )}
        />

        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard onLogout={handleLogout} />} />
          <Route path="/admin/biblioteca" element={<AdminErrorCodes />} />
        </Route>

        <Route
          path="/app/*"
          element={(
            <ClientRoute user={user}>
              <ClienteApp user={user || getStoredUser()} onLogout={handleLogout} />
            </ClientRoute>
          )}
        />

        <Route path="*" element={<AppEntry user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());

    const syncLogout = () => setUser(null);
    window.addEventListener('auth:logout', syncLogout);
    return () => window.removeEventListener('auth:logout', syncLogout);
  }, []);

  return <AppRouter user={user} setUser={setUser} />;
}
