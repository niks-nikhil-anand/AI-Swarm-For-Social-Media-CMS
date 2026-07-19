import { ok, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getPostizClient } from "@/lib/postiz";
import { normalizePlatform } from "@/lib/social";

export const POST = withApiHandler(async () => {
  const userId = await requireUserId();
  const client = getPostizClient();
  const remoteAccounts = await client.listAccounts();
  const synced = [];

  for (const remote of remoteAccounts) {
    const platform = normalizePlatform(remote.platform);
    if (!platform) continue;
    const account = await prisma.platformAccount.upsert({
      where: {
        userId_platform_postizAccountId: {
          userId,
          platform,
          postizAccountId: remote.id,
        },
      },
      create: {
        userId,
        platform,
        displayName: remote.name ?? remote.handle ?? `${platform} account`,
        handle: remote.handle,
        postizAccountId: remote.id,
        lastSyncedAt: new Date(),
      },
      update: {
        displayName: remote.name ?? remote.handle ?? `${platform} account`,
        handle: remote.handle,
        isActive: true,
        lastSyncedAt: new Date(),
      },
    });
    synced.push(account);
  }

  return ok({ synced });
});
