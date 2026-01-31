import React, { useState } from 'react';
import { Users, Search, User } from 'lucide-react';
import { Member } from '../types';
import { Button } from '../components/Button';

interface MemberListViewProps {
  members: Member[];
  isLoading: boolean;
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
  onViewDetails: (member: Member) => void;
  isReadOnly?: boolean;
}

export const MemberListView: React.FC<MemberListViewProps> = ({ 
  members, 
  isLoading, 
  onEdit, 
  onDelete, 
  onViewDetails,
  isReadOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Primeiro filtramos
  const filtered = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cpf.includes(searchTerm)
  );

  // 2. Depois ordenamos alfabeticamente seguindo as regras PT-BR
  const sortedMembers = filtered.sort((a, b) => 
    a.fullName.localeCompare(b.fullName, 'pt-BR', { sensitivity: 'base' })
  );

  return (
    <div className="space-y-6">
      
      {/* Header com Contador */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-2 mb-2">
          <div className="text-slate-400 text-sm">
              Gerenciamento e Consulta
          </div>
          <div className="px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-sm text-slate-300 shadow-sm flex items-center gap-2">
              <Users size={14} className="text-royal-500"/>
              Total de Membros: <span className="text-royal-400 font-bold text-base">{members.length}</span>
          </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou CPF..." 
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-slate-100 focus:outline-none focus:border-royal-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
      </div>

      {/* List */}
      {isLoading && members.length === 0 ? (
        <div className="text-center py-20 text-slate-500">Carregando dados...</div>
      ) : sortedMembers.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-lg">
          <p className="text-slate-400">Nenhum membro encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedMembers.map((member) => (
            <div key={member.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between group hover:border-slate-700 transition-colors">
              <div className="mb-4 md:mb-0 flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-slate-600" size={24} />
                    )}
                </div>

                <div>
                  <h4 className="font-semibold text-lg text-white flex items-center gap-2">
                    {member.fullName}
                    <span className="text-xs font-normal bg-royal-900/30 text-royal-400 px-2 py-0.5 rounded border border-royal-900/50">
                      {member.role}
                    </span>
                  </h4>
                  <p className="text-slate-500 text-sm">CPF: {member.cpf} • RG: {member.rg}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-2 pl-16 md:pl-0">
                <Button 
                  variant="secondary" 
                  className="text-[10px] uppercase font-bold px-3 py-2 w-full sm:w-auto"
                  onClick={() => onViewDetails(member)}
                >
                  LER DADOS DO MEMBRO
                </Button>
                <Button 
                  variant="secondary"
                  className={`text-[10px] uppercase font-bold px-3 py-2 w-full sm:w-auto ${isReadOnly ? 'opacity-50 cursor-not-allowed text-slate-500 border-slate-800' : 'text-blue-300 hover:text-blue-200 hover:border-blue-800'}`}
                  onClick={() => !isReadOnly && onEdit(member)}
                  disabled={isReadOnly}
                  title={isReadOnly ? "Ação restrita a administradores" : "Editar"}
                >
                  ATUALIZAR DADOS
                </Button>
                <Button 
                  variant="danger"
                  className={`text-[10px] uppercase font-bold px-3 py-2 w-full sm:w-auto ${isReadOnly ? 'opacity-50 cursor-not-allowed bg-slate-800 border-slate-800 text-slate-500' : ''}`}
                  onClick={() => !isReadOnly && onDelete(member.id)}
                  disabled={isReadOnly}
                  title={isReadOnly ? "Ação restrita a administradores" : "Deletar"}
                >
                  DELETAR MEMBRO
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};