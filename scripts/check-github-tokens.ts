import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkTokens() {
  const accounts = await prisma.account.findMany({
    where: {
      provider: "github",
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  console.log(`Found ${accounts.length} GitHub account(s):\n`);

  for (const account of accounts) {
    console.log(`User: ${account.user.name} (${account.user.email})`);
    console.log(`User ID: ${account.user.id}`);
    console.log(`Provider Account ID: ${account.providerAccountId}`);
    console.log(`Has access_token: ${!!account.access_token}`);
    console.log(`Has refresh_token: ${!!account.refresh_token}`);
    console.log(`Token expires_at: ${account.expires_at ? new Date(account.expires_at * 1000).toISOString() : "N/A"}`);
    console.log(`Scopes: ${account.scope || "N/A"}`);
    console.log("---");
  }

  await prisma.$disconnect();
}

checkTokens().catch(console.error);
