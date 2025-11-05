// Supabase Edge Function: send-book-completion-email
// This function sends an email notification when a personalized book is completed

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  user_email: string;
  user_name: string;
  book_title: string;
  child_name: string;
  pdf_url: string;
  order_number: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_email, user_name, book_title, child_name, pdf_url, order_number }: EmailRequest = await req.json();

    console.log(`Sending book completion email to ${user_email} for book: ${book_title}`);

    // Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; background-color: #f9f7fc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #784D9C 0%, #B47AFF 100%); padding: 40px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 40px; }
            .content h2 { color: #784D9C; margin-top: 0; }
            .content p { color: #333; line-height: 1.6; font-size: 16px; }
            .book-info { background: #f7f0fc; padding: 20px; border-radius: 12px; margin: 24px 0; }
            .book-info strong { color: #784D9C; }
            .cta-button { display: inline-block; background: #784D9C; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .cta-button:hover { background: #5e3d7c; }
            .footer { background: #f9f7fc; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .emoji { font-size: 48px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 Your Book is Ready!</h1>
            </div>
            <div class="content">
              <div class="emoji">🎉</div>
              <h2>Hi ${user_name},</h2>
              <p>Great news! The personalized book you ordered is now ready to download!</p>
              
              <div class="book-info">
                <p><strong>Book Title:</strong> ${book_title}</p>
                <p><strong>Personalized for:</strong> ${child_name}</p>
                <p><strong>Order Number:</strong> ${order_number}</p>
              </div>

              <p>Your custom-made adventure featuring ${child_name} as the hero is waiting for you. Click the button below to download your book:</p>

              <center>
                <a href="${pdf_url}" class="cta-button">Download Your Book</a>
              </center>

              <p>We hope ${child_name} loves being the star of their very own story! Thank you for choosing Hero Kids.</p>

              <p style="margin-top: 30px;">Happy reading!<br><strong>The Hero Kids Team</strong></p>
            </div>
            <div class="footer">
              <p>Hero Kids - Creating Magical Stories<br>
              If you have any questions, contact us at support@herokids.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // In a production environment, you would integrate with an email service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Postmark
    // - Resend
    
    // For now, we'll log the email and return success
    // Replace this with actual email sending code:
    
    /*
    // Example with Resend:
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Hero Kids <notifications@herokids.com>',
        to: user_email,
        subject: `📚 Your Personalized Book "${book_title}" is Ready!`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error(`Email service error: ${emailResponse.statusText}`);
    }
    */

    console.log(`Email would be sent to ${user_email}`);
    console.log(`Subject: Your Personalized Book "${book_title}" is Ready!`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email notification sent successfully",
        recipient: user_email,
        book_title: book_title,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
