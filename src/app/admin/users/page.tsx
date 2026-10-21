import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Card, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/guards";
import { isAdminEmail } from "@/lib/auth/admin";
import {
  getUserStats,
  listUsers,
  type AdminUserRow,
} from "@/server/services/user-queries";

export const metadata: Metadata = {
  title: "Utilizadores · Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Lisbon",
});

const methodLabels: Record<string, string> = {
  password: "Email",
  google: "Google",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession("/admin/users");
  if (!isAdminEmail(session.user.email)) notFound();

  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const page = Number.parseInt(
    typeof params.page === "string" ? params.page : "1",
    10,
  );

  const [stats, result] = await Promise.all([
    getUserStats(),
    listUsers({ query, page: Number.isFinite(page) ? page : 1 }),
  ]);
  const currentPage = Math.min(
    Math.max(1, Number.isFinite(page) ? page : 1),
    result.pages,
  );

  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/admin/users?${qs}` : "/admin/users";
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Painel de administração
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Utilizadores
        </h1>
        <p className="mt-1 text-muted">
          Todas as contas registadas na plataforma.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Total de utilizadores" value={stats.total} accent />
          <Stat label="Novos nos últimos 7 dias" value={stats.newLast7Days} />
          <Stat label="Com conta Google" value={stats.withGoogle} />
        </div>

        <form
          action="/admin/users"
          method="get"
          className="mt-8 flex max-w-md gap-2"
          role="search"
        >
          <Input
            name="q"
            defaultValue={query}
            placeholder="Pesquisar por nome ou email"
            aria-label="Pesquisar utilizadores"
            maxLength={100}
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
            Pesquisar
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted">
          {query
            ? `${result.total} resultado${result.total === 1 ? "" : "s"} para "${query}"`
            : `${result.total} utilizador${result.total === 1 ? "" : "es"}`}
        </p>

        {result.users.length === 0 ? (
          <Card className="mt-3 text-center text-sm text-muted">
            Nenhum utilizador encontrado.
          </Card>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Nº</th>
                  <th scope="col" className="px-4 py-3 font-medium">Nome</th>
                  <th scope="col" className="px-4 py-3 font-medium">Email</th>
                  <th scope="col" className="px-4 py-3 font-medium">Login</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">
                    Salas criadas
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">
                    Salas em que entrou
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">Registo</th>
                </tr>
              </thead>
              <tbody>
                {result.users.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result.pages > 1 && (
          <nav
            aria-label="Paginação"
            className="mt-4 flex items-center justify-between text-sm"
          >
            {currentPage > 1 ? (
              <Link href={pageHref(currentPage - 1)} className="text-primary hover:underline">
                ← Anterior
              </Link>
            ) : (
              <span />
            )}
            <span className="text-muted">
              Página {currentPage} de {result.pages}
            </span>
            {currentPage < result.pages ? (
              <Link href={pageHref(currentPage + 1)} className="text-primary hover:underline">
                Seguinte →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </main>
    </>
  );
}

function UserRow({ user }: { user: AdminUserRow }) {
  const displayName = user.name?.trim() || "—";
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 font-mono text-muted">{user.number}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              className="h-7 w-7 shrink-0 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-muted">
              {(user.name?.trim() || user.email).charAt(0).toUpperCase()}
            </span>
          )}
          <span className="font-medium text-foreground">{displayName}</span>
          {isAdminEmail(user.email) && (
            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
              Admin
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-muted">{user.email}</td>
      <td className="px-4 py-3 text-muted">
        {user.loginMethods.length > 0
          ? user.loginMethods.map((m) => methodLabels[m] ?? m).join(" · ")
          : "—"}
      </td>
      <td className="px-4 py-3 text-right tabular-nums">{user.ownedRooms}</td>
      <td className="px-4 py-3 text-right tabular-nums">{user.joinedRooms}</td>
      <td className="px-4 py-3 whitespace-nowrap text-muted">
        {dateFormat.format(new Date(user.createdAt))}
      </td>
    </tr>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <CardDescription>{label}</CardDescription>
      <p
        className={`mt-1 text-2xl font-semibold ${accent ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
    </Card>
  );
}
