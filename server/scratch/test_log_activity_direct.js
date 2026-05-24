const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { StaffProfileService } = require('../dist/staff-profile/staff-profile.service');

async function testDirect() {
    console.log('Booting NestJS app context from dist...');
    const app = await NestFactory.createApplicationContext(AppModule);
    console.log('App context booted.');
    const svc = app.get(StaffProfileService);
    
    const user = { id: '3f8595bf-d7e7-4008-8e6d-74d398d5c4ff', email: 'staff@example.com', firstName: 'Staff', lastName: 'Member' };
    const data = { type: 'info', msg: 'Testing log activity directly from node script', icon: 'event_note', color: 'text-slate-600 bg-slate-50' };
    
    console.log('Calling logDashboardActivity...');
    await svc.logDashboardActivity(user, data);
    console.log('logDashboardActivity completed successfully!');
    
    await app.close();
}

testDirect().catch(e => {
    console.error('CRITICAL ERROR:', e);
});
