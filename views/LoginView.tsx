import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { APP_CONFIG } from '../constants';

interface LoginViewProps {
  onLoginSuccess: (user: string) => void;
  onViewPolicy: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onViewPolicy }) => {
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.user === APP_CONFIG.USER && loginForm.pass === APP_CONFIG.PASS) {
      onLoginSuccess(APP_CONFIG.USER);
      setLoginError('');
    } else {
      setLoginError('Credenciais inválidas. Acesso negado.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100">
      {/* Left Side */}
      <div className="w-full md:w-1/2 p-12 flex flex-col justify-center items-start border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-royal-600 to-transparent"></div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-white">
          MEMBERS<span className="text-royal-500">.AI</span>
        </h1>
        <h2 className="text-2xl text-slate-400 font-light mb-8">ADEPA - Frei Fabiano</h2>
        <div className="mt-auto">
          <p className="text-sm text-slate-600 uppercase tracking-widest font-semibold">Developed by the CEO of Ben.AI: David Ben</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center bg-slate-900">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <ShieldCheck className="text-royal-500" size={32} />
            <h3 className="text-2xl font-semibold">Acesso Administrativo</h3>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Usuário"
              placeholder="Identificação do sistema"
              value={loginForm.user}
              onChange={e => setLoginForm({...loginForm, user: e.target.value})}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••••"
              value={loginForm.pass}
              onChange={e => setLoginForm({...loginForm, pass: e.target.value})}
            />
            
            {loginError && (
              <div className="p-3 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-sm">
                {loginError}
              </div>
            )}

            <Button type="submit" className="w-full py-3" variant="primary">
              Entrar no Sistema
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-3">
            <p className="text-slate-500 text-xs">
              Acesso restrito a administradores. Não há opção de recuperação automática.
            </p>
            <button 
              onClick={onViewPolicy}
              className="text-royal-500 hover:text-royal-400 text-xs font-medium underline underline-offset-4 transition-colors"
            >
              ver política de segurança do site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};