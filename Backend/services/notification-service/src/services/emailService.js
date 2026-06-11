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

module.exports = {
  sendWelcomeEmail
};

