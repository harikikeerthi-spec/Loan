const { Client } = require('pg');
require('dotenv').config();

const ALLOWED_ROLES = ['admin', 'user', 'staff', 'super_admin', 'agent', 'bank', 'student'];

async function main() {
    const args = process.argv.slice(2);
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    try {
        if (args.length < 2) {
            console.log('\n=== CURRENT USERS IN DATABASE ===');
            const res = await client.query("SELECT id, email, role, \"firstName\", \"lastName\", \"staffId\" FROM \"User\" ORDER BY \"createdAt\" DESC LIMIT 50");
            
            if (res.rows.length === 0) {
                console.log('No users found in the database. Please sign up an account first!');
            } else {
                console.table(res.rows.map(u => ({
                    ID: u.id,
                    Email: u.email,
                    Name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'N/A',
                    Role: u.role,
                    StaffId: u.staffId || 'None'
                })));
            }

            console.log('\n=== USAGE INSTRUCTIONS ===');
            console.log('To promote/change a user\'s role, run:');
            console.log('  node scratch/promote-user.js <email> <role>');
            console.log('\nExamples:');
            console.log('  node scratch/promote-user.js myemail@gmail.com admin');
            console.log('  node scratch/promote-user.js myemail@gmail.com staff');
            console.log(`\nAllowed roles: ${ALLOWED_ROLES.join(', ')}`);
            return;
        }

        const email = args[0].trim().toLowerCase();
        const role = args[1].trim().toLowerCase();

        if (!ALLOWED_ROLES.includes(role)) {
            console.error(`\nError: Invalid role "${role}". Allowed roles are: ${ALLOWED_ROLES.join(', ')}`);
            return;
        }

        console.log(`\nSearching for user with email: ${email}...`);
        const userRes = await client.query("SELECT * FROM \"User\" WHERE LOWER(email) = $1", [email]);
        
        if (userRes.rows.length === 0) {
            console.error(`Error: User with email "${email}" not found! Please register/signup via the website first.`);
            return;
        }

        const user = userRes.rows[0];
        console.log(`Found user: ${user.firstName || ''} ${user.lastName || ''} (${user.email}) - Current Role: ${user.role}`);

        let staffId = user.staffId;
        if (role === 'staff' && !staffId) {
            console.log('Generating sequential Staff ID for the staff role...');
            // Fetch all staff IDs
            const staffRes = await client.query("SELECT \"staffId\" FROM \"User\" WHERE \"staffId\" LIKE 'VL-SF-%'");
            const prefix = 'VL-SF-';
            let nextSeq = 1;

            if (staffRes.rows.length > 0) {
                const numericIds = staffRes.rows
                    .map(r => {
                        if (!r.staffId) return 0;
                        const suffix = r.staffId.substring(prefix.length);
                        const num = parseInt(suffix, 10);
                        return isNaN(num) ? 0 : num;
                    })
                    .filter(n => n > 0);

                if (numericIds.length > 0) {
                    nextSeq = Math.max(...numericIds) + 1;
                }
            }

            staffId = `${prefix}${String(nextSeq).padStart(3, '0')}`;
            console.log(`Generated Staff ID: ${staffId}`);
        }

        console.log(`Updating role to "${role}"...`);
        if (role === 'staff' && staffId) {
            await client.query("UPDATE \"User\" SET role = $1, \"staffId\" = $2 WHERE LOWER(email) = $3", [role, staffId, email]);
        } else {
            await client.query("UPDATE \"User\" SET role = $1 WHERE LOWER(email) = $2", [role, email]);
        }

        console.log(`\nSuccess! User ${email} has been updated to "${role}".`);
        
        // Verify update
        const verifyRes = await client.query("SELECT id, email, role, \"firstName\", \"lastName\", \"staffId\" FROM \"User\" WHERE LOWER(email) = $1", [email]);
        console.table(verifyRes.rows);

    } catch (e) {
        console.error('An error occurred:', e);
    } finally {
        await client.end();
    }
}

main();
