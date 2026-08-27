import { z } from "zod"

export const personalInfoSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  location: z.string().min(1, "Location is required"),
  linkedIn: z.string().optional(),
  website: z.string().optional(),
  summary: z.string().min(10, "Summary should be at least 10 characters")
})

export const workExperienceSchema = z.object({
  company: z.string().min(1, "Company is required"),
  title: z.string().min(1, "Job title is required"),
  location: z.string().min(1, "Location is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  bullets: z.array(z.string().min(1, "Bullet point cannot be empty")).min(1, "At least one bullet point is required")
})

export const educationSchema = z.object({
  school: z.string().min(1, "School name is required"),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().min(1, "Field of study is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  gpa: z.string().optional()
})

export const skillGroupSchema = z.object({
  category: z.string().min(1, "Category is required"),
  items: z.array(z.string()).min(1, "At least one skill is required")
})

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().min(1, "Description is required"),
  url: z.string().optional(),
  technologies: z.array(z.string()),
  bullets: z.array(z.string())
})

export const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  issuer: z.string().min(1, "Issuer is required"),
  date: z.string().min(1, "Date is required"),
  url: z.string().optional()
})

export const resumeDataSchema = z.object({
  personalInfo: personalInfoSchema,
  workExperience: z.array(workExperienceSchema),
  education: z.array(educationSchema),
  skills: z.array(skillGroupSchema),
  projects: z.array(projectSchema),
  certifications: z.array(certificationSchema)
})

export const resumeInputSchema = z.object({
  title: z.string().min(1, "Resume title is required (e.g. 'Software Engineer 2024')"),
  data: resumeDataSchema
})

export type ResumeFormValues = z.infer<typeof resumeInputSchema>

export const emptyResumeData: ResumeFormValues = {
  title: "",
  data: {
    personalInfo: { fullName: "", email: "", phone: "", location: "", summary: "", linkedIn: "", website: "" },
    workExperience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: []
  }
}