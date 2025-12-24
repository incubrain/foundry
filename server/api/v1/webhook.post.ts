// server/api/v1/webhook.post.ts
import { z } from 'zod';

const captureSchema = z.object({
  formData: z.record(z.any()),
  antiSpam: z.any().optional(),
});

// Global rate limiter instance
const rateLimiter = new RateLimiter();

type WebhookPlatform = 'telegram' | 'slack' | 'discord' | 'unknown';

/**
 * Detect webhook platform from URL
 */
function detectPlatform(url: string): WebhookPlatform {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('api.telegram.org')) return 'telegram';
  if (lowerUrl.includes('hooks.slack.com')) return 'slack';
  if (
    lowerUrl.includes('discord.com/api/webhooks') ||
    lowerUrl.includes('discordapp.com/api/webhooks')
  )
    return 'discord';

  return 'unknown';
}

/**
 * Format message for specific platform with spam flags
 */
function formatMessage(
  platform: WebhookPlatform,
  data: {
    formData?: Record<string, any>;
    flags: SpamFlags;
  },
  chatId?: string,
) {
  const risk =
    data.flags.score > 50 ? '⚠️' : data.flags.score > 20 ? '⚡' : '✅';
  const primaryEmail = data.formData?.email || 'No Email';

  // Format fields for display
  const fieldList = Object.entries(data.formData || {})
    .filter(([key]) => key !== 'email') // Email is shown separately or at top
    .map(([key, value]) => `${key}: ${value}`);

  switch (platform) {
    case 'telegram':
      if (!chatId) {
        throw new Error(
          'NUXT_TELEGRAM_CHAT_ID is required for Telegram webhooks',
        );
      }

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

    case 'slack':
      // Build fields block
      const slackFields = [
        {
          type: 'mrkdwn',
          text: `*Email*\n${primaryEmail}`,
        },
        ...Object.entries(data.formData || {})
          .filter(([k]) => k !== 'email')
          .map(([key, value]) => ({
            type: 'mrkdwn',
            text: `*${key.charAt(0).toUpperCase() + key.slice(1)}*\n${value}`,
          })),
      ];

      return {
        text: `${risk} New Lead: ${primaryEmail}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*New Lead captured*`,
            },
          },
          {
            type: 'section',
            fields: slackFields,
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `📝 ${data.formData?.formId} | ⚠️ Risk: ${data.flags.score}`,
              },
            ],
          },
        ],
      };

    case 'discord':
      const color =
        data.flags.score > 50
          ? 0xff6b6b
          : data.flags.score > 20
            ? 0xffd93d
            : 0x00ff00;

      const discordFields = [
        { name: '📧 Email', value: `\`${primaryEmail}\``, inline: false },
        ...Object.entries(data.formData || {})
          .filter(([k]) => k !== 'email')
          .map(([key, value]) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: String(value), // Ensure string
            inline: true,
          })),
        { name: '📝 Form', value: data.formData?.formId, inline: true },
        data.flags.score > 0
          ? { name: '⚠️ Risk', value: `${data.flags.score}/100`, inline: true }
          : null,
      ].filter(Boolean);

      return {
        content: `${risk} **New Lead**`,
        embeds: [
          {
            color,
            fields: discordFields,
            timestamp: new Date().toISOString(),
          },
        ],
      };

    default:
      return {
        text: `${risk} ${primaryEmail} - ${JSON.stringify(data.formData)}`,
      };
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { formData, antiSpam } = body;

  // Get IP for rate limiting
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';

  // === ANTI-SPAM VALIDATION ===

  // Validate anti-spam data
  const flags = validateAntiSpam(antiSpam || {});

  // Log suspicious activity
  if (flags.score > 0) {
    logger.warn('[Anti-Spam] Suspicious submission:', {
      email: formData?.email,
      ip: ip.substring(0, 10) + '...',
      flags,
    });
  }

  // HARD REJECT: Honeypot triggered
  if (flags.honeypot) {
    logger.warn('[Anti-Spam] Honeypot triggered - silent reject:', formData?.email);

    // Return success to user (don't reveal detection)
    return {
      success: true,
      message: 'Thanks! Check your email.',
    };
  }

  // HARD REJECT: Rate limit exceeded
  if (rateLimiter.check(ip)) {
    logger.warn('[Anti-Spam] Rate limit exceeded:', ip, formData?.email);

    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: 'Too many submissions. Please try again in a few minutes.',
    });
  }

  // === EMAIL VALIDATION ===

  const parsed = captureSchema.safeParse({ formData });

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid Data',
      message: 'Email capture validation failed',
      data: parsed.error.errors,
    });
  }

  const config = useRuntimeConfig();
  const webhookUrl = config.webhookUrl;

  if (!webhookUrl) {
    logger.box({
      title: '❌ Webhook Not Configured',
      message: [
        'Choose ONE or MORE platforms for lead notifications:',
        '',
        '• Telegram: https://api.telegram.org/bots/api#sendmessage',
        '• Slack: https://api.slack.com/messaging/webhooks',
        '• Discord: Server Settings → Integrations → Webhooks',
        '',
        'Add to .env file (comma-separated for multiple):',
        'NUXT_WEBHOOK_URL=<url1>,<url2>,<url3>',
        '',
        'For Telegram, also add:',
        'NUXT_TELEGRAM_CHAT_ID=<your-chat-id>',
        '',
        'Then restart dev server',
      ].join('\n'),
      style: {
        borderColor: 'red',
        borderStyle: 'rounded',
      },
    });

    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook Not Configured',
      message:
        'Webhook URL is missing. Supports Telegram, Slack, or Discord. Add NUXT_WEBHOOK_URL to your .env file. See terminal for setup instructions.',
    });
  }

  // Parse multiple webhook URLs (comma-separated)
  const webhookUrls = webhookUrl
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  if (webhookUrls.length === 0) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook Not Configured',
      message: 'No valid webhook URLs found',
    });
  }

  const telegramChatId = config.telegramChatId;

  // Send to all webhooks in parallel
  const results = await Promise.allSettled(
    webhookUrls.map(async (url) => {
      const platform = detectPlatform(url);

      let message;
      try {
        message = formatMessage(
          platform,
          {
            formData: parsed.data.formData,
            flags,
          },
          telegramChatId,
        );
      } catch (error) {
        logger.error(`[${platform}] Failed to format message:`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }

      try {
        const response = await $fetch(url, {
          method: 'POST',
          body: message,
        });

        // Validate Telegram response
        if (
          platform === 'telegram' &&
          response &&
          typeof response === 'object'
        ) {
          const telegramResponse = response as {
            ok: boolean;
            description?: string;
            error_code?: number;
          };

          if (!telegramResponse.ok) {
            logger.error('[telegram] API returned error:', {
              ok: telegramResponse.ok,
              error_code: telegramResponse.error_code,
              description: telegramResponse.description,
              sentPayload: message,
            });

            throw new Error(
              telegramResponse.description || 'Telegram API returned ok: false',
            );
          }
        }

        logger.success(
          `[${platform}] Lead delivered:`,
          parsed.data.formData?.email,
        );

        return { platform, url: url.substring(0, 30) + '...', success: true };
      } catch (error: any) {
        logger.error(`[${platform}] Delivery failed:`, {
          url: url.substring(0, 10) + '...',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
      }
    }),
  );

  // Analyze results
  const successful = results.filter((r) => r.status === 'fulfilled');
  const failed = results.filter((r) => r.status === 'rejected');

  logger.info('Webhook delivery summary:', {
    total: webhookUrls.length,
    successful: successful.length,
    failed: failed.length,
  });

  // Return success if at least one webhook succeeded
  if (successful.length > 0) {
    return {
      success: true,
      delivered: successful.length,
      failed: failed.length,
      platforms: successful.map(
        (r) => (r as PromiseFulfilledResult<any>).value,
      ),
    };
  }

  // All failed - throw error
  throw createError({
    statusCode: 500,
    statusMessage: 'All Webhooks Failed',
    message: `Failed to deliver to all ${webhookUrls.length} configured webhook(s)`,
    data: {
      attempted: webhookUrls.length,
      failures: failed.map((r, i) => ({
        url: webhookUrls[i].substring(0, 30) + '...',
        error: (r as PromiseRejectedResult).reason?.message || 'Unknown error',
      })),
    },
  });
});
