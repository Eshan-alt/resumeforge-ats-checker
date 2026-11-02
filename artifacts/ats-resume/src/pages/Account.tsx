import { UserProfile } from "@clerk/react";
import { Link } from "wouter";

export default function Account() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard" className="text-primary hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="text-3xl font-serif">Account settings</h1>
      <p className="text-muted-foreground">
        Update your profile, manage how you sign in, and review your account
        security.
      </p>
      <UserProfile routing="hash" />
    </main>
  );
}
