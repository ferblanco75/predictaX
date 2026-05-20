import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function escapeHtml(value: string) {
  return value.replace(/[&<>"]|'/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char];
  });
}

/**
 * POST /api/waitlist
 *
 * Handles waitlist signup submissions
 * Sends notification email via Resend
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, nombre, razon } = body;

    // Validation
    if (!email || !nombre || typeof email !== 'string' || typeof nombre !== 'string') {
      return NextResponse.json({ error: 'Email y nombre son requeridos' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Validate nombre length
    if (nombre.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre debe tener al menos 2 caracteres' },
        { status: 400 }
      );
    }

    // Validate razon length if provided
    if (razon && typeof razon !== 'string') {
      return NextResponse.json({ error: 'Razón inválida' }, { status: 400 });
    }

    if (razon && razon.length > 500) {
      return NextResponse.json(
        { error: 'La razón no puede exceder 500 caracteres' },
        { status: 400 }
      );
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('[Waitlist] RESEND_API_KEY not configured');
      // In development, just log and return success
      if (process.env.NODE_ENV === 'development') {
        console.log('[Waitlist] Development mode - Email would be sent to:', {
          email,
          nombre,
          razon,
        });
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Servicio de email no configurado' }, { status: 500 });
    }

    // Check if recipient email is configured
    const recipientEmail = process.env.WAITLIST_EMAIL_TO;
    if (!recipientEmail) {
      console.error('[Waitlist] WAITLIST_EMAIL_TO not configured');
      return NextResponse.json({ error: 'Destinatario de email no configurado' }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const safeNombre = escapeHtml(nombre.trim());
    const safeEmail = escapeHtml(email.trim());
    const safeRazon = razon
      ? escapeHtml(razon.trim())
      : '<em style="color: #9ca3af;">No especificada</em>';

    // Send email notification using Resend
    const { data, error } = await resend.emails.send({
      from: 'PredictaX Waitlist <onboarding@resend.dev>',
      to: recipientEmail,
      subject: `Nueva inscripción waitlist: ${nombre.trim()}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nueva Inscripción Waitlist</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Nueva Inscripción</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Lista de Espera PredictaX</p>
            </div>

            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Detalles del Registro</h2>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px; background: white; border: 1px solid #e5e7eb; font-weight: bold; width: 40%;">Nombre:</td>
                  <td style="padding: 12px; background: white; border: 1px solid #e5e7eb;">${safeNombre}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; background: white; border: 1px solid #e5e7eb; font-weight: bold;">Email:</td>
                  <td style="padding: 12px; background: white; border: 1px solid #e5e7eb;">
                    <a href="mailto:${safeEmail}" style="color: #3b82f6; text-decoration: none;">${safeEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px; background: white; border: 1px solid #e5e7eb; font-weight: bold;">Razón:</td>
                  <td style="padding: 12px; background: white; border: 1px solid #e5e7eb;">${safeRazon}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; background: white; border: 1px solid #e5e7eb; font-weight: bold;">Fecha:</td>
                  <td style="padding: 12px; background: white; border: 1px solid #e5e7eb;">${new Date().toLocaleString(
                    'es-ES',
                    {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    }
                  )}</td>
                </tr>
              </table>

              <div style="margin-top: 30px; padding: 20px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  💡 <strong>Consejo:</strong> Responde lo antes posible para mantener el interés del usuario.
                </p>
              </div>
            </div>

            <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
              <p style="margin: 0;">Este email fue generado automáticamente por PredictaX</p>
              <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} PredictaX - Todos los derechos reservados</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Waitlist] Resend error:', error);
      return NextResponse.json({ error: 'Error al enviar el email' }, { status: 500 });
    }

    console.log('[Waitlist] Email sent successfully:', data);

    return NextResponse.json(
      {
        success: true,
        message: 'Registro exitoso',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Waitlist] Unexpected error:', error);

    return NextResponse.json(
      {
        error: 'Error al procesar la solicitud',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/waitlist
 *
 * Returns API status (for health checks)
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Waitlist API is running',
    configured: {
      resend: !!process.env.RESEND_API_KEY,
      recipient: !!process.env.WAITLIST_EMAIL_TO,
    },
  });
}
