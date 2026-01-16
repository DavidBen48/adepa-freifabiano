import { createClient } from '@supabase/supabase-js';
import { Member } from '../types';

// Supabase Configuration
const SUPABASE_URL = 'https://qhrolihjzsuskkgzseby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFocm9saWhqenN1c2trZ3pzZWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MzI2MzAsImV4cCI6MjA4MzIwODYzMH0.PmdrJ9PsUEmg_ZhmpEYfF8HFGU_sz2DRMzQ9I8pm9l4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to map Database Row (snake_case) to Application Model (camelCase)
const mapRowToMember = (row: any): Member => ({
  id: row.id,
  fullName: row.full_name,
  birthDate: row.birth_date,
  cpf: row.cpf,
  rg: row.rg,
  role: row.role,
  issueDate: row.issue_date,
  locality: row.locality,
  baptismDate: row.baptism_date,
  accessCode: row.access_code,
  photoUrl: row.photo_url,
  // Endereço
  street: row.street,
  number: row.number,
  zipCode: row.zip_code,
  neighborhood: row.neighborhood,
  city: row.city,
  
  createdAt: row.created_at,
});

// Helper to map Application Model to Database Row
const mapMemberToRow = (member: Partial<Member>) => {
  const row: any = {};
  if (member.fullName !== undefined) row.full_name = member.fullName;
  if (member.birthDate !== undefined) row.birth_date = member.birthDate;
  if (member.cpf !== undefined) row.cpf = member.cpf;
  if (member.rg !== undefined) row.rg = member.rg;
  if (member.role !== undefined) row.role = member.role;
  if (member.issueDate !== undefined) row.issue_date = member.issueDate;
  if (member.locality !== undefined) row.locality = member.locality;
  if (member.baptismDate !== undefined) row.baptism_date = member.baptismDate;
  if (member.accessCode !== undefined) row.access_code = member.accessCode;
  if (member.photoUrl !== undefined) row.photo_url = member.photoUrl;
  
  // Address mapping
  if (member.street !== undefined) row.street = member.street;
  if (member.number !== undefined) row.number = member.number;
  if (member.zipCode !== undefined) row.zip_code = member.zipCode;
  if (member.neighborhood !== undefined) row.neighborhood = member.neighborhood;
  if (member.city !== undefined) row.city = member.city;

  return row;
};

// --- Local Storage Fallback Mechanism ---
// This ensures the app works even if Supabase is down or reachable (Offline Mode)
const LOCAL_STORAGE_KEY = 'members_ai_offline_data';

const getLocalData = (): Member[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error reading local storage", e);
    return [];
  }
};

const saveLocalData = (members: Member[]) => {
  try {
    // OPTIMIZATION: Do not save base64 photos to localStorage to avoid QuotaExceededError.
    // localStorage has a limit of ~5MB. Photos should be fetched from DB or Supabase Storage.
    // This cache is strictly for metadata fallback when offline.
    const lightweightMembers = members.map(m => {
      // Destructure photoUrl out, keep the rest
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { photoUrl, ...rest } = m;
      return rest as Member;
    });
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lightweightMembers));
  } catch (e) {
    // If it still fails (e.g. huge text data), just warn and continue.
    console.warn("Warning: Could not save offline backup to local storage.", e);
  }
};

export const supabaseService = {
  getMembers: async (): Promise<Member[]> => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*'); // Ordenação será feita no front-end para garantir performance e regra de negócio

      if (error) throw error;
      
      const members = (data || []).map(mapRowToMember);
      // Sync local cache on successful fetch
      saveLocalData(members);
      return members;
    } catch (error: any) {
      console.warn('Supabase offline/unreachable. Using local data fallback.', error.message);
      return getLocalData();
    }
  },

  addMember: async (member: Omit<Member, 'id' | 'createdAt'>): Promise<Member> => {
    // Prepare fallback object in case backend fails
    const fallbackMember: Member = {
      ...member,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    try {
      const row = mapMemberToRow(member);
      const { data, error } = await supabase
        .from('members')
        .insert([row])
        .select()
        .single();

      if (error) throw error;
      
      const returnedMember = mapRowToMember(data);
      
      // Update local cache
      const current = getLocalData();
      saveLocalData([returnedMember, ...current]);
      
      return returnedMember;
    } catch (error: any) {
      console.warn('Supabase offline. Saving locally.', error.message);
      const current = getLocalData();
      saveLocalData([fallbackMember, ...current]);
      return fallbackMember;
    }
  },

  updateMember: async (id: string, updates: Partial<Member>): Promise<Member | null> => {
    try {
      const row = mapMemberToRow(updates);
      const { data, error } = await supabase
        .from('members')
        .update(row)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const updatedMember = mapRowToMember(data);

      // Update local cache
      const current = getLocalData();
      const newLocal = current.map(m => m.id === id ? updatedMember : m);
      saveLocalData(newLocal);

      return updatedMember;
    } catch (error: any) {
       console.warn('Supabase offline. Updating locally.', error.message);
       const current = getLocalData();
       const memberToUpdate = current.find(m => m.id === id);
       if (memberToUpdate) {
         const updatedLocal = { ...memberToUpdate, ...updates };
         const newLocal = current.map(m => m.id === id ? updatedLocal : m);
         saveLocalData(newLocal);
         return updatedLocal;
       }
       return null;
    }
  },

  deleteMember: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local cache
      const current = getLocalData();
      saveLocalData(current.filter(m => m.id !== id));
      
      return true;
    } catch (error: any) {
      console.warn('Supabase offline. Deleting locally.', error.message);
      const current = getLocalData();
      saveLocalData(current.filter(m => m.id !== id));
      return true;
    }
  }
};