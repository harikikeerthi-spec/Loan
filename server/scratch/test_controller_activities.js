const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { StaffProfileController } = require('../dist/staff-profile/staff-profile.controller');

async function testController() {
    console.log('Booting NestJS app context...');
    const app = await NestFactory.createApplicationContext(AppModule);
    console.log('App context booted.');
    const controller = app.get(StaffProfileController);

    const mockReq = {
        user: {
            id: '8ecf51c2-c9ac-4c76-9147-0c1ca96a8e51',
            email: 'staffvidhya@gmail.com',
            role: 'staff',
            firstName: 'Staff',
            lastName: 'Vidhya'
        }
    };

    const mockBody = {
        type: 'info',
        msg: 'Testing log activity from controller script',
        icon: 'event_note',
        color: 'text-slate-600 bg-slate-50'
    };

    console.log('Invoking controller.logActivity...');
    try {
        const result = await controller.logActivity(mockReq, mockBody);
        console.log('Controller returned success:', result);
    } catch (e) {
        console.error('CONTROLLER EXCEPTION THROWN:', e);
    }

    await app.close();
}

testController().catch(console.error);
