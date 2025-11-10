import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  name: string;
  email: string;
  mobile: string;
  skill: string;
  pinCode: string;
  schoolName: string;
  age: number;
}

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

// Make API call to Instamojo with fallback logic
async function callInstamojoAPI(payload: any, accessToken: string): Promise<any> {
  const prodUrl = Deno.env.get("INSTAMOJO_PROD_URL") || "https://api.instamojo.com/v2/payment_requests/";
  const testUrl = Deno.env.get("INSTAMOJO_TEST_URL");
  const proxyUrl = Deno.env.get("INSTAMOJO_PROXY_URL");

  // Try production endpoint first (test endpoint has DNS issues from edge functions)
  const endpoints = [{ url: prodUrl, name: "production" }];

  // Add test URL if explicitly configured
  if (testUrl) {
    endpoints.push({ url: testUrl, name: "test" });
  }

  // Add proxy URL if configured
  if (proxyUrl) {
    endpoints.push({ url: proxyUrl, name: "proxy" });
  }

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`Attempting to call Instamojo ${endpoint.name} endpoint: ${endpoint.url}`);

      // Format body as URLSearchParams for v2 API
      const formBody = new URLSearchParams();
      Object.keys(payload).forEach((key) => {
        formBody.append(key, String(payload[key]));
      });

      // For DNS errors, don't retry - fail fast and try next endpoint
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      });

      const data = await response.json();
      console.log(`Instamojo ${endpoint.name} endpoint response status:`, response.status);
      console.log(`Instamojo ${endpoint.name} endpoint response data:`, JSON.stringify(data));

      if (!response.ok) {
        console.error(`Instamojo ${endpoint.name} API error:`, data);
        throw new Error(data.message || `Failed to create payment request via ${endpoint.name} endpoint`);
      }

      console.log(`✅ Successfully used Instamojo ${endpoint.name} endpoint`);
      return data;
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message || String(error);

      // Check if it's a DNS or network error
      const isDNSError =
        errorMessage.includes("dns error") ||
        errorMessage.includes("Name or service not known") ||
        errorMessage.includes("failed to lookup");

      if (isDNSError) {
        console.warn(`⚠️ Instamojo ${endpoint.name} endpoint unreachable (DNS error) — trying next endpoint...`);
      } else {
        console.warn(`⚠️ Instamojo ${endpoint.name} endpoint failed: ${errorMessage} — trying next endpoint...`);
      }

      // Continue to next endpoint
      continue;
    }
  }

  // All endpoints failed
  console.error("❌ All Instamojo endpoints failed");
  throw lastError || new Error("Failed to create payment request - all endpoints unreachable");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, mobile, skill, pinCode, schoolName, age }: PaymentRequest = await req.json();

    console.log("Creating payment request for:", { name, email, mobile });

    // Get Instamojo OAuth credentials
    const INSTAMOJO_CLIENT_ID = Deno.env.get("INSTAMOJO_CLIENT_ID");
    const INSTAMOJO_CLIENT_SECRET = Deno.env.get("INSTAMOJO_CLIENT_SECRET");

    if (!INSTAMOJO_CLIENT_ID || !INSTAMOJO_CLIENT_SECRET) {
      throw new Error("Instamojo OAuth credentials not configured");
    }

    console.log("🟢 Using Instamojo v2 API with OAuth 2.0 authentication");

    // Get access token
    const accessToken = await getAccessToken(INSTAMOJO_CLIENT_ID, INSTAMOJO_CLIENT_SECRET);

    // Get the origin for redirect URL
    const origin = req.headers.get("origin") || "https://preview--profile-badge-hub.lovable.app/request-assessment";
    const redirectUrl = `${origin}/payment-success`;

    const instamojoPayload = {
      purpose: "Skill Assessment Fee",
      amount: "99",
      buyer_name: name,
      email: email,
      phone: mobile,
      redirect_url: redirectUrl,
      webhook: `${Deno.env.get("SUPABASE_URL")}/functions/v1/verify-payment`,
      send_email: true,
      send_sms: false,
      allow_repeated_payments: false,
    };

    console.log("Calling Instamojo API with payload:", { ...instamojoPayload, phone: "***" });

    // Call Instamojo API with automatic fallback
    const data = await callInstamojoAPI(instamojoPayload, accessToken);

    console.log("Received response from Instamojo:", JSON.stringify(data));

    // Handle different response structures
    if (!data) {
      throw new Error("No response received from Instamojo");
    }

    // Extract payment URL and ID from response
    const paymentUrl = data.longurl || data.payment_request?.longurl;
    const paymentId = data.id || data.payment_request?.id;

    if (!paymentUrl || !paymentId) {
      console.error("Invalid response structure:", data);
      throw new Error("Invalid response from Instamojo - missing payment URL or ID");
    }

    console.log("Payment created successfully:", { paymentId, paymentUrl });

    // Store the payment request data in the response for later verification
    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: paymentUrl,
        paymentId: paymentId,
        assessmentData: {
          name,
          email,
          mobile,
          skill,
          pinCode,
          schoolName,
          age,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error in create-payment function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create payment request",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
};

serve(handler);
