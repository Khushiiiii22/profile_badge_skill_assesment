import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper for notes parsing (unchanged)
function parseAssessmentDataFromNotes(notes: string): any {
  try {
    if (!notes) return null;
    const params = new URLSearchParams(notes);
    const assessmentDataStr = params.get('assessment_data');
    if (!assessmentDataStr) return null;
    const decoded = decodeURIComponent(assessmentDataStr);
    const parsed = JSON.parse(decoded);
    console.log('✅ Successfully parsed assessment data from notes');
    return parsed;
  } catch (error) {
    console.warn('⚠️ Failed to parse assessment data from notes:', error);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const contentType = req.headers.get('content-type') || '';
    let paymentData: any;
    let assessmentData: any = null;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      const notes = formData.get('notes') as string || '';
      paymentData = {
        payment_id: formData.get('payment_id'),
        payment_request_id: formData.get('payment_request_id'),
        payment_status: formData.get('payment_status'),
        buyer_name: formData.get('buyer_name'),
        buyer_email: formData.get('buyer'),
        amount: formData.get('amount'),
        mac: formData.get('mac'),
      };
      if (notes) {
        assessmentData = parseAssessmentDataFromNotes(notes);
        if (assessmentData) {
          console.log('📋 Assessment data extracted from webhook:', assessmentData);
        }
      }
      console.log('📨 Webhook received from Instamojo:', paymentData);
    } else {
      paymentData = await req.json();
      if (paymentData.assessment_data) {
        assessmentData = paymentData.assessment_data;
        console.log('📋 Assessment data from frontend API call:', assessmentData);
      }
      console.log('📞 API call from frontend:', paymentData);
    }

    const { payment_id, payment_request_id, payment_status } = paymentData;
    if (!payment_id || !payment_request_id) {
      throw new Error('Missing payment_id or payment_request_id');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if transaction already exists
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('instamojo_payment_id', payment_id)
      .single();
    if (existingTransaction) {
      console.log('✅ Transaction already recorded');
      // Also unlock assessment access if not yet done
      const buyerEmail = paymentData.buyer_email || paymentData.buyer;
      if (buyerEmail) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', buyerEmail)
          .single();
        if (userData?.id) {
          await supabase
            .from('profiles')
            .update({ assessment_access: true })
            .eq('id', userData.id);
        }
      }
      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          message: 'Payment already verified and access unlocked'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let isVerified = false;
    if (payment_status === 'Credit') {
      isVerified = true;
      console.log('✅ Payment verified via webhook');
    } else {
      console.log('🔍 Verifying payment with Instamojo API...');
      const INSTAMOJO_CLIENT_ID = Deno.env.get("INSTAMOJO_CLIENT_ID");
      const INSTAMOJO_CLIENT_SECRET = Deno.env.get("INSTAMOJO_CLIENT_SECRET");

      if (!INSTAMOJO_CLIENT_ID || !INSTAMOJO_CLIENT_SECRET) {
        throw new Error('Instamojo credentials not configured');
      }
      // Get OAuth token
      const tokenUrl = "https://api.instamojo.com/oauth2/token/";
      const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: INSTAMOJO_CLIENT_ID,
          client_secret: INSTAMOJO_CLIENT_SECRET,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get Instamojo access token');
      }
      const { access_token } = await tokenResponse.json();

      // Verify payment
      const verifyUrl = `https://api.instamojo.com/v2/payment_requests/${payment_request_id}/`;
      const verifyResponse = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json',
        },
      });

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify payment with Instamojo');
      }

      const verifyData = await verifyResponse.json();
      const paymentFound = (verifyData.payments || []).some((url: string) =>
        url.includes(payment_id)
      );

      isVerified = verifyData.status === 'Completed' && paymentFound;
      console.log('✅ Payment verified via API:', isVerified);
    }

    if (!isVerified) {
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          message: 'Payment not completed'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user from payment request email
    const buyerEmail = paymentData.buyer_email || paymentData.buyer;
    let userId = null;
    if (buyerEmail) {
      const { data: userData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', buyerEmail)
        .single();
      userId = userData?.id;
    }
    if (!userId) {
      // Try to get from auth header if frontend call
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      }
    }
    if (!userId) {
      throw new Error('Unable to identify user for this payment');
    }

    // Save transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: parseFloat(paymentData.amount) || 10,
        payment_status: 'completed',
        instamojo_payment_id: payment_id,
        instamojo_order_id: payment_request_id,
      });
    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      throw new Error('Failed to save transaction');
    }
    console.log('💾 Transaction saved successfully');

    // Unlock assessment access for the user
    await supabase
      .from('profiles')
      .update({ assessment_access: true }) // Or the field your frontend expects
      .eq('id', userId);

    // Optionally create assessment record if assessmentData provided
    try {
      if (assessmentData && assessmentData.skill && assessmentData.pinCode && assessmentData.schoolName) {
        const { data: newAssessment, error: assessmentError } = await supabase
          .from('assessments')
          .insert({
            user_id: userId,
            skill: assessmentData.skill,
            pin_code: assessmentData.pinCode,
            school_name: assessmentData.schoolName,
            status: 'pending',
            instamojo_payment_id: payment_id,
            instamojo_payment_request_id: payment_request_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (assessmentError) {
          console.error('⚠️ Warning: Failed to create assessment:', assessmentError);
          // Don't throw - payment was successful, just log the warning
        } else {
          console.log('✅ Assessment record created successfully:', {
            id: newAssessment?.id,
            skill: newAssessment?.skill,
            status: newAssessment?.status,
          });
        }
      } else {
        console.warn('⚠️ No assessment data available - frontend will create it as fallback');
      }
    } catch (assessmentParseError) {
      console.warn('⚠️ Could not parse/process assessment data:', assessmentParseError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        message: 'Payment verified and recorded, assessment access unlocked',
        user_id: userId,
        assessment_created: !!assessmentData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ Error in verify-payment:', error);
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
