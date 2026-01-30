import React, { useState } from 'react';
import { Member } from '../types';
import { User, MapPin, Navigation } from 'lucide-react';
import { Button } from '../components/Button';
import { RouteModal } from '../components/RouteModal';

interface VisitMemberViewProps {
  members: Member[];
}

export const VisitMemberView: React.FC<VisitMemberViewProps> = ({ members }) => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Filtrar apenas membros que possuem endereço cadastrado para visita
  // Regra básica: Ter Rua e Número
  const validMembers = members.filter(m => 
    m.street && m.street.trim() !== '' && 
    m.number && m.number.trim() !== ''
  ).sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-3 text-slate-300 pb-4 border-b border-slate-800">
         <Navigation className="text-royal-500" />
         <h2 className="text-xl font-semibold">Planejamento de Visitas</h2>
       </div>

       {validMembers.length === 0 ? (
         <div className="text-center py-20 border border-dashed border-slate-800 rounded-lg">
           <MapPin size={48} className="mx-auto text-slate-700 mb-4" />
           <p className="text-slate-400">Nenhum membro com endereço completo cadastrado para visita.</p>
           <p className="text-slate-600 text-sm mt-2">Atualize o cadastro dos membros inserindo Rua, Número e CEP.</p>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {validMembers.map(member => (
              <div key={member.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between shadow-lg hover:border-royal-900/50 transition-colors">
                 {/* Esquerda: Foto + Nome */}
                 <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                       {member.photoUrl ? (
                         <img src={member.photoUrl} alt={member.fullName} className="w-full h-full object-cover" />
                       ) : (
                         <User className="text-slate-500" size={24} />
                       )}
                    </div>
                    <div className="flex flex-col min-w-0">
                       <h4 className="font-bold text-slate-100 truncate text-sm">{member.fullName}</h4>
                       <span className="text-xs text-slate-500 truncate max-w-[150px]">
                         {member.street}, {member.number}
                       </span>
                    </div>
                 </div>

                 {/* Direita: Botão */}
                 <div className="flex-shrink-0 ml-2">
                    <Button 
                      variant="primary" 
                      className="text-xs px-3 py-2 h-auto whitespace-nowrap bg-royal-600 hover:bg-royal-500"
                      onClick={() => setSelectedMember(member)}
                    >
                      Ver Trajeto
                    </Button>
                 </div>
              </div>
            ))}
         </div>
       )}

       {selectedMember && (
         <RouteModal 
           member={selectedMember} 
           onClose={() => setSelectedMember(null)} 
         />
       )}
    </div>
  );
};