import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Award, LogOut, Plus, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MySkillProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
                    {profile?.name ? getInitials(profile.name) : <User className="h-12 w-12" />}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-2">{profile?.name || "Student"}</h1>
                  <p className="text-muted-foreground">{profile?.email}</p>
                  <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                    <Badge variant="secondary">Student</Badge>
                    {profile?.age && <Badge variant="outline">Age: {profile.age}</Badge>}
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

          {/* Skills Overview */}
          <div>
            <h2 className="text-2xl font-bold mb-4">My Skills</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { name: "Communication", progress: 0, badge: null },
                { name: "Leadership", progress: 0, badge: null },
                { name: "Problem Solving", progress: 0, badge: null },
                { name: "Teamwork", progress: 0, badge: null },
                { name: "Time Management", progress: 0, badge: null },
                { name: "Creativity", progress: 0, badge: null },
              ].map((skill, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span>{skill.name}</span>
                      {skill.badge && (
                        <Badge variant="secondary">{skill.badge}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Progress</span>
                        <span>{skill.progress}%</span>
                      </div>
                      <Progress value={skill.progress} className="h-2" />
                      {skill.progress === 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Not assessed yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Call to Action */}
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
        </div>
      </div>
    </div>
  );
};

export default MySkillProfile;