const sgMail = require('@sendgrid/mail');
const config = require('./config');

class Mailer {

  api_key;
  district_recipient_map;

  constructor(district_recipient_map) {
    this.api_key = config.SENDGRID_API_KEY;
    this.district_recipient_map = district_recipient_map;
    sgMail.setApiKey(this.api_key);
  }

  async alert(info) {
    try {
      let msg = '';
      let i = 0;
      const district = info.district;
      const centers = info.centers;

      for (const center of centers) {
        const head = `${++i}. ${center.name}, ${center.block} ${center.pincode}.`;
        msg += head + '\n';
        for (const session of center.sessions) {
          msg += '\t' + `Date: ${session.date}. Availability: ${session.available}. Vaccine: ${session.vaccine || 'No info'}. \n`;
        }
      }
      const subj = `Found vaccination slots for ${district}!`;
      console.log(msg);
      const recipients = this.district_recipient_map[district];
      await this.sendMail(recipients, subj, msg);
      console.log(`Successfully sent alert for ${district} at ${new Date().toTimeString()}.`);
    } catch (e) {
      console.error(`Failed to send mail for ${district} at ${new Date().toTimeString()}`);
      return;
    }

  }

  async sendMail(to, subj, msg) {

    const mail = {
      to: to,
      from: config.SENDER_EMAIL,
      subject: subj,
      text: msg
    }
    return new Promise((res, rej) => {
      sgMail
        .send(mail)
        .then((response) => {
          console.log(response[0].statusCode)
          return res();
        })
        .catch((error) => {
          console.error(error);
          return rej(error);
        })
    })
  }
}

module.exports = Mailer;