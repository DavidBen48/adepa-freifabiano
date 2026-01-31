import React, { useState } from 'react';
import { ShieldCheck, User } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { APP_CONFIG } from '../constants';

interface LoginViewProps {
  onLoginSuccess: (user: string, role: 'admin' | 'guest') => void;
  onViewPolicy: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onViewPolicy }) => {
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.user === APP_CONFIG.USER && loginForm.pass === APP_CONFIG.PASS) {
      onLoginSuccess(APP_CONFIG.USER, 'admin');
      setLoginError('');
    } else {
      setLoginError('Credenciais inválidas. Acesso negado.');
    }
  };

  const handleGuestLogin = () => {
    onLoginSuccess('Visitante', 'guest');
  };

  return (
    // Usa h-dvh para garantir 100% da altura da viewport móvel sem rolagem
    <div className="h-dvh w-full flex flex-col md:flex-row bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* 1. Branding Section (Topo no Mobile, Esquerda no Desktop) */}
      <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center items-center md:items-start border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950 relative shrink-0">
        <div className="absolute top-0 left-0 w-full h-1 md:h-2 bg-gradient-to-r from-royal-600 to-transparent"></div>
        
        {/* Compactação de texto no mobile */}
        <h1 className="text-3xl md:text-6xl font-bold tracking-tighter mb-1 md:mb-4 text-white">
          MEMBERS<span className="text-royal-500">.AI</span>
        </h1>
        <h2 className="text-sm md:text-2xl text-slate-400 font-light mb-0 md:mb-8">ADEPA - Frei Fabiano</h2>
        
        {/* Desktop Footer (Hidden on Mobile) */}
        <div className="mt-auto hidden md:block">
          <p className="text-sm text-slate-600 uppercase tracking-widest font-semibold">Developed by the CEO of Ben.AI: David Ben</p>
          <p className="text-sm text-slate-500 mt-2 font-mono font-bold">versão 2.5.1 (beta)</p>
        </div>
      </div>

      {/* 2. Form Section (Meio/Baixo no Mobile, Direita no Desktop) */}
      <div className="flex-1 w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center items-center bg-slate-900 h-full">
        <div className="w-full max-w-md flex flex-col h-full md:h-auto justify-center">
          
          <div className="mb-6 md:mb-8 flex items-center justify-center md:justify-start gap-3 shrink-0">
            <ShieldCheck className="text-royal-500" size={24} />
            <h3 className="text-xl md:text-2xl font-semibold">Acesso Administrativo</h3>
          </div>

          {/* Formulário Compacto */}
          <form onSubmit={handleLogin} className="space-y-4 md:space-y-6 shrink-0">
            <Input
              label="Usuário"
              placeholder="Identificação do sistema"
              value={loginForm.user}
              onChange={e => setLoginForm({...loginForm, user: e.target.value})}
              className="mb-2" // Override margin bottom
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••••"
              value={loginForm.pass}
              onChange={e => setLoginForm({...loginForm, pass: e.target.value})}
              className="mb-2" // Override margin bottom
            />
            
            {loginError && (
              <div className="p-2 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-xs text-center">
                {loginError}
              </div>
            )}

            <Button type="submit" className="w-full py-3" variant="primary">
              Entrar no Sistema
            </Button>
          </form>
          
          {/* Ações Secundárias */}
          <div className="mt-4 md:mt-6 text-center space-y-3 shrink-0">
            <p className="text-slate-500 text-[10px] md:text-xs leading-tight">
              Acesso restrito. Sem recuperação automática.
            </p>

            <Button 
              type="button" 
              variant="secondary" 
              className="w-full py-2 text-xs font-semibold uppercase tracking-wide border-slate-700 hover:bg-slate-800"
              onClick={handleGuestLogin}
            >
              <User size={14} className="mr-2" />
              Entrar sem Cadastro
            </Button>

            <button 
              onClick={onViewPolicy}
              className="text-royal-500 hover:text-royal-400 text-xs font-medium underline underline-offset-4 transition-colors pt-2 block w-full"
            >
              ver política de segurança do site
            </button>
          </div>

          {/* Mobile Footer (Integrado no final do container flex para garantir visibilidade) */}
          <div className="mt-auto pt-4 text-center md:hidden shrink-0">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold">Developed by the CEO of Ben.AI: David Ben</p>
            <p className="text-[9px] text-slate-500 mt-1 font-mono font-bold">versão 2.5.1 (beta)</p>
          </div>
        </div>
      </div>
    </div>
  );
};