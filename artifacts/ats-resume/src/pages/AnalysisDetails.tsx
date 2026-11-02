import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  useGetAnalysis,
  getGetAnalysisQueryKey,
  useGenerateAnalysisAiSuggestions,
  useRewriteAnalysisBullet,
} from "@workspace/api-client-react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Target,
  XCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  PenTool,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AnalysisDetails() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const analysisId = parseInt(params.id || "0");
  const queryClient = useQueryClient();

  const {
    data: analysis,
    isLoading,
    error,
  } = useGetAnalysis(analysisId, {
    query: {
      enabled: !!analysisId,
      retry: 1,
      queryKey: getGetAnalysisQueryKey(analysisId),
    },
  });

  const generateSuggestions = useGenerateAnalysisAiSuggestions();
  const rewriteBullet = useRewriteAnalysisBullet();

  const [bulletToRewrite, setBulletToRewrite] = useState("");
  const [rewrittenBullet, setRewrittenBullet] = useState("");

  const handleGenerateSuggestions = () => {
    generateSuggestions.mutate(
      { id: analysisId },
      {
        onSuccess: () => {
          toast.success("Your writing suggestions are ready to review.");
          queryClient.invalidateQueries({
            queryKey: getGetAnalysisQueryKey(analysisId),
          });
        },
        onError: (err: any) => {
          toast.error(
            err?.error ||
              err?.message ||
              "Writing suggestions are unavailable right now. Please try again later.",
          );
        },
      },
    );
  };

  const handleRewrite = () => {
    if (!bulletToRewrite.trim()) return;
    rewriteBullet.mutate(
      { id: analysisId, data: { bullet: bulletToRewrite } },
      {
        onSuccess: (res) => {
          setRewrittenBullet(res.rewrittenBullet);
          toast.success("Your revised bullet point is ready to review.");
        },
        onError: () =>
          toast.error(
            "We couldn’t rewrite this bullet. Use an exact bullet from the uploaded resume and try again.",
          ),
      },
    );
  };

  const handleDownload = () => {
    window.location.href = `/api/analyses/${analysisId}/report`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-medium">Loading your analysis…</h2>
        <p className="text-muted-foreground text-sm mt-2">
          Retrieving your saved score, keyword feedback, and recommendations.
        </p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <div className="bg-card p-8 rounded-xl shadow-sm text-center max-w-md w-full border border-border">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">
            We couldn’t open this analysis
          </h2>
          <p className="text-muted-foreground mb-6">
            We couldn't load the details for this analysis. It may have been
            deleted.
          </p>
          <Button onClick={() => setLocation("/dashboard")} className="w-full">
            Back to overview
          </Button>
        </div>
      </div>
    );
  }

  const score = analysis.deterministicResults.overallScore;
  const isGood = score >= 75;
  const isOkay = score >= 50 && score < 75;
  const scoreColorClass = isGood
    ? "text-green-600"
    : isOkay
      ? "text-amber-600"
      : "text-destructive";
  const scoreBgClass = isGood
    ? "bg-green-600"
    : isOkay
      ? "bg-amber-600"
      : "bg-destructive";

  const categoryData = Object.entries(
    analysis.deterministicResults.categoryScores,
  ).map(([name, val]) => ({
    name:
      name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, " $1"),
    score: val,
    fill:
      val >= 75
        ? "hsl(var(--primary))"
        : val >= 50
          ? "hsl(var(--primary))"
          : "hsl(var(--destructive))",
  }));

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <main className="container max-w-6xl mx-auto px-4 mt-8 space-y-6">
        <div className="no-print bg-card border rounded-xl mb-6">
          <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Back to overview"
                onClick={() => setLocation("/dashboard")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="font-semibold tracking-tight text-foreground truncate max-w-[200px] md:max-w-md">
                  {analysis.filename}
                </h2>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>
                    {new Date(analysis.createdAt).toLocaleDateString()}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border"></span>
                  <span className="uppercase">{analysis.status}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
                aria-label="Download analysis report as HTML"
                data-testid="button-download-report"
              >
                <Download className="w-4 h-4" />{" "}
                <span className="hidden sm:inline">Download report</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Top Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Score Card */}
          <Card className="lg:col-span-4 border-border shadow-sm flex flex-col justify-center">
            <CardContent className="pt-8 pb-8 text-center flex flex-col items-center justify-center h-full">
              <div className="relative inline-flex items-center justify-center mb-6">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    className="stroke-muted fill-none"
                    strokeWidth="10"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    className={`fill-none transition-all duration-1000 ease-out ${scoreColorClass.replace("text", "stroke")}`}
                    strokeWidth="10"
                    strokeDasharray="440"
                    strokeDashoffset={440 - (440 * score) / 100}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span
                    className={`text-5xl font-serif font-bold ${scoreColorClass}`}
                  >
                    {score}
                  </span>
                  <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    / 100
                  </span>
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {isGood
                  ? "Strong alignment"
                  : isOkay
                    ? "Partial alignment"
                    : "Room to improve"}
              </h2>
              <p className="text-sm text-muted-foreground max-w-[250px]">
                Your resume{" "}
                {isGood
                  ? "strongly aligns"
                  : isOkay
                    ? "partially aligns"
                    : "lacks alignment"}{" "}
                with the target job description in this check. Use the score to
                guide revisions; it does not predict a hiring decision.
              </p>
            </CardContent>
          </Card>

          {/* Category breakdown */}
          <Card className="lg:col-span-8 border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Score breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: "hsl(var(--foreground))",
                        fontWeight: 500,
                      }}
                      width={120}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          fillOpacity={0.9}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="keywords" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto bg-card border rounded-lg p-1 h-auto flex-wrap mb-6 sticky top-16 z-10 shadow-sm">
            <TabsTrigger
              value="keywords"
              className="flex-1 min-w-[120px] font-medium py-2.5"
            >
              Keywords & skills
            </TabsTrigger>
            <TabsTrigger
              value="formatting"
              className="flex-1 min-w-[120px] font-medium py-2.5"
            >
              Formatting
            </TabsTrigger>
            <TabsTrigger
              value="ai-suggestions"
              className="flex-1 min-w-[120px] font-medium py-2.5 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Writing suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keywords" className="mt-0 outline-none">
            <p className="text-sm text-muted-foreground mb-4">
              These terms come from the job description. Add a missing skill
              only if it reflects your experience; wording differences can
              affect detection.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border shadow-sm border-t-4 border-t-green-500">
                <CardHeader className="pb-4 border-b bg-muted/10">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Matched (
                    {analysis.deterministicResults.matchedKeywords.length +
                      analysis.deterministicResults.matchedSkills.length}
                    )
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                        Skills found in your resume
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.deterministicResults.matchedSkills.length >
                        0 ? (
                          analysis.deterministicResults.matchedSkills.map(
                            (s) => (
                              <Badge
                                key={s}
                                variant="secondary"
                                className="bg-green-100 text-green-800 hover:bg-green-200 border-0"
                              >
                                {s}
                              </Badge>
                            ),
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            No matches detected
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                        Keywords found in your resume
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.deterministicResults.matchedKeywords.length >
                        0 ? (
                          analysis.deterministicResults.matchedKeywords.map(
                            (k) => (
                              <Badge
                                key={k}
                                variant="outline"
                                className="border-green-200 text-green-700 bg-green-50/50"
                              >
                                {k}
                              </Badge>
                            ),
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            No matches detected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm border-t-4 border-t-destructive">
                <CardHeader className="pb-4 border-b bg-muted/10">
                  <CardTitle className="text-base flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-destructive" />
                    Missing (
                    {analysis.deterministicResults.missingKeywords.length +
                      analysis.deterministicResults.missingSkills.length}
                    )
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                        Skills not detected
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.deterministicResults.missingSkills.length >
                        0 ? (
                          analysis.deterministicResults.missingSkills.map(
                            (s) => (
                              <Badge
                                key={s}
                                variant="secondary"
                                className="bg-red-100 text-red-800 hover:bg-red-200 border-0"
                              >
                                {s}
                              </Badge>
                            ),
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            No gaps detected in this check
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                        Keywords not detected
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.deterministicResults.missingKeywords.length >
                        0 ? (
                          analysis.deterministicResults.missingKeywords.map(
                            (k) => (
                              <Badge
                                key={k}
                                variant="outline"
                                className="border-red-200 text-red-700 bg-red-50/50"
                              >
                                {k}
                              </Badge>
                            ),
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            No gaps detected in this check
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="formatting" className="mt-0 outline-none">
            <Card className="border-border shadow-sm mb-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Resume sections</CardTitle>
                <CardDescription>
                  Sections detected in the extracted resume text.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(
                    analysis.deterministicResults.sectionChecks,
                  ).map(([section, found]) => (
                    <div
                      key={section}
                      className={`p-4 rounded-xl border flex items-center gap-3 ${found ? "bg-green-50/30 border-green-100" : "bg-red-50/30 border-red-100"}`}
                    >
                      {found ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                      )}
                      <span className="font-medium text-sm capitalize">
                        {section.replace(/([A-Z])/g, " $1")}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {analysis.deterministicResults.formattingIssues.length > 0 && (
              <Card className="border-amber-200 shadow-sm bg-amber-50/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="w-5 h-5" /> Formatting to review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysis.deterministicResults.formattingIssues.map(
                      (issue, i) => (
                        <li
                          key={i}
                          className="flex gap-3 text-sm text-amber-900 bg-white/60 p-3 rounded-lg border border-amber-100"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                          <span className="leading-relaxed">{issue}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent
            value="ai-suggestions"
            className="mt-0 outline-none space-y-6"
          >
            {!analysis.aiSuggestions ? (
              <Card className="border-border shadow-sm text-center py-16">
                <CardContent className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Refine your wording
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-8">
                    Get optional suggestions for your summary and bullet points,
                    based on your resume and the role. Availability depends on
                    whether the site owner has enabled AI.
                  </p>
                  <Button
                    size="lg"
                    onClick={handleGenerateSuggestions}
                    disabled={generateSuggestions.isPending}
                    className="gap-2 px-8 shadow-sm h-12"
                    data-testid="button-generate-ai"
                  >
                    {generateSuggestions.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />{" "}
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" /> Generate suggestions
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="rounded-lg border border-amber-300/60 bg-amber-50/70 px-4 py-3 text-sm text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
                  Review each suggestion before using it. Keep only statements
                  you can support with your experience, and verify every number,
                  skill, and achievement.
                </div>
                <Card className="border-border shadow-sm border-t-4 border-t-primary">
                  <CardHeader className="pb-4 bg-muted/10 border-b">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" /> Recommended
                      next steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-4">
                      {analysis.aiSuggestions.improvements.map((imp, i) => (
                        <li
                          key={i}
                          className="flex gap-3 text-sm bg-accent/30 p-4 rounded-lg border border-accent"
                        >
                          <span className="font-mono font-bold text-primary mt-0.5">
                            {i + 1}.
                          </span>
                          <span className="leading-relaxed">{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-border shadow-sm">
                    <CardHeader className="pb-4 bg-muted/10 border-b">
                      <CardTitle className="text-base">
                        Suggested summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {analysis.aiSuggestions.optimizedSummary}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-border shadow-sm">
                    <CardHeader className="pb-4 bg-muted/10 border-b">
                      <CardTitle className="text-base">
                        Action verbs to consider
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="flex flex-wrap gap-2">
                        {analysis.aiSuggestions.strongerActionVerbs.map((v) => (
                          <Badge
                            key={v}
                            variant="outline"
                            className="border-primary/30 text-primary bg-primary/5 px-3 py-1 text-sm font-medium"
                          >
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-border shadow-sm bg-muted/10 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-6 md:border-r border-border">
                      <h3 className="font-semibold flex items-center gap-2 mb-4 text-foreground">
                        <PenTool className="w-5 h-5 text-primary" /> Refine a
                        bullet point
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Paste an exact bullet point from the uploaded resume.
                        Get clearer wording that preserves your original facts.
                        Add numbers only when you can verify them.
                      </p>

                      <Textarea
                        aria-label="Original bullet point from your resume"
                        placeholder="Paste an exact bullet point from this resume…"
                        value={bulletToRewrite}
                        onChange={(e) => setBulletToRewrite(e.target.value)}
                        className="min-h-[120px] mb-4 text-sm font-mono resize-none bg-background"
                      />
                      <Button
                        onClick={handleRewrite}
                        disabled={
                          rewriteBullet.isPending || !bulletToRewrite.trim()
                        }
                        className="w-full gap-2"
                        data-testid="button-rewrite-bullet"
                      >
                        {rewriteBullet.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Refine this bullet
                      </Button>
                    </div>

                    <div className="p-6 bg-background">
                      <h3 className="font-semibold mb-4 text-foreground">
                        Suggested wording
                      </h3>
                      {rewrittenBullet ? (
                        <div className="p-5 bg-green-50/50 border border-green-100 rounded-xl text-sm leading-relaxed text-green-900 relative">
                          <Sparkles className="w-5 h-5 absolute top-4 right-4 text-green-400 opacity-50" />
                          {rewrittenBullet}
                        </div>
                      ) : (
                        <div className="h-[120px] flex items-center justify-center border border-dashed rounded-xl text-sm text-muted-foreground bg-muted/20">
                          Your revised bullet point will appear here.
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
