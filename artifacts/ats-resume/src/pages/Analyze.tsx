import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  UploadCloud,
  Loader2,
  File,
  X,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useCreateAnalysisMutation } from "@/hooks/use-analysis";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Analyze() {
  const [, setLocation] = useLocation();
  const createAnalysis = useCreateAnalysisMutation();

  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setAnalysisError("");
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (
      !validTypes.includes(file.type) &&
      !(file.type === "" && /\.(pdf|docx)$/i.test(file.name))
    ) {
      toast.error("Please upload a PDF or DOCX file.");
      return;
    }
    if (file.size === 0) {
      toast.error("This file is empty. Choose another resume.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error(
        "This file is too large. Choose a PDF or DOCX smaller than 4 MB.",
      );
      return;
    }
    setFile(file);
  };

  const handleAnalyze = () => {
    setAnalysisError("");
    if (!file) {
      toast.error("Please upload your resume.");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error(
        "Paste the job description you want to compare your resume with.",
      );
      return;
    }

    if (jobDescription.trim().length < 50) {
      toast.error(
        "Add at least 50 characters so there is enough detail to compare.",
      );
      return;
    }

    createAnalysis.mutate(
      { data: { file, jobDescription: jobDescription.trim() } },
      {
        onSuccess: (data) => {
          toast.success("Your resume analysis is ready.");
          setLocation(`/analyses/${data.id}`);
        },
        onError: (err: any) => {
          const message =
            err?.data?.error ||
            err?.error ||
            err?.message ||
            "We couldn’t analyze this resume. Check your file and try again.";
          setAnalysisError(message);
          toast.error(message);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <main className="container max-w-4xl mx-auto px-4 mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h2 className="text-3xl font-serif text-foreground mb-2">
            Check your resume
          </h2>
          <p className="text-muted-foreground">
            Upload your resume and add a job description to see relevant skills,
            keyword gaps, and suggestions for improvement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Upload */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="font-medium text-foreground">
                Upload your resume
              </h3>
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
                    <h4 className="font-medium text-foreground mb-1">
                      Drop your resume here
                    </h4>
                    <p className="text-sm text-muted-foreground mb-6">
                      Text-based PDF or DOCX · Up to 4 MB
                    </p>

                    <label>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileInput}
                        data-testid="input-resume-file"
                      />
                      <Button
                        asChild
                        variant="outline"
                        className="cursor-pointer"
                      >
                        <span>Choose a file</span>
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
                        <h4
                          className="font-medium text-sm truncate"
                          title={file.name}
                        >
                          {file.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={createAnalysis.isPending}
                      aria-label="Remove selected resume"
                      onClick={() => setFile(null)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      data-testid="button-remove-file"
                    >
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
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-medium text-foreground">
                Add the job description
              </h3>
            </div>

            <Card className="flex-1 flex flex-col">
              <CardContent className="p-4 flex-1 flex flex-col gap-2">
                <Textarea
                  aria-label="Target job description"
                  maxLength={50000}
                  disabled={createAnalysis.isPending}
                  placeholder="Paste the role’s responsibilities, required skills, and qualifications…"
                  className="min-h-[250px] flex-1 resize-none font-mono text-sm leading-relaxed"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  data-testid="textarea-job-description"
                />
                <div className="flex justify-between items-center text-xs px-1">
                  <span
                    className={
                      jobDescription.length < 50 && jobDescription.length > 0
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }
                  >
                    {jobDescription.length} characters
                  </span>
                  {jobDescription.length > 0 && jobDescription.length < 50 && (
                    <span className="text-destructive">
                      Add at least 50 characters
                    </span>
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
            disabled={
              createAnalysis.isPending ||
              !file ||
              jobDescription.trim().length < 50
            }
            data-testid="button-analyze-resume"
          >
            {createAnalysis.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Analyze my resume
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>

        {createAnalysis.isPending && (
          <div className="text-center mt-6">
            <p className="text-sm font-medium text-primary animate-pulse">
              Reading your resume and comparing its skills, sections, and
              keywords with the job description…
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Keep this page open while we prepare your report.
            </p>
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
  );
}
