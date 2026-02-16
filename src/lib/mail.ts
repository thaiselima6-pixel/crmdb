import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const data = await resend.emails.send({
      from: 'CRM Agência <noreply@suaagencia.com.br>',
      to,
      subject,
      html,
    });
    return data;
  } catch (error) {
    console.error("FAILED_TO_SEND_EMAIL", error);
    return null;
  }
};
