import { useState, useCallback } from "react"
import { useLocation } from "wouter"
import { UploadCloud, Loader2, File, X, Briefcase, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { useCreateAnalysisMutation } from "@/hooks/use-analysis"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Analyze() {
  const [, setLocation] = useLocation()
  const createAnalysis = useCreateAnalysisMutation()
  
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [analysisError, setAnalysisError] = useState("")

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      validateAndSetFile(droppedFile)
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (file: File) => {
    setAnalysisError("")
    const validTypes = [
      "application/pdf", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or DOCX file.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File exceeds 10MB limit.")
      return
    }
    setFile(file)
  }

  const handleAnalyze = () => {
    setAnalysisError("")
    if (!file) {
      toast.error("Please upload your resume.")
      return
    }
    if (!jobDescription.trim()) {
      toast.error("Please provide a job description.")
      return
    }
    
    if (jobDescription.trim().length < 50) {
      toast.error("Job description should be at least 50 characters.")
      return
    }

    createAnalysis.mutate({ data: { file, jobDescription: jobDescription.trim() } }, {
      onSuccess: (data) => {
        toast.success("Analysis complete!")
        setLocation(`/analyses/${data.id}`)
      },
      onError: (err: any) => {
        const message = err?.data?.error || err?.error || err?.message || "Failed to analyze resume."
        setAnalysisError(message)
        toast.error(message)
      }
    })
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <header className="bg-background border-b sticky top-0 z-20 shadow-sm">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/dashboard")}>
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
              <Briefcase className="w-4 h-4" />
            </div>
            <h1 className="font-serif text-xl font-medium tracking-tight text-primary hidden sm:block">ResumeForge</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="text-muted-foreground">
              Cancel
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h2 className="text-3xl font-serif text-foreground mb-2">New Analysis</h2>
          <p className="text-muted-foreground">Compare your resume against a specific job description.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Upload */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">1</div>
              <h3 className="font-medium text-foreground">Upload Resume</h3>
            </div>
            
            <Card>
              <CardContent className="p-0">
                {!file ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors
                      ${isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/30"}
                      hover:bg-muted/50`}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <h4 className="font-medium text-foreground mb-1">Drag & drop your resume</h4>
                    <p className="text-sm text-muted-foreground mb-6">PDF or DOCX up to 10MB</p>
                    
                    <label>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileInput}
                        data-testid="input-resume-file"
                      />
                      <Button asChild variant="outline" className="cursor-pointer">
                        <span>Browse Files</span>
                      </Button>
                    </label>
                  </div>
                ) : (
                  <div className="border rounded-xl p-6 flex items-center justify-between bg-card">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <File className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-medium text-sm truncate" title={file.name}>{file.name}</h4>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive shrink-0" data-testid="button-remove-file">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Right Column: Job Description */}
          <section className="space-y-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">2</div>
              <h3 className="font-medium text-foreground">Target Job Description</h3>
            </div>
            
            <Card className="flex-1 flex flex-col">
              <CardContent className="p-4 flex-1 flex flex-col gap-2">
                <Textarea 
                  placeholder="Paste the full job description here..."
                  className="min-h-[250px] flex-1 resize-none font-mono text-sm leading-relaxed"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  data-testid="textarea-job-description"
                />
                <div className="flex justify-between items-center text-xs px-1">
                  <span className={jobDescription.length < 50 && jobDescription.length > 0 ? "text-destructive" : "text-muted-foreground"}>
                    {jobDescription.length} characters
                  </span>
                  {jobDescription.length > 0 && jobDescription.length < 50 && (
                    <span className="text-destructive">Minimum 50 characters required</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="flex justify-end pt-6 border-t border-border">
          <Button 
            size="lg" 
            className="w-full md:w-auto min-w-[200px] text-lg h-14"
            onClick={handleAnalyze}
            disabled={createAnalysis.isPending || !file || !jobDescription}
            data-testid="button-analyze-resume"
          >
            {createAnalysis.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Start Analysis
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
        
        {createAnalysis.isPending && (
          <div className="text-center mt-6">
            <p className="text-sm font-medium text-primary animate-pulse">Scanning keywords, parsing sections, and comparing to job requirements...</p>
            <p className="text-xs text-muted-foreground mt-1">This usually takes about 10-15 seconds.</p>
          </div>
        )}
        {analysisError && (
          <div
            role="alert"
            data-testid="analysis-error"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
          >
            {analysisError}
          </div>
        )}
      </main>
    </div>
  )
}
