import { Injectable } from '@nestjs/common';

@Injectable()
export class SlackService {
  /**
   * Simulates publishing a Block Kit alert to Slack channel on a specific decision event.
   */
  async publishDecisionNotification(
    bankName: string,
    studentName: string,
    applicationNumber: string,
    decisionType: string,
    details: any
  ): Promise<any> {
    console.log(`[SlackService] Pushing Slack event webhook for ${bankName}...`);

    // Build standard Slack Block Kit payload
    const blockKitPayload = {
      text: `🏦 VidyaLoans Decision Notification: ${decisionType.toUpperCase()}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🏦 VidyaLoans Partner Portal Update',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${bankName}* has submitted a *${decisionType.toUpperCase()}* decision for an application.`
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Student Name:*\n${studentName}`
            },
            {
              type: 'mrkdwn',
              text: `*LAN / Application ID:*\n${applicationNumber}`
            },
            {
              type: 'mrkdwn',
              text: `*Decision:*\n${decisionType}`
            },
            {
              type: 'mrkdwn',
              text: `*Effective Date:*\n${new Date().toLocaleDateString()}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Decision Notes:*\n${JSON.stringify(details, null, 2)}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Application',
                emoji: true
              },
              value: `app_view_${applicationNumber}`,
              action_id: 'action_view_application',
              style: 'primary'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Audit Log Details',
                emoji: true
              },
              value: `audit_${applicationNumber}`,
              action_id: 'action_audit_details'
            }
          ]
        }
      ]
    };

    console.log('[SlackService] Built Block Kit Message mockup:', JSON.stringify(blockKitPayload, null, 2));

    // Simulated successful trigger response
    return {
      success: true,
      channel: '#loans-pipeline',
      ts: `171620${Math.floor(Math.random() * 900000) + 100000}.000100`,
      mockMessagePayload: blockKitPayload
    };
  }
}
