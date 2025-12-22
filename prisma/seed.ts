
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
    await prisma.category.deleteMany(); // Added cleanup
    await prisma.user.deleteMany();

    // 0. CREATE CATEGORIES (Interests) - Moved up
    const categoryDetails = [
        { name: 'Sports', children: ['Basketball', 'Soccer', 'Tennis'] },
        { name: 'Tech', children: ['Programming', 'AI', 'Gadgets'] },
        { name: 'Arts', children: ['Music', 'Painting', 'Photography'] },
        { name: 'Games', children: ['RPG', 'FPS', 'MOBA'] },
    ];

    let allCategories = [];

    for (const cat of categoryDetails) {
        const parent = await prisma.category.create({
            data: {
                name: cat.name,
                description: `All about ${cat.name}`,
                usageCount: faker.number.int({ min: 100, max: 1000 })
            }
        });
        allCategories.push(parent);

        for (const childName of cat.children) {
            const child = await prisma.category.create({
                data: {
                    name: childName,
                    parentId: parent.id,
                    description: `${childName} related discussions`,
                    usageCount: faker.number.int({ min: 50, max: 500 })
                }
            });
            allCategories.push(child);
        }
    }
    console.log('Created interest categories.');

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
        const randomCategory = faker.helpers.arrayElement(allCategories);
        const team = await prisma.team.create({
            data: {
                name: faker.company.name() + ' ' + faker.helpers.arrayElement(['Group', 'Club', 'Squad', 'Team']),
                description: faker.lorem.paragraph(),
                type: faker.helpers.arrayElement(['GAME', 'STUDY', 'SPORT', 'PROJECT', 'MUSIC', 'TRAVEL']),
                maxMembers: faker.number.int({ min: 5, max: 20 }),
                status: faker.helpers.arrayElement(['RECRUITING', 'FULL', 'RECRUITING', 'RECRUITING']), // Weighted towards recruiting
                creatorId: creator.id,
                categoryId: randomCategory.id, // Assign category
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
            const randomCategory = faker.helpers.arrayElement(allCategories);
            await prisma.post.create({
                data: {
                    title: faker.lorem.sentence(),
                    content: faker.lorem.paragraphs({ min: 1, max: 5 }),
                    authorId: user.id,
                    categoryId: randomCategory.id, // Assign category
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
