import type { SpamFlags } from '../../server/utils/anti-spam';

export function formatSlackMessage(data: {
  formData?: Record<string, any>;
  flags: SpamFlags;
}) {
  const risk =
    data.flags.score > 50 ? '⚠️' : data.flags.score > 20 ? '⚡' : '✅';
  const primaryEmail = data.formData?.email || 'No Email';

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
}
