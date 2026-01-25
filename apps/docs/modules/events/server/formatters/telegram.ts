import type { SpamFlags } from '~/server/utils/anti-spam';

export function formatTelegramMessage(
  data: {
    formData?: Record<string, any>;
    flags: SpamFlags;
  },
  chatId?: string,
) {
  if (!chatId) {
    throw new Error('NUXT_TELEGRAM_CHAT_ID is required for Telegram webhooks');
  }

  const risk =
    data.flags.score > 50 ? '⚠️' : data.flags.score > 20 ? '⚡' : '✅';
  const primaryEmail = data.formData?.email || 'No Email';

  // Format fields for display
  const fieldList = Object.entries(data.formData || {})
    .filter(([key]) => key !== 'email') // Email is shown separately or at top
    .map(([key, value]) => `${key}: ${value}`);

  const telegramLines = [
    `${risk} New Lead`,
    '',
    `📧 ${primaryEmail}`,
    ...fieldList.map((f) => `🔹 ${f}`),
    '',
    `📝 Form: ${data.formData?.formId}`,
  ];

  // Add spam flags if present
  if (data.flags.score > 0) {
    telegramLines.push('', `⚠️ Risk Score: ${data.flags.score}/100`);
    if (data.flags.fast) telegramLines.push('⚡ Fast submission');
    if (data.flags.noJs) telegramLines.push('🤖 No JavaScript');
  }

  return {
    chat_id: chatId,
    text: telegramLines.join('\n'),
  };
}
