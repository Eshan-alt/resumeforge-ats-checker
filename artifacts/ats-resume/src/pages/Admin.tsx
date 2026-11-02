import { useState } from "react";
import { Link } from "wouter";
import {
  useGetAccount,
  useGetAdminOverview,
  useGetAdminUsers,
  getGetAccountQueryKey,
  getGetAdminOverviewQueryKey,
  getGetAdminUsersQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function Admin() {
  const [page, setPage] = useState(1);
  const account = useGetAccount({
    query: { queryKey: getGetAccountQueryKey(), retry: false },
  });
  const enabled = account.data?.role === "admin";
  const overview = useGetAdminOverview({
    query: { queryKey: getGetAdminOverviewQueryKey(), enabled, retry: false },
  });
  const users = useGetAdminUsers(
    { page },
    {
      query: {
        queryKey: getGetAdminUsersQueryKey({ page }),
        enabled,
        retry: false,
      },
    },
  );
  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <Link href="/dashboard" className="text-primary hover:underline">
        ← Back to dashboard
      </Link>
      <div>
        <ShieldCheck className="text-primary mb-3" size={32} />
        <h1 className="text-3xl font-serif">Administration</h1>
        <p className="text-muted-foreground mt-2">
          Review account activity, saved resumes, and analysis usage across
          ResumeForge.
        </p>
      </div>
      {account.isLoading ? (
        <p role="status">Checking access…</p>
      ) : account.isError ? (
        <p role="alert">
          We couldn’t verify your administrator access. Please try again.{" "}
          <Button variant="outline" onClick={() => account.refetch()}>
            Retry
          </Button>
        </p>
      ) : !enabled ? (
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold">Administrator access required</h2>
            <p className="text-muted-foreground mt-2">
              Your account does not have permission to open this page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {overview.isError || users.isError ? (
            <div role="alert">
              We couldn’t load the usage overview. Please try again.{" "}
              <Button
                variant="outline"
                onClick={() => {
                  overview.refetch();
                  users.refetch();
                }}
              >
                Retry
              </Button>
            </div>
          ) : null}
          <div className="grid sm:grid-cols-3 gap-4">
            {(
              [
                ["users", "App users"],
                ["resumes", "Saved resumes"],
                ["analyses", "ATS analyses"],
              ] as const
            ).map(([key, label]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-4xl font-semibold">
                  {overview.data?.[key] ?? "—"}
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <p className="text-sm text-muted-foreground">
                This list includes accounts that have used the workspace. It
                shows usage counts without exposing private resume content.
              </p>
            </CardHeader>
            <CardContent>
              {users.isLoading ? (
                <p role="status">Loading users…</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b">
                        {[
                          "User ID",
                          "Role",
                          "Joined",
                          "Resumes",
                          "Analyses",
                        ].map((h) => (
                          <th key={h} className="p-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.data?.users.map((user) => (
                        <tr key={user.userId} className="border-b">
                          <td className="p-3 font-mono">{user.userId}</td>
                          <td className="p-3 capitalize">{user.role}</td>
                          <td className="p-3 whitespace-nowrap">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3">{user.resumes}</td>
                          <td className="p-3">{user.analyses}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.data?.users.length === 0 && (
                    <p className="py-6">
                      No accounts to show on this page yet.
                    </p>
                  )}
                </div>
              )}
              <div className="flex justify-between items-center gap-3 mt-5">
                <Button
                  variant="outline"
                  disabled={page === 1 || users.isFetching}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} · {users.data?.total ?? "—"} users
                </span>
                <Button
                  variant="outline"
                  disabled={
                    !users.data ||
                    page * users.data.pageSize >= users.data.total ||
                    users.isFetching
                  }
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
