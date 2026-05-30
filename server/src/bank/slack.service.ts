import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  private async postToSlack(payload: any): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      this.logger.warn('[SlackService] SLACK_WEBHOOK_URL is not set. Simulating Slack push.');
      this.logger.debug('[SlackService] Payload:\n' + JSON.stringify(payload, null, 2));
      return true;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        this.logger.error(`[SlackService] Failed to post to Slack: ${res.status} ${res.statusText}`);
        return false;
      }
      return true;
    } catch (e) {
      this.logger.error(`[SlackService] Error posting to Slack: ${e.message}`);
      return false;
    }
  }

  /**
   * Publishes a Block Kit alert to Slack channel on a specific decision event.
   */
  async publishDecisionNotification(
    bankName: string,
    studentName: string,
    applicationNumber: string,
    decisionType: string,
    details: any
  ): Promise<any> {
    this.logger.log(`[SlackService] Pushing Slack event webhook for ${bankName}...`);

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
            text: `*Decision Notes:*\n${typeof details === 'object' ? JSON.stringify(details, null, 2) : details}`
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
            }
          ]
        }
      ]
    };

    await this.postToSlack(blockKitPayload);

    return {
      success: true,
      channel: '#loans-pipeline',
      ts: `171620${Math.floor(Math.random() * 900000) + 100000}.000100`,
      mockMessagePayload: blockKitPayload
    };
  }

  /**
   * Publishes a Block Kit alert to Slack on a query being raised or resolved.
   */
  async publishQueryNotification(
    bankName: string,
    studentName: string,
    applicationNumber: string,
    queryDescription: string,
    action: 'raised' | 'resolved'
  ): Promise<any> {
    this.logger.log(`[SlackService] Pushing Slack query ${action} webhook...`);

    const emoji = action === 'raised' ? '❓' : '✅';
    const blockKitPayload = {
      text: `${emoji} VidyaLoans Query Notification: ${action.toUpperCase()}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🏦 VidyaLoans Query Portal Update`,
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${bankName}* has *${action.toUpperCase()}* a query on an application.`
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
              text: `*Action:*\n${action.toUpperCase()}`
            },
            {
              type: 'mrkdwn',
              text: `*Timestamp:*\n${new Date().toLocaleString()}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Query Description / Resolution:*\n${queryDescription}`
          }
        }
      ]
    };

    await this.postToSlack(blockKitPayload);

    return {
      success: true,
      mockMessagePayload: blockKitPayload
    };
  }
}
