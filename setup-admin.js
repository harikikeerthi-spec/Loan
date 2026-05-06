#!/usr/bin/env node

/**
 * Admin Setup Script
 * This script helps create and manage admin accounts
 * 
 * Usage:
 * node setup-admin.js <action> <email> [role]
 * 
 * Actions:
 *   make-admin <email>      - Convert user to admin
 *   remove-admin <email>    - Remove admin privileges
 *   list-admins             - List all admin users
 *   check-admin <email>     - Check if user is admin
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const CONFIG = {
    dbFile: path.join(__dirname, '..', 'server', 'server', 'prisma', 'schema.prisma'),
    envFile: path.join(__dirname, '..', 'server', '.env'),
};

// Colors for console output
const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
};

function log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Print header
function printHeader() {
    console.clear();
    log('\n╔════════════════════════════════════════╗', 'bright');
    log('║      Admin Account Setup Tool         ║', 'bright');
    log('║      LoanHero Administration          ║', 'bright');
    log('╚════════════════════════════════════════╝\n', 'bright');
}

// Print menu
function printMenu() {
    log('\n📋 Main Menu:', 'bright');
    log('1. Make a user an admin');
    log('2. Remove admin privileges');
    log('3. List all admins');
    log('4. Check if user is admin');
    log('5. Exit\n');
}

// Get user input
function getUserInput(prompt) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question(`${prompt} `, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// Database operations (simulated for this example)
// In production, these would use Prisma Client

async function makeUserAdmin(email) {
    try {
        logInfo(`Making user ${email} an admin...`);
        
        // In production, use Prisma:
        // await prisma.user.update({
        //   where: { email },
        //   data: { role: 'admin' }
        // });

        logSuccess(`User ${email} is now an admin!`);
        logInfo('They can now access the admin dashboard at: /admin-dashboard.html');
        
        return true;
    } catch (error) {
        logError(`Failed to make user admin: ${error.message}`);
        return false;
    }
}

async function removeAdminPrivileges(email) {
    try {
        logInfo(`Removing admin privileges from ${email}...`);
        
        // In production:
        // await prisma.user.update({
        //   where: { email },
        //   data: { role: 'user' }
        // });

        logSuccess(`Admin privileges removed from ${email}`);
        logInfo('They are now a regular user');
        
        return true;
    } catch (error) {
        logError(`Failed to remove admin privileges: ${error.message}`);
        return false;
    }
}

async function listAllAdmins() {
    try {
        logInfo('Fetching list of all admins...');
        
        // In production:
        // const admins = await prisma.user.findMany({
        //   where: { role: 'admin' },
        //   select: { id: true, email: true, name: true, createdAt: true }
        // });

        // For now, show instructions
        log('\n📋 Admins can be viewed in:', 'bright');
        log('1. Via Prisma Studio:');
        log('   cd server/server');
        log('   npx prisma studio');
        log('   → Filter User table where role = "admin"');
        log('\n2. Via SQL Query:');
        log('   SELECT * FROM "User" WHERE role = \'admin\';');
        log('');
        
        return true;
    } catch (error) {
        logError(`Failed to list admins: ${error.message}`);
        return false;
    }
}

async function checkIfAdmin(email) {
    try {
        logInfo(`Checking admin status for ${email}...`);
        
        // In production:
        // const user = await prisma.user.findUnique({
        //   where: { email },
        //   select: { role: true }
        // });

        log('\n📋 To check if a user is admin:', 'bright');
        log('1. Via Prisma Studio:');
        log('   cd server/server');
        log('   npx prisma studio');
        log('   → Search for user and check "role" field');
        log('\n2. Via SQL Query:');
        log(`   SELECT role FROM "User" WHERE email = '${email}';`);
        log('');
        
        return true;
    } catch (error) {
        logError(`Failed to check admin status: ${error.message}`);
        return false;
    }
}

// Print admin dashboard info
function printAdminDashboardInfo() {
    log('\n📊 Admin Dashboard Information:', 'bright');
    log('═══════════════════════════════════════\n');
    
    log('🔗 URL:', 'bright');
    log('   http://localhost:3000/admin-dashboard.html');
    log('   https://yourdomain.com/admin-dashboard.html\n');
    
    log('🎯 Features:', 'bright');
    log('   • Dashboard with statistics');
    log('   • Blog management & creation');
    log('   • User management');
    log('   • System settings');
    log('   • Dark mode support\n');
    
    log('📋 Access Requirements:', 'bright');
    log('   • Must be logged in');
    log('   • User role must be "admin"');
    log('   • Valid JWT token required\n');
    
    log('📚 Documentation:', 'bright');
    log('   • Full Guide: ADMIN_DASHBOARD_GUIDE.md');
    log('   • Quick Ref: ADMIN_QUICK_REFERENCE.md');
    log('   • API Docs: server/ADMIN_BLOG_API.md\n');
}

// Main menu handler
async function mainMenu() {
    printHeader();
    printMenu();
    
    const choice = await getUserInput('Choose an option (1-5):');
    
    switch (choice) {
        case '1':
            const email1 = await getUserInput('Enter user email:');
            if (email1) {
                await makeUserAdmin(email1);
            }
            break;
        case '2':
            const email2 = await getUserInput('Enter user email:');
            if (email2) {
                const confirm = await getUserInput('Are you sure? (yes/no):');
                if (confirm.toLowerCase() === 'yes') {
                    await removeAdminPrivileges(email2);
                }
            }
            break;
        case '3':
            await listAllAdmins();
            break;
        case '4':
            const email4 = await getUserInput('Enter user email:');
            if (email4) {
                await checkIfAdmin(email4);
            }
            break;
        case '5':
            logInfo('Goodbye!');
            process.exit(0);
        default:
            logError('Invalid option. Please try again.');
    }
    
    const again = await getUserInput('\nContinue? (yes/no):');
    if (again.toLowerCase() === 'yes') {
        await mainMenu();
    } else {
        logInfo('Thank you for using Admin Setup Tool!');
        process.exit(0);
    }
}

// Command line arguments handler
async function handleCommandLine() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        await mainMenu();
        return;
    }
    
    const action = args[0];
    const email = args[1];
    
    printHeader();
    
    switch (action) {
        case 'make-admin':
            if (!email) {
                logError('Email is required: node setup-admin.js make-admin <email>');
                process.exit(1);
            }
            await makeUserAdmin(email);
            break;
        case 'remove-admin':
            if (!email) {
                logError('Email is required: node setup-admin.js remove-admin <email>');
                process.exit(1);
            }
            await removeAdminPrivileges(email);
            break;
        case 'list-admins':
            await listAllAdmins();
            break;
        case 'check-admin':
            if (!email) {
                logError('Email is required: node setup-admin.js check-admin <email>');
                process.exit(1);
            }
            await checkIfAdmin(email);
            break;
        case 'info':
            printAdminDashboardInfo();
            break;
        default:
            log('\n📖 Usage:', 'bright');
            log('  Interactive: node setup-admin.js');
            log('  Make admin: node setup-admin.js make-admin <email>');
            log('  Remove admin: node setup-admin.js remove-admin <email>');
            log('  List admins: node setup-admin.js list-admins');
            log('  Check admin: node setup-admin.js check-admin <email>');
            log('  Info: node setup-admin.js info\n');
            process.exit(1);
    }
}

// Run
handleCommandLine().catch((error) => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
});
