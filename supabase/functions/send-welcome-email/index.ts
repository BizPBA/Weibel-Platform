import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.51.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WelcomeEmailPayload {
  email: string;
  fullName: string;
  companyName: string;
  companyLogo?: string;
  role: string;
  adminName: string;
  adminEmail: string;
}

function generateEmailHTML(payload: WelcomeEmailPayload): string {
  const { email, fullName, companyName, companyLogo, role, adminName, adminEmail } = payload;

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    customer_responsible: 'Kunde ansvarlig',
    location_responsible: 'Lokation ansvarlig',
    employee: 'Medarbejder',
  };

  const roleLabel = roleLabels[role] || role;

  return `
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Velkommen til ${companyName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo-container {
      background-color: white;
      border-radius: 12px;
      padding: 20px;
      display: inline-block;
      margin-bottom: 20px;
    }
    .logo {
      max-width: 200px;
      max-height: 80px;
      height: auto;
    }
    .company-name {
      color: white;
      font-size: 28px;
      font-weight: bold;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #475569;
      margin-bottom: 30px;
    }
    .details-box {
      background-color: #f1f5f9;
      border-radius: 8px;
      padding: 24px;
      margin: 30px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #64748b;
    }
    .detail-value {
      color: #0f172a;
      font-weight: 500;
    }
    .info-notice {
      background-color: #dbeafe;
      border-left: 4px solid #2563eb;
      padding: 16px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .info-notice p {
      margin: 0;
      color: #1e40af;
      font-size: 14px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      color: #64748b;
      font-size: 14px;
      margin: 5px 0;
    }
    .contact-box {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .contact-link {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .greeting {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${companyLogo ? `
        <div class="logo-container">
          <img src="${companyLogo}" alt="${companyName}" class="logo">
        </div>
      ` : `
        <h1 class="company-name">${companyName}</h1>
      `}
    </div>

    <div class="content">
      <h2 class="greeting">Velkommen til teamet, ${fullName}! 👋</h2>

      <p class="message">
        <strong>${adminName}</strong> har oprettet en konto til dig på <strong>${companyName}</strong>'s InfoBridge.
      </p>

      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">Virksomhed:</span>
          <span class="detail-value">${companyName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Din rolle:</span>
          <span class="detail-value">${roleLabel}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${email}</span>
        </div>
      </div>

      <div class="info-notice">
        <p><strong>ℹ️ Om login:</strong> Login via Microsoft vil snart være tilgængeligt. Du vil modtage yderligere instruktioner, når login-systemet er konfigureret.</p>
      </div>

      <p class="message" style="margin-top: 30px;">
        Når login via Microsoft er konfigureret, vil du kunne logge ind med din Microsoft-konto (<strong>${email}</strong>).
      </p>

      <div class="contact-box">
        <p class="message">
          Har du spørgsmål? Kontakt <strong>${adminName}</strong>
        </p>
        <a href="mailto:${adminEmail}" class="contact-link">${adminEmail}</a>
      </div>
    </div>

    <div class="footer">
      <p class="footer-text"><strong>InfoBridge</strong></p>
      <p class="footer-text">Komplet løsning til administration af rengøring og vedligeholdelse</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateEmailText(payload: WelcomeEmailPayload): string {
  const { email, fullName, companyName, role, adminName, adminEmail } = payload;

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    customer_responsible: 'Kunde ansvarlig',
    location_responsible: 'Lokation ansvarlig',
    employee: 'Medarbejder',
  };

  const roleLabel = roleLabels[role] || role;

  return `
Velkommen til ${companyName}, ${fullName}!

${adminName} har oprettet en konto til dig på ${companyName}'s InfoBridge.

DINE KONTOOPLYSNINGER:
- Virksomhed: ${companyName}
- Din rolle: ${roleLabel}
- Email: ${email}

OM LOGIN:
Login via Microsoft vil snart være tilgængeligt. Du vil modtage yderligere instruktioner, når login-systemet er konfigureret.

Når login via Microsoft er konfigureret, vil du kunne logge ind med din Microsoft-konto (${email}).

HAR DU SPØRGSMÅL?
Kontakt ${adminName}: ${adminEmail}

---
InfoBridge
Komplet løsning til administration af rengøring og vedligeholdelse
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const payload: WelcomeEmailPayload = await req.json();
    const { email, fullName, companyName, companyLogo, role, adminName, adminEmail } = payload;

    if (!email || !fullName || !companyName || !role || !adminName || !adminEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailHtml = generateEmailHTML(payload);
    const emailText = generateEmailText(payload);

    console.log("Welcome email would be sent to:", email);
    console.log("Email HTML length:", emailHtml.length);
    console.log("Email text length:", emailText.length);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Welcome email prepared (email service integration pending)",
        note: "Email will be sent once email service is configured"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
