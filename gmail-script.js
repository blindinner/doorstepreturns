/**
 * Doorstep Returns - Gmail Auto-Reply Script
 *
 * SETUP:
 * 1. Go to script.google.com
 * 2. Create new project
 * 3. Paste this code
 * 4. Update CONFIG below with your values
 * 5. Run setup() once to create the label
 * 6. Run createTrigger() once to set up automatic checking
 *
 * The script checks for new emails every 5 minutes and sends auto-replies.
 */

const CONFIG = {
  // Your booking page URL
  bookingUrl: 'https://your-domain.vercel.app/book',

  // Label to mark processed emails (will be created automatically)
  processedLabel: 'DoorstepReturns/Processed',

  // Subject line to look for (emails forwarded to you)
  // Leave empty to process all emails, or set to filter
  subjectFilter: 'Fwd:',

  // Your webhook URL (optional - to notify your app)
  webhookUrl: '', // e.g., 'https://your-domain.vercel.app/api/inbound-email'
};

/**
 * Run this once to set up the label
 */
function setup() {
  getOrCreateLabel(CONFIG.processedLabel);
  Logger.log('Setup complete! Label created: ' + CONFIG.processedLabel);
  Logger.log('Now run createTrigger() to start automatic processing.');
}

/**
 * Run this once to create the automatic trigger
 */
function createTrigger() {
  // Remove existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processNewEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger - runs every 5 minutes
  ScriptApp.newTrigger('processNewEmails')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('Trigger created! Script will run every 5 minutes.');
}

/**
 * Main function - processes new emails and sends auto-replies
 */
function processNewEmails() {
  const label = getOrCreateLabel(CONFIG.processedLabel);

  // Search for unread emails not yet processed
  // Modify this query as needed
  let query = 'is:unread -label:' + CONFIG.processedLabel.replace('/', '-');

  if (CONFIG.subjectFilter) {
    query += ' subject:(' + CONFIG.subjectFilter + ')';
  }

  const threads = GmailApp.search(query, 0, 10);

  threads.forEach(thread => {
    const messages = thread.getMessages();
    const firstMessage = messages[0];

    // Get sender info
    const from = firstMessage.getFrom();
    const subject = firstMessage.getSubject();
    const body = firstMessage.getPlainBody();

    // Extract email address from "Name <email>" format
    const emailMatch = from.match(/<([^>]+)>/) || [null, from];
    const senderEmail = (emailMatch[1] || from).trim().toLowerCase();

    Logger.log('Processing email from: ' + senderEmail);

    // Check if this looks like an Amazon return email
    const isAmazonReturn = body.toLowerCase().includes('amazon') ||
                          body.toLowerCase().includes('return') ||
                          subject.toLowerCase().includes('amazon') ||
                          subject.toLowerCase().includes('return');

    if (isAmazonReturn) {
      // Send auto-reply with booking link
      sendAutoReply(senderEmail, subject);

      // Notify webhook (optional)
      if (CONFIG.webhookUrl) {
        notifyWebhook(senderEmail, subject, body);
      }
    }

    // Mark as processed
    thread.addLabel(label);
    thread.markAsRead();
  });
}

/**
 * Sends the auto-reply email with booking link
 */
function sendAutoReply(toEmail, originalSubject) {
  const bookingLink = CONFIG.bookingUrl + '?email=' + encodeURIComponent(toEmail);

  const subject = 'Re: ' + originalSubject + ' - Book Your Pickup';

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; padding: 20px;">
      <h2 style="color: #0f5c48; margin-bottom: 16px;">Got your return email!</h2>

      <p style="color: #48575f; font-size: 16px; line-height: 1.6;">
        We received your Amazon return email. Click below to schedule your pickup:
      </p>

      <a href="${bookingLink}"
         style="display: inline-block; background: #0f5c48; color: white; padding: 14px 28px;
                text-decoration: none; border-radius: 4px; font-weight: 600; margin: 20px 0;">
        Book Your Pickup →
      </a>

      <p style="color: #8a969c; font-size: 14px; margin-top: 24px;">
        We'll come to your door, pick up your return, and drop it off at the carrier the same day.
        No box needed, no printing required.
      </p>

      <hr style="border: none; border-top: 1px solid #d2d8d4; margin: 24px 0;">

      <p style="color: #8a969c; font-size: 12px;">
        Doorstep Returns<br>
        This is an automated reply.
      </p>
    </div>
  `;

  const plainBody = `
Got your return email!

We received your Amazon return email. Click the link below to schedule your pickup:

${bookingLink}

We'll come to your door, pick up your return, and drop it off at the carrier the same day.
No box needed, no printing required.

- Doorstep Returns
  `;

  GmailApp.sendEmail(toEmail, subject, plainBody, {
    htmlBody: htmlBody,
    name: 'Doorstep Returns'
  });

  Logger.log('Auto-reply sent to: ' + toEmail);
}

/**
 * Notifies your webhook about the received email
 */
function notifyWebhook(senderEmail, subject, body) {
  try {
    const payload = {
      from: senderEmail,
      subject: subject,
      text: body.substring(0, 5000), // Limit body size
      timestamp: new Date().toISOString()
    };

    UrlFetchApp.fetch(CONFIG.webhookUrl, {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    Logger.log('Webhook notified');
  } catch (e) {
    Logger.log('Webhook error: ' + e.message);
  }
}

/**
 * Gets or creates a Gmail label
 */
function getOrCreateLabel(labelName) {
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    label = GmailApp.createLabel(labelName);
  }
  return label;
}

/**
 * Test function - run manually to test the auto-reply
 */
function testAutoReply() {
  // Replace with your email to test
  sendAutoReply('your-test-email@gmail.com', 'Test Amazon Return');
  Logger.log('Test email sent!');
}
