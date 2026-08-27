import { useState } from "react"
import { Link, useLocation } from "wouter"
import { useListAnalyses, useDeleteAnalysis, getListAnalysesQueryKey } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, FileText, Trash2, Loader2, ChevronRight, Filter } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"

export default function History() {
  const [, setLocation] = useLocation()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  
  const { data: analyses, isLoading } = useListAnalyses()
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
  
  const filteredAnalyses = analyses?.filter(a => 
    a.filename.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <header className="bg-background border-b sticky top-0 z-20 shadow-sm">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-xl font-medium tracking-tight">Analysis History</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 mt-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by filename..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
              data-testid="input-search-history"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <Filter className="w-4 h-4" />
            {filteredAnalyses.length} Result{filteredAnalyses.length !== 1 ? 's' : ''}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-xl border border-dashed shadow-sm">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium mb-1">No analyses found</h3>
            <p className="text-muted-foreground mb-4">You haven't run any analyses yet, or none match your search.</p>
            {searchTerm ? (
              <Button variant="outline" onClick={() => setSearchTerm("")}>Clear Search</Button>
            ) : (
              <Button onClick={() => setLocation('/analyze')}>New Analysis</Button>
            )}
          </div>
        ) : (
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-6 md:col-span-5 pl-2">Filename</div>
              <div className="col-span-3 md:col-span-2 text-center">Score</div>
              <div className="col-span-3 md:col-span-3 text-right md:text-left">Date</div>
              <div className="col-span-12 md:col-span-2 hidden md:block text-right pr-2">Actions</div>
            </div>
            
            <div className="divide-y divide-border">
              {filteredAnalyses.map(analysis => {
                const score = analysis.overallScore
                const isGood = score >= 75
                const isOkay = score >= 50 && score < 75
                const scoreColor = isGood ? "text-green-700 bg-green-50" : isOkay ? "text-amber-700 bg-amber-50" : "text-destructive bg-destructive/10"
                
                return (
                  <div 
                    key={analysis.id} 
                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-accent/20 cursor-pointer transition-colors"
                    onClick={() => setLocation(`/analyses/${analysis.id}`)}
                    data-testid={`row-analysis-${analysis.id}`}
                  >
                    <div className="col-span-6 md:col-span-5 flex items-center gap-3 overflow-hidden pl-2">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-sm truncate" title={analysis.filename}>{analysis.filename}</span>
                    </div>
                    
                    <div className="col-span-3 md:col-span-2 flex justify-center">
                      <Badge variant="outline" className={`font-mono border-0 ${scoreColor}`}>
                        {score} / 100
                      </Badge>
                    </div>
                    
                    <div className="col-span-3 md:col-span-3 text-right md:text-left text-sm text-muted-foreground">
                      {new Date(analysis.createdAt).toLocaleDateString()}
                    </div>
                    
                    <div className="col-span-12 md:col-span-2 flex justify-end items-center gap-2 mt-2 md:mt-0 pr-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDelete(analysis.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <ChevronRight className="w-5 h-5 text-muted-foreground md:hidden" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
