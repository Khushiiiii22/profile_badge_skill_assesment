import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AssessorRouteProps {
  children: React.ReactNode;
}

export const AssessorRoute = ({ children }: AssessorRouteProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAssessor, setIsAssessor] = useState(false);

  useEffect(() => {
    checkAssessorAccess();
  }, []);

  const checkAssessorAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Unauthorized",
          description: "Please log in to access this page.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      const { data: rolesData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (error) {
        toast({
          title: "Access Denied",
          description: "You don't have assessor privileges to access this page.",
          variant: "destructive",
        });
        navigate('/my-skill-profile');
        return;
      }

      const roles = (rolesData || []).map((r: any) => (typeof r.role === 'string' ? r.role.trim().toLowerCase() : ''));
      if (!roles.includes('assessor')) {
        toast({
          title: "Access Denied",
          description: "You don't have assessor privileges to access this page.",
          variant: "destructive",
        });
        navigate('/my-skill-profile');
        return;
      }

      setIsAssessor(true);
      setLoading(false);

    } catch (error) {
      console.error('Error checking assessor access:', error);
      navigate('/auth');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying assessor access...</p>
        </div>
      </div>
    );
  }

  if (!isAssessor) {
    return null;
  }

  return <>{children}</>;
};