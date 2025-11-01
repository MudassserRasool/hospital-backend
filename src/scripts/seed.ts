// Database seeding script
// Run with: ts-node src/scripts/seed.ts

async function seed() {
  console.log('Starting database seeding...');
  // Add your seeding logic here
  console.log('Seeding completed!');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
