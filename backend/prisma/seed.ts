import { seedRoles } from "./seeds/roles.seed";
import { seedPermissions } from "./seeds/permissions.seed";
import { seedRolePermissions } from "./seeds/rolePermissions.seed";
import { seedAdmin } from "./seeds/admin.seed";

async function main() {
  console.log("🌱 Starting database seed...");

  await seedRoles();
  await seedPermissions();
  await seedRolePermissions();
  await seedAdmin();

  console.log("🎉 Database seeded successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });