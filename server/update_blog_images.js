
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Updating blog images...');

    // Update all blogs with local images
    const blogs = await prisma.blog.findMany();

    for (let i = 0; i < blogs.length; i++) {
        const blog = blogs[i];
        let newImage = `assets/img/blog_${(i % 3) + 1}.png`; // We have 3 blog images

        await prisma.blog.update({
            where: { id: blog.id },
            data: {
                featuredImage: newImage,
                authorImage: 'assets/img/avatar_2.png', // Using our generated avatar
            },
        });
        console.log(`Updated blog: ${blog.title} with image: ${newImage}`);
    }

    console.log('Done!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
