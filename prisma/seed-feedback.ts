
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding feedback...");

    // Find some users and posts to use
    const user = await prisma.user.findFirst();
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } }) || user;
    const post = await prisma.post.findFirst();

    if (!user) {
        console.log("No users found. Creating one...");
    }

    // Create Suggestions
    await prisma.feedback.createMany({
        data: [
            {
                userId: user?.id,
                content: "Please add a dark mode feature.",
                type: "SUGGESTION",
                status: "PENDING",
                contact: "user@example.com"
            },
            {
                userId: user?.id,
                content: "The chat notification is too loud.",
                type: "SUGGESTION",
                status: "PENDING"
            },
            {
                userId: admin?.id,
                content: "We should add more categories for interests.",
                type: "SUGGESTION",
                status: "PROCESSED"
            }
        ]
    });
    console.log("Created suggestions");

    // Create Reports
    // Report a user
    if (user && admin) {
        await prisma.feedback.create({
            data: {
                userId: admin.id,
                content: "This user is spamming.",
                type: "REPORT",
                status: "PENDING",
                reportType: "USER",
                reportedUserId: user.id
            }
        });
        console.log("Created user report");
    }

    // Report a post
    if (user && post) {
        await prisma.feedback.create({
            data: {
                userId: user.id,
                content: "Inappropriate content in this post.",
                type: "REPORT",
                status: "PENDING",
                reportType: "POST",
                reportedPostId: post.id
            }
        });
        console.log("Created post report");
    }

    console.log("Feedback seeding completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
