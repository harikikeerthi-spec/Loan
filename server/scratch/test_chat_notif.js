const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { ChatService } = require('../dist/chat/chat.service');

async function test() {
  console.log('Bootstrapping NestJS...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const chatService = app.get(ChatService);
  
  try {
    console.log('Calling saveMessage...');
    const res = await chatService.saveMessage({
      conversationId: 'd9013ac2-54c8-4f13-8991-07fb17365bd1',
      senderType: 'bank',
      senderId: 'jegan14735@aratrin.com',
      receiverType: 'staff',
      content: 'This is a test bank message to verify staff notifications',
      messageType: 'text',
      status: 'sent',
      senderName: 'Test Bank Partner'
    });
    console.log('Success, saved message:', res);
  } catch (err) {
    console.error('Failed:', err);
  }
  await app.close();
}

test();
