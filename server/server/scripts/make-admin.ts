import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeUserAdmin(email: string) {
    try {
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.log(`❌ User with email "${email}" not found`);
            console.log('   Please make sure the user has registered first.');
            return;
        }

        // Update user role to admin
        const updatedUser = await prisma.user.update({
            where: { email },
            data: { role: 'admin' },
        });

        console.log('✅ Successfully updated user to admin!');
        console.log('');
        console.log('Admin User Details:');
        console.log('-------------------');
        console.log(`Email: ${updatedUser.email}`);
        console.log(`Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
        console.log(`Role: ${updatedUser.role}`);
        console.log(`User ID: ${updatedUser.id}`);
        console.log('');
        console.log('This user can now access admin endpoints!');
    } catch (error) {
        console.error('❌ Error making user admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Get email from  command line arguments
const email = process.argv[2];

if (!email) {
    console.log('');
    console.log('Usage: npm run make-admin <email>');
    console.log('Example: npm run make-admin admin@example.com');
    console.log('');
    process.exit(1);
}

// Validate email format
if (!email.includes('@') || !email.includes('.')) {
    console.log('❌ Invalid email format');
    process.exit(1);
}

console.log('');
console.log('🔧 Making user admin...');
console.log('');
makeUserAdmin(email);
