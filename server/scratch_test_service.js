const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { ChatService } = require('./dist/chat/chat.service');

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const chatService = app.get(ChatService);
  
  const messageId = '6abd5515-a4c9-45c1-ba4b-98eeffa2502e';
  console.log('Testing edit messageId:', messageId);

  try {
    const msg = await chatService.getMessageById(messageId);
    console.log('getMessageById result:', msg);

    if (msg) {
      console.log('Attempting editMessage...');
      const edited = await chatService.editMessage(messageId, msg.content + ' (Direct edit test)');
      console.log('editMessage result:', edited);
    }
  } catch (err) {
    console.error('Operation Failed:', err);
  }
  await app.close();
}

test();
