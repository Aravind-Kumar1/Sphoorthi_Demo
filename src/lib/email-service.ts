import emailjs from '@emailjs/browser';

/**
 * Sends a 'Thank You' email to a new member using EmailJS.
 * Make sure to set these environment variables in your .env.local
 */
export const sendWelcomeEmail = async (memberName: string, memberEmail: string) => {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn('⚠️ EmailJS credentials missing. Email not sent.');
    return;
  }

  const templateParams = {
    name: memberName,
    to_name: memberName,
    to_email: memberEmail,
  };

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('✓ Welcome email sent via EmailJS:', response.status, response.text);
  } catch (error: any) {
    console.error('✗ EmailJS Error:', {
      status: error?.status,
      text: error?.text,
      message: error?.message || error
    });
  }
};
