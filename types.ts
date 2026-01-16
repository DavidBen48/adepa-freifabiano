export type Role = 'Membro' | 'Auxiliar de Trabalho' | 'Diácono(isa)' | 'Presbítero' | 'Pastor(a)';

export interface Member {
  id: string;
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  cpf: string;
  rg: string;
  role: Role;
  issueDate?: string; // YYYY-MM-DD
  locality: string; // Fixed to "Frei Fabiano"
  baptismDate?: string; // YYYY-MM-DD
  accessCode?: string; // Max 4 digits
  photoUrl?: string; // Base64 string for the photo
  
  // Endereço (Opcionais)
  street?: string;
  number?: string;
  zipCode?: string;
  neighborhood?: string;
  city?: string;

  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user?: string;
}

export enum ViewState {
  MEMBERS_LIST = 'MEMBERS_LIST',
  ADD_MEMBER = 'ADD_MEMBER',
  SECURITY_POLICY = 'SECURITY_POLICY'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}