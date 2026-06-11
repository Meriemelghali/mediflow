const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mediflowesprit@gmail.com',
    pass: 'lqni vkek yqcw yiea', // Mot de passe d'application Google
  },
});

const sendWelcomeEmail = async (email, firstName) => {
  try {
    // Lire le contenu du fichier HTML
    const templatePath = path.join(__dirname, '../templates/welcomeTemplate.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    // Remplacer les variables dans le template
    htmlContent = htmlContent.replace(/{{firstName}}/g, firstName);

    const info = await transporter.sendMail({
      from: '"MediFlow" <mediflowesprit@gmail.com>',
      to: email,
      subject: "Bienvenue sur MediFlow !",
      text: `Bonjour ${firstName},\n\nBienvenue sur MediFlow ! Votre compte a été créé avec succès.\n\nCordialement,\nL'équipe MediFlow`,
      html: htmlContent,
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const sendResetPasswordEmail = async (email, firstName, resetUrl) => {
  try {
    const info = await transporter.sendMail({
      from: '"MediFlow" <mediflowesprit@gmail.com>',
      to: email,
      subject: 'Reinitialisation de votre mot de passe MediFlow',
      text: `Bonjour ${firstName},\n\nCliquez sur ce lien pour reinitialiser votre mot de passe : ${resetUrl}\n\nCe lien expire dans 1 heure.\n\nSi vous n'avez pas demande cette action, ignorez cet email.\n\nL'equipe MediFlow`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2>Reinitialisation du mot de passe</h2>
          <p>Bonjour ${firstName},</p>
          <p>Vous avez demande la reinitialisation de votre mot de passe MediFlow.</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 18px; background: #00c8e8; color: #03070f; text-decoration: none; border-radius: 8px; font-weight: 700;">
              Choisir un nouveau mot de passe
            </a>
          </p>
          <p>Ce lien expire dans 1 heure.</p>
          <p>Si vous n'avez pas demande cette action, ignorez cet email.</p>
        </div>
      `
    });

    console.log('Reset password email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending reset password email:', error);
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendResetPasswordEmail
};

