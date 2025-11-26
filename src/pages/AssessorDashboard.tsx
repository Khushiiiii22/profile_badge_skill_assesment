import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, AlertCircle, LogOut, Eye, FileText, Users, Award } from "lucide-react";
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
  rejection_reason?: string;
};

type AssessmentWithProfile = Assessment & {
  profile_full_name?: string;
  profile_email?: string;
};

const AssessorDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<AssessmentWithProfile[]>([]);
  const [allAssessments, setAllAssessments] = useState<AssessmentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentWithProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    fetchAssessments();
    // eslint-disable-next-line
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      // Check user role first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Unauthorized",
          description: "Please log in to access the assessor dashboard.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      // Check if user has assessor role (handle multiple rows)
      const { data: rolesData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      if (roleError) {
        toast({
          title: "Access Denied",
          description: "You don't have assessor privileges to access this page.",
          variant: "destructive",
        });
        navigate("/my-skill-profile");
        return;
      }

      const roles = (rolesData || []).map((r: any) => (typeof r.role === 'string' ? r.role.trim().toLowerCase() : ''));
      if (!roles.includes('assessor') && !roles.includes('admin')) {
        toast({
          title: "Access Denied",
          description: "You don't have assessor privileges to access this page.",
          variant: "destructive",
        });
        navigate("/my-skill-profile");
        return;
      }

      // Check assessor approval status (skip for admin)
      if (roles.includes('assessor') && !roles.includes('admin')) {
        console.log('🔍 Checking assessor approval status for user:', session.user.id);
        
        const { data: assessorRequests, error: requestError } = await supabase
          .from('assessor_requests')
          .select('status')
          .eq('user_id', session.user.id);

        console.log('📊 Assessor requests data:', assessorRequests, 'Error:', requestError);

        const assessorRequest = assessorRequests && assessorRequests.length > 0 ? assessorRequests[0] : null;

        if (assessorRequest) {
          console.log('✅ Found assessor request with status:', assessorRequest.status);
          setApprovalStatus(assessorRequest.status as 'pending' | 'approved' | 'rejected');
          setIsApproved(assessorRequest.status === 'approved');
          
          if (assessorRequest.status !== 'approved') {
            console.log('⏸️ Status is not approved, stopping here');
            setLoading(false);
            return; // Don't fetch assessments if not approved
          }
          console.log('🎉 Status is approved! Continuing to fetch assessments...');
        } else {
          console.log('⚠️ No assessor request found, defaulting to pending');
          setApprovalStatus('pending');
          setIsApproved(false);
          setLoading(false);
          return;
        }
      } else {
        // Admin has full access
        console.log('👑 Admin access detected');
        setIsApproved(true);
        setApprovalStatus('approved');
      }

      // Fetch all assessments with their profiles for assessor view
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Fetch profiles separately to avoid foreign key issues
      const assessmentData = data || [];
      const userIds = [...new Set(assessmentData.map(a => a.user_id))];
      
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        profilesMap = (profilesData || []).reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>);
      }

      // Transform the data to match expected format
      const assessmentsWithProfiles = assessmentData.map(assessment => ({
        ...assessment,
        profiles: profilesMap[assessment.user_id] || null,
        profile_full_name: profilesMap[assessment.user_id]?.full_name || 'Unknown',
        profile_email: profilesMap[assessment.user_id]?.email || '',
      }));
      setAllAssessments(assessmentsWithProfiles);
      // Filter pending assessments for the main view
      const pendingAssessments = assessmentsWithProfiles.filter(
        assessment => assessment.status === 'awaiting_approval' || assessment.status === 'completed'
      );
      setAssessments(pendingAssessments);

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
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('🔄 Approving assessment:', assessmentId);
      
      const { error } = await supabase
        .from('assessments')
        .update({
          status: 'completed',
          approved: true
        } as any)
        .eq('id', assessmentId);
      
      if (error) {
        console.error('❌ Error approving assessment:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', error.details);
        console.error('❌ Error hint:', error.hint);
        throw error;
      }
      
      console.log('✅ Assessment approved successfully');
      
      toast({
        title: "Assessment Approved",
        description: "The assessment has been successfully approved and certificate issued.",
      });
      await fetchAssessments();
    } catch (error: any) {
      console.error('❌ Error approving assessment:', error);
      toast({
        title: "Error",
        description: "Failed to approve assessment.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedAssessment || !rejectionReason.trim()) return;

    try {
      setActionLoading(selectedAssessment.id);
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('🔄 Rejecting assessment:', selectedAssessment.id);
      
      const { error } = await supabase
        .from('assessments')
        .update({
          status: 'rejected'
        } as any)
        .eq('id', selectedAssessment.id);
      
      if (error) {
        console.error('❌ Error rejecting assessment:', error);
        throw error;
      }
      
      console.log('✅ Assessment rejected successfully');
      
      toast({
        title: "Assessment Rejected",
        description: "The assessment has been rejected. Student can request re-examination.",
      });
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedAssessment(null);
      await fetchAssessments();
    } catch (error: any) {
      console.error('❌ Error rejecting assessment:', error);
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
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Awaiting Review</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCertificationStatus = (assessment: AssessmentWithProfile) => {
    if (assessment.approved) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><Award className="w-3 h-3 mr-1" />Certified</Badge>;
    } else if (assessment.status === 'rejected') {
      return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const openRejectDialog = (assessment: AssessmentWithProfile) => {
    setSelectedAssessment(assessment);
    setShowRejectDialog(true);
  };

  const displayAssessments = activeTab === 'pending' ? assessments : allAssessments;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading assessor dashboard...</p>
        </div>
      </div>
    );
  }

  // Show pending approval message if assessor is not approved
  if (!isApproved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            {/* Top bar with Sign Out button */}
            <div className="flex justify-end mb-8">
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>

            {/* Pending Approval Card */}
            <Card className="border-2 border-yellow-200">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-yellow-100 rounded-full w-20 h-20 flex items-center justify-center">
                  <Clock className="h-10 w-10 text-yellow-600" />
                </div>
                <CardTitle className="text-2xl">
                  {approvalStatus === 'pending' && 'Assessor Application Pending'}
                  {approvalStatus === 'rejected' && 'Assessor Application Rejected'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {approvalStatus === 'pending' && (
                  <>
                    <p className="text-lg text-muted-foreground">
                      Your assessor application is currently under review by the admin team.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                      <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                      <ul className="text-sm text-blue-800 space-y-2 text-left max-w-md mx-auto">
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span>An admin will review your application</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span>You'll receive a notification once approved</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span>After approval, you can review student assessments</span>
                        </li>
                      </ul>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      This usually takes 24-48 hours. Please check back later.
                    </p>
                  </>
                )}
                {approvalStatus === 'rejected' && (
                  <>
                    <p className="text-lg text-destructive">
                      Unfortunately, your assessor application has been rejected.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please contact the admin team for more information.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
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
              <h1 className="text-3xl font-bold mb-2">Assessor Dashboard</h1>
              <p className="text-muted-foreground">
                Review and verify student assessments and certifications
              </p>
            </div>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-blue-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold">{assessments.length}</p>
                    <p className="text-sm text-muted-foreground">Pending Reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold">{allAssessments.filter(a => a.approved).length}</p>
                    <p className="text-sm text-muted-foreground">Approved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold">{allAssessments.filter(a => a.status === 'rejected').length}</p>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold">{allAssessments.length}</p>
                    <p className="text-sm text-muted-foreground">Total Assessments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="flex mb-6">
            <Button
              variant={activeTab === 'pending' ? 'default' : 'outline'}
              onClick={() => setActiveTab('pending')}
              className="mr-4"
            >
              Pending Assessments ({assessments.length})
            </Button>
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              onClick={() => setActiveTab('all')}
            >
              All Student Profiles ({allAssessments.length})
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {activeTab === 'pending' ? 'Pending Assessments' : 'Student Assessment Profiles'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {displayAssessments.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'pending'
                      ? "There are no assessments awaiting review at this time."
                      : "No student assessment profiles found."
                    }
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
                        <TableHead>Certification Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayAssessments.map((assessment) => (
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
                          <TableCell>{getCertificationStatus(assessment)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Eye className="w-4 h-4 mr-1" />
                                    View Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Assessment Details</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Student Name</Label>
                                        <p className="font-medium">{assessment.profile_full_name}</p>
                                      </div>
                                      <div>
                                        <Label>Skill</Label>
                                        <p className="font-medium">{assessment.skill}</p>
                                      </div>
                                      <div>
                                        <Label>Score</Label>
                                        <p className="font-medium">{assessment.score}%</p>
                                      </div>
                                      <div>
                                        <Label>School</Label>
                                        <p className="font-medium">{assessment.school_name}</p>
                                      </div>
                                      <div>
                                        <Label>Assessment Date</Label>
                                        <p className="font-medium">
                                          {assessment.assessment_date
                                            ? new Date(assessment.assessment_date).toLocaleDateString()
                                            : 'N/A'
                                          }
                                        </p>
                                      </div>
                                      <div>
                                        <Label>Status</Label>
                                        <p className="font-medium">{getStatusBadge(assessment.status)}</p>
                                      </div>
                                    </div>
                                    {assessment.feedback && (
                                      <div>
                                        <Label>Feedback</Label>
                                        <p className="text-sm text-muted-foreground">{assessment.feedback}</p>
                                      </div>
                                    )}
                                    {assessment.certificate_url && (
                                      <div>
                                        <Label>Certificate</Label>
                                        <a
                                          href={assessment.certificate_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary hover:underline"
                                        >
                                          View Certificate
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {(assessment.status === 'awaiting_approval' || assessment.status === 'completed') && (
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
                                    onClick={() => openRejectDialog(assessment)}
                                    disabled={actionLoading === assessment.id}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
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

          {/* Rejection Reason Dialog */}
          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Assessment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rejection-reason">Rejection Reason</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Please provide a detailed reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={!rejectionReason.trim() || actionLoading === selectedAssessment?.id}
                  >
                    {actionLoading === selectedAssessment?.id ? 'Rejecting...' : 'Reject Assessment'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default AssessorDashboard;
