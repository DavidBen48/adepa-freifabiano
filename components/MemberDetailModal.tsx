import React from 'react';
import { User, LogOut, MapPin, ExternalLink, Map as MapIcon } from 'lucide-react';
import { Button } from './Button';
import { Member } from '../types';

interface MemberDetailModalProps {
  member: Member | null;
  onClose: () => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ member, onClose }) => {
  if (!member) return null;

  // Monta o endereço completo para a busca no mapa
  // A inclusão do CEP aumenta significativamente a precisão
  const addressParts = [
    member.street,
    member.number,
    member.neighborhood,
    member.city,
    member.zipCode, // CEP adicionado para precisão
    "Brasil"
  ].filter(part => part && part.trim() !== '');

  const fullAddress = addressParts.join(', ');
  const hasAddress = member.street && member.street.length > 0;
  
  // URL para o Iframe (Visualização)
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  
  // URL para Link Externo (GPS/Nova Aba)
  const mapExternalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
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
            {/* Dados Principais */}
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

            {/* Seção de Endereço e Mapa */}
            <div className="bg-slate-950/50 rounded-lg border border-slate-800 overflow-hidden">
                 <div className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-royal-400">
                            <MapPin size={18} />
                            <h4 className="font-semibold text-sm uppercase tracking-wider">Endereço Residencial</h4>
                        </div>
                        {hasAddress && (
                            <a 
                                href={mapExternalUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs flex items-center gap-1 text-royal-500 hover:text-royal-400 hover:underline"
                            >
                                Abrir no GPS <ExternalLink size={12}/>
                            </a>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-4 text-sm mb-4">
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

                 {/* Integração do Mapa */}
                 {hasAddress ? (
                    <div className="w-full h-64 bg-slate-800 border-t border-slate-700 relative group">
                        <iframe 
                            width="100%" 
                            height="100%" 
                            src={mapEmbedUrl}
                            className="w-full h-full grayscale-[50%] hover:grayscale-0 transition-all duration-500"
                            loading="lazy"
                            title="Localização do Membro"
                        ></iframe>
                        <div className="absolute top-2 right-2 bg-slate-900/80 px-2 py-1 rounded text-[10px] text-slate-400 pointer-events-none border border-slate-700">
                            Google Maps Preview
                        </div>
                    </div>
                 ) : (
                    <div className="w-full h-32 bg-slate-900/50 border-t border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-2">
                        <MapIcon size={24} className="opacity-20" />
                        <span className="text-xs">Endereço não cadastrado para exibir mapa.</span>
                    </div>
                 )}
            </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
};