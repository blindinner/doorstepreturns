// SMS stub - replace with Twilio implementation later
// Logs to console for now

export type MessageType = 'confirmation' | 'fifteen_min' | 'complete';

export async function sendSMS(
  phone: string,
  messageType: MessageType,
  data: { customerName: string; trackingNumbers?: string[] }
): Promise<void> {
  const messages: Record<MessageType, string> = {
    confirmation: `Hi ${data.customerName}! Your Doorstep Returns pickup is confirmed. Please forward your Amazon return emails to returns@doorstepreturns.com`,
    fifteen_min: `Hi ${data.customerName}! Your Doorstep Returns driver will arrive in about 15 minutes.`,
    complete: `Hi ${data.customerName}! Your returns have been dropped off. Tracking: ${data.trackingNumbers?.join(', ') || 'N/A'}`,
  };

  console.log(`[SMS STUB] To: ${phone}`);
  console.log(`[SMS STUB] Type: ${messageType}`);
  console.log(`[SMS STUB] Message: ${messages[messageType]}`);

  // TODO: Replace with actual Twilio implementation
  // await twilioClient.messages.create({
  //   body: messages[messageType],
  //   to: phone,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  // });
}
