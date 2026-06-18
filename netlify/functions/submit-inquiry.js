import Busboy from 'busboy';
import { Resend } from 'resend';

const RECIPIENT = 'office@tulipprecast.com';

const PRODUCT_LABELS = {
  'indiana-limestone': 'Indiana Limestone Products',
  'precast':           'Concrete Precast',
  'landscaping':       'Landscaping Services',
  'sculptures':        'Sculptures / 3D Wall Art',
  'fireplace':         'Fireplace Design',
  'sculpturing':       'Sculpturing',
  'design-services':   'Design Services',
  'pool-spa':          'Pool & Spa',
  'gfrc':              'GFRC Panels',
  'multiple':          'Multiple / Not Sure',
};

const REFERRAL_LABELS = {
  'google':    'Google Search',
  'referral':  'Referral / Word of Mouth',
  'social':    'Social Media',
  'drive-by':  'Drive By',
  'other':     'Other',
};

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(f) {
  const name     = `${f['first-name'] || ''} ${f['last-name'] || ''}`.trim() || '—';
  const email    = f['email']   || '—';
  const phone    = f['phone']   || '—';
  const company  = f['company'] || '—';
  const product  = PRODUCT_LABELS[f['product-interest']] || f['product-interest'] || '—';
  const projType = f['project-type']
    ? f['project-type'].charAt(0).toUpperCase() + f['project-type'].slice(1)
    : '—';
  const referral  = REFERRAL_LABELS[f['referral']] || f['referral'] || '—';
  const phoneHref = phone.replace(/\D/g, '');
  const desc      = esc(f['description'] || '—').replace(/\n/g, '<br>');
  const firstName = esc(f['first-name'] || 'Customer');

  const now = new Date().toLocaleString('en-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>New Quote Request — Tulip Precast</title>
</head>
<body style="margin:0;padding:0;background:#F4EFE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4EFE8;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr>
    <td style="background:#3D3530;padding:36px 40px 28px;text-align:center;">
      <p style="margin:0 0 8px;font-size:9px;font-weight:400;letter-spacing:4px;text-transform:uppercase;color:#C8A882;">TULIP LIMESTONE · PRECAST</p>
      <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;color:#FDFAF6;letter-spacing:-0.3px;">New Quote Request</h1>
      <div style="width:36px;height:1px;background:#C8A882;margin:14px auto 0;"></div>
    </td>
  </tr>

  <!-- Timestamp bar -->
  <tr>
    <td style="background:#C8A882;padding:9px 40px;">
      <p style="margin:0;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#3D3530;">${esc(now)}</p>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="background:#FFFFFF;padding:36px 40px;">

      <!-- Contact -->
      <p style="margin:0 0 12px;font-size:8px;font-weight:400;letter-spacing:3px;text-transform:uppercase;color:#C8A882;border-bottom:1px solid #F0E8D8;padding-bottom:8px;">Contact Information</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        <tr>
          <td width="36%" style="padding:8px 0;border-bottom:1px solid #F9F5EF;"><span style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#9C8880;">Name</span></td>
          <td style="padding:8px 0;border-bottom:1px solid #F9F5EF;"><span style="font-size:13px;color:#3D3530;">${esc(name)}</span></td>
        </tr>
        <tr>
          <td width="36%" style="padding:8px 0;border-bottom:1px solid #F9F5EF;"><span style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#9C8880;">Email</span></td>
          <td style="padding:8px 0;border-bottom:1px solid #F9F5EF;"><span style="font-size:13px;color:#C8A882;">${esc(email)}</span></td>
        </tr>
        <tr>
          <td width="36%" style="padding:8px 0;border-bottom:1px solid #F9F5EF;"><span style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#9C8880;">Phone</span></td>
          <td style="padding:8px 0;border-bottom:1px solid #F9F5EF;"><span style="font-size:13px;color:#3D3530;">${esc(phone)}</span></td>
        </tr>
        <tr>
          <td width="36%" style="padding:8px 0;"><span style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#9C8880;">Company</span></td>
          <td style="padding:8px 0;"><span style="font-size:13px;color:#3D3530;">${esc(company)}</span></td>
        </tr>
      </table>

      <!-- Project -->
      <p style="margin:0 0 12px;font-size:8px;font-weight:400;letter-spacing:3px;text-transform:uppercase;color:#C8A882;border-bottom:1px solid #F0E8D8;padding-bottom:8px;">Project Details</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        <tr>
          <td width="36%" style="padding:8px 0;border-bottom:1px solid #F9F5EF;"><span style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#9C8880;">Product Interest</span></td>
          <td style="padding:8px 0;border-bottom:1px solid #F9F5EF;"><span style="font-size:13px;color:#3D3530;">${esc(product)}</span></td>
        </tr>
        <tr>
          <td width="36%" style="padding:8px 0;border-bottom:1px solid #F9F5EF;"><span style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#9C8880;">Project Type</span></td>
          <td style="padding:8px 0;border-bottom:1px solid #F9F5EF;"><span style="font-size:13px;color:#3D3530;">${esc(projType)}</span></td>
        </tr>
        <tr>
          <td width="36%" style="padding:8px 0;"><span style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#9C8880;">Heard Via</span></td>
          <td style="padding:8px 0;"><span style="font-size:13px;color:#3D3530;">${esc(referral)}</span></td>
        </tr>
      </table>

      <!-- Description -->
      <p style="margin:0 0 12px;font-size:8px;font-weight:400;letter-spacing:3px;text-transform:uppercase;color:#C8A882;border-bottom:1px solid #F0E8D8;padding-bottom:8px;">Project Description</p>
      <div style="background:#F9F5EF;border-left:3px solid #C8A882;padding:16px 20px;margin-bottom:32px;">
        <p style="margin:0;font-size:13px;font-weight:300;color:#3D3530;line-height:1.8;">${desc}</p>
      </div>

      <!-- Reply CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding-top:24px;border-top:1px solid #F0E8D8;">
            <p style="margin:0;font-size:11px;color:#9C8880;">Reply directly to this email to contact ${firstName}</p>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#3D3530;padding:24px 40px;text-align:center;">
      <p style="margin:0 0 4px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#9C8880;">Tulip Limestone · Precast — Ontario Made</p>
      <p style="margin:0;font-size:10px;font-weight:300;color:#706358;">98 Rutherford Rd Unit 2C, Brampton, ON &nbsp;·&nbsp; office@tulipprecast.com</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function parseForm(event) {
  return new Promise((resolve, reject) => {
    const fields = {};
    const files  = [];

    const bb = Busboy({
      headers: {
        'content-type':
          event.headers['content-type'] ||
          event.headers['Content-Type'] ||
          '',
      },
    });

    bb.on('field', (name, value) => { fields[name] = value; });

    bb.on('file', (name, stream, info) => {
      const chunks = [];
      stream.on('data', (d) => chunks.push(d));
      stream.on('end', () => {
        if (info.filename && chunks.length > 0) {
          files.push({
            filename: info.filename,
            content:  Buffer.concat(chunks),
          });
        }
      });
    });

    bb.on('finish', () => resolve({ fields, files }));
    bb.on('error',  reject);

    const body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body || '');

    bb.write(body);
    bb.end();
  });
}

export const handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: 'Method Not Allowed' };
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY environment variable');
    return {
      statusCode: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Server configuration error' }),
    };
  }

  try {
    const { fields, files } = await parseForm(event);

    const resend   = new Resend(process.env.RESEND_API_KEY);
    const fullName = `${fields['first-name'] || ''} ${fields['last-name'] || ''}`.trim() || 'Website Visitor';

    const { error } = await resend.emails.send({
      from:        process.env.EMAIL_FROM || 'Tulip Precast Website <noreply@tulipprecast.com>',
      to:          [RECIPIENT],
      reply_to:    fields['email'] || undefined,
      subject:     `New Quote Request — ${fullName}`,
      html:        buildHtml(fields),
      attachments: files.map((f) => ({
        filename: f.filename,
        content:  f.content,
      })),
    });

    if (error) {
      console.error('Resend error:', JSON.stringify(error));
      return {
        statusCode: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Email delivery failed' }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Server error' }),
    };
  }
};
