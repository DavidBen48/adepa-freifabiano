import React, { useState, useEffect } from 'react';
import { Camera, Upload, MapPin } from 'lucide-react';
import { Input, Select } from '../components/Input';
import { Button } from '../components/Button';
import { Member, Role } from '../types';
import { ROLES, APP_CONFIG } from '../constants';

interface MemberFormViewProps {
  initialData?: Member;
  isEditing: boolean;
  isLoading: boolean;
  onSave: (memberData: Omit<Member, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const MemberFormView: React.FC<MemberFormViewProps> = ({ 
  initialData, 
  isEditing, 
  isLoading, 
  onSave, 
  onCancel 
}) => {
  const initialFormState: Omit<Member, 'id' | 'createdAt'> = {
    fullName: '',
    birthDate: '',
    cpf: '',
    rg: '',
    role: ROLES[0] as Role,
    issueDate: '',
    baptismDate: '',
    accessCode: '',
    locality: APP_CONFIG.LOCALITY,
    photoUrl: '',
    // Campos de Endereço
    street: '',
    number: '',
    zipCode: '',
    neighborhood: '',
    city: ''
  };

  const [memberForm, setMemberForm] = useState(initialFormState);

  useEffect(() => {
    if (initialData && isEditing) {
      setMemberForm({
        fullName: initialData.fullName,
        birthDate: initialData.birthDate,
        cpf: initialData.cpf,
        rg: initialData.rg,
        role: initialData.role,
        issueDate: initialData.issueDate || '',
        baptismDate: initialData.baptismDate || '',
        accessCode: initialData.accessCode || '',
        locality: initialData.locality,
        photoUrl: initialData.photoUrl || '',
        street: initialData.street || '',
        number: initialData.number || '',
        zipCode: initialData.zipCode || '',
        neighborhood: initialData.neighborhood || '',
        city: initialData.city || ''
      });
    } else {
      setMemberForm(initialFormState);
    }
  }, [initialData, isEditing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setMemberForm({ ...memberForm, photoUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(memberForm);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 pb-4 border-b border-slate-800">
        {isEditing ? `Editando: ${memberForm.fullName}` : 'Novo Cadastro'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Seção 1: Dados Pessoais */}
        <div className="space-y-4">
            {/* Photo Upload Improved */}
            <div className="flex items-center gap-4 mb-6">
            <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                {memberForm.photoUrl ? (
                <img src={memberForm.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                <Camera className="text-slate-500" size={36} />
                )}
            </div>
            <div className="flex-1">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                Foto de Perfil
                </label>
                
                <div className="relative">
                <input 
                    type="file" 
                    id="photo-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <label 
                    htmlFor="photo-upload"
                    className="inline-flex items-center justify-center px-4 py-2 border border-slate-600 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-royal-500 cursor-pointer transition-all duration-200 shadow-sm gap-2 font-medium text-sm group"
                >
                    <Upload size={16} className="text-royal-500 group-hover:text-white transition-colors" />
                    Escolher Foto/Imagem
                </label>
                </div>
                
                <p className="text-xs text-slate-600 mt-2">Recomendado: JPG ou PNG. Máximo 5MB.</p>
            </div>
            </div>

            <Input 
            label="Nome Completo" 
            required 
            value={memberForm.fullName}
            onChange={e => setMemberForm({...memberForm, fullName: e.target.value})}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
                label="Data de Nascimento" 
                type="date" 
                required 
                value={memberForm.birthDate}
                onChange={e => setMemberForm({...memberForm, birthDate: e.target.value})}
            />
            <Input 
                label="CPF" 
                required 
                placeholder="000.000.000-00"
                value={memberForm.cpf}
                onChange={e => setMemberForm({...memberForm, cpf: e.target.value})}
            />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                label="RG" 
                required 
                value={memberForm.rg}
                onChange={e => setMemberForm({...memberForm, rg: e.target.value})}
            />
            <Select
                label="Função Eclesiástica"
                options={ROLES}
                value={memberForm.role}
                onChange={e => setMemberForm({...memberForm, role: e.target.value as Role})}
            />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
                label="Data de Emissão (RG)" 
                type="date"
                value={memberForm.issueDate}
                onChange={e => setMemberForm({...memberForm, issueDate: e.target.value})}
            />
            <Input 
                label="Data de Batismo" 
                type="date"
                value={memberForm.baptismDate}
                onChange={e => setMemberForm({...memberForm, baptismDate: e.target.value})}
            />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
                label="Localidade" 
                disabled 
                value={APP_CONFIG.LOCALITY}
                className="opacity-50 cursor-not-allowed bg-slate-800"
            />
            <Input 
                label="Cód. Acesso (Opcional)" 
                type="number"
                maxLength={4}
                placeholder="Máx 4 dígitos"
                value={memberForm.accessCode}
                onChange={e => setMemberForm({...memberForm, accessCode: e.target.value})}
            />
            </div>
        </div>

        {/* Seção 2: Endereço (Separador Visual) */}
        <div className="border-t border-slate-800 pt-6">
            <div className="flex items-center gap-2 mb-4 text-royal-400">
                <MapPin size={20} />
                <h3 className="text-lg font-semibold">Endereço Residencial</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                    label="CEP (Op)" 
                    placeholder="00000-000"
                    value={memberForm.zipCode}
                    onChange={e => setMemberForm({...memberForm, zipCode: e.target.value})}
                    className="col-span-1"
                />
                 <Input 
                    label="Rua / Logradouro (Op)" 
                    placeholder="Ex: Rua das Flores"
                    value={memberForm.street}
                    onChange={e => setMemberForm({...memberForm, street: e.target.value})}
                    className="md:col-span-2"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <Input 
                    label="Número (Op)" 
                    placeholder="S/N"
                    value={memberForm.number}
                    onChange={e => setMemberForm({...memberForm, number: e.target.value})}
                    className="col-span-1"
                />
                 <Input 
                    label="Bairro (Op)" 
                    placeholder="Centro"
                    value={memberForm.neighborhood}
                    onChange={e => setMemberForm({...memberForm, neighborhood: e.target.value})}
                    className="col-span-1"
                />
                 <Input 
                    label="Cidade (Op)" 
                    placeholder="Cidade"
                    value={memberForm.city}
                    onChange={e => setMemberForm({...memberForm, city: e.target.value})}
                    className="col-span-1"
                />
            </div>
        </div>

        <div className="pt-6 flex gap-4">
          <Button 
            type="button" 
            variant="ghost" 
            className="flex-1"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Membro'}
          </Button>
        </div>
      </form>
    </div>
  );
};