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
  return row;
};

export const supabaseService = {
  getMembers: async (): Promise<Member[]> => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Error (getMembers):', error.message);
      return [];
    }
    return (data || []).map(mapRowToMember);
  },

  addMember: async (member: Omit<Member, 'id' | 'createdAt'>): Promise<Member> => {
    const row = mapMemberToRow(member);
    const { data, error } = await supabase
      .from('members')
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error (addMember):', error.message);
      throw new Error(error.message);
    }
    return mapRowToMember(data);
  },

  updateMember: async (id: string, updates: Partial<Member>): Promise<Member | null> => {
    const row = mapMemberToRow(updates);
    const { data, error } = await supabase
      .from('members')
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error) {
       console.error('Supabase Error (updateMember):', error.message);
       return null;
    }
    return mapRowToMember(data);
  },

  deleteMember: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase Error (deleteMember):', error.message);
      return false;
    }
    return true;
  }
};