import { Link } from "wouter";
import {
  ArrowUpRight,
  Briefcase,
  Check,
  FileSearch,
  FileText,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: FileSearch,
    title: "Understand your resume’s fit",
    text: "See how your resume matches a job description, with clear scores, missing keywords, and practical next steps.",
  },
  {
    icon: FileText,
    title: "Build a resume for each role",
    text: "Organize your experience, preview a clean layout, and save tailored versions for different opportunities.",
  },
  {
    icon: ShieldCheck,
    title: "Write with confidence",
    text: "Get optional help refining your summary and bullet points. Keep every claim grounded in your real experience.",
  },
];
const questions = [
  [
    "What does the ATS score mean?",
    "It estimates how your resume aligns with the job description using ResumeForge’s checks. Employers use different systems, so a score cannot guarantee an interview.",
  ],
  [
    "Which files can I upload?",
    "Upload a text-based PDF or DOCX up to 4 MB. Image-only scans need to be converted to readable text before analysis.",
  ],
  [
    "Can I keep more than one resume?",
    "Yes. Save and name separate resumes for different roles, then search, edit, preview, or delete them in your resume library.",
  ],
  [
    "Do I need AI to use the checker?",
    "No. You can build resumes and check their alignment with a job description without AI. Writing suggestions are optional and depend on availability.",
  ],
];
export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/90">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 h-20 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-3 font-semibold text-lg tracking-tight"
          >
            <span className="bg-primary text-primary-foreground p-2.5 rounded-xl">
              <Briefcase size={20} />
            </span>
            ResumeForge
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-4">
            <a
              href="#how-it-works"
              className="hidden md:block text-sm text-muted-foreground hover:text-foreground"
            >
              How it works
            </a>
            <a
              href="#faq"
              className="hidden md:block text-sm text-muted-foreground hover:text-foreground"
            >
              FAQs
            </a>
            <ThemeToggle />
            <Link href="/sign-in" className="text-sm font-medium">
              Sign in
            </Link>
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/sign-up">
                Get started <ArrowUpRight size={16} />
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <main>
        <section className="mx-auto max-w-7xl px-5 sm:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary mb-7">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Build your next opportunity
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl leading-[1.04] font-serif max-w-xl">
              A stronger resume.
              <br />
              <span className="text-primary italic">A clearer next step.</span>
            </h1>
            <p className="mt-7 text-lg leading-relaxed text-muted-foreground max-w-lg">
              Show employers what you bring. Compare your resume with a job
              description, understand what needs attention, and present your
              experience clearly.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-6">
                <Link href="/sign-up">
                  Check my resume <ArrowRight size={18} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6">
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
              {["PDF & DOCX", "Private workspace", "Saved resume versions"].map(
                (t) => (
                  <span key={t} className="flex items-center gap-2">
                    <Check size={14} className="text-primary" />
                    {t}
                  </span>
                ),
              )}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-primary/5 rounded-[3rem] -rotate-3" />
            <div className="relative rounded-2xl border bg-card shadow-xl shadow-primary/5 overflow-hidden">
              <div className="border-b px-6 py-4 flex justify-between items-center">
                <span className="text-sm font-semibold">
                  See what your resume is saying
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground rounded-full border px-2 py-1">
                  Example report
                </span>
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      TARGET ROLE
                    </p>
                    <h2 className="text-xl font-semibold">Software Engineer</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Resume alignment report
                    </p>
                  </div>
                  <div className="rounded-full border-8 border-primary/15 h-24 w-24 flex items-center justify-center shrink-0">
                    <span className="font-semibold text-3xl">
                      78
                      <span className="text-xs text-muted-foreground">
                        /100
                      </span>
                    </span>
                  </div>
                </div>
                <div className="mt-8 space-y-5">
                  {[
                    ["Keyword alignment", 82],
                    ["Section coverage", 90],
                    ["Formatting", 64],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-2">
                        <span>{label}</span>
                        <span className="font-medium">{value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/75"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-7 rounded-xl bg-muted/50 border p-4">
                  <p className="text-xs font-semibold mb-2">YOUR NEXT STEP</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Make your project impact easier to find. Clarify your
                    contribution and use relevant skills you already have.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="border-y bg-card py-16">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-10">
              <h2 className="font-serif text-4xl">
                Less guesswork.
                <br />
                More useful feedback.
              </h2>
              <p className="text-muted-foreground max-w-md leading-relaxed">
                Build your resume, understand the feedback, and keep your resume
                versions and analysis reports in one place.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map(({ icon: Icon, title, text }) => (
                <article
                  key={title}
                  className="rounded-xl border bg-background p-7"
                >
                  <Icon className="text-primary mb-6" size={26} />
                  <h3 className="font-semibold text-lg mb-3">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section
          id="how-it-works"
          className="max-w-7xl mx-auto px-5 sm:px-8 py-20 scroll-mt-6"
        >
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">
            A simple workflow
          </p>
          <h2 className="font-serif text-4xl mb-10">
            Three steps to a clearer resume.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              [
                "Bring your resume",
                "Upload your PDF or DOCX, or build a resume in your workspace.",
              ],
              [
                "Add the job description",
                "Paste the job description so the feedback reflects the role.",
              ],
              [
                "Review and improve",
                "Review your score and recommendations, update your resume, and keep a record of each analysis.",
              ],
            ].map(([title, text], i) => (
              <div key={title} className="border-t pt-5">
                <span className="text-primary font-mono text-sm">0{i + 1}</span>
                <h3 className="font-semibold mt-5 mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section id="faq" className="max-w-3xl mx-auto px-5 pb-20 scroll-mt-6">
          <h2 className="font-serif text-4xl mb-8">
            Your questions, answered.
          </h2>
          {questions.map(([q, a]) => (
            <details key={q} className="group border-b py-5">
              <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-primary">
                {q}
              </summary>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                {a}
              </p>
            </details>
          ))}
        </section>
        <section className="mx-5 sm:mx-8 mb-16">
          <div className="mx-auto max-w-7xl bg-primary text-primary-foreground rounded-2xl px-6 py-12 sm:p-14 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="font-serif text-4xl mb-3">
                Make your next application count.
              </h2>
              <p className="text-primary-foreground/80">
                Start with the experience you have. Build a clearer story.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="shrink-0 self-start md:self-auto"
            >
              <Link href="/sign-up">
                Create your account <ArrowUpRight size={18} />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="border-t px-5 py-8">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between gap-4 text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} Eshan Garg. All rights reserved.
          </span>
          <span>
            Resume feedback supports your preparation; it doesn’t guarantee
            hiring outcomes.
          </span>
          <Link href="/admin/sign-in" className="hover:text-foreground">
            Admin sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
