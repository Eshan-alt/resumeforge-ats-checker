import React, { useEffect, useState } from "react"
import { useLocation, useParams } from "wouter"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCreateResume, useGetResume, useUpdateResume, getGetResumeQueryKey, getListResumesQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { resumeInputSchema, ResumeFormValues, emptyResumeData } from "@/lib/schema"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Plus, Trash2, Save, FileText, Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ResumeFormPage() {
  const [, setLocation] = useLocation()
  const params = useParams()
  const isNew = !params.id || params.id === "new"
  const resumeId = isNew ? null : parseInt(params.id as string)
  
  const queryClient = useQueryClient()
  const createResume = useCreateResume()
  const updateResume = useUpdateResume()

  const { data: existingResume, isLoading } = useGetResume(resumeId as number, { 
    query: { enabled: !!resumeId, queryKey: getGetResumeQueryKey(resumeId as number) } 
  })

  const form = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeInputSchema),
    defaultValues: emptyResumeData
  })

  useEffect(() => {
    if (existingResume) {
      const d = existingResume.data;
      form.reset({
        title: existingResume.title,
        data: {
          ...d,
          personalInfo: {
            ...d.personalInfo,
            linkedIn: d.personalInfo.linkedIn || undefined,
            website: d.personalInfo.website || undefined,
          },
          workExperience: d.workExperience.map(exp => ({
            ...exp,
            endDate: exp.endDate || undefined
          })),
          education: d.education.map(edu => ({
            ...edu,
            endDate: edu.endDate || undefined,
            gpa: edu.gpa || undefined
          })),
          projects: d.projects.map(proj => ({
            ...proj,
            url: proj.url || undefined
          })),
          certifications: d.certifications.map(cert => ({
            ...cert,
            url: cert.url || undefined
          }))
        }
      })
    }
  }, [existingResume, form])

  const onSubmit = (data: ResumeFormValues) => {
    if (isNew) {
      createResume.mutate({ data }, {
        onSuccess: (res) => {
          toast.success("Resume created successfully")
          queryClient.invalidateQueries({ queryKey: getListResumesQueryKey() })
          setLocation(`/resumes/${res.id}/preview`)
        },
        onError: () => toast.error("Failed to create resume")
      })
    } else {
      updateResume.mutate({ id: resumeId as number, data }, {
        onSuccess: (res) => {
          toast.success("Resume updated successfully")
          queryClient.invalidateQueries({ queryKey: getGetResumeQueryKey(resumeId as number) })
          queryClient.invalidateQueries({ queryKey: getListResumesQueryKey() })
          setLocation(`/resumes/${res.id}/preview`)
        },
        onError: () => toast.error("Failed to update resume")
      })
    }
  }

  if (isLoading && !isNew) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <header className="bg-background border-b sticky top-0 z-20 shadow-sm">
        <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-xl font-medium tracking-tight">
              {isNew ? "Create Resume" : "Edit Resume"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="default" 
              onClick={form.handleSubmit(onSubmit)} 
              disabled={createResume.isPending || updateResume.isPending}
              className="gap-2"
            >
              {(createResume.isPending || updateResume.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save & Preview
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 mt-8">
        <Form {...form}>
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <div className="bg-card p-6 rounded-xl border shadow-sm">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Resume Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Frontend Engineer 2024" className="text-lg py-6" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto bg-card border rounded-lg p-1 h-auto flex-wrap mb-6">
                <TabsTrigger value="personal" className="flex-1 min-w-[120px]">Personal Info</TabsTrigger>
                <TabsTrigger value="experience" className="flex-1 min-w-[120px]">Experience</TabsTrigger>
                <TabsTrigger value="education" className="flex-1 min-w-[120px]">Education</TabsTrigger>
                <TabsTrigger value="skills" className="flex-1 min-w-[120px]">Skills</TabsTrigger>
                <TabsTrigger value="projects" className="flex-1 min-w-[120px]">Projects</TabsTrigger>
                <TabsTrigger value="certifications" className="flex-1 min-w-[120px]">Certifications</TabsTrigger>
              </TabsList>

              <div className="bg-card border rounded-xl shadow-sm p-6">
                <TabsContent value="personal" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="data.personalInfo.fullName" render={({ field }) => (
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="data.personalInfo.email" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="data.personalInfo.phone" render={({ field }) => (
                      <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="data.personalInfo.location" render={({ field }) => (
                      <FormItem><FormLabel>Location (City, State)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="data.personalInfo.linkedIn" render={({ field }) => (
                      <FormItem><FormLabel>LinkedIn URL (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="data.personalInfo.website" render={({ field }) => (
                      <FormItem><FormLabel>Portfolio/Website (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="data.personalInfo.summary" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Summary</FormLabel>
                      <FormControl><Textarea className="min-h-[120px]" placeholder="Brief overview of your career and goals..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </TabsContent>

                <TabsContent value="experience" className="mt-0">
                  <ExperienceSection form={form} />
                </TabsContent>

                <TabsContent value="education" className="mt-0">
                  <EducationSection form={form} />
                </TabsContent>

                <TabsContent value="skills" className="mt-0">
                  <SkillsSection form={form} />
                </TabsContent>

                <TabsContent value="projects" className="mt-0">
                  <ProjectsSection form={form} />
                </TabsContent>
                
                <TabsContent value="certifications" className="mt-0">
                  <CertificationsSection form={form} />
                </TabsContent>
              </div>
            </Tabs>
          </form>
        </Form>
      </main>
    </div>
  )
}

function ExperienceSection({ form }: { form: any }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "data.workExperience"
  })

  return (
    <div className="space-y-8">
      {fields.map((field, index) => (
        <div key={field.id} className="p-6 border rounded-lg bg-muted/20 relative group">
          <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormField control={form.control} name={`data.workExperience.${index}.company`} render={({ field }) => (
              <FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name={`data.workExperience.${index}.title`} render={({ field }) => (
              <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name={`data.workExperience.${index}.location`} render={({ field }) => (
              <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name={`data.workExperience.${index}.startDate`} render={({ field }) => (
                <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input placeholder="MMM YYYY" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name={`data.workExperience.${index}.endDate`} render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl><Input placeholder="MMM YYYY or Present" {...field} disabled={form.watch(`data.workExperience.${index}.isCurrent`)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
          <FormField control={form.control} name={`data.workExperience.${index}.isCurrent`} render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 bg-background border mb-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>I currently work here</FormLabel>
              </div>
            </FormItem>
          )} />
          
          <BulletSection control={form.control} name={`data.workExperience.${index}.bullets`} label="Responsibilities & Achievements" />
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full border-dashed py-8" onClick={() => append({ company: "", title: "", location: "", startDate: "", endDate: "", isCurrent: false, bullets: [""] })}>
        <Plus className="w-4 h-4 mr-2" /> Add Experience
      </Button>
    </div>
  )
}

function BulletSection({ control, name, label }: { control: any, name: string, label: string }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name
  })

  return (
    <div className="space-y-3">
      <FormLabel className="text-base">{label}</FormLabel>
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2">
          <div className="mt-3 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
          <FormField control={control} name={`${name}.${index}`} render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl><Textarea className="min-h-[60px] resize-none" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => append("")}>
        <Plus className="w-4 h-4 mr-2" /> Add Bullet
      </Button>
    </div>
  )
}

function EducationSection({ form }: { form: any }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "data.education"
  })

  return (
    <div className="space-y-6">
      {fields.map((field, index) => (
        <div key={field.id} className="p-6 border rounded-lg bg-muted/20 relative group grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <FormField control={form.control} name={`data.education.${index}.school`} render={({ field }) => (
            <FormItem><FormLabel>School/University</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name={`data.education.${index}.degree`} render={({ field }) => (
              <FormItem><FormLabel>Degree</FormLabel><FormControl><Input placeholder="B.S., M.A." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name={`data.education.${index}.field`} render={({ field }) => (
              <FormItem><FormLabel>Field of Study</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name={`data.education.${index}.startDate`} render={({ field }) => (
              <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input placeholder="YYYY" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name={`data.education.${index}.endDate`} render={({ field }) => (
              <FormItem><FormLabel>End Date</FormLabel><FormControl><Input placeholder="YYYY or Expected" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          <FormField control={form.control} name={`data.education.${index}.gpa`} render={({ field }) => (
            <FormItem><FormLabel>GPA (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full border-dashed py-8" onClick={() => append({ school: "", degree: "", field: "", startDate: "" })}>
        <Plus className="w-4 h-4 mr-2" /> Add Education
      </Button>
    </div>
  )
}

function SkillsSection({ form }: { form: any }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "data.skills"
  })

  return (
    <div className="space-y-6">
      {fields.map((field, index) => (
        <div key={field.id} className="p-4 border rounded-lg bg-muted/20 relative group">
          <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <FormField control={form.control} name={`data.skills.${index}.category`} render={({ field: inputField }) => (
            <FormItem className="mb-4 max-w-xs">
              <FormLabel>Category</FormLabel>
              <FormControl><Input placeholder="e.g. Languages, Tools" {...inputField} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name={`data.skills.${index}.items`} render={({ field: inputField }) => (
            <FormItem>
              <FormLabel>Skills (comma separated)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="React, TypeScript, Node.js" 
                  value={Array.isArray(inputField.value) ? inputField.value.join(", ") : ""} 
                  onChange={(e) => inputField.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full border-dashed py-8" onClick={() => append({ category: "", items: [] })}>
        <Plus className="w-4 h-4 mr-2" /> Add Skill Category
      </Button>
    </div>
  )
}

function ProjectsSection({ form }: { form: any }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "data.projects"
  })

  return (
    <div className="space-y-8">
      {fields.map((field, index) => (
        <div key={field.id} className="p-6 border rounded-lg bg-muted/20 relative group">
          <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormField control={form.control} name={`data.projects.${index}.name`} render={({ field }) => (
              <FormItem><FormLabel>Project Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name={`data.projects.${index}.url`} render={({ field }) => (
              <FormItem><FormLabel>URL (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          <FormField control={form.control} name={`data.projects.${index}.description`} render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel>Short Description</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name={`data.projects.${index}.technologies`} render={({ field: inputField }) => (
            <FormItem className="mb-4">
              <FormLabel>Technologies (comma separated)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="React, Firebase, PostgreSQL" 
                  value={Array.isArray(inputField.value) ? inputField.value.join(", ") : ""} 
                  onChange={(e) => inputField.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <BulletSection control={form.control} name={`data.projects.${index}.bullets`} label="Project Details & Accomplishments" />
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full border-dashed py-8" onClick={() => append({ name: "", description: "", url: "", technologies: [], bullets: [""] })}>
        <Plus className="w-4 h-4 mr-2" /> Add Project
      </Button>
    </div>
  )
}

function CertificationsSection({ form }: { form: any }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "data.certifications"
  })

  return (
    <div className="space-y-6">
      {fields.map((field, index) => (
        <div key={field.id} className="p-6 border rounded-lg bg-muted/20 relative group grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <FormField control={form.control} name={`data.certifications.${index}.name`} render={({ field }) => (
            <FormItem><FormLabel>Certification Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name={`data.certifications.${index}.issuer`} render={({ field }) => (
            <FormItem><FormLabel>Issuer</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name={`data.certifications.${index}.date`} render={({ field }) => (
            <FormItem><FormLabel>Date</FormLabel><FormControl><Input placeholder="MMM YYYY" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name={`data.certifications.${index}.url`} render={({ field }) => (
            <FormItem><FormLabel>URL (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full border-dashed py-8" onClick={() => append({ name: "", issuer: "", date: "" })}>
        <Plus className="w-4 h-4 mr-2" /> Add Certification
      </Button>
    </div>
  )
}
