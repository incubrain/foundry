import { z } from 'zod';
import { formatDiscordMessage } from '../formatters/discord';
import { formatSlackMessage } from '../formatters/slack';
import { formatTelegramMessage } from '../formatters/telegram';

// Assumes these are available from server/utils via auto-import or alias
// We use a relative import for types, but for runtime logic we rely on Nitro's auto-import
// OR we import strictly if we can.
import { RateLimiter, validateAntiSpam } from '../utils/anti-spam';

const captureSchema = z.object({
  formData: z.record(z.any()),
  antiSpam: z.any().optional(),
});

// Global rate limiter instance
const rateLimiter = new RateLimiter();

type WebhookPlatform = 'telegram' | 'slack' | 'discord' | 'unknown';

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
    console.warn('[Anti-Spam] Suspicious submission:', {
      email: formData?.email,
      ip: ip.substring(0, 10) + '...',
      flags,
    });
  }

  // HARD REJECT: Honeypot triggered
  if (flags.honeypot) {
    console.warn(
      '[Anti-Spam] Honeypot triggered - silent reject:',
      formData?.email,
    );

    // Return success to user (don't reveal detection)
    return {
      success: true,
      message: 'Thanks! Check your email.',
    };
  }

  // HARD REJECT: Rate limit exceeded
  if (rateLimiter.check(ip)) {
    console.warn('[Anti-Spam] Rate limit exceeded:', ip, formData?.email);

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
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook Not Configured',
      message:
        'Webhook URL is missing. Supports Telegram, Slack, or Discord. Add NUXT_WEBHOOK_URL to your .env file.',
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
        if (platform === 'discord') {
          message = formatDiscordMessage({
            formData: parsed.data.formData,
            flags,
          });
        } else if (platform === 'slack') {
          message = formatSlackMessage({
            formData: parsed.data.formData,
            flags,
          });
        } else if (platform === 'telegram') {
          message = formatTelegramMessage(
            { formData: parsed.data.formData, flags },
            telegramChatId,
          );
        } else {
          // Fallback
          message = {
            text: `New Lead: ${parsed.data.formData?.email} - ${JSON.stringify(parsed.data.formData)}`,
          };
        }
      } catch (error) {
        console.error(`[${platform}] Failed to format message:`, {
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
            console.error('[telegram] API returned error:', {
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

        console.log(
          `[${platform}] Lead delivered:`,
          parsed.data.formData?.email,
        );

        return { platform, url: url.substring(0, 30) + '...', success: true };
      } catch (error: any) {
        console.error(`[${platform}] Delivery failed:`, {
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

  console.info('Webhook delivery summary:', {
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
