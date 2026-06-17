const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'BodyTrack <onboarding@resend.dev>';

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY non configurée, email non envoyé:', subject);
    return;
  }
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.error('Erreur envoi email Resend:', data);
    } else {
      console.log(`Email envoyé à ${to}: "${subject}"`);
    }
    return data;
  } catch (err) {
    console.error('Erreur réseau envoi email:', err.message);
  }
}

function welcomeEmail(prenom) {
  return {
    subject: 'Bienvenue sur BodyTrack 🎯',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #3B5BFC;">Bienvenue ${prenom} 👋</h1>
        <p>Ton compte BodyTrack a été créé avec succès.</p>
        <p>À partir de maintenant, plus besoin de calculer tes calories à la main :
        prends simplement une photo de tes repas, de tes séances de sport ou de ta balance connectée,
        et l'IA s'occupe du reste.</p>
        <p style="margin-top: 24px;">
          <a href="https://bodytrack.duckdns.org" style="background: #3B5BFC; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Ouvrir BodyTrack
          </a>
        </p>
        <p style="color: #888; font-size: 13px; margin-top: 32px;">Tu reçois cet email car tu viens de créer un compte sur BodyTrack.</p>
      </div>
    `,
  };
}

function reminderEmail(prenom, moment) {
  const labels = {
    matin: { emoji: '🌅', text: 'ton petit-déjeuner' },
    midi: { emoji: '☀️', text: 'ton repas du midi' },
    soir: { emoji: '🌙', text: 'ton repas du soir' },
  };
  const l = labels[moment] || labels.soir;
  return {
    subject: `${l.emoji} N'oublie pas de logger ${l.text}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #3B5BFC;">${l.emoji} Petit rappel, ${prenom}</h2>
        <p>Tu n'as pas encore loggé ${l.text} aujourd'hui. Une photo suffit pour garder ton suivi à jour !</p>
        <p style="margin-top: 20px;">
          <a href="https://bodytrack.duckdns.org" style="background: #3B5BFC; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Logger maintenant
          </a>
        </p>
      </div>
    `,
  };
}

module.exports = { sendEmail, welcomeEmail, reminderEmail };
