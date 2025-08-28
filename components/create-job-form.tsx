"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

interface CreateJobFormProps {
  onSuccess?: () => void
}

export function CreateJobForm({ onSuccess }: CreateJobFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    jobType: "full-time",
    description: "",
    requirements: "",
    benefits: "",
    salaryRange: "",
    skills: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create job object
      const jobData = {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: formData.title,
        company: formData.company,
        location: formData.location,
        job_type: formData.jobType,
        description: formData.description,
        requirements: formData.requirements,
        benefits: formData.benefits,
        salary_range: formData.salaryRange,
        skills: formData.skills,
        status: "active",
        created_at: new Date().toISOString(),
        applicants: 0,
        userId: user?.id,
        userEmail: user?.email,
      }

      // Save to localStorage
      const existingJobs = JSON.parse(localStorage.getItem("recruitify_jobs") || "[]")
      existingJobs.push(jobData)
      localStorage.setItem("recruitify_jobs", JSON.stringify(existingJobs))

      // Try to save to API
      try {
        await fetch("/api/jobs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(jobData),
        })
      } catch (apiError) {
        console.warn("API save failed, localStorage backup used:", apiError)
      }

      toast({
        title: "Job created successfully!",
        description: "Your job posting has been created and is now active.",
      })

      // Redirect to dashboard
      router.push("/dashboard")

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error creating job:", error)
      toast({
        title: "Error creating job",
        description: "There was an error creating your job posting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Job</CardTitle>
        <CardDescription>Fill in the details to create a new job posting</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g. Senior Software Developer"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                placeholder="e.g. Tech Corp"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="e.g. Berlin, Germany"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobType">Job Type</Label>
              <Select value={formData.jobType} onValueChange={(value) => handleInputChange("jobType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => handleInputChange("requirements", e.target.value)}
              placeholder="List the required skills, experience, and qualifications..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Key Skills</Label>
            <Input
              id="skills"
              value={formData.skills}
              onChange={(e) => handleInputChange("skills", e.target.value)}
              placeholder="e.g. JavaScript, React, Node.js, Python"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salaryRange">Salary Range</Label>
              <Input
                id="salaryRange"
                value={formData.salaryRange}
                onChange={(e) => handleInputChange("salaryRange", e.target.value)}
                placeholder="e.g. €50,000 - €70,000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits</Label>
              <Input
                id="benefits"
                value={formData.benefits}
                onChange={(e) => handleInputChange("benefits", e.target.value)}
                placeholder="e.g. Health insurance, Remote work"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Job"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
