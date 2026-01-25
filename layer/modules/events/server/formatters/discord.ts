import type { SpamFlags } from '~/server/utils/anti-spam';

export function formatDiscordMessage(data: {
  formData?: Record<string, any>;
  flags: SpamFlags;
}) {
  const risk =
    data.flags.score > 50 ? '⚠️' : data.flags.score > 20 ? '⚡' : '✅';
  const primaryEmail = data.formData?.email || 'No Email';

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
}
