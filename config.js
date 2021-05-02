const config = {
  AVAILABILITY_THRESHOLD: 5,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  POLL_FREQUENCY: 20 * 1000, // 20 seconds
  SENDER_EMAIL: process.env.SENDER_EMAIL
}
module.exports = config;