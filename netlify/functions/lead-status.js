const MEASUREMENT_ID = 'G-926GRE36JL';

const EVENT_NAMES = {
  qualified: 'qualified_lead',
  converted: 'converted_lead',
};

const LABELS = {
  qualified: 'Qualified',
  converted: 'Converted',
};

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPage({ heading, body, isError }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(heading)} — Tulip Precast</title>
</head>
<body style="margin:0;padding:0;background:#F4EFE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="max-width:420px;margin:80px auto;padding:40px;background:#FFFFFF;border:1px solid #F0E8D8;text-align:center;">
  <div style="font-size:32px;color:${isError ? '#B5533C' : '#C8A882'};margin-bottom:16px;">${isError ? '&times;' : '&#10003;'}</div>
  <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:400;color:#3D3530;">${esc(heading)}</h1>
  <p style="margin:0;font-size:14px;color:#706358;line-height:1.6;">${esc(body)}</p>
</div>
</body>
</html>`;
}

export const handler = async (event) => {
  const params   = event.queryStringParameters || {};
  const status   = params.status;
  const clientId = params.cid;
  // Netlify (AWS Lambda API Gateway proxy integration) already URL-decodes
  // queryStringParameters, so params.lead arrives decoded — no further
  // decodeURIComponent here, which would throw on a name containing "%".
  const leadName = params.lead || 'This lead';

  const eventName = EVENT_NAMES[status];

  if (!eventName || !clientId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: renderPage({
        heading: 'Invalid link',
        body: 'This lead-tracking link is missing required information.',
        isError: true,
      }),
    };
  }

  if (!process.env.GA4_API_SECRET) {
    console.error('Missing GA4_API_SECRET environment variable');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: renderPage({
        heading: 'Server configuration error',
        body: 'GA4 tracking is not configured. Contact your developer.',
        isError: true,
      }),
    };
  }

  try {
    // The Measurement Protocol collect endpoint always returns 204 on a
    // well-formed request regardless of whether the event validates, so
    // this status check only catches network/transport failures.
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${process.env.GA4_API_SECRET}`,
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId,
          events: [
            {
              name: eventName,
              params: { lead_name: leadName, source: 'email_action' },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      console.error('GA4 Measurement Protocol request failed:', response.status);
    }
  } catch (err) {
    console.error('GA4 Measurement Protocol request error:', err);
  }

  const label = LABELS[status];

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: renderPage({
      heading: `Marked as ${label}`,
      body: `${leadName} has been tagged as ${label.toLowerCase()} in GA4. You can close this tab.`,
      isError: false,
    }),
  };
};
