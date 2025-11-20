import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Award, LogOut, Plus, User, Clock, CheckCircle, XCircle, AlertCircle, AlertTriangle, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface Assessment {
  id: string;
  user_id: string;
  skill: string;
  pin_code: string;
  school_name: string;
  status: 'pending' | 'in_progress' | 'awaiting_approval' | 'completed' | 'cancelled' | 'accepted' | 'rejected';
  payment_id: string | null;
  payment_request_id: string | null;
  assessor_id: string | null;
  assessment_date: string | null;
  score: number | null;
  feedback: string | null;
  certificate_url: string | null;
  badge_url: string | null;
  created_at: string;
  updated_at: string;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  skill_name?: string;
}

const MySkillProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  const allSkills = [
    "Communication",
    "Leadership",
    "Problem Solving",
    "Teamwork",
    "Time Management",
    "Creativity",
  ];

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // Optional: redirect admins to the admin dashboard
    // if (!loading && userRole === "admin") {
    //   navigate("/admin");
    // }
  }, [userRole, loading, navigate]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    setProfile(profileData);

    // Fetch user role
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);
    const roles = (rolesData || []).map((r: any) => (typeof r.role === 'string' ? r.role.trim().toLowerCase() : ''));
    if (roles.includes('admin')) setUserRole('admin');
    else if (roles.includes('assessor')) setUserRole('assessor');
    else setUserRole('student');

    // Fetch assessments
    const { data: assessmentData, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching assessments:', error);
      toast({
        title: "Error",
        description: "Failed to load your assessments.",
        variant: "destructive",
      });
      setAssessments([]);
    } else {
      setAssessments(assessmentData || []);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    navigate("/");
  };

  const getSkillData = (skillName: string) => {
    const assessment = assessments.find(a => a.skill === skillName || a.skill_name === skillName);
    return {
      name: skillName,
      progress: assessment?.score || 0,
      badge: assessment?.status === 'completed' && assessment?.approved ? 'Certified' : null,
      status: assessment ? assessment.status : 'not_assessed',
      assessment: assessment,
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'awaiting_approval':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'in_progress':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Certified';
      case 'accepted':
        return 'Certified';
      case 'awaiting_approval':
        return 'Awaiting Approval';
      case 'pending':
        return 'Pending Assessment';
      case 'in_progress':
        return 'In Progress';
      case 'cancelled':
        return 'Cancelled';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Not Assessed';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'accepted':
        return 'default';
      case 'awaiting_approval':
        return 'secondary';
      case 'pending':
        return 'secondary';
      case 'in_progress':
        return 'outline';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Award className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return (name || "")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // --- SUMMARY VARIABLES ---
  const acceptedAssessments = assessments.filter(a => a.status === 'accepted').length;
  const completedAssessments = assessments.filter(a => a.status === 'completed').length;
  const rejectedAssessments = assessments.filter(a => a.status === 'rejected');
  const pendingAssessments = assessments.filter(a =>
    a.status === 'pending' || a.status === 'in_progress' || a.status === 'awaiting_approval'
  ).length;
  const totalCertified = acceptedAssessments;
  const totalAssessments = assessments.length;
  const certificationProgress = totalAssessments > 0 ? (acceptedAssessments / totalAssessments) * 100 : 0;

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <Award className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">SkillN</span>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Header */}
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-primary">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {profile?.name ? getInitials(profile.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-2">{profile?.name || (userRole === "admin" ? "Admin" : "Student")}</h1>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                    <Badge variant="secondary">{userRole === "admin" ? "Admin" : "Student"}</Badge>
                    {profile?.age && <Badge variant="outline">Age: {profile.age}</Badge>}
                    {userRole === "student" && acceptedAssessments > 0 && (
                      <Badge className="bg-green-500">{acceptedAssessments} Certified</Badge>
                    )}
                    {userRole === "student" && pendingAssessments > 0 && (
                      <Badge variant="secondary">{pendingAssessments} Pending</Badge>
                    )}
                  </div>
                </div>
                {/* Only show Take Assessment for students */}
                {userRole === "student" && (
                  <Link to="/get-assessed">
                    <Button variant="hero">
                      <Plus className="mr-2 h-4 w-4" />
                      Take Assessment
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          {userRole === "student" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">{completedAssessments}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{pendingAssessments}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{assessments.length}</p>
                    <p className="text-sm text-muted-foreground">Total Assessments</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Assessment History Table */}
          {userRole === "student" && (
            <Card>
              <CardHeader>
                <CardTitle>Assessment History</CardTitle>
              </CardHeader>
              <CardContent>
                {assessments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">You haven't taken any assessments yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Skill</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Certificate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assessments.map(a => (
                        <TableRow key={a.id}>
                          <TableCell>{a.skill_name || a.skill}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(a.status)}>{getStatusText(a.status)}</Badge>
                          </TableCell>
                          <TableCell>{a.score !== null ? `${a.score}%` : "N/A"}</TableCell>
                          <TableCell>{formatDate(a.assessment_date || a.created_at)}</TableCell>
                          <TableCell>
                            {['accepted', 'completed', 'approved'].includes(a.status) && a.certificate_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(a.certificate_url!, "_blank")}
                              >
                                Certificate
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* (The rest of your dashboard, including Certifications, Retake Notifications, Progress, etc stays the same as before) */}
        </div>
      </div>
    </div>
  );
};

export default MySkillProfile;

