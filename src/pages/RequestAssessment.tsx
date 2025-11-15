import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const requestSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  age: z.number().min(5, "Age must be at least 5").max(100, "Age must be less than 100"),
  email: z.string().trim().email("Invalid email address").max(255),
  mobile: z.string().trim().regex(/^[0-9]{10}$/, "Mobile number must be 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

const RequestAssessment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { skill, pinCode, schoolName } = location.state || {};
  
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    email: "",
    mobile: "",
    password: "",
  });

  // ✨ NEW: Track loading state for submit button
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isLoading) return;
    
    try {
      setIsLoading(true);

      // Validate form data
      const validated = requestSchema.parse({
        ...formData,
        age: parseInt(formData.age),
      });

      toast({
        title: "Processing",
        description: "Setting up your account...",
      });

      // Check if user exists first
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      
      let userId: string;
      
      if (existingSession) {
        // User is already logged in
        userId = existingSession.user.id;
        console.log("User already logged in:", userId);
      } else {
        // Try to sign up, or sign in if user exists
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: validated.email,
          password: validated.password,
          options: {
            emailRedirectTo: `${window.location.origin}/my-skill-profile`,
            data: {
              name: validated.name,
              age: validated.age,
              mobile: validated.mobile,
            }
          }
        });

        // If user already exists, try to sign in instead
        if (signUpError?.message === 'User already registered') {
          console.log("User already registered, attempting sign in...");
          
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: validated.email,
            password: validated.password,
          });
          
          if (signInError) {
            throw new Error('This email is already registered. Please use a different email or sign in with your existing account.');
          }
          
          userId = signInData.user.id;
          console.log("Sign in successful:", userId);
        } else if (signUpError) {
          throw signUpError;
        } else if (!authData.user) {
          throw new Error('Failed to create user account');
        } else {
          userId = authData.user.id;
          console.log("Sign up successful:", userId);
        }
      }

      // Create payment request
      toast({
        title: "Processing",
        description: "Creating payment request...",
      });

      // ✨ UPDATED: Pass assessment data to create-payment function
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          name: validated.name,
          email: validated.email,
          mobile: validated.mobile,
          age: validated.age,
          skill,
          pinCode,
          schoolName,
          // ✨ NEW: Send assessment data separately so it can be passed to webhook
          assessment_data: {
            skill,
            pinCode,
            schoolName,
          },
        },
      });

      if (error) {
        console.error('Payment creation error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No response from payment service');
      }

      if (data.success && data.paymentUrl) {
        // ✨ UPDATED: Store full assessment data in localStorage for fallback
        const assessmentPayload = {
          ...data.assessmentData,
          userId,
          paymentId: data.paymentId,
          paymentRequestId: data.paymentRequestId,
        };
        
        localStorage.setItem('pendingAssessment', JSON.stringify(assessmentPayload));
        
        console.log('✅ Assessment data stored in localStorage:', assessmentPayload);
        console.log('🔗 Redirecting to Instamojo payment page:', data.paymentUrl);
        
        // ✨ NEW: Show success toast before redirect
        toast({
          title: "Redirecting to Payment",
          description: "You'll be redirected to Instamojo to complete the payment...",
        });
        
        // Redirect to Instamojo payment page
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(data.error || 'Failed to create payment request');
      }
    } catch (error: any) {
      setIsLoading(false);
      
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error('Payment error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to process request. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  if (!skill || !pinCode || !schoolName) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Missing Information</CardTitle>
            <CardDescription>
              Please start from the assessment selection page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/get-assessed">
              <Button variant="default" className="w-full">
                Go to Assessment Selection
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-12">
        <Link to="/get-assessed">
          <Button 
            variant="ghost" 
            className="mb-8"
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 space-y-4">
            <h1 className="text-4xl font-bold">Complete Your Profile</h1>
            <p className="text-xl text-muted-foreground">
              Just a few more details to request your {skill} assessment
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Skill</p>
                <p className="font-semibold">{skill}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">PIN Code</p>
                <p className="font-semibold">{pinCode}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">School</p>
                <p className="font-semibold text-sm">{schoolName}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                This information will be used to create your skill profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={100}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter your age"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    min="5"
                    max="100"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    maxLength={255}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                    maxLength={10}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password (min 6 characters)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    maxLength={100}
                    minLength={6}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border-2 border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Assessment Fee</h3>
                      <p className="text-sm text-muted-foreground">One-time payment</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">₹10</p>
                      <p className="text-xs text-muted-foreground">via Instamojo</p>
                    </div>
                  </div>
                </div>

                {/* ✨ NEW: Show loading state on submit button */}
                <Button 
                  type="submit" 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Proceed to Payment
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  By proceeding, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RequestAssessment;
