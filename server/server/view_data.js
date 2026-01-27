const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('Fetching users from database...')
    const users = await prisma.user.findMany()
    if (users.length === 0) {
        console.log('No users found in the database.')
    } else {
        console.log('Found ' + users.length + ' user(s):')
        console.dir(users, { depth: null, colors: true })
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
