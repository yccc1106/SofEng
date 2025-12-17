
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
    for (let i = 0; i < 20; i++) {
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
                personalityTags: faker.helpers.arrayElements(['Analytical', 'Creative', 'Leader', 'Team Player', 'Detail-oriented', 'Visionary'], { min: 1, max: 3 }),
                image: faker.image.avatar(),
                phoneNumber: faker.phone.number(),
            },
        });
        users.push(user);
        console.log(`Created user: ${user.email}`);
    }

    // 2. CREATE TEAMS
    const teams = [];
    for (let i = 0; i < 5; i++) {
        const creator = faker.helpers.arrayElement(users);
        const team = await prisma.team.create({
            data: {
                name: faker.company.name() + ' Team',
                description: faker.lorem.sentence(),
                type: faker.helpers.arrayElement(['GAME', 'STUDY', 'SPORT', 'PROJECT']),
                maxMembers: faker.number.int({ min: 3, max: 10 }),
                status: 'RECRUITING',
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
        console.log(`Created team: ${team.name}`);

        // Add random members
        const potentialMembers = users.filter(u => u.id !== creator.id);
        const membersToAdd = faker.helpers.arrayElements(potentialMembers, { min: 0, max: 3 });

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

    // 3. CREATE POSTS
    for (const user of users) {
        const numberOfPosts = faker.number.int({ min: 0, max: 3 });
        for (let i = 0; i < numberOfPosts; i++) {
            await prisma.post.create({
                data: {
                    title: faker.lorem.sentence(),
                    content: faker.lorem.paragraphs(),
                    authorId: user.id,
                    tags: faker.helpers.arrayElements(['Life', 'Tech', 'Art', 'Music', 'Sport', 'Study'], { min: 1, max: 3 }),
                    viewCount: faker.number.int({ min: 0, max: 1000 }),
                    status: 'PUBLISHED',
                    // Randomly add likes
                    likes: {
                        create: faker.helpers.arrayElements(users, { min: 0, max: 5 }).map(u => ({
                            userId: u.id
                        }))
                    }
                },
            });
        }
    }

    // 4. CREATE FRIENDSHIPS
    // Simple random logic to create some friendships
    for (let i = 0; i < 15; i++) {
        const userA = faker.helpers.arrayElement(users);
        const userB = faker.helpers.arrayElement(users.filter(u => u.id !== userA.id));

        // Check if exists (simplified)
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
