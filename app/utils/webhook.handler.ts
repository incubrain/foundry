// app/utils/webhook.handler.ts

/**
 * Sends form submission data to webhook endpoint
 */
export async function webhookHandler(payload: EventPayload): Promise<any> {
  if (payload.type !== 'form_submitted') return;

  try {
    const response = await $fetch('/api/v1/webhook', {
      method: 'POST',
      body: {
        formData: payload.data.formData,
        antiSpam: payload.data.antiSpam,
      },
    });

    payload.response = response;
    return response;
  } catch (error) {
    console.error('[Webhook] Failed:', error);
    throw error;
  }
}
