// Payment stub - replace with Stripe implementation later

export const PRICE_PER_RETURN = 5.99; // dollars per QR code
export const BASE_PRICE = 5.99; // minimum charge for one return

export async function createPaymentIntent(
  bookingId: string,
  returnCount: number = 1
): Promise<{ clientSecret: string; amount: number }> {
  const amount = Math.max(BASE_PRICE, PRICE_PER_RETURN * returnCount);

  console.log(`[PAYMENT STUB] Creating payment intent for booking ${bookingId}`);
  console.log(`[PAYMENT STUB] Amount: $${amount.toFixed(2)} for ${returnCount} return(s)`);

  // TODO: Replace with actual Stripe implementation
  // const paymentIntent = await stripe.paymentIntents.create({
  //   amount: Math.round(amount * 100), // cents
  //   currency: 'usd',
  //   metadata: { bookingId },
  // });

  return {
    clientSecret: `stub_secret_${bookingId}`,
    amount,
  };
}

export async function capturePayment(paymentRef: string, finalAmount: number): Promise<boolean> {
  console.log(`[PAYMENT STUB] Capturing payment ${paymentRef} for $${finalAmount.toFixed(2)}`);

  // TODO: Replace with actual Stripe capture
  return true;
}
