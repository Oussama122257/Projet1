import axios from 'axios';

export interface SmsPayload {
  to: string;
  message: string;
  senderId?: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Generic SMS sender that supports multiple Algerian SMS providers
export async function sendSms(payload: SmsPayload): Promise<SmsResult> {
  const provider = process.env.SMS_PROVIDER || 'twilio';

  switch (provider) {
    case 'twilio':
      return sendViaTwilio(payload);
    case 'infobip':
      return sendViaInfobip(payload);
    case 'otp_dz':
      return sendViaOtpDz(payload);
    default:
      return { success: false, error: `Unsupported SMS provider: ${provider}` };
  }
}

async function sendViaTwilio(payload: SmsPayload): Promise<SmsResult> {
  try {
    const accountSid = process.env.SMS_API_KEY;
    const authToken = process.env.SMS_API_SECRET;
    const from = payload.senderId || process.env.SMS_SENDER_ID || 'ColiShipDZ';

    const { data } = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        To: payload.to,
        From: from,
        Body: payload.message,
      }),
      {
        auth: { username: accountSid!, password: authToken! },
      }
    );

    return { success: true, messageId: data.sid };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Twilio error: ${message}` };
  }
}

async function sendViaInfobip(payload: SmsPayload): Promise<SmsResult> {
  try {
    const { data } = await axios.post(
      'https://api.infobip.com/sms/2/text/advanced',
      {
        messages: [
          {
            from: payload.senderId || process.env.SMS_SENDER_ID || 'ColiShipDZ',
            destinations: [{ to: payload.to }],
            text: payload.message,
          },
        ],
      },
      {
        headers: {
          Authorization: `App ${process.env.SMS_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      messageId: data.messages?.[0]?.messageId,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Infobip error: ${message}` };
  }
}

async function sendViaOtpDz(payload: SmsPayload): Promise<SmsResult> {
  try {
    const { data } = await axios.post(
      'https://api.otp.dz/api/v1/sms/send',
      {
        phone: payload.to,
        message: payload.message,
        sender_id: payload.senderId || process.env.SMS_SENDER_ID,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SMS_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return { success: data.success, messageId: data.message_id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `OTP.dz error: ${message}` };
  }
}

// Template variable replacement for notification messages
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

export const DEFAULT_TEMPLATES: Record<string, { fr: string; ar: string }> = {
  CONFIRMED: {
    fr: 'Bonjour {{customer_name}}, votre commande #{{order_number}} a été confirmée. Vous serez livré sous 2-3 jours. Suivi: {{tracking_url}}',
    ar: 'مرحبا {{customer_name}}، تم تأكيد طلبك رقم #{{order_number}}. سيتم التوصيل خلال 2-3 أيام. التتبع: {{tracking_url}}',
  },
  DISPATCHED: {
    fr: 'Votre colis #{{order_number}} a été expédié via {{carrier_name}}. Suivi: {{tracking_url}}',
    ar: 'تم شحن طردك رقم #{{order_number}} عبر {{carrier_name}}. التتبع: {{tracking_url}}',
  },
  IN_TRANSIT: {
    fr: 'Votre colis #{{order_number}} est en route vers {{wilaya}}. Suivi: {{tracking_url}}',
    ar: 'طردك رقم #{{order_number}} في الطريق إلى {{wilaya}}. التتبع: {{tracking_url}}',
  },
  OUT_FOR_DELIVERY: {
    fr: 'Votre colis #{{order_number}} est en cours de livraison. Le livreur vous contactera bientôt.',
    ar: 'طردك رقم #{{order_number}} قيد التوصيل. سيتصل بك السائق قريبا.',
  },
  DELIVERED: {
    fr: 'Votre commande #{{order_number}} a été livrée avec succès. Merci pour votre achat !',
    ar: 'تم توصيل طلبك رقم #{{order_number}} بنجاح. شكرا لتسوقكم!',
  },
  RETURNED: {
    fr: 'Votre colis #{{order_number}} n\'a pas pu être livré et sera retourné. Contactez-nous pour plus d\'informations.',
    ar: 'لم يتم توصيل طردك رقم #{{order_number}} وسيتم إرجاعه. اتصل بنا لمزيد من المعلومات.',
  },
};
