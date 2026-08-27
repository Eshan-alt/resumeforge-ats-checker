import { Link, useLocation } from "wouter"
import { useListAnalyses, useListResumes, useDeleteAnalysis, getListAnalysesQueryKey } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Trash2, Loader2, Sparkles, Briefcase, TrendingUp, History, PenTool, ExternalLink, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useUser, useClerk } from "@clerk/react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Dashboard() {
  const [, setLocation] = useLocation()
  const queryClient = useQueryClient()
  const { user } = useUser()
  const { signOut } = useClerk()
  
  const { data: analyses, isLoading: isLoadingAnalyses } = useListAnalyses()
  const { data: resumes } = useListResumes()
  const deleteAnalysis = useDeleteAnalysis()

  const handleDelete = (id: number) => {
    deleteAnalysis.mutate({ id }, {
      onSuccess: () => {
        toast.success("Analysis deleted")
        queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() })
      },
      onError: () => toast.error("Failed to delete analysis")
    })
  }
  
  const trendData = analyses?.slice(0, 10).reverse().map((a, i) => ({
    name: `Analysis ${i + 1}`,
    score: a.overallScore,
    date: new Date(a.createdAt).toLocaleDateString()
  })) || []

  const avgScore = analyses?.length 
    ? Math.round(analyses.reduce((acc, curr) => acc + curr.overallScore, 0) / analyses.length) 
    : 0

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="bg-background border-b border-border sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/dashboard")}>
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
              <Briefcase className="w-4 h-4" />
            </div>
            <h1 className="font-serif text-xl font-medium tracking-tight text-primary">ResumeForge</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => setLocation("/history")} className="text-muted-foreground gap-2 hidden sm:flex">
              <History className="w-4 h-4" /> History
            </Button>
            <div className="w-px h-4 bg-border mx-1 hidden sm:block"></div>
            <span className="text-sm font-medium hidden sm:block truncate max-w-[120px]">{user?.firstName || user?.emailAddresses[0]?.emailAddress}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut({ redirectUrl: "/" })}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-serif text-foreground mb-1 tracking-tight">Overview</h2>
            <p className="text-muted-foreground">Track your resume performance against target job descriptions.</p>
          </div>
          <Button onClick={() => setLocation('/analyze')} size="lg" className="gap-2 shrink-0 shadow-sm" data-testid="button-new-analysis">
            <Plus className="w-4 h-4" />
            New Analysis
          </Button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          
          {/* Trends */}
          <Card className="col-span-1 lg:col-span-2 shadow-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Score Trend (Last 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length > 1 ? (
                <div className="h-[200px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{fontSize: 10, fill: "hsl(var(--muted-foreground))"}} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{fontSize: 10, fill: "hsl(var(--muted-foreground))"}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                        cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded-md border border-dashed mt-4">
                  {trendData.length === 1 ? "Complete one more analysis to see trends." : "No data available."}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aggregate Stats */}
          <div className="grid grid-rows-2 gap-6">
            <Card className="shadow-sm border-border/50 flex flex-col justify-center">
              <CardContent className="pt-6 pb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Average Score</p>
                  <p className="text-3xl font-mono font-semibold">{avgScore}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-border/50 flex flex-col justify-center">
              <CardContent className="pt-6 pb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Analyses</p>
                  <p className="text-3xl font-mono font-semibold">{analyses?.length || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-between items-end mb-4 border-b pb-2">
          <h3 className="text-xl font-medium tracking-tight">Recent Analyses</h3>
          <Link href="/history" className="text-sm font-medium text-primary hover:underline" data-testid="link-view-all">View all</Link>
        </div>

        {isLoadingAnalyses ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !analyses || analyses.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-xl border border-dashed border-border">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-medium mb-2">No analyses yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Upload your resume and a job description to get started.</p>
            <Button onClick={() => setLocation('/analyze')} className="gap-2">
              <Plus className="w-4 h-4" />
              New Analysis
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {analyses.slice(0, 3).map((analysis) => {
              const isGood = analysis.overallScore >= 75;
              const isOkay = analysis.overallScore >= 50 && analysis.overallScore < 75;
              const scoreColor = isGood ? "text-green-600 bg-green-50" : isOkay ? "text-amber-600 bg-amber-50" : "text-destructive bg-destructive/10";
              
              return (
                <Card key={analysis.id} className="flex flex-col group hover:border-primary/40 transition-colors shadow-sm cursor-pointer" onClick={() => setLocation(`/analyses/${analysis.id}`)} data-testid={`card-analysis-${analysis.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <Badge variant="outline" className={`font-mono text-sm px-2 py-0.5 border-0 ${scoreColor}`}>
                        {analysis.overallScore} / 100
                      </Badge>
                    </div>
                    <CardTitle className="text-base line-clamp-1">{analysis.filename}</CardTitle>
                    <CardDescription>{new Date(analysis.createdAt).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-3 border-t mt-auto flex justify-between bg-muted/10 group-hover:bg-primary/5 transition-colors">
                    <span className="text-sm font-medium text-primary flex items-center gap-1">View Results <ChevronRight className="w-4 h-4" /></span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 z-10" onClick={(e) => { e.stopPropagation(); handleDelete(analysis.id); }} data-testid={`button-delete-${analysis.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}

        {/* Builder Section */}
        <div className="mt-16 bg-card border rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-muted-foreground shrink-0">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Resume Builder</h3>
              <p className="text-muted-foreground text-sm max-w-md">Need to update your resume? Use our built-in tool to create and manage professional resumes.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <Button variant="outline" onClick={() => setLocation('/resumes/new')} className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Create Resume
            </Button>
            {resumes && resumes.length > 0 && (
              <Button variant="secondary" onClick={() => setLocation(`/resumes/${resumes[0].id}/edit`)} className="gap-2 w-full sm:w-auto">
                <ExternalLink className="w-4 h-4" /> View Saved ({resumes.length})
              </Button>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
