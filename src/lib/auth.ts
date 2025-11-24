import { supabase } from "@/integrations/supabase/client";

export type Role = 'admin' | 'assessor' | 'student';

export async function getHighestRole(userId: string): Promise<Role> {
  try {
    const [{ data: rolesData }, { data: profileData }] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', userId),
      supabase.from('profiles').select('assessor_assigned_at').eq('id', userId).single(),
    ]);

    const roles = (rolesData || []).map((r: any) => (typeof r.role === 'string' ? r.role.trim().toLowerCase() : ''));
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('assessor')) return 'assessor';

    // If admin hasn't added a role in profiles entry but profile has assessor assignment, treat as assessor
    if (profileData?.assessor_assigned_at) return 'assessor';

    return 'student';
  } catch (err) {
    console.error('getHighestRole error:', err);
    return 'student';
  }
}
