import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Award, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getHighestRole } from '@/lib/auth';
import { z } from "zod";

const authSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "admin12";
const ADMIN_ROLE = "admin"; // use lowercase 'admin' everywhere

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("student");
  const [viewAs, setViewAs] = useState<'assigned'|'student'|'assessor'>('assigned');

  // Centralized role check and redirect + debug logs
  async function checkAndRedirect(userId: string) {
    try {
      console.log("🔍 Querying user_roles for user_id:", userId);
      const { data: rolesData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Role query error:', error);
        navigate('/my-skill-profile');
        return;
      }

      const resolvedRole = await getHighestRole(userId);
      console.log('checkAndRedirect: resolvedRole for user', userId, resolvedRole);

      // Honor stored desired role (e.g., user selected 'assessor' on sign-in) if allowed
      let desiredRole: string | null = null;
      try { desiredRole = sessionStorage.getItem('auth:desiredRole'); } catch (e) { desiredRole = null; }
      if (desiredRole) {
        // validate desiredRole
        if (desiredRole === 'assessor' && (resolvedRole === 'assessor' || resolvedRole === ADMIN_ROLE)) {
          navigate('/assessor-dashboard');
          try { sessionStorage.removeItem('auth:desiredRole'); } catch (e) {}
          return;
        }
        if (desiredRole === 'student') {
          navigate('/my-skill-profile');
          try { sessionStorage.removeItem('auth:desiredRole'); } catch (e) {}
          return;
        }
        // if desiredRole is 'assigned' or invalid, fall through to assigned behavior
      }

      if (resolvedRole === ADMIN_ROLE) {
        navigate('/admin');
      } else if (resolvedRole === 'assessor') {
        navigate('/assessor-dashboard');
      } else {
        navigate('/my-skill-profile');
      }
    } catch (err) {
      console.error("Role check failed, error:", err);
      navigate('/my-skill-profile');
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("useEffect: Session loaded", session);
      if (session?.user) {
        await checkAndRedirect(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("onAuthStateChange:", event, session);
      if ((event === 'SIGNED_IN' || event === "PASSWORD_RECOVERY") && session?.user) {
        await checkAndRedirect(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      authSchema.parse({ email, password });
      if (!name.trim() || name.trim().length < 2) {
        throw new Error("Name must be at least 2 characters");
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name: name.trim() }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        console.log('✅ User created:', data.user.id);
        
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update the profile with full_name (trigger creates it with name from metadata)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ full_name: name.trim() })
          .eq('id', data.user.id);
        
        if (updateError) {
          console.error('⚠️ Error updating profile:', updateError);
        }
        
        // Insert user role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: role,
          });
        
        if (roleError) {
          console.error('❌ Error inserting user_roles:', roleError);
          throw roleError;
        }
        
        console.log('✅ Inserted user role:', role);
        
        // Create assessor request if role is assessor
        if (role === 'assessor') {
          const { error: assessorError } = await supabase
            .from('assessor_requests')
            .insert({
              user_id: data.user.id,
              status: 'pending',
            });
          
          if (assessorError) {
            console.error('❌ Error creating assessor_requests:', assessorError);
            throw assessorError;
          }
          
          console.log('✅ Created assessor request');
        }
        
        if (role === 'student') {
          toast({
          title: "Account Created!",
          description: "Welcome to SkillN. Redirecting to your profile...",
        });
                    navigate('/my-skill-profile');
                  } else if (role === 'assessor') {
                    toast({
            title: "Account Pending Approval",
            description: "Your assessor account is pending admin approval. You will be notified once approved.",
          });
          navigate('/assessor-dashboard');
        }
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign Up Failed",
          description: error.message || "An error occurred during sign up",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
  let signInEmail = email.trim();
      let signInPassword = password;

      // Hardcoded admin login shortcut
      if (email === 'admin' && password === ADMIN_PASSWORD) {
        signInEmail = ADMIN_EMAIL;
        signInPassword = ADMIN_PASSWORD;
      } else {
        authSchema.parse({ email, password });
      }

  // Persist desired view so auth state handler can honor it if fired
  try { sessionStorage.setItem('auth:desiredRole', viewAs); } catch (e) { /* ignore */ }

  const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (error) throw error;

      if (data.user) {
        console.log("handleSignIn: Signed in user", data.user.id);
  // Decide which role to use for redirect
  const assignedRole = await getHighestRole(data.user.id);
        let desiredRole = assignedRole;

        if (viewAs === 'assessor') {
          if (assignedRole !== 'assessor' && assignedRole !== 'admin') {
            toast({ title: 'Access Denied', description: 'You do not have assessor access. Redirecting to your assigned role.', variant: 'destructive' });
            desiredRole = assignedRole;
          } else {
            desiredRole = 'assessor';
          }
        } else if (viewAs === 'student') {
          desiredRole = 'student';
        }

  // Redirect according to desiredRole
        if (desiredRole === ADMIN_ROLE) {
          navigate('/admin');
        } else if (desiredRole === 'assessor') {
          navigate('/assessor-dashboard');
        } else {
          navigate('/my-skill-profile');
        }

  toast({ title: 'Welcome Back!', description: desiredRole === ADMIN_ROLE ? 'Redirecting to admin dashboard...' : 'Redirecting to your profile...' });

  // Clear desired role flag
  try { sessionStorage.removeItem('auth:desiredRole'); } catch (e) { /* ignore */ }
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign In Failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 mb-4">
            <Award className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold">SkillN</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome to SkillN</h1>
          <p className="text-muted-foreground">Sign in to access your skill profile</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account.<br />
                  <span className="text-sm text-muted-foreground">Please sign in to access your account.</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      maxLength={255}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Open as</Label>
                    <RadioGroup value={viewAs} onValueChange={(v) => setViewAs(v as any)}>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="assigned" id="assigned" />
                          <Label htmlFor="assigned">Use assigned role</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="student" id="signin-student" />
                          <Label htmlFor="signin-student">Student</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="assessor" id="signin-assessor" />
                          <Label htmlFor="signin-assessor">Assessor</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button type="submit" variant="default" className="w-full" disabled={loading}>
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  Sign up to start your skill assessment journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      maxLength={255}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <RadioGroup value={role} onValueChange={setRole}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="student" id="student" />
                        <Label htmlFor="student">Student</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="assessor" id="assessor" />
                        <Label htmlFor="assessor">Assessor</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button type="submit" variant="default" className="w-full" disabled={loading}>
                    {loading ? "Creating Account..." : "Sign Up"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
