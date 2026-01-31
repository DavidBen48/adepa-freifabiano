import React, { useState, useEffect } from 'react';
import { AuthState, Member, ViewState } from './types';
import { APP_CONFIG } from './constants';
import { Button } from './components/Button';
import { supabaseService } from './services/supabaseService';
import { SecurityModal } from './components/SecurityModal';
import { ChatAssistant } from './components/ChatAssistant';
import { MemberDetailModal } from './components/MemberDetailModal';

// Views
import { LoginView } from './views/LoginView';
import { SecurityPolicyView } from './views/SecurityPolicyView';
import { MemberListView } from './views/MemberListView';
import { MemberFormView } from './views/MemberFormView';
import { VisitMemberView } from './views/VisitMemberView';

import { 
  Users, 
  UserPlus, 
  LogOut,
  Map
} from 'lucide-react';

const App = () => {
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false });
  const [view, setView] = useState<ViewState>(ViewState.MEMBERS_LIST);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Edit State
  const [memberToEdit, setMemberToEdit] = useState<Member | undefined>(undefined);

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

  const handleLoginSuccess = (user: string, role: 'admin' | 'guest') => {
    setAuth({ isAuthenticated: true, user, role });
    setView(ViewState.MEMBERS_LIST);
  };

  const handleLogout = () => {
    setAuth({ isAuthenticated: false });
    setMembers([]);
    setView(ViewState.MEMBERS_LIST);
  };

  // --- CRUD SPEED OPTIMIZATION (Optimistic Updates) ---
  const handleSaveMember = async (memberForm: Omit<Member, 'id' | 'createdAt'>) => {
    if (auth.role === 'guest') {
        alert("Modo visitante: Ação não permitida.");
        return;
    }
    setIsLoading(true);
    try {
      const payload = {
        ...memberForm,
        locality: APP_CONFIG.LOCALITY,
        role: memberForm.role
      };

      if (memberToEdit) {
        // Optimistic: Update in Supabase, then update local state manually
        // We do NOT fetch all members again. This makes it instant.
        const updatedMember = await supabaseService.updateMember(memberToEdit.id, payload);
        
        if (updatedMember) {
          setMembers(prevMembers => 
            prevMembers.map(m => m.id === updatedMember.id ? updatedMember : m)
          );
        }
      } else {
        const newMember = await supabaseService.addMember(payload);
        setMembers(prevMembers => [newMember, ...prevMembers]);
      }

      setMemberToEdit(undefined);
      setView(ViewState.MEMBERS_LIST);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar membro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Actions triggered by sub-views ---

  const initiateAdd = () => {
    setMemberToEdit(undefined);
    setView(ViewState.ADD_MEMBER);
  }

  const initiateEditAuth = (member: Member) => {
     if (auth.role === 'guest') return;
     setSecurityModal({ isOpen: true, type: 'UPDATE', memberId: member.id });
  };

  const initiateDeleteAuth = (id: string) => {
    if (auth.role === 'guest') return;
    setSecurityModal({ isOpen: true, type: 'DELETE', memberId: id });
  };

  const handleSecurityConfirm = async () => {
    const targetId = securityModal.memberId;
    
    if (securityModal.type === 'DELETE' && targetId) {
      // Optimistic Delete: Remove from UI immediately, then sync with DB
      setMembers(prev => prev.filter(m => m.id !== targetId));
      
      // Execute in background
      await supabaseService.deleteMember(targetId);
      
    } else if (securityModal.type === 'UPDATE' && targetId) {
      const memberFound = members.find(m => m.id === targetId);
      if (memberFound) {
        setMemberToEdit(memberFound);
        setView(ViewState.ADD_MEMBER);
      }
    }
    setSecurityModal({ ...securityModal, isOpen: false });
  };

  // --- RENDER ROUTER ---

  if (!auth.isAuthenticated) {
    if (view === ViewState.SECURITY_POLICY) {
      return <SecurityPolicyView onBack={() => setView(ViewState.MEMBERS_LIST)} />;
    }
    return (
      <LoginView 
        onLoginSuccess={handleLoginSuccess} 
        onViewPolicy={() => setView(ViewState.SECURITY_POLICY)}
      />
    );
  }

  // Determine Read-Only Status
  const isReadOnly = auth.role === 'guest';
  const adminName = auth.role === 'admin' ? 'freifabiano' : 'Visitante';

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-royal-600 rounded flex items-center justify-center text-white font-bold">FB</div>
            <span className="font-semibold text-lg hidden md:block">MEMBERS<span className="text-royal-500">.AI</span> <span className="text-slate-500 text-sm font-normal">| Frei Fabiano</span></span>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-xs text-slate-400 hidden sm:block">
                {auth.role === 'admin' ? 'Admin: ' : 'Usuário: '} 
                <span className={auth.role === 'admin' ? 'text-royal-400 font-bold' : 'text-slate-300'}>{adminName}</span>
             </span>
             <Button variant="ghost" onClick={handleLogout} className="text-xs p-1">
               <LogOut size={16} className="mr-2"/> Sair
             </Button>
          </div>
        </div>
      </header>

      {/* Tabs / Navigation */}
      <div className="bg-slate-900/50 border-b border-slate-800 w-full">
        {/* Changed from min-w-max to w-full with flex-1 for equal distribution on mobile */}
        <div className="max-w-7xl mx-auto flex justify-between w-full">
          <button
            onClick={() => { setView(ViewState.MEMBERS_LIST); setMemberToEdit(undefined); }}
            className={`flex-1 py-3 md:py-4 text-xs md:text-sm font-medium border-b-2 transition-colors flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${view === ViewState.MEMBERS_LIST ? 'border-royal-500 text-white bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Users size={18} />
            <span>Membros</span>
          </button>
          <button
            onClick={initiateAdd}
            className={`flex-1 py-3 md:py-4 text-xs md:text-sm font-medium border-b-2 transition-colors flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${view === ViewState.ADD_MEMBER ? 'border-royal-500 text-white bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <UserPlus size={18} />
            <span>{memberToEdit ? 'Editar' : 'Adicionar'}</span>
          </button>
          <button
            onClick={() => { setView(ViewState.VISIT_MEMBER); setMemberToEdit(undefined); }}
            className={`flex-1 py-3 md:py-4 text-xs md:text-sm font-medium border-b-2 transition-colors flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${view === ViewState.VISIT_MEMBER ? 'border-royal-500 text-white bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Map size={18} />
            <span>Visitar</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {view === ViewState.MEMBERS_LIST && (
          <MemberListView 
            members={members} 
            isLoading={isLoading}
            onEdit={initiateEditAuth}
            onDelete={initiateDeleteAuth}
            onViewDetails={setViewingMember}
            isReadOnly={isReadOnly}
          />
        )}

        {view === ViewState.ADD_MEMBER && (
          <MemberFormView 
            initialData={memberToEdit}
            isEditing={!!memberToEdit}
            isLoading={isLoading}
            onSave={handleSaveMember}
            onCancel={() => { setView(ViewState.MEMBERS_LIST); setMemberToEdit(undefined); }}
            isReadOnly={isReadOnly}
          />
        )}

        {view === ViewState.VISIT_MEMBER && (
          <VisitMemberView members={members} isReadOnly={isReadOnly} />
        )}
      </main>

      {/* Global Modals */}
      <SecurityModal
        isOpen={securityModal.isOpen}
        title={securityModal.type === 'UPDATE' ? 'Autorizar Edição' : 'Autorizar Exclusão'}
        actionType={securityModal.type}
        onClose={() => setSecurityModal({...securityModal, isOpen: false})}
        onConfirm={handleSecurityConfirm}
      />

      <MemberDetailModal 
        member={viewingMember} 
        onClose={() => setViewingMember(null)} 
      />
      
      <ChatAssistant members={members} />
    </div>
  );
};

export default App;