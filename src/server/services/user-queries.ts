import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const USERS_PAGE_SIZE = 25;

export interface AdminUserRow {
  id: string;
  /** Registration order: the first user ever created is nº 1. */
  number: number;
  name: string | null;
  email: string;
  image: string | null;
  /** Sign-in methods: "password" and/or OAuth providers ("google"). */
  loginMethods: string[];
  ownedRooms: number;
  joinedRooms: number;
  createdAt: string;
}

export interface AdminUserStats {
  total: number;
  newLast7Days: number;
  withGoogle: number;
}

export async function getUserStats(): Promise<AdminUserStats> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [total, newLast7Days, withGoogle] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.user.count({ where: { accounts: { some: { provider: "google" } } } }),
  ]);
  return { total, newLast7Days, withGoogle };
}

/** Users for the admin panel, newest first, filtered by name/email. */
export async function listUsers({
  query,
  page,
}: {
  query?: string;
  page: number;
}): Promise<{ users: AdminUserRow[]; total: number; pages: number }> {
  const q = query?.trim();
  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const total = await db.user.count({ where });
  const pages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);

  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      passwordHash: true,
      createdAt: true,
      accounts: { select: { provider: true } },
      _count: { select: { ownedRooms: true, memberships: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (current - 1) * USERS_PAGE_SIZE,
    take: USERS_PAGE_SIZE,
  });

  // Registration number = how many users were created up to and including this one.
  const numbers = await Promise.all(
    users.map((u) =>
      db.user.count({ where: { createdAt: { lte: u.createdAt } } }),
    ),
  );

  return {
    total,
    pages,
    users: users.map((u, i) => ({
      id: u.id,
      number: numbers[i],
      name: u.name,
      email: u.email,
      image: u.image,
      loginMethods: [
        ...(u.passwordHash ? ["password"] : []),
        ...u.accounts.map((a) => a.provider),
      ],
      ownedRooms: u._count.ownedRooms,
      joinedRooms: u._count.memberships,
      createdAt: u.createdAt.toISOString(),
    })),
  };
}
