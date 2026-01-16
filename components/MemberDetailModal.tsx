import React from 'react';
import { User, LogOut, MapPin } from 'lucide-react';
import { Button } from './Button';
import { Member } from '../types';

interface MemberDetailModalProps {
  member: Member | null;
  onClose: () => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ member, onClose }) => {
  if (!member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            {member.photoUrl ? (
               <img src={member.photoUrl} alt={member.fullName} className="w-16 h-16 rounded-full object-cover border border-slate-600" />
            ) : (
               <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                 <User className="text-slate-400" size={32} />
               </div>
            )}
            <div>
              <h3 className="text-2xl font-bold text-white">{member.fullName}</h3>
              <span className="text-royal-400 text-sm font-medium">{member.role}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <LogOut size={20} className="rotate-180"/> 
          </button>
        </div>
        
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4 text-sm bg-slate-950/50 p-6 rounded-lg border border-slate-800">
                <div className="space-y-1">
                    <p className="text-slate-500">CPF</p>
                    <p className="text-slate-200">{member.cpf}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-slate-500">RG</p>
                    <p className="text-slate-200">{member.rg}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-slate-500">Data de Nascimento</p>
                    <p className="text-slate-200">{new Date(member.birthDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-slate-500">Batismo</p>
                    <p className="text-slate-200">{member.baptismDate ? new Date(member.baptismDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-slate-500">Localidade</p>
                    <p className="text-slate-200">{member.locality}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-slate-500">Código de Acesso</p>
                    <p className="text-slate-200 font-mono tracking-wider">{member.accessCode || '-'}</p>
                </div>
            </div>

            {/* Endereço */}
            <div className="bg-slate-950/50 p-6 rounded-lg border border-slate-800">
                 <div className="flex items-center gap-2 mb-4 text-royal-400">
                    <MapPin size={18} />
                    <h4 className="font-semibold text-sm uppercase tracking-wider">Endereço</h4>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-4 text-sm">
                     <div className="space-y-1 md:col-span-2">
                        <p className="text-slate-500">Logradouro</p>
                        <p className="text-slate-200">{member.street ? `${member.street}, ${member.number || 'S/N'}` : 'Não informado'}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-slate-500">Bairro</p>
                        <p className="text-slate-200">{member.neighborhood || '-'}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-slate-500">Cidade</p>
                        <p className="text-slate-200">{member.city || '-'}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-slate-500">CEP</p>
                        <p className="text-slate-200">{member.zipCode || '-'}</p>
                     </div>
                 </div>
            </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
};