
import { PrismaClient, Role, Gender } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SCHOOLS = ['Harvard University', 'Stanford University', 'MIT', 'Tsinghua University', 'Peking University'];
const MAJORS = ['Computer Science', 'Physics', 'Mathematics', 'Economics', 'Psychology', 'Art'];
const GRADES = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Master', 'PhD'];
const MBTI_TYPES = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];

async function main() {
    const hashedPassword = await bcrypt.hash('password', 10);
    console.log('Start seeding ...');

    // CLEANUP
    await prisma.postComment.deleteMany();
    await prisma.postLike.deleteMany();
    await prisma.postCollection.deleteMany();
    await prisma.post.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.friendRequest.deleteMany();
    await prisma.friendship.deleteMany();
    await prisma.feedback.deleteMany();
    await prisma.user.deleteMany();

    // 1. CREATE USERS
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
        },
    });
    users.push(admin);
    console.log(`Created admin user: ${admin.email}`);

    // Create Normal Users
    // Increase to 100 users
    for (let i = 0; i < 100; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const user = await prisma.user.create({
            data: {
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
            },
        });
        users.push(user);
    }
    console.log(`Created ${users.length - 1} normal users.`);

    // 2. CREATE TEAMS
    const teams = [];
    // Increase to 20 teams
    for (let i = 0; i < 20; i++) {
        const creator = faker.helpers.arrayElement(users);
        const team = await prisma.team.create({
            data: {
                name: faker.company.name() + ' ' + faker.helpers.arrayElement(['Group', 'Club', 'Squad', 'Team']),
                description: faker.lorem.paragraph(),
                type: faker.helpers.arrayElement(['GAME', 'STUDY', 'SPORT', 'PROJECT', 'MUSIC', 'TRAVEL']),
                maxMembers: faker.number.int({ min: 5, max: 20 }),
                status: faker.helpers.arrayElement(['RECRUITING', 'FULL', 'RECRUITING', 'RECRUITING']), // Weighted towards recruiting
                creatorId: creator.id,
                members: {
                    create: {
                        userId: creator.id,
                        role: 'LEADER',
                        status: 'JOINED'
                    }
                }
            },
        });
        teams.push(team);

        // Add random members
        const potentialMembers = users.filter(u => u.id !== creator.id);
        const membersToAdd = faker.helpers.arrayElements(potentialMembers, { min: 2, max: Math.min(10, team.maxMembers - 1) });

        for (const member of membersToAdd) {
            await prisma.teamMember.create({
                data: {
                    teamId: team.id,
                    userId: member.id,
                    role: 'MEMBER',
                    status: 'JOINED'
                }
            });
        }
    }
    console.log(`Created ${teams.length} teams.`);

    // 3. CREATE POSTS
    for (const user of users) {
        // Increase posts per user to 5-10
        const numberOfPosts = faker.number.int({ min: 5, max: 10 });
        for (let i = 0; i < numberOfPosts; i++) {
            await prisma.post.create({
                data: {
                    title: faker.lorem.sentence(),
                    content: faker.lorem.paragraphs({ min: 1, max: 5 }),
                    authorId: user.id,
                    tags: faker.helpers.arrayElements(['Life', 'Tech', 'Art', 'Music', 'Sport', 'Study', 'Career', 'Travel', 'Food', 'Gaming'], { min: 1, max: 4 }),
                    viewCount: faker.number.int({ min: 0, max: 5000 }),
                    status: 'PUBLISHED',
                    // Randomly add likes
                    likes: {
                        create: faker.helpers.arrayElements(users, { min: 0, max: 20 }).map(u => ({
                            userId: u.id
                        }))
                    },
                    // Randomly add collections
                    collections: {
                        create: faker.helpers.arrayElements(users, { min: 0, max: 5 }).map(u => ({
                            userId: u.id
                        }))
                    },
                    // Randomly add comments
                    comments: {
                        create: faker.helpers.arrayElements(users, { min: 0, max: 5 }).map(u => ({
                            userId: u.id,
                            content: faker.lorem.sentence()
                        }))
                    }
                },
            });
        }
    }
    console.log('Created posts for all users.');

    // 4. CREATE FRIENDSHIPS
    // Create random friendships
    for (let i = 0; i < 200; i++) {
        const userA = faker.helpers.arrayElement(users);
        const userB = faker.helpers.arrayElement(users.filter(u => u.id !== userA.id));

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
    }
    console.log('Created friendships.');

    // 5. CREATE CHAT MESSAGES
    // Direct Messages between friends
    const friendships = await prisma.friendship.findMany();
    for (const friendship of friendships) {
        // Randomly decide if they have chatted
        if (faker.datatype.boolean(0.7)) {
            const numMessages = faker.number.int({ min: 1, max: 20 });
            for (let m = 0; m < numMessages; m++) {
                const senderId = faker.datatype.boolean() ? friendship.userAId : friendship.userBId;
                const receiverId = senderId === friendship.userAId ? friendship.userBId : friendship.userAId;

                await prisma.chatMessage.create({
                    data: {
                        content: faker.lorem.sentence(),
                        type: 'TEXT',
                        senderId: senderId,
                        receiverId: receiverId,
                        isRead: faker.datatype.boolean(0.8),
                        createdAt: faker.date.recent({ days: 30 })
                    }
                });
            }
        }
    }

    // Team Messages
    for (const team of teams) {
        // Get team members
        const teamMembers = await prisma.teamMember.findMany({ where: { teamId: team.id } });
        if (teamMembers.length > 0) {
            const numMessages = faker.number.int({ min: 5, max: 50 });
            for (let m = 0; m < numMessages; m++) {
                const senderMember = faker.helpers.arrayElement(teamMembers);
                await prisma.chatMessage.create({
                    data: {
                        content: faker.lorem.sentence(),
                        type: 'TEXT',
                        senderId: senderMember.userId,
                        teamId: team.id,
                        isRead: true, // Simplified for team chat
                        createdAt: faker.date.recent({ days: 30 })
                    }
                });
            }
        }
    }
    console.log('Created chat messages.');


    // 6. CREATE FEEDBACK (Suggestions & Reports)

    // 6.1 Suggestions
    for (let i = 0; i < 15; i++) {
        const user = faker.helpers.arrayElement(users);
        await prisma.feedback.create({
            data: {
                userId: user.id,
                content: faker.lorem.paragraph(),
                type: 'SUGGESTION',
                status: faker.helpers.arrayElement(['PENDING', 'PROCESSED', 'ADOPTED', 'IGNORED']),
                contact: user.email,
            }
        });
    }

    // 6.2 User Reports
    for (let i = 0; i < 10; i++) {
        const reporter = faker.helpers.arrayElement(users);
        const reportedUser = faker.helpers.arrayElement(users.filter(u => u.id !== reporter.id));
        await prisma.feedback.create({
            data: {
                userId: reporter.id,
                content: `Report user: ${reportedUser.name}. Reason: ${faker.lorem.sentence()}`,
                type: 'REPORT',
                reportType: 'USER',
                reportedUserId: reportedUser.id,
                status: faker.helpers.arrayElement(['PENDING', 'RESOLVED', 'IGNORED']),
            }
        });
    }

    // 6.3 Post Reports
    const allPosts = await prisma.post.findMany({ take: 50 });
    if (allPosts.length > 0) {
        for (let i = 0; i < 10; i++) {
            const reporter = faker.helpers.arrayElement(users);
            const reportedPost = faker.helpers.arrayElement(allPosts);
            await prisma.feedback.create({
                data: {
                    userId: reporter.id,
                    content: `Report post: ${reportedPost.title}. Reason: ${faker.lorem.sentence()}`,
                    type: 'REPORT',
                    reportType: 'POST',
                    reportedPostId: reportedPost.id,
                    status: faker.helpers.arrayElement(['PENDING', 'RESOLVED', 'IGNORED']),
                }
            });
        }
    }

    // 6.4 Message Reports
    const allMessages = await prisma.chatMessage.findMany({ take: 50 });
    if (allMessages.length > 0) {
        for (let i = 0; i < 10; i++) {
            const reporter = faker.helpers.arrayElement(users);
            const reportedMessage = faker.helpers.arrayElement(allMessages);
            await prisma.feedback.create({
                data: {
                    userId: reporter.id,
                    content: `Report message: "${reportedMessage.content.substring(0, 20)}...". Reason: ${faker.lorem.sentence()}`,
                    type: 'REPORT',
                    reportType: 'MESSAGE',
                    reportedMessageId: reportedMessage.id,
                    status: faker.helpers.arrayElement(['PENDING', 'RESOLVED', 'IGNORED']),
                }
            });
        }
    }
    console.log('Created feedback.');


    // 7. CREATE CATEGORIES (Interests)
    const categories = [
        { name: 'Sports', children: ['Basketball', 'Soccer', 'Tennis'] },
        { name: 'Tech', children: ['Programming', 'AI', 'Gadgets'] },
        { name: 'Arts', children: ['Music', 'Painting', 'Photography'] },
        { name: 'Games', children: ['RPG', 'FPS', 'MOBA'] },
    ];

    for (const cat of categories) {
        const parent = await prisma.category.create({
            data: {
                name: cat.name,
                description: `All about ${cat.name}`,
                usageCount: faker.number.int({ min: 100, max: 1000 })
            }
        });

        for (const childName of cat.children) {
            await prisma.category.create({
                data: {
                    name: childName,
                    parentId: parent.id,
                    description: `${childName} related discussions`,
                    usageCount: faker.number.int({ min: 50, max: 500 })
                }
            });
        }
    }
    console.log('Created interest categories.');

    console.log('Seeding finished.');
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
