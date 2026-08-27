import React from "react"
import { useLocation, useParams } from "wouter"
import { useGetResume, useGetResumeScore, getGetResumeQueryKey, getGetResumeScoreQueryKey } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, AlertTriangle, Info, XCircle, Loader2, Sparkles, Pencil } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ResumePreview() {
  const [, setLocation] = useLocation()
  const params = useParams()
  const resumeId = parseInt(params.id as string)

  const { data: resume, isLoading: isLoadingResume } = useGetResume(resumeId, {
    query: { enabled: !!resumeId, queryKey: getGetResumeQueryKey(resumeId) }
  })

  const { data: score, isLoading: isLoadingScore } = useGetResumeScore(resumeId, {
    query: { enabled: !!resumeId, queryKey: getGetResumeScoreQueryKey(resumeId) }
  })

  const handlePrint = () => {
    window.print()
  }

  if (isLoadingResume || !resume) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  const { data } = resume

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row">
      {/* ATS Score Panel - Hidden on Print */}
      <aside className="w-full md:w-80 bg-background border-r border-border flex flex-col no-print h-screen sticky top-0 overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")} className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="font-serif font-medium text-lg">ATS Analysis</h2>
          </div>
          <ThemeToggle />
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          {isLoadingScore ? (
             <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : score ? (
            <>
              <div className="text-center mb-8">
                <div className="relative inline-flex items-center justify-center mb-4">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="60" className="stroke-muted fill-none" strokeWidth="8" />
                    <circle 
                      cx="64" cy="64" r="60" 
                      className={`fill-none transition-all duration-1000 ease-out ${score.score >= 80 ? 'stroke-primary' : score.score >= 60 ? 'stroke-amber-500' : 'stroke-destructive'}`} 
                      strokeWidth="8" 
                      strokeDasharray="377" 
                      strokeDashoffset={377 - (377 * score.score) / 100} 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-serif font-bold text-foreground">{score.score}</span>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">/ 100</span>
                  </div>
                </div>
                <h3 className="text-xl font-medium tracking-tight mb-1">{score.label}</h3>
                <p className="text-sm text-muted-foreground">ATS Compatibility Score</p>
              </div>

              <div className="flex-1 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                    <Sparkles className="w-4 h-4" /> Actionable Tips
                  </h4>
                  {score.tips.length === 0 ? (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">
                      Your resume is perfectly optimized! No critical issues found.
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {score.tips.map((tip, i) => (
                        <li key={i} className="flex gap-3 text-sm items-start bg-card border p-3 rounded-lg shadow-sm">
                          {tip.severity === 'error' ? <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" /> : 
                           tip.severity === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> : 
                           <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                          <div>
                            <span className="font-semibold block mb-0.5">{tip.section}</span>
                            <span className="text-muted-foreground leading-relaxed">{tip.message}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          ) : null}
          
          <div className="pt-6 mt-6 border-t space-y-3">
            <Button className="w-full gap-2" onClick={handlePrint}>
              <Download className="w-4 h-4" /> Download PDF
            </Button>
            <Button variant="outline" className="w-full gap-2" onClick={() => setLocation(`/resumes/${resumeId}/edit`)}>
              <Pencil className="w-4 h-4" /> Edit Resume
            </Button>
          </div>
        </div>
      </aside>

      {/* Resume Document Canvas */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-muted/30">
        <div className="bg-white text-black w-full max-w-[800px] min-h-[1056px] shadow-2xl p-10 md:p-12 sm:rounded-sm print:shadow-none print:p-0 print:rounded-none">
          
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2 uppercase tracking-wide">{data.personalInfo.fullName}</h1>
            <div className="text-sm flex flex-wrap justify-center items-center gap-x-2 gap-y-1 text-gray-700">
              {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
              {data.personalInfo.email && data.personalInfo.phone && <span className="text-gray-300">|</span>}
              {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
              {data.personalInfo.phone && data.personalInfo.location && <span className="text-gray-300">|</span>}
              {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
            </div>
            <div className="text-sm flex justify-center items-center gap-2 text-gray-700 mt-1">
              {data.personalInfo.linkedIn && <a href={data.personalInfo.linkedIn} className="text-blue-600 hover:underline">{data.personalInfo.linkedIn.replace(/^https?:\/\/(www\.)?/, '')}</a>}
              {data.personalInfo.linkedIn && data.personalInfo.website && <span className="text-gray-300">|</span>}
              {data.personalInfo.website && <a href={data.personalInfo.website} className="text-blue-600 hover:underline">{data.personalInfo.website.replace(/^https?:\/\/(www\.)?/, '')}</a>}
            </div>
          </div>

          {/* Summary */}
          {data.personalInfo.summary && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2 text-gray-900">Professional Summary</h2>
              <p className="text-sm text-gray-800 leading-relaxed">{data.personalInfo.summary}</p>
            </div>
          )}

          {/* Work Experience */}
          {data.workExperience && data.workExperience.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-3 text-gray-900">Experience</h2>
              <div className="space-y-4">
                {data.workExperience.map((exp, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline mb-1">
                      <div>
                        <span className="font-bold text-gray-900 text-sm">{exp.title}</span>
                        <span className="mx-1 text-gray-500">at</span>
                        <span className="font-semibold text-gray-800 text-sm">{exp.company}</span>
                      </div>
                      <div className="text-xs text-gray-600 shrink-0 font-medium">
                        {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                      </div>
                    </div>
                    {exp.location && <div className="text-xs text-gray-500 mb-1.5 italic">{exp.location}</div>}
                    <ul className="list-disc pl-5 space-y-1">
                      {exp.bullets.map((bullet, j) => (
                        <li key={j} className="text-sm text-gray-800 leading-snug">{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-3 text-gray-900">Education</h2>
              <div className="space-y-3">
                {data.education.map((edu, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{edu.school}</div>
                      <div className="text-sm text-gray-800">{edu.degree} in {edu.field}</div>
                      {edu.gpa && <div className="text-xs text-gray-600 mt-0.5">GPA: {edu.gpa}</div>}
                    </div>
                    <div className="text-xs text-gray-600 shrink-0 font-medium">
                      {edu.startDate} – {edu.endDate || 'Expected'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2 text-gray-900">Skills</h2>
              <div className="space-y-1.5">
                {data.skills.map((skill, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-bold text-gray-900 mr-2">{skill.category}:</span>
                    <span className="text-gray-800">{skill.items.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {data.projects && data.projects.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-3 text-gray-900">Projects</h2>
              <div className="space-y-4">
                {data.projects.map((proj, i) => (
                  <div key={i}>
                    <div className="flex items-baseline mb-1">
                      <span className="font-bold text-gray-900 text-sm mr-2">{proj.name}</span>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <span className="text-xs text-gray-600 italic border-l pl-2">
                          {proj.technologies.join(', ')}
                        </span>
                      )}
                      {proj.url && (
                         <a href={proj.url} className="text-xs text-blue-600 hover:underline ml-auto">{proj.url.replace(/^https?:\/\/(www\.)?/, '')}</a>
                      )}
                    </div>
                    <div className="text-sm text-gray-700 mb-1.5">{proj.description}</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {proj.bullets.map((bullet, j) => (
                        <li key={j} className="text-sm text-gray-800 leading-snug">{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-3 text-gray-900">Certifications</h2>
              <div className="space-y-2">
                {data.certifications.map((cert, i) => (
                  <div key={i} className="flex justify-between items-start text-sm">
                    <div>
                      <span className="font-bold text-gray-900">{cert.name}</span>
                      <span className="mx-1 text-gray-500">—</span>
                      <span className="text-gray-800">{cert.issuer}</span>
                      {cert.url && (
                        <a href={cert.url} className="ml-2 text-xs text-blue-600 hover:underline inline-block">View</a>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 shrink-0 font-medium">
                      {cert.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}