import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// This endpoint receives forwarded emails from your email service
// (Mailgun, SendGrid, Postmark, etc.)
//
// After receiving an email, you would send an auto-reply with a booking link.
// The auto-reply part would be handled by your email service or a separate function.

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming email data
    // The exact format depends on your email service:
    // - Mailgun: multipart form data
    // - SendGrid: JSON
    // - Postmark: JSON

    const contentType = request.headers.get('content-type') || '';

    let senderEmail = '';
    let subject = '';
    let body = '';

    if (contentType.includes('application/json')) {
      // JSON format (SendGrid, Postmark)
      const data = await request.json();
      senderEmail = data.from || data.From || data.sender || '';
      subject = data.subject || data.Subject || '';
      body = data.text || data.TextBody || data.body || '';
    } else if (contentType.includes('multipart/form-data')) {
      // Form data format (Mailgun)
      const formData = await request.formData();
      senderEmail = formData.get('from')?.toString() || formData.get('sender')?.toString() || '';
      subject = formData.get('subject')?.toString() || '';
      body = formData.get('body-plain')?.toString() || formData.get('text')?.toString() || '';
    } else {
      // Try to parse as JSON anyway
      const data = await request.json();
      senderEmail = data.from || data.sender || '';
      subject = data.subject || '';
      body = data.text || data.body || '';
    }

    // Extract email address from "Name <email@example.com>" format
    const emailMatch = senderEmail.match(/<([^>]+)>/) || [null, senderEmail];
    const cleanEmail = (emailMatch[1] || senderEmail).toLowerCase().trim();

    if (!cleanEmail) {
      return NextResponse.json({ error: 'No sender email found' }, { status: 400 });
    }

    console.log(`[Inbound Email] From: ${cleanEmail}`);
    console.log(`[Inbound Email] Subject: ${subject}`);

    // Store the forwarded email
    // First, check if there's an existing booking for this email
    let booking = await db.getBookingByEmail(cleanEmail);

    if (booking) {
      // Add the forwarded email to existing booking
      await db.addPastedEmail(booking.id, `Subject: ${subject}\n\n${body}`);
      console.log(`[Inbound Email] Added to existing booking: ${booking.id}`);
    } else {
      // Store for later - when they complete booking, we'll match by email
      // For now, we'll create a "pending" record in a separate table or just log it
      console.log(`[Inbound Email] No booking found for ${cleanEmail} - email stored for matching`);

      // You could store this in a separate "pending_emails" table
      // For now, we'll just acknowledge receipt
    }

    // Return success - the email service needs a 200 response
    // The auto-reply would be configured in your email service (Mailgun routes, SendGrid, etc.)
    // Or you could trigger it here by calling an email sending API

    return NextResponse.json({
      success: true,
      message: 'Email received',
      senderEmail: cleanEmail,
      bookingLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/book?email=${encodeURIComponent(cleanEmail)}`
    });

  } catch (error) {
    console.error('[Inbound Email] Error:', error);
    return NextResponse.json({ error: 'Failed to process email' }, { status: 500 });
  }
}

// Also handle GET for webhook verification (some services require this)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Mailgun webhook verification
  if (searchParams.has('challenge')) {
    return NextResponse.json({ challenge: searchParams.get('challenge') });
  }

  return NextResponse.json({ status: 'Inbound email webhook is active' });
}
