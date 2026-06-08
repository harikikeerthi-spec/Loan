const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { CommunityService } = require('./dist/community/community.service');

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const communityService = app.get(CommunityService);
  
  try {
    const res = await communityService.createForumPost('1f3d3a39-331c-4b41-bc81-c313761e1702', {
      title: 'Direct test post',
      content: 'Hello from nestjs app context',
      category: 'General'
    });
    console.log('Success:', res);
  } catch (err) {
    console.error('Failed:', err);
  }
  await app.close();
}

test();
