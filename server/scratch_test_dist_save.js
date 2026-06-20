const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { ChatService } = require('./dist/chat/chat.service');

async function test() {
    console.log('Booting NestJS application context...');
    const app = await NestFactory.createApplicationContext(AppModule);
    console.log('App context booted.');
    
    const chatService = app.get(ChatService);
    
    console.log('Calling saveMessage...');
    try {
        const result = await chatService.saveMessage({
            conversationId: 'ad1097dd-ab70-42f1-a879-1cacbef1fa01',
            senderType: 'staff',
            senderId: 'jimawa1376@afterdo.com',
            receiverType: 'customer',
            content: 'Test message from dist service test',
            status: 'sent'
        });
        console.log('Message saved successfully:', result);
    } catch (e) {
        console.error('saveMessage THREW AN EXCEPTION:', e);
    }
    
    await app.close();
}

test().catch(console.error);
