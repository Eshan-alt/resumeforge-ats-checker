import { useState } from "react";
import { Link } from "wouter";
import {
  useListResumes,
  useDeleteResume,
  getListResumesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function SavedResumes() {
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<{ id: number; title: string } | null>(
    null,
  );
  const queryClient = useQueryClient();
  const resumes = useListResumes();
  const deletion = useDeleteResume();
  const filtered =
    resumes.data?.filter((r) =>
      r.title.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];
  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <Link href="/dashboard" className="text-primary hover:underline">
        ← Back to dashboard
      </Link>
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif">My resumes</h1>
          <p className="text-muted-foreground mt-2">
            Keep your resume versions organized. Open a saved resume to edit,
            preview, or export it.
          </p>
        </div>
        <Button asChild>
          <Link href="/resumes/new">Create a resume</Link>
        </Button>
      </div>
      <Input
        aria-label="Search saved resumes"
        placeholder="Search by resume title…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {resumes.isLoading ? (
        <p role="status">Loading resumes…</p>
      ) : resumes.isError ? (
        <p role="alert">
          We couldn’t load your resumes. Please try again.{" "}
          <Button variant="outline" onClick={() => resumes.refetch()}>
            Retry
          </Button>
        </p>
      ) : !filtered.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            {search
              ? "No resumes match your search."
              : "Your resume library is ready. Create your first resume to start building a version for your next role."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((resume) => (
            <Card key={resume.id}>
              <CardHeader>
                <CardTitle className="break-words">{resume.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Updated {new Date(resume.updatedAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={`/resumes/${resume.id}/edit`}>Edit</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/resumes/${resume.id}/preview`}>Preview</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => setPending(resume)}
                >
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open && !deletion.isPending) setPending(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete resume?</DialogTitle>
            <DialogDescription>
              “{pending?.title}” will be permanently deleted. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={deletion.isPending}
              onClick={() => setPending(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deletion.isPending}
              onClick={() =>
                pending &&
                deletion.mutate(
                  { id: pending.id },
                  {
                    onSuccess: () => {
                      queryClient.invalidateQueries({
                        queryKey: getListResumesQueryKey(),
                      });
                      setPending(null);
                      toast.success("Resume deleted");
                    },
                    onError: () =>
                      toast.error(
                        "We couldn’t delete this resume. Please try again.",
                      ),
                  },
                )
              }
            >
              {deletion.isPending ? "Deleting…" : "Delete resume"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
