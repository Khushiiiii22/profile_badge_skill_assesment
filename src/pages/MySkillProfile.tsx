import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Award, LogOut, Plus, User, Clock, CheckCircle, XCircle, AlertCircle, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Assessment {
  id: string;
  user_id: string;
  skill: string;
  pin_code: string;
  school_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
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
}

const MySkillProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
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
  }, []);

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
    const assessment = assessments.find(a => a.skill_name === skillName);
    const assessmentData = assessment?.assessment_data as any;
    return {
      name: skillName,
      progress: assessmentData?.score || 0,
      badge: assessmentData?.status === 'completed' ? 'Certified' : null,
      status: assessmentData?.status || 'not_assessed',
      assessment: assessment,
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
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
        return 'Completed';
      case 'pending':
        return 'Pending Assessment';
      case 'in_progress':
        return 'In Progress';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Not Assessed';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'in_progress':
        return 'outline';
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
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const completedAssessments = assessments.filter(a => a.status === 'completed').length;
  const pendingAssessments = assessments.filter(a => a.status === 'pending').length;

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
                  <h1 className="text-3xl font-bold mb-2">{profile?.name || "Student"}</h1>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                    <Badge variant="secondary">Student</Badge>
                    {profile?.age && <Badge variant="outline">Age: {profile.age}</Badge>}
                    {completedAssessments > 0 && (
                      <Badge className="bg-green-500">
                        {completedAssessments} Certified
                      </Badge>
                    )}
                    {pendingAssessments > 0 && (
                      <Badge variant="secondary">
                        {pendingAssessments} Pending
                      </Badge>
                    )}
                  </div>
                </div>

                <Link to="/get-assessed">
                  <Button variant="hero">
                    <Plus className="mr-2 h-4 w-4" />
                    Take Assessment
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          {assessments.length > 0 && (
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

          {/* Skills Overview */}
          <div>
            <h2 className="text-2xl font-bold mb-4">My Skills</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {allSkills.map((skillName, index) => {
                const skillData = getSkillData(skillName);
                return (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span className="flex items-center gap-2">
                          {skillData.name}
                          {getStatusIcon(skillData.status)}
                        </span>
                        {skillData.badge && (
                          <Badge className="bg-green-500">{skillData.badge}</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant={getStatusVariant(skillData.status)}>
                            {getStatusText(skillData.status)}
                          </Badge>
                        </div>

                        {skillData.status === 'completed' && (
                          <>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Score</span>
                                <span className="font-semibold text-foreground">
                                  {skillData.progress}%
                                </span>
                              </div>
                              <Progress value={skillData.progress} className="h-2" />
                            </div>

                            {skillData.assessment?.feedback && (
                              <div className="mt-3 p-3 bg-muted rounded-md">
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-semibold">Feedback:</span> {skillData.assessment.feedback}
                                </p>
                              </div>
                            )}

                            <div className="flex gap-2 mt-3">
                              {skillData.assessment?.certificate_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => window.open(skillData.assessment?.certificate_url, '_blank')}
                                >
                                  View Certificate
                                </Button>
                              )}
                              {skillData.assessment?.badge_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => window.open(skillData.assessment?.badge_url, '_blank')}
                                >
                                  View Badge
                                </Button>
                              )}
                            </div>
                          </>
                        )}

                        {skillData.status === 'pending' && (
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              Your assessment request has been submitted. An assessor will contact you soon.
                            </p>
                            <Button
                              size="sm"
                              onClick={() => navigate(`/take-assessment/${skillData.assessment.id}`)}
                              className="w-full"
                            >
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Take Assessment
                            </Button>
                          </div>
                        )}

                        {skillData.status === 'in_progress' && (
                          <p className="text-sm text-muted-foreground">
                            Your assessment is currently in progress.
                          </p>
                        )}

                        {skillData.status === 'not_assessed' && (
                          <p className="text-sm text-muted-foreground">
                            Not assessed yet. Click below to get started.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Call to Action */}
          {assessments.length === 0 && (
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
              <CardContent className="p-8 text-center">
                <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Ready to Get Assessed?</h3>
                <p className="text-muted-foreground mb-6">
                  Choose a skill and start your journey to earning professional badges and certificates
                </p>
                <Link to="/get-assessed">
                  <Button variant="hero" size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Start Your First Assessment
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Recent Assessments */}
          {assessments.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {assessments.slice(0, 5).map((assessment) => (
                      <div
                        key={assessment.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(assessment.status)}
                          <div>
                            <p className="font-semibold">{assessment.skill_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(assessment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MySkillProfile;
