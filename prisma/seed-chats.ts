
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding chats ...');

    const adminEmail = 'admin@example.com';
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!admin) {
        console.error(`Admin user (${adminEmail}) not found. Please run 'npx prisma db seed' first.`);
        return;
    }

    // Find 5 random other users
    const count = await prisma.user.count({
        where: { NOT: { id: admin.id } }
    });

    if (count === 0) {
        console.error('No other users found.');
        return;
    }

    const otherUsers = await prisma.user.findMany({
        where: { NOT: { id: admin.id } },
        take: 5
    });

    console.log(`Found ${otherUsers.length} users to chat with.`);

    for (const user of otherUsers) {
        // 1. Ensure Friendship exists
        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userAId: admin.id, userBId: user.id },
                    { userAId: user.id, userBId: admin.id }
                ]
            }
        });

        if (!existingFriendship) {
            // Determine who is A and who is B (schema doesn't strictly enforce, but let's be consistent or just create one)
            await prisma.friendship.create({
                data: {
                    userAId: admin.id,
                    userBId: user.id,
                    status: 'FRIEND'
                }
            });
            console.log(`  - Created friendship with ${user.name}`);
        } else {
            console.log(`  - Friendship already exists with ${user.name}`);
        }

        // 2. Create Messages
        const numMessages = faker.number.int({ min: 5, max: 15 });
        let currentTime = new Date();
        currentTime.setDate(currentTime.getDate() - 1); // Start 1 day ago

        for (let i = 0; i < numMessages; i++) {
            currentTime = new Date(currentTime.getTime() + faker.number.int({ min: 1000 * 60, max: 1000 * 60 * 60 })); // Add minutes/hours

            const isFromAdmin = faker.datatype.boolean();

            await prisma.chatMessage.create({
                data: {
                    content: faker.hacker.phrase(), // Use hacker phrases for techy feel or just lorem
                    senderId: isFromAdmin ? admin.id : user.id,
                    receiverId: isFromAdmin ? user.id : admin.id,
                    isRead: true, // Mark as read
                    createdAt: currentTime
                }
            });
        }
        console.log(`  - Created ${numMessages} messages with ${user.name}`);
    }

    console.log('Chat seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
