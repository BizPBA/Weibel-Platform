import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface InvitationEmailPayload {
  email: string;
  inviterName: string;
  companyName: string;
  companyLogo?: string;
  role: string;
  invitationId: string;
  expiresAt: string;
  acceptUrl: string;
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

if (!RESEND_API_KEY) {
  console.error('RESEND_API_KEY is not set');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function generateEmailHTML(payload: InvitationEmailPayload): string {
  const { email, inviterName, companyName, companyLogo, role, expiresAt, acceptUrl } = payload;

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    customer_responsible: 'Kunde ansvarlig',
    location_responsible: 'Lokation ansvarlig',
    employee: 'Medarbejder',
  };

  const roleLabel = roleLabels[role] || role;
  const expiryDate = new Date(expiresAt).toLocaleDateString('da-DK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation til ${companyName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background-color: white;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .logo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .company-name {
      color: white;
      font-size: 28px;
      font-weight: 700;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 20px;
      line-height: 1.8;
    }
    .details-box {
      background-color: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #6b7280;
    }
    .detail-value {
      color: #1f2937;
      font-weight: 500;
    }
    .cta-container {
      text-align: center;
      margin: 30px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
    }
    .expiry-notice {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .expiry-notice p {
      color: #92400e;
      font-size: 14px;
      margin: 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 2px solid #e5e7eb;
    }
    .footer-text {
      font-size: 14px;
      color: #6b7280;
      margin: 5px 0;
    }
    .help-text {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${companyLogo ? `
        <div class="logo">
          <img src="${companyLogo}" alt="${companyName}" />
        </div>
      ` : `
        <h1 class="company-name">${companyName}</h1>
      `}
    </div>

    <div class="content">
      <h2 class="greeting">Du er inviteret! 🎉</h2>

      <p class="message">
        <strong>${inviterName}</strong> har inviteret dig til at blive en del af <strong>${companyName}</strong> på InfoBridge.
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
          <span class="detail-label">Inviteret til:</span>
          <span class="detail-value">${email}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Inviteret af:</span>
          <span class="detail-value">${inviterName}</span>
        </div>
      </div>

      <div class="cta-container">
        <a href="${acceptUrl}" class="cta-button">Accepter invitation</a>
      </div>

      <div class="expiry-notice">
        <p><strong>⏰ Vigtigt:</strong> Denne invitation udløber den ${expiryDate}. Accepter invitationen inden da for at få adgang.</p>
      </div>

      <p class="message" style="margin-top: 30px;">
        Hvis du har problemer med knappen ovenfor, kan du kopiere og indsætte følgende link i din browser:
      </p>
      <p style="word-break: break-all; color: #2563eb; font-size: 14px;">
        ${acceptUrl}
      </p>
    </div>

    <div class="footer">
      <p class="footer-text"><strong>InfoBridge</strong></p>
      <p class="footer-text">Komplet løsning til administration af rengøring og vedligeholdelse</p>
      <p class="help-text">
        Hvis du ikke forventede denne invitation, kan du ignorere denne email.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateEmailText(payload: InvitationEmailPayload): string {
  const { email, inviterName, companyName, role, expiresAt, acceptUrl } = payload;

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    customer_responsible: 'Kunde ansvarlig',
    location_responsible: 'Lokation ansvarlig',
    employee: 'Medarbejder',
  };

  const roleLabel = roleLabels[role] || role;
  const expiryDate = new Date(expiresAt).toLocaleDateString('da-DK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
Du er inviteret til ${companyName}!

${inviterName} har inviteret dig til at blive en del af ${companyName} på InfoBridge.

DETALJER:
- Virksomhed: ${companyName}
- Din rolle: ${roleLabel}
- Inviteret til: ${email}
- Inviteret af: ${inviterName}

ACCEPTER INVITATION:
${acceptUrl}

VIGTIGT: Denne invitation udløber den ${expiryDate}. Accepter invitationen inden da for at få adgang.

---
InfoBridge
Komplet løsning til administration af rengøring og vedligeholdelse

Hvis du ikke forventede denne invitation, kan du ignorere denne email.
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: InvitationEmailPayload = await req.json();

    if (!payload.email || !payload.inviterName || !payload.companyName || !payload.acceptUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const emailHtml = generateEmailHTML(payload);
    const emailText = generateEmailText(payload);

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'InfoBridge <noreply@infobridge.dk>',
        to: [payload.email],
        subject: `Invitation til ${payload.companyName}`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      console.error('Resend API error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const result = await resendResponse.json();

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});