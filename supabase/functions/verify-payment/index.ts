import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get OAuth access token from Instamojo
async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  console.log("Requesting OAuth access token from Instamojo...");

  const tokenUrl = "https://api.instamojo.com/oauth2/token/";

  const formBody = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Failed to get access token:", data);
    throw new Error(data.error || "Failed to get access token");
  }

  console.log("✅ Successfully obtained access token");
  return data.access_token;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payment_id, payment_request_id } = await req.json();

    console.log('Verifying payment:', { payment_id, payment_request_id });

    // Get Instamojo OAuth credentials
    const INSTAMOJO_CLIENT_ID = Deno.env.get("INSTAMOJO_CLIENT_ID");
    const INSTAMOJO_CLIENT_SECRET = Deno.env.get("INSTAMOJO_CLIENT_SECRET");

    if (!INSTAMOJO_CLIENT_ID || !INSTAMOJO_CLIENT_SECRET) {
      throw new Error('Instamojo OAuth credentials not configured');
    }

    console.log('🟢 Using Instamojo v2 API with OAuth 2.0 authentication');

    // Get access token
    const accessToken = await getAccessToken(INSTAMOJO_CLIENT_ID, INSTAMOJO_CLIENT_SECRET);

    // Verify payment with Instamojo v2 API - Get payment request details
    const verificationUrl = `https://api.instamojo.com/v2/payment_requests/${payment_request_id}/`;
    
    console.log('Calling Instamojo verification endpoint:', verificationUrl);

    const response = await fetch(verificationUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    
    console.log('Instamojo verification response status:', response.status);
    console.log('Instamojo verification response data:', JSON.stringify(data));

    if (!response.ok) {
      console.error('Instamojo verification error:', data);
      throw new Error('Failed to verify payment');
    }

    // Check if payment request status is Completed
    const paymentStatus = data.status;
    const payments = data.payments || [];
    
    console.log('Payment status:', paymentStatus);
    console.log('Payments array:', payments);
    
    // Check if status is Completed and payment_id exists in payments array
    // Note: payments array contains full URLs, so we check if any URL contains the payment_id
    const paymentFound = payments.some((paymentUrl: string) => paymentUrl.includes(payment_id));
    
    if (paymentStatus !== 'Completed' || !paymentFound) {
      console.log('Payment verification failed - Status:', paymentStatus, 'Payment found:', paymentFound);
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false,
          status: paymentStatus,
          message: 'Payment not completed or payment ID not found'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    console.log('✅ Payment verified successfully');

    // Initialize Supabase client with proper error handling
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header to identify user
    const authHeader = req.headers.get('Authorization');
    let userId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        userId = user.id;
      }
    }

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: 10,
        payment_status: 'completed',
        razorpay_payment_id: payment_id,
        razorpay_order_id: payment_request_id,
      });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      throw new Error('Failed to save transaction');
    }

    console.log('Payment verified and transaction saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: true,
        amount: data.amount,
        status: data.status
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in verify-payment function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        verified: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);