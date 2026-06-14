import { PrismaClient } from "@prisma/client";
import { LOCATION_DATASET } from "../src/modules/locations/locations.dataset";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding locations…");
  for (const loc of LOCATION_DATASET) {
    await prisma.location.upsert({
      where: { id: loc.id },
      update: {},
      create: {
        id: loc.id,
        lat: loc.lat,
        lng: loc.lng,
        country: loc.country ?? null,
        city: loc.city ?? null,
        provider: loc.provider ?? "synthetic",
        providerRef: loc.providerRef ?? null,
        difficulty: (loc.difficulty ?? "NORMAL") as any,
      },
    });
  }
  console.log(`Seeded ${LOCATION_DATASET.length} locations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
