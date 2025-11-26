import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, AlertCircle, LogOut, Users, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Define assessment type based on actual database schema from migration
type Assessment = {
  id: string;
  user_id: string;
  skill: string;
  pin_code: string;
  school_name: string;
  status: 'pending' | 'in_progress' | 'awaiting_approval' | 'completed' | 'cancelled' | 'rejected' | 'approved';
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

type AssessorRequest = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  experience?: string;
  qualifications?: string;
  motivation?: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  admin_notes?: string;
};

type Assessor = {
  id: string;
  full_name?: string;
  email?: string;
  assessor_assigned_at?: string;
  assessor_assigned_by?: string;
  assessment_count?: number;
  assessments_reviewed?: number;
};

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<AssessmentWithProfile[]>([]);
  const [assessorRequests, setAssessorRequests] = useState<AssessorRequest[]>([]);
  const [approvedAssessors, setApprovedAssessors] = useState<Assessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [activeAssessorsCount, setActiveAssessorsCount] = useState(0);

  useEffect(() => {
    fetchAssessments();
    fetchAssessorRequests();
    fetchApprovedAssessors();
    // eslint-disable-next-line
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
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

  const fetchAssessorRequests = async () => {
    try {
      const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status')
      .eq('role', 'assessor')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
      if (error) throw error;
      setAssessorRequests(data || []);
      setPendingRequestsCount(data?.length || 0);
    } catch (error: any) {
      console.error('Error fetching assessor requests:', error);
    }
  };

  const fetchApprovedAssessors = async () => {
    try {
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'assessor');
      if (rolesError) throw rolesError;
      if (!userRoles || userRoles.length === 0) {
        setApprovedAssessors([]);
        setActiveAssessorsCount(0);
        return;
      }
      const userIds = userRoles.map(role => role.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, assessor_assigned_at, assessor_assigned_by, assessment_count')
        .in('id', userIds);
      if (profilesError) throw profilesError;
      // Fetch assessment counts for each assessor
      const assessorsWithActivity = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count: assessmentsReviewed } = await supabase
            .from('assessments')
            .select('id', { count: 'exact', head: true })
            .eq('assessor_id', profile.id);
          return {
            ...profile,
            assessments_reviewed: assessmentsReviewed || 0,
          };
        })
      );
      setApprovedAssessors(assessorsWithActivity);
      setActiveAssessorsCount(assessorsWithActivity.length);
    } catch (error: any) {
      console.error('Error fetching approved assessors:', error);
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

  const handleApproveAssessor = async (userId: string) => {
    try {
      setActionLoading(userId);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      // Update profile status to approved
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ status: 'approved' })
      .eq('id', userId);
          if (profileError) throw profileError;
      // Add assessor role to user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: 'assessor' });
      if (roleError) throw roleError;
      if (profileError) throw profileError;
      toast({
        title: "Assessor Approved",
        description: "The assessor application has been approved successfully.",
      });
      await fetchAssessorRequests();
      await fetchApprovedAssessors();
    } catch (error: any) {
      console.error('Error approving assessor:', error);
      toast({
        title: "Error",
        description: "Failed to approve assessor application.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectAssessor = async (userId: string) => {    try {
      setActionLoading(userId);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: session.user.id,
        })
        .eq('id', userId);
      if (error) throw error;
      toast({
        title: "Assessor Rejected",
        description: "The assessor application has been rejected.",
      });
      await fetchAssessorRequests();
    } catch (error: any) {
      console.error('Error rejecting assessor:', error);
      toast({
        title: "Error",
        description: "Failed to reject assessor application.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAssessor = async (userId: string) => {
    try {
      setActionLoading(userId);
      // Remove assessor role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'assessor');
      if (roleError) throw roleError;
      // Clear assessor assignment details from profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          assessor_assigned_at: null,
          assessor_assigned_by: null,
        })
        .eq('id', userId);
      if (profileError) throw profileError;
      toast({
        title: "Assessor Removed",
        description: "The assessor role has been removed successfully.",
      });
      await fetchApprovedAssessors();
    } catch (error: any) {
      console.error('Error removing assessor:', error);
      toast({
        title: "Error",
        description: "Failed to remove assessor role.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
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

  const getAssessorStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
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
          <Tabs defaultValue="assessments" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assessments">Assessment Approvals</TabsTrigger>
              <TabsTrigger value="assessors">Assessor Management</TabsTrigger>
            </TabsList>
            {/* --- Assessments Tab --- */}
            <TabsContent value="assessments">
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
                              <TableCell>{assessment.score ?? 'N/A'}%</TableCell>
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
            </TabsContent>
            {/* --- Assessors Tab --- */}
            <TabsContent value="assessors">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="flex items-center p-6">
                      <Clock className="h-8 w-8 text-yellow-500 mr-4" />
                      <div>
                        <p className="text-2xl font-bold">{pendingRequestsCount}</p>
                        <p className="text-sm text-muted-foreground">Pending Assessor Requests</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center p-6">
                      <UserCheck className="h-8 w-8 text-green-500 mr-4" />
                      <div>
                        <p className="text-2xl font-bold">{activeAssessorsCount}</p>
                        <p className="text-sm text-muted-foreground">Active Assessors</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {/* Assessor Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Assessor Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assessorRequests.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                        <p className="text-muted-foreground">
                          All assessor applications have been processed.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Application Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assessorRequests.map((request) => (
                              <TableRow key={request.id}>
                                <TableCell className="font-medium">{request.full_name}</TableCell>
                                <TableCell>{request.email}</TableCell>
                                <TableCell className="max-w-xs truncate">{request.experience || 'N/A'}</TableCell>
                                <TableCell>
                                  {new Date(request.requested_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{getAssessorStatusBadge(request.status)}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    {request.status === 'pending' && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => handleApproveAssessor(request.id
                                          disabled={actionLoading === request.id}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          {actionLoading === request.id ? 'Approving...' : 'Approve'}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => handleRejectAssessor(request.id)}
                                          disabled={actionLoading === request.id}
                                        >
                                          <XCircle className="w-4 h-4 mr-1" />
                                          {actionLoading === request.id ? 'Rejecting...' : 'Reject'}
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
                {/* Approved Assessors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      Approved Assessors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {approvedAssessors.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Active Assessors</h3>
                        <p className="text-muted-foreground">
                          No assessors have been assigned yet.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Assigned Date</TableHead>
                              <TableHead>Assessments Reviewed</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {approvedAssessors.map((assessor) => (
                              <TableRow key={assessor.id}>
                                <TableCell className="font-medium">{assessor.full_name || 'Unknown'}</TableCell>
                                <TableCell>{assessor.email || 'N/A'}</TableCell>
                                <TableCell>
                                  {assessor.assessor_assigned_at
                                    ? new Date(assessor.assessor_assigned_at).toLocaleDateString()
                                    : 'N/A'
                                  }
                                </TableCell>
                                <TableCell>{assessor.assessments_reviewed || 0}</TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRemoveAssessor(assessor.id)}
                                    disabled={actionLoading === assessor.id}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    {actionLoading === assessor.id ? 'Removing...' : 'Remove'}
                                  </Button>
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
