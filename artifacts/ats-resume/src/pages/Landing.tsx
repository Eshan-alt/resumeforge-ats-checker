import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { Briefcase, CheckCircle2, ChevronRight, FileSearch, ShieldCheck, Target, Zap } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="font-serif text-xl font-medium tracking-tight text-primary">ResumeForge</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          <Link href="/sign-in" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">Sign In</Link>
          <Button asChild className="rounded-full px-6">
            <Link href="/sign-up">Start Free Trial</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-24 pb-32 px-4 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
          
          <div className="container mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
              <Zap className="w-4 h-4" />
              <span>Now with AI-powered keyword matching</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-serif text-foreground mb-6 leading-tight tracking-tight">
              Evidence-based feedback <br className="hidden md:block"/>
              for <span className="text-primary italic">serious</span> job seekers.
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload your resume and the exact job description. ResumeForge acts as the ATS, giving you precise, actionable data to bridge the gap before you apply.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full w-full sm:w-auto shadow-xl shadow-primary/20">
                <Link href="/sign-up">
                  Analyze Resume Now <ChevronRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full w-full sm:w-auto">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
            
            <div className="mt-16 flex items-center justify-center gap-8 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> PDF & DOCX Support</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Instant Analysis</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Actionable Reports</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-muted/30 border-y border-border">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">A professional instrument, not a template.</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">We strip away the noise and give you exactly what hiring managers and automated systems are looking for.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-background border rounded-2xl p-8 shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Precision Targeting</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Upload the exact job description you're applying for. We extract the hard requirements and compare them line-by-line against your experience.
                </p>
              </div>
              
              <div className="bg-background border rounded-2xl p-8 shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <FileSearch className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Deep Parsing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our system simulates enterprise Applicant Tracking Systems to test your document's scannability, section headers, and formatting issues.
                </p>
              </div>
              
              <div className="bg-background border rounded-2xl p-8 shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Actionable Rewrites</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Identify weak bullet points and get AI-assisted recommendations to strengthen action verbs and impact metrics.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-6 tracking-tight">Stop guessing. Start applying with confidence.</h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Compare your resume with the role, fix the highest-impact gaps, and apply with a clearer strategy.
            </p>
            <Button asChild size="lg" className="h-14 px-10 text-lg rounded-full shadow-lg">
              <Link href="/sign-up">Create Free Account</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground bg-muted/20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Briefcase className="w-4 h-4" />
            <span className="font-semibold text-foreground">ResumeForge</span>
          </div>
          <p>© {new Date().getFullYear()} ResumeForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
