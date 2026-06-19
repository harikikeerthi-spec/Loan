const { Client } = require('pg');
const { EmailService } = require('../dist/auth/email.service');
require('dotenv').config();

async function testCampaignPipeline() {
  console.log('Connecting to database...');
  const pgClient = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  await pgClient.connect();

  try {
    // 1. Seed a test campaign
    console.log('Seeding a test campaign...');
    const insertCampRes = await pgClient.query(`
      INSERT INTO "EmailCampaign" (
        title, "templateType", tone, "optimizationGoal", "primaryObjective", "targetContext", subject, "bodyTemplate", status, priority, "scheduledAt"
      ) VALUES (
        'Test Campaign', 'newsletter', 'friendly_casual', 'Test', 'Click link', 'Test Context',
        'Hello {{firstName}} {{lastName}} - Important Update!',
        '<p>Dear {{firstName}} {{lastName}},</p><p>This is a test campaign. Please check the website.</p>',
        'draft', 'high', NOW()
      ) RETURNING *
    `);

    const campaign = insertCampRes.rows[0];
    const campaignId = campaign.id;
    console.log(`Test campaign created with ID: ${campaignId}`);

    // 2. Seed test recipients
    console.log('Seeding test recipients...');
    const recipients = [
      { email: 'harikikeerthi+test1@gmail.com', firstName: 'TestOne', lastName: 'User' },
      { email: 'harikikeerthi+test2@gmail.com', firstName: 'TestTwo', lastName: 'User' }
    ];

    for (const r of recipients) {
      await pgClient.query(`
        INSERT INTO "CampaignRecipient" (
          "campaignId", "recipientEmail", "recipientName", variables, status
        ) VALUES (
          $1, $2, $3, $4, 'pending'
        )
      `, [
        campaignId,
        r.email,
        `${r.firstName} ${r.lastName}`,
        JSON.stringify({ firstName: r.firstName, lastName: r.lastName })
      ]);
    }
    console.log('Seeding of recipients complete.');

    // 3. Mark campaign as queued
    await pgClient.query(`
      UPDATE "EmailCampaign"
      SET status = 'queued', "totalCount" = $1
      WHERE id = $2
    `, [recipients.length, campaignId]);
    console.log('Campaign status updated to "queued".');

    // 4. Manually run campaign processing logic (simulating CampaignProcessorService)
    console.log('\n--- Simulating Campaign Processor Batch (Max 10) ---');
    const { data: activeCampaigns } = { data: [campaign] };
    const emailService = new EmailService();

    // Fetch pending recipients
    const recRes = await pgClient.query(`
      SELECT * FROM "CampaignRecipient"
      WHERE "campaignId" = $1 AND status = 'pending'
      LIMIT 10
    `, [campaignId]);

    const pendingRecipients = recRes.rows;
    console.log(`Fetched ${pendingRecipients.length} pending recipients for processing.`);

    // Transition campaign to sending
    await pgClient.query(`
      UPDATE "EmailCampaign"
      SET status = 'sending', "updatedAt" = NOW()
      WHERE id = $1
    `, [campaignId]);

    // Send emails
    for (const recipient of pendingRecipients) {
      const vars = recipient.variables || {};
      const subject = `Hello ${vars.firstName} ${vars.lastName} - Important Update!`;
      const body = `<p>Dear ${vars.firstName} ${vars.lastName},</p><p>This is a test campaign. Please check the website.</p>`;

      try {
        console.log(`Sending test email to ${recipient.recipientEmail}...`);
        await emailService.sendMail(recipient.recipientEmail, subject, body, 'Text fallback');

        // Update recipient to sent
        await pgClient.query(`
          UPDATE "CampaignRecipient"
          SET status = 'sent', "sentAt" = NOW()
          WHERE id = $1
        `, [recipient.id]);

        // Increment sent count
        await pgClient.query(`
          UPDATE "EmailCampaign"
          SET "sentCount" = "sentCount" + 1, "updatedAt" = NOW()
          WHERE id = $1
        `, [campaignId]);
        console.log(`Email successfully sent to ${recipient.recipientEmail}`);
      } catch (err) {
        console.error(`Failed to send email to ${recipient.recipientEmail}:`, err.message);
        // Update recipient to failed
        await pgClient.query(`
          UPDATE "CampaignRecipient"
          SET status = 'failed', "errorMessage" = $1, "sentAt" = NOW()
          WHERE id = $2
        `, [err.message, recipient.id]);

        // Increment failed count
        await pgClient.query(`
          UPDATE "EmailCampaign"
          SET "failedCount" = "failedCount" + 1, "updatedAt" = NOW()
          WHERE id = $1
        `, [campaignId]);
      }
    }

    // Finalize campaign checks
    const finalRecRes = await pgClient.query(`
      SELECT COUNT(*) as count FROM "CampaignRecipient"
      WHERE "campaignId" = $1 AND status = 'pending'
    `, [campaignId]);

    const pendingCount = parseInt(finalRecRes.rows[0].count, 10);
    if (pendingCount === 0) {
      console.log('No pending recipients left. Marking campaign as completed.');
      await pgClient.query(`
        UPDATE "EmailCampaign"
        SET status = 'completed', "updatedAt" = NOW()
        WHERE id = $1
      `, [campaignId]);
    }

    // Print final DB state of this campaign
    const finalCampRes = await pgClient.query(`
      SELECT * FROM "EmailCampaign" WHERE id = $1
    `, [campaignId]);
    console.log('\nFinal Campaign State in DB:');
    console.log(JSON.stringify(finalCampRes.rows[0], null, 2));

    // Clean up test data
    console.log('\nCleaning up test campaign and recipients...');
    await pgClient.query('DELETE FROM "EmailCampaign" WHERE id = $1', [campaignId]);
    console.log('Cleanup complete.');

  } catch (error) {
    console.error('Pipeline test failed with error:', error);
  } finally {
    await pgClient.end();
  }
}

testCampaignPipeline();
