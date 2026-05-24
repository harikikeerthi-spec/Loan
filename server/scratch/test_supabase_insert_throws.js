const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { AuditLogService } = require('../dist/auth/audit-log.service');

async function testThrows() {
    console.log('Booting NestJS app context from dist...');
    const app = await NestFactory.createApplicationContext(AppModule);
    console.log('App context booted.');
    const auditLog = app.get(AuditLogService);
    
    const user = { id: 'system', email: 'system@example.com' };
    
    console.log('Calling auditLog.logAction directly with invalid entityId / initiatedBy...');
    try {
        const result = await auditLog.logAction(
            'STAFF_ACTIVITY',
            'DASHBOARD',
            'INFO',
            user,
            { msg: 'test' }
        );
        console.log('Result from logAction (no throw):', result);
    } catch (e) {
        console.error('logAction THREW AN EXCEPTION:', e);
    }
    
    await app.close();
}

testThrows().catch(e => {
    console.error('CRITICAL ERROR:', e);
});
