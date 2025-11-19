import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, AlertCircle, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Define assessment type based on actual database schema from migration
type Assessment = {
  id: string;
  user_id: string;
  skill: string;
  pin_code: string;
  school_name: string;
  status: string;
  instamojo_payment_id?: string;
  instamojo_payment_request_id?: string;
  assessor_id?: string;
  assessment_date?: string;
  score?: number;
  feedback?: string;
  certificate_url?: string;
  badge_url?: string;
  created_at?: string;
  updated_at?: string;
  approved?: boolean;
};

type AssessmentWithProfile = Assessment & {
  profile_full_name?: string;
  profile_email?: string;
};

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<AssessmentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      // Check user role first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Unauthorized",
          description: "Please log in to access the admin dashboard.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      // Check if user has admin role
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();
      if (roleError || !userRole) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges to access this page.",
          variant: "destructive",
        });
        navigate("/my-skill-profile");
        return;
      }
      // Fetch assessments that are awaiting approval
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('status', 'awaiting_approval')
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Fetch profile information separately
      const assessmentsWithProfiles = await Promise.all(
        (data || []).map(async (assessment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', assessment.user_id)
            .single();
          return {
            ...assessment,
            profile_full_name: profile?.full_name || 'Unknown',
            profile_email: profile?.email || '',
          };
        })
      );

      setAssessments(assessmentsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching assessments:', error);
      toast({
        title: "Error",
        description: "Failed to load assessments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (assessmentId: string) => {
    try {
      setActionLoading(assessmentId);
      const { error } = await supabase
        .from('assessments')
        .update({ approved: true, status: 'completed', approved_at: new Date().toISOString() })
        .eq('id', assessmentId);
      if (error) throw error;
      toast({
        title: "Assessment Approved",
        description: "The assessment has been successfully approved.",
      });
      await fetchAssessments();
    } catch (error: any) {
      console.error('Error approving assessment:', error);
      toast({
        title: "Error",
        description: "Failed to approve assessment.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (assessmentId: string) => {
    try {
      setActionLoading(assessmentId);
      const { error } = await supabase
        .from('assessments')
        .update({ status: 'rejected' })
        .eq('id', assessmentId);
      if (error) throw error;
      toast({
        title: "Assessment Rejected",
        description: "The assessment has been rejected.",
      });
      await fetchAssessments();
    } catch (error: any) {
      console.error('Error rejecting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to reject assessment.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    navigate("/auth");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'awaiting_approval':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Awaiting Approval</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Top bar with title and Sign Out button */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage student assessment results and approvals
              </p>
            </div>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Assessment Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">
                    There are no assessments awaiting approval at this time.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Skill</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Assessment Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assessments.map((assessment) => (
                        <TableRow key={assessment.id}>
                          <TableCell className="font-medium">
                            {assessment.profile_full_name || 'Unknown'}
                          </TableCell>
                          <TableCell>{assessment.skill}</TableCell>
                          <TableCell>{assessment.score}%</TableCell>
                          <TableCell>{assessment.school_name}</TableCell>
                          <TableCell>
                            {assessment.assessment_date
                              ? new Date(assessment.assessment_date).toLocaleDateString()
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>{getStatusBadge(assessment.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {assessment.status === 'awaiting_approval' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleApprove(assessment.id)}
                                    disabled={actionLoading === assessment.id}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    {actionLoading === assessment.id ? 'Approving...' : 'Approve'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReject(assessment.id)}
                                    disabled={actionLoading === assessment.id}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    {actionLoading === assessment.id ? 'Rejecting...' : 'Reject'}
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
