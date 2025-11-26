import { supabase } from "@/integrations/supabase/client";

export type Role = 'admin' | 'assessor' | 'student';

export async function getHighestRole(userId: string): Promise<Role> {
  try {
    console.log('🔍 getHighestRole: Checking roles for user:', userId);
    
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    console.log('📊 getHighestRole: Roles data:', rolesData, 'Error:', rolesError);

    const roles = (rolesData || []).map((r: any) => (typeof r.role === 'string' ? r.role.trim().toLowerCase() : ''));
    
    console.log('📋 getHighestRole: Processed roles:', roles);
    
    // Admin always gets admin role
    if (roles.includes('admin')) {
      console.log('👑 getHighestRole: Returning admin');
      return 'admin';
    }
    
    // For assessors, check if they're approved
    if (roles.includes('assessor')) {
      console.log('🔍 getHighestRole: Found assessor role, checking approval status...');
      const { data: assessorRequests } = await supabase
        .from('assessor_requests')
        .select('status')
        .eq('user_id', userId);
      
      console.log('📊 getHighestRole: Assessor requests:', assessorRequests);
      
      // Only return assessor if approved
      const approvedRequest = (assessorRequests || []).find((req: any) => req.status === 'approved');
      if (approvedRequest) {
        console.log('✅ Assessor approved, granting assessor role');
        return 'assessor';
      }
      // If not approved, treat as student for routing but they'll see pending state on dashboard
      console.log('⏳ Assessor not approved yet, will redirect to assessor dashboard with pending state');
      return 'assessor'; // Changed: always return assessor so they go to assessor dashboard
    }

    console.log('👤 getHighestRole: Returning student (default)');
    return 'student';
  } catch (err) {
    console.error('❌ getHighestRole error:', err);
    return 'student';
  }
}
