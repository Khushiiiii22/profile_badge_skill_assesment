import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      const paymentId = searchParams.get('payment_id');
      const paymentRequestId = searchParams.get('payment_request_id');

      if (!paymentId || !paymentRequestId) {
        toast({
          title: "Invalid Payment",
          description: "Payment information is missing.",
          variant: "destructive",
        });
        setVerifying(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to complete your payment.",
            variant: "destructive",
          });
          navigate('/auth', { 
            state: { 
              redirectTo: `/payment-success?payment_id=${paymentId}&payment_request_id=${paymentRequestId}` 
            } 
          });
          return;
        }

        // Verify payment with backend
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: {
            payment_id: paymentId,
            payment_request_id: paymentRequestId,
          },
        });

        if (error) throw error;

        if (data.verified) {
          setVerified(true);
          
          // Get pending assessment data from localStorage
          const pendingAssessment = localStorage.getItem('pendingAssessment');
          
          if (pendingAssessment) {
            try {
              const assessmentData = JSON.parse(pendingAssessment);
              
              console.log('Creating assessment record:', assessmentData);
              
              // Create assessment record in database
              const { data: newAssessment, error: assessmentError } = await supabase
                .from('assessments')
                .insert({
                  user_id: session.user.id,
                  skill: assessmentData.skill,
                  pin_code: assessmentData.pinCode,
                  school_name: assessmentData.schoolName,
                  status: 'pending',
                  payment_id: paymentId,
                  payment_request_id: paymentRequestId
                } as any)
                .select()
                .single();
              
              if (assessmentError) {
                console.error('Failed to create assessment:', assessmentError);
                toast({
                  title: "Warning",
                  description: "Payment verified but failed to create assessment record. Please contact support.",
                  variant: "destructive",
                });
              } else {
                console.log('✅ Assessment record created:', newAssessment);
                // Clear localStorage after successful creation
                localStorage.removeItem('pendingAssessment');
              }
            } catch (parseError) {
              console.error('Failed to parse assessment data:', parseError);
            }
          } else {
            console.warn('⚠️ No pending assessment data found in localStorage');
          }
          
          toast({
            title: "Payment Successful!",
            description: "Your assessment request has been submitted.",
          });
          
          // Redirect to profile after 3 seconds
          setTimeout(() => {
            navigate('/my-skill-profile');
          }, 3000);
        } else {
          toast({
            title: "Payment Verification Failed",
            description: data.message || "Unable to verify your payment. Please contact support.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to verify payment.",
          variant: "destructive",
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {verifying ? (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </div>
              <CardTitle>Verifying Payment</CardTitle>
              <CardDescription>Please wait while we confirm your payment...</CardDescription>
            </>
          ) : verified ? (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-green-600">Payment Successful!</CardTitle>
              <CardDescription>
                Your assessment request has been submitted successfully.
              </CardDescription>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Payment Failed</CardTitle>
              <CardDescription>
                We couldn't verify your payment. Please try again or contact support.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {verified && (
            <div className="text-center text-sm text-muted-foreground">
              Redirecting to your skill profile...
            </div>
          )}
          {!verifying && !verified && (
            <div className="space-y-2">
              <Button
                onClick={() => navigate('/get-assessed')}
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
