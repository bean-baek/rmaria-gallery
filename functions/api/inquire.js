const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;
const MAX_EMAIL = 200;
const MAX_MESSAGE = 2000;

function bad(reason, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: reason }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function ok() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return bad('Invalid JSON body.');
  }

  // Honeypot — if filled, pretend success but do nothing
  if (data.company && String(data.company).trim() !== '') {
    return ok();
  }

  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  const kind = String(data.kind || '').trim();
  const workSlug = String(data.workSlug || '').trim();
  const message = String(data.message || '').trim();

  if (!name || name.length > MAX_NAME) return bad('Invalid name.');
  if (!email || email.length > MAX_EMAIL || !EMAIL_RE.test(email)) return bad('Invalid email.');
  if (!['print', 'commission', 'other'].includes(kind)) return bad('Invalid kind.');
  if (!message || message.length > MAX_MESSAGE) return bad('Invalid message.');

  const destination = env.INQUIRY_EMAIL;
  if (!destination) {
    return bad('Server not configured (missing INQUIRY_EMAIL).', 500);
  }

  const fromDomain = (env.MAIL_FROM_DOMAIN || 'rmaria.pages.dev').replace(/^https?:\/\//, '');
  const fromEmail = `noreply@${fromDomain}`;

  const subjectKindLabel = kind.charAt(0).toUpperCase() + kind.slice(1);
  const subject = workSlug
    ? `[r.maria inquiry] ${subjectKindLabel} — ${workSlug}`
    : `[r.maria inquiry] ${subjectKindLabel}`;

  const body =
    `New inquiry from r.maria site\n` +
    `\n` +
    `Name:    ${name}\n` +
    `Email:   ${email}\n` +
    `Kind:    ${kind}\n` +
    `Work:    ${workSlug || '(general)'}\n` +
    `\n` +
    `Message:\n` +
    `${message}\n` +
    `\n` +
    `— Sent from ${fromDomain}\n`;

  try {
    const mcRes = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: destination }] }],
        from: { email: fromEmail, name: 'r.maria inquiry' },
        reply_to: { email },
        subject,
        content: [{ type: 'text/plain', value: body }],
      }),
    });

    if (!mcRes.ok) {
      const text = await mcRes.text().catch(() => '');
      return bad(`Email delivery failed (${mcRes.status}). ${text.slice(0, 200)}`, 502);
    }
  } catch (err) {
    return bad('Email delivery failed (network).', 502);
  }

  return ok();
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
