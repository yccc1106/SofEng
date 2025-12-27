
import { PrismaClient, Role, Gender } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Constants
const USER_COUNT = 200; // Increased for "very much data" but kept reasonable for performance
const TEAM_COUNT = 50;
const POSTS_PER_USER_MIN = 3;
const POSTS_PER_USER_MAX = 8;
const MAX_COMMENTS_PER_POST = 10;
const MAX_LIKES_PER_POST = 20;

const SCHOOLS = ['Harvard University', 'Stanford University', 'MIT', 'Tsinghua University', 'Peking University', 'Oxford', 'Cambridge', 'ETH Zurich', 'NUS', 'UCLA'];
const MAJORS = ['Computer Science', 'Physics', 'Mathematics', 'Economics', 'Psychology', 'Art', 'Biology', 'Chemistry', 'Engineering', 'Philosophy'];
const GRADES = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Master', 'PhD'];
const MBTI_TYPES = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];

async function main() {
    console.log('🚀 Start seeding ...');
    const hashedPassword = await bcrypt.hash('password', 10);

    // ----------------------------------------------------------------------
    // 0. CLEANUP
    // ----------------------------------------------------------------------
    console.log('🧹 Cleaning up database...');
    // Delete in reverse order of dependency
    await prisma.feedback.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.postComment.deleteMany();
    await prisma.postLike.deleteMany();
    await prisma.postCollection.deleteMany();
    await prisma.post.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.friendRequest.deleteMany();
    await prisma.friendship.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // ----------------------------------------------------------------------
    // 1. CREATE CATEGORIES
    // ----------------------------------------------------------------------
    console.log('🏷️ Creating categories...');
    const categoryDetails = [
        { name: 'Sports', children: ['Basketball', 'Soccer', 'Tennis', 'Swimming', 'Running', 'Gym'] },
        { name: 'Tech', children: ['Programming', 'AI', 'Gadgets', 'WebDev', 'Mobile', 'Hardware'] },
        { name: 'Arts', children: ['Music', 'Painting', 'Photography', 'Design', 'Dance', 'Writing'] },
        { name: 'Games', children: ['RPG', 'FPS', 'MOBA', 'Strategy', 'Indie', 'Tabletop'] },
        { name: 'Life', children: ['Food', 'Travel', 'Fashion', 'Pets', 'Health', 'Relationships'] },
        { name: 'Academic', children: ['Math', 'Physics', 'Literature', 'History', 'Philosophy'] },
    ];

    let allCategories = [];

    for (const cat of categoryDetails) {
        const parent = await prisma.category.create({
            data: {
                name: cat.name,
                description: `All about ${cat.name}`,
                usageCount: faker.number.int({ min: 100, max: 10000 })
            }
        });
        allCategories.push(parent);

        for (const childName of cat.children) {
            const child = await prisma.category.create({
                data: {
                    name: childName,
                    parentId: parent.id,
                    description: `${childName} related discussions`,
                    usageCount: faker.number.int({ min: 50, max: 5000 })
                }
            });
            allCategories.push(child);
        }
    }
    console.log(`✅ Created ${allCategories.length} categories.`);

    // ----------------------------------------------------------------------
    // 2. CREATE USERS
    // ----------------------------------------------------------------------
    console.log(`👥 Creating ${USER_COUNT} users...`);
    const users = [];

    // Create Admin
    const admin = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'ADMIN',
            gender: 'SECRET',
            bio: 'System Administrator',
            personalityType: 'INTJ',
            image: faker.image.avatar(),
        },
    });
    users.push(admin);
    console.log('   - Created Admin: admin@example.com');

    // Create Normal Users
    await prisma.user.createMany({
        data: Array.from({ length: USER_COUNT }).map(() => {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            return {
                name: `${firstName} ${lastName}`,
                email: faker.internet.email({ firstName, lastName }).toLowerCase(),
                password: hashedPassword,
                role: 'USER',
                gender: faker.helpers.arrayElement(Object.values(Gender)),
                studentId: faker.string.numeric(8),
                school: faker.helpers.arrayElement(SCHOOLS),
                major: faker.helpers.arrayElement(MAJORS),
                grade: faker.helpers.arrayElement(GRADES),
                bio: faker.person.bio(),
                personalityType: faker.helpers.arrayElement(MBTI_TYPES),
                personalityTags: faker.helpers.arrayElements(['Analytical', 'Creative', 'Leader', 'Team Player', 'Detail-oriented', 'Visionary', 'Empathetic', 'Strategic'], { min: 1, max: 4 }),
                image: faker.image.avatar(),
                phoneNumber: faker.phone.number(),
                status: faker.helpers.arrayElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'BANNED']), // Mostly active
            };
        })
    });

    // Fetch all users back to get their IDs
    const allUsers = await prisma.user.findMany();
    // Exclude admin from random pools sometimes
    const normalUsers = allUsers.filter(u => u.id !== admin.id);

    console.log(`✅ Created ${allUsers.length} total users.`);

    // ----------------------------------------------------------------------
    // 3. CREATE TEAMS
    // ----------------------------------------------------------------------
    console.log(`🛡️ Creating ${TEAM_COUNT} teams...`);

    for (let i = 0; i < TEAM_COUNT; i++) {
        const creator = faker.helpers.arrayElement(allUsers);
        const randomCategory = faker.helpers.arrayElement(allCategories);

        const team = await prisma.team.create({
            data: {
                name: faker.company.name() + ' ' + faker.helpers.arrayElement(['Group', 'Club', 'Squad', 'Team']),
                description: faker.lorem.paragraph(),
                type: faker.helpers.arrayElement(['GAME', 'STUDY', 'SPORT', 'PROJECT', 'MUSIC', 'TRAVEL']),
                maxMembers: faker.number.int({ min: 5, max: 20 }),
                status: faker.helpers.arrayElement(['RECRUITING', 'FULL', 'RECRUITING', 'RECRUITING']),
                creatorId: creator.id,
                categoryId: randomCategory.id,
                members: {
                    create: {
                        userId: creator.id,
                        role: 'LEADER',
                        status: 'JOINED'
                    }
                }
            },
        });

        // Add random members
        const potentialMembers = allUsers.filter(u => u.id !== creator.id);
        const membersToAdd = faker.helpers.arrayElements(potentialMembers, { min: 2, max: Math.min(15, team.maxMembers - 1) });

        const memberData = membersToAdd.map(member => ({
            teamId: team.id,
            userId: member.id,
            role: 'MEMBER',
            status: 'JOINED',
            joinedAt: faker.date.past()
        }));

        if (memberData.length > 0) {
            await prisma.teamMember.createMany({ data: memberData });
        }
    }
    console.log('✅ Teams created.');

    // ----------------------------------------------------------------------
    // 4. CREATE FRIENDSHIPS & REQUESTS
    // ----------------------------------------------------------------------
    console.log('🤝 Creating friendships...');

    // Make sure Admin has friends
    const adminFriends = faker.helpers.arrayElements(normalUsers, { min: 5, max: 20 });
    for (const friend of adminFriends) {
        await prisma.friendship.create({
            data: {
                userAId: admin.id,
                userBId: friend.id,
                status: 'FRIEND'
            }
        });
    }

    // Random friendships between others
    for (let i = 0; i < USER_COUNT * 2; i++) {
        const userA = faker.helpers.arrayElement(normalUsers);
        const userB = faker.helpers.arrayElement(normalUsers);
        if (userA.id === userB.id) continue;

        // Ensure uniqueness (lazy way: ignore errors or check constraints, but createMany doesn't support relation well here)
        // We will just try/catch individually to avoid stopping execution
        try {
            // Check if exists
            const exists = await prisma.friendship.findFirst({
                where: {
                    OR: [
                        { userAId: userA.id, userBId: userB.id },
                        { userAId: userB.id, userBId: userA.id }
                    ]
                }
            });

            if (!exists) {
                await prisma.friendship.create({
                    data: {
                        userAId: userA.id,
                        userBId: userB.id,
                        status: 'FRIEND'
                    }
                });
            }
        } catch (e) {
            // ignore unique constraint violations
        }
    }
    console.log('✅ Friendships created.');

    // ----------------------------------------------------------------------
    // 5. CREATE POSTS & INTERACTIONS
    // ----------------------------------------------------------------------
    console.log('📝 Creating posts and interactions...');

    const postsData = [];

    for (const user of allUsers) {
        const numberOfPosts = faker.number.int({ min: POSTS_PER_USER_MIN, max: POSTS_PER_USER_MAX });

        for (let i = 0; i < numberOfPosts; i++) {
            // We can't use createMany because of relations (likes, comments etc) which we want to seed richly
            // But for performance with 1000 users * 5 posts = 5000 posts, single inserts might be slow.
            // We will do single inserts to properly link categories and data.

            const randomCategory = faker.helpers.arrayElement(allCategories);

            const post = await prisma.post.create({
                data: {
                    title: faker.lorem.sentence(),
                    content: faker.lorem.paragraphs({ min: 1, max: 3 }),
                    authorId: user.id,
                    categoryId: randomCategory.id,
                    tags: faker.helpers.arrayElements(['Life', 'Tech', 'Art', 'Music', 'Sport', 'Study', 'Career', 'Travel', 'Food', 'Gaming'], { min: 1, max: 4 }),
                    viewCount: faker.number.int({ min: 0, max: 5000 }),
                    status: 'PUBLISHED',
                    createdAt: faker.date.past()
                }
            });

            // Random Likes
            const likers = faker.helpers.arrayElements(allUsers, { min: 0, max: MAX_LIKES_PER_POST });
            if (likers.length > 0) {
                await prisma.postLike.createMany({
                    data: likers.map(u => ({ userId: u.id, postId: post.id }))
                });
            }

            // Random Comments
            const commenters = faker.helpers.arrayElements(allUsers, { min: 0, max: MAX_COMMENTS_PER_POST });
            if (commenters.length > 0) {
                await prisma.postComment.createMany({
                    data: commenters.map(u => ({
                        userId: u.id,
                        postId: post.id,
                        content: faker.lorem.sentence(),
                        createdAt: faker.date.recent()
                    }))
                });
            }

            // Random Collections
            const collectors = faker.helpers.arrayElements(allUsers, { min: 0, max: 5 });
            if (collectors.length > 0) {
                await prisma.postCollection.createMany({
                    data: collectors.map(u => ({ userId: u.id, postId: post.id }))
                });
            }
        }
    }
    console.log('✅ Posts created.');

    // ----------------------------------------------------------------------
    // 6. CREATE CHATS
    // ----------------------------------------------------------------------
    console.log('💬 Creating chat messages...');

    // Get all friendships to seed chats between friends
    const friendships = await prisma.friendship.findMany({ take: 100 }); // Seed chats for 100 friendship pairs

    for (const friendship of friendships) {
        const numMessages = faker.number.int({ min: 5, max: 20 });
        let currentTime = new Date();
        currentTime.setDate(currentTime.getDate() - 30); // Start 30 days ago

        const messages = [];
        for (let i = 0; i < numMessages; i++) {
            currentTime = new Date(currentTime.getTime() + faker.number.int({ min: 1000 * 60, max: 1000 * 60 * 60 * 24 }));
            const isFromA = faker.datatype.boolean();

            messages.push({
                content: faker.hacker.phrase(),
                senderId: isFromA ? friendship.userAId : friendship.userBId,
                receiverId: isFromA ? friendship.userBId : friendship.userAId,
                isRead: true,
                createdAt: currentTime
            });
        }
        await prisma.chatMessage.createMany({ data: messages });
    }
    console.log('✅ Chats created.');

    // ----------------------------------------------------------------------
    // 7. CREATE FEEDBACK
    // ----------------------------------------------------------------------
    console.log('📢 Creating feedback...');

    const feedbackData = [];
    const somePost = await prisma.post.findFirst();

    // Suggestions
    for (let i = 0; i < 30; i++) {
        const user = faker.helpers.arrayElement(allUsers);
        feedbackData.push({
            userId: user.id,
            content: faker.lorem.paragraph(),
            type: "SUGGESTION",
            status: faker.helpers.arrayElement(["PENDING", "PROCESSED", "RESOLVED"]),
            contact: user.email
        });
    }

    // Reports (User)
    for (let i = 0; i < 10; i++) {
        const reporter = faker.helpers.arrayElement(allUsers);
        const reported = faker.helpers.arrayElement(allUsers);
        feedbackData.push({
            userId: reporter.id,
            content: "This user is being abusive.",
            type: "REPORT",
            status: "PENDING",
            reportType: "USER",
            reportedUserId: reported.id
        });
    }

    // Reports (Post)
    if (somePost) {
        for (let i = 0; i < 10; i++) {
            const reporter = faker.helpers.arrayElement(allUsers);
            feedbackData.push({
                userId: reporter.id,
                content: "Inappropriate content.",
                type: "REPORT",
                status: "PENDING",
                reportType: "POST",
                reportedPostId: somePost.id
            });
        }
    }

    await prisma.feedback.createMany({ data: feedbackData });
    console.log('✅ Feedback created.');

    console.log('🎉 Seeding finished successfully!');
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
