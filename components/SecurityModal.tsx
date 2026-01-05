import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { APP_CONFIG } from '../constants';
import { Lock } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  actionType: 'UPDATE' | 'DELETE';
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose, onConfirm, title, actionType }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === APP_CONFIG.SECURITY_CODE) {
      onConfirm();
      onClose();
      setCode('');
      setError('');
    } else {
      setError('Código de segurança incorreto.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-3 mb-4 text-slate-100">
           <div className={`p-2 rounded-full ${actionType === 'DELETE' ? 'bg-red-900/30 text-red-400' : 'bg-royal-900/30 text-royal-500'}`}>
             <Lock size={20} />
           </div>
           <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        
        <p className="text-slate-400 mb-6 text-sm">
          Esta ação requer autorização superior. Insira o código de segurança para confirmar.
        </p>

        <form onSubmit={handleSubmit}>
          <Input
            type="password"
            placeholder="Código de 6 dígitos"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={error}
            maxLength={6}
            autoFocus
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant={actionType === 'DELETE' ? 'danger' : 'primary'}
            >
              Confirmar {actionType}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};