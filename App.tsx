import React, { useState, useEffect } from 'react';
import { AuthState, Member, ViewState, Role } from './types';
import { APP_CONFIG, ROLES } from './constants';
import { Input, Select } from './components/Input';
import { Button } from './components/Button';
import { supabaseService } from './services/supabaseService';
import { SecurityModal } from './components/SecurityModal';
import { ChatAssistant } from './components/ChatAssistant';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  LogOut,
  ChevronRight,
  Camera,
  User
} from 'lucide-react';

const App = () => {
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false });
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState('');
  
  const [view, setView] = useState<ViewState>(ViewState.MEMBERS_LIST);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State for Add/Edit
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
    photoUrl: ''
  };
  const [memberForm, setMemberForm] = useState(initialFormState);
  const [isEditingId, setIsEditingId] = useState<string | null>(null);

  // Modal State
  const [securityModal, setSecurityModal] = useState<{
    isOpen: boolean;
    type: 'UPDATE' | 'DELETE';
    memberId: string | null;
  }>({ isOpen: false, type: 'UPDATE', memberId: null });

  // View Member State
  const [viewingMember, setViewingMember] = useState<Member | null>(null);

  useEffect(() => {
    if (auth.isAuthenticated) {
      loadMembers();
    }
  }, [auth.isAuthenticated]);

  const loadMembers = async () => {
    setIsLoading(true);
    const data = await supabaseService.getMembers();
    setMembers(data);
    setIsLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.user === APP_CONFIG.USER && loginForm.pass === APP_CONFIG.PASS) {
      setAuth({ isAuthenticated: true, user: APP_CONFIG.USER });
      setLoginError('');
    } else {
      setLoginError('Credenciais inválidas. Acesso negado.');
    }
  };

  const handleLogout = () => {
    setAuth({ isAuthenticated: false });
    setLoginForm({ user: '', pass: '' });
    setMembers([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic check for file size (100MB is huge for browser logic, but we allow it per requirement)
      // Since we use localStorage in this demo, we can't actually store 100MB base64 strings.
      // We will simulate the success for the UI logic.
      const reader = new FileReader();
      reader.onloadend = () => {
        // In a real app, you would upload `file` to Supabase Storage and get a URL.
        // Here we just use the base64 for preview if it's small enough, otherwise a placeholder.
        const result = reader.result as string;
        setMemberForm({ ...memberForm, photoUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Format payload
      const payload = {
        ...memberForm,
        locality: APP_CONFIG.LOCALITY,
        role: memberForm.role
      };

      if (isEditingId) {
        // Logic handled via security modal for edits usually, 
        // but if we are in the "Add/Edit" view and submitting:
        await supabaseService.updateMember(isEditingId, payload);
      } else {
        await supabaseService.addMember(payload);
      }

      await loadMembers();
      setMemberForm(initialFormState);
      setIsEditingId(null);
      setView(ViewState.MEMBERS_LIST);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar membro. Verifique se o SQL de permissões foi executado no Supabase.");
    } finally {
      setIsLoading(false);
    }
  };

  const initiateEdit = (member: Member) => {
    // Populate form but switch view
    setMemberForm({
      fullName: member.fullName,
      birthDate: member.birthDate,
      cpf: member.cpf,
      rg: member.rg,
      role: member.role,
      issueDate: member.issueDate || '',
      baptismDate: member.baptismDate || '',
      accessCode: member.accessCode || '',
      locality: member.locality,
      photoUrl: member.photoUrl || ''
    });
    setIsEditingId(member.id);
    setView(ViewState.ADD_MEMBER);
  };

  const initiateDelete = (id: string) => {
    setSecurityModal({ isOpen: true, type: 'DELETE', memberId: id });
  };

  const initiateUpdateAuth = (member: Member) => {
     // User clicked Update on list, require auth then move to form
     setSecurityModal({ isOpen: true, type: 'UPDATE', memberId: member.id });
  };

  const handleSecurityConfirm = async () => {
    if (securityModal.type === 'DELETE' && securityModal.memberId) {
      await supabaseService.deleteMember(securityModal.memberId);
      loadMembers();
    } else if (securityModal.type === 'UPDATE' && securityModal.memberId) {
      const memberToEdit = members.find(m => m.id === securityModal.memberId);
      if (memberToEdit) {
        initiateEdit(memberToEdit);
      }
    }
    setSecurityModal({ ...securityModal, isOpen: false });
  };

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cpf.includes(searchTerm)
  );

  // --- RENDER: LOGIN ---
  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100">
        {/* Left Side */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center items-start border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-royal-600 to-transparent"></div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-white">
            ADEPA<span className="text-royal-500">.AI</span>
          </h1>
          <h2 className="text-2xl text-slate-400 font-light mb-8">Frei Fabiano</h2>
          <div className="mt-auto">
            <p className="text-sm text-slate-600 uppercase tracking-widest font-semibold">Developed by David Ben</p>
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
            
            <p className="text-center text-slate-500 text-xs mt-6">
              Acesso restrito a administradores. Não há opção de recuperação automática.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-royal-600 rounded flex items-center justify-center text-white font-bold">FB</div>
            <span className="font-semibold text-lg hidden md:block">ADEPA.AI <span className="text-slate-500 text-sm font-normal">| Frei Fabiano</span></span>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-xs text-slate-400 hidden sm:block">Admin: {APP_CONFIG.USER}</span>
             <Button variant="ghost" onClick={handleLogout} className="text-xs p-1">
               <LogOut size={16} className="mr-2"/> Sair
             </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex gap-6">
          <button
            onClick={() => { setView(ViewState.MEMBERS_LIST); setIsEditingId(null); setMemberForm(initialFormState); }}
            className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${view === ViewState.MEMBERS_LIST ? 'border-royal-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Users size={18} />
            Membros
          </button>
          <button
            onClick={() => { setView(ViewState.ADD_MEMBER); setIsEditingId(null); setMemberForm(initialFormState); }}
            className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${view === ViewState.ADD_MEMBER ? 'border-royal-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <UserPlus size={18} />
            {isEditingId ? 'Editar Membro' : 'Adicionar Membros'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        
        {/* VIEW: MEMBER LIST */}
        {view === ViewState.MEMBERS_LIST && (
          <div className="space-y-6">
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
            {isLoading ? (
              <div className="text-center py-20 text-slate-500">Carregando dados...</div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-800 rounded-lg">
                <p className="text-slate-400">Nenhum membro encontrado.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredMembers.map((member) => (
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
                    
                    <div className="flex items-center gap-2 pl-16 md:pl-0">
                      <Button 
                        variant="secondary" 
                        className="text-xs px-3 py-1.5"
                        onClick={() => setViewingMember(member)}
                        title="Ler Detalhes"
                      >
                        READ
                      </Button>
                      <Button 
                        variant="secondary"
                        className="text-xs px-3 py-1.5 text-blue-300 hover:text-blue-200 hover:border-blue-800"
                        onClick={() => initiateUpdateAuth(member)}
                        title="Atualizar Dados"
                      >
                        UPDATE
                      </Button>
                      <Button 
                        variant="danger"
                        className="text-xs px-3 py-1.5"
                        onClick={() => initiateDelete(member.id)}
                        title="Excluir Membro"
                      >
                        DELETE
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: ADD/EDIT FORM */}
        {view === ViewState.ADD_MEMBER && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 pb-4 border-b border-slate-800">
              {isEditingId ? `Editando: ${memberForm.fullName}` : 'Novo Cadastro'}
            </h2>
            
            <form onSubmit={handleAddMember} className="space-y-4">
              {/* Photo Upload */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                  {memberForm.photoUrl ? (
                    <img src={memberForm.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="text-slate-500" size={30} />
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Foto do Membro
                  </label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-royal-900/30 file:text-royal-400 hover:file:bg-royal-900/50 cursor-pointer"
                  />
                  <p className="text-xs text-slate-600 mt-1">Máximo 100MB. Formatos: JPG, PNG.</p>
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

              <div className="pt-6 flex gap-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex-1"
                  onClick={() => { setView(ViewState.MEMBERS_LIST); setIsEditingId(null); setMemberForm(initialFormState); }}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
                  {isEditingId ? 'Salvar Alterações' : 'Cadastrar Membro'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Security Modal */}
      <SecurityModal
        isOpen={securityModal.isOpen}
        title={securityModal.type === 'UPDATE' ? 'Autorizar Edição' : 'Autorizar Exclusão'}
        actionType={securityModal.type}
        onClose={() => setSecurityModal({...securityModal, isOpen: false})}
        onConfirm={handleSecurityConfirm}
      />

      {/* View Member Modal (Read-Only) */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                {viewingMember.photoUrl ? (
                   <img src={viewingMember.photoUrl} alt={viewingMember.fullName} className="w-16 h-16 rounded-full object-cover border border-slate-600" />
                ) : (
                   <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                     <User className="text-slate-400" size={32} />
                   </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-white">{viewingMember.fullName}</h3>
                  <span className="text-royal-400 text-sm font-medium">{viewingMember.role}</span>
                </div>
              </div>
              <button onClick={() => setViewingMember(null)} className="text-slate-500 hover:text-white">
                <LogOut size={20} className="rotate-180"/> 
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4 text-sm bg-slate-950/50 p-6 rounded-lg border border-slate-800">
               <div className="space-y-1">
                 <p className="text-slate-500">CPF</p>
                 <p className="text-slate-200">{viewingMember.cpf}</p>
               </div>
               <div className="space-y-1">
                 <p className="text-slate-500">RG</p>
                 <p className="text-slate-200">{viewingMember.rg}</p>
               </div>
               <div className="space-y-1">
                 <p className="text-slate-500">Data de Nascimento</p>
                 <p className="text-slate-200">{new Date(viewingMember.birthDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
               </div>
               <div className="space-y-1">
                 <p className="text-slate-500">Batismo</p>
                 <p className="text-slate-200">{viewingMember.baptismDate ? new Date(viewingMember.baptismDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</p>
               </div>
               <div className="space-y-1">
                 <p className="text-slate-500">Localidade</p>
                 <p className="text-slate-200">{viewingMember.locality}</p>
               </div>
               <div className="space-y-1">
                 <p className="text-slate-500">Código de Acesso</p>
                 <p className="text-slate-200 font-mono tracking-wider">{viewingMember.accessCode || '-'}</p>
               </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button onClick={() => setViewingMember(null)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant - Always visible if authenticated */}
      <ChatAssistant members={members} />
    </div>
  );
};

export default App;