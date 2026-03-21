import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

// Hardcoded secret from your auth.module.ts
const JWT_SECRET = 'secretKey';
const prisma = new PrismaClient();

async function generateToken(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.log(`❌ User with email "${email}" not found.`);
            return;
        }

        if (user.role !== 'admin') {
            console.log(`⚠️  WARNING: This user is NOT an admin (Role: ${user.role}).`);
            console.log(`   The token will be valid, but admin endpoints will return 403 Forbidden.`);
            console.log(`   Run 'npx ts-node scripts/make-admin.ts ${email}' first.`);
        }

        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

        console.log('\n✅ ADMIN TOKEN GENERATED:');
        console.log('---------------------------------------------------');
        console.log(token);
        console.log('---------------------------------------------------');
        console.log('\nUse this command to test:');
        console.log(`curl -X GET "http://localhost:3000/blogs/admin/all" -H "Authorization: Bearer ${token}"`);

    } catch (error) {
        console.error('❌ Error generating token:', error);
    } finally {
        await prisma.$disconnect();
    }
}

const email = process.argv[2];
if (!email) {
    console.log('Usage: npx ts-node scripts/get-token.ts <email>');
    process.exit(1);
}

generateToken(email);
