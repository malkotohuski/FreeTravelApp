const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  await prisma.user.deleteMany(); // изчистваме предишните user-и

  const users = [
    {
      username: 'Shushkata',
      fName: 'Vili',
      lName: 'Dimitrova',
      userImage: null,
      averageRating: 0,
      email: 'vili@example.com',
      password: await bcrypt.hash('123456', 10), // default password
    },
    {
      username: 'FastRider',
      fName: 'Daniel',
      lName: 'Ivanov',
      userImage: 'https://i.pravatar.cc/150?img=5',
      averageRating: 4.5,
      email: 'daniel@example.com',
      password: await bcrypt.hash('123456', 10),
    },
    {
      username: 'CityExplorer',
      fName: 'Maya',
      lName: 'Petrova',
      userImage: 'https://i.pravatar.cc/150?img=12',
      averageRating: 3.7,
      email: 'maya@example.com',
      password: await bcrypt.hash('123456', 10),
    },
    {
      username: 'NightOwl',
      fName: 'Georgi',
      lName: 'Kolev',
      userImage: 'https://i.pravatar.cc/150?img=20',
      averageRating: 5,
      email: 'georgi@example.com',
      password: await bcrypt.hash('123456', 10),
    },
  ];

  for (const user of users) {
    await prisma.user.create({data: user});
  }

  console.log('✅ Seed done: 4 users added!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
