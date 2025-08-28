"use client"

import type React from "react"

import { useState } from "react"
import { Upload, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function AiMatchingDemo() {
  const [step, setStep] = useState(1)
  const [jobDescription, setJobDescription] = useState("")
  const [fileName, setFileName] = useState("")
  const [showResults, setShowResults] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name)
    }
  }

  const handleMatch = () => {
    setShowResults(true)
  }

  return (
    <section id="ai-matching-demo" className="bg-gray-50 py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            AI-Powered Résumé Matching
          </h2>
          <p className="mb-12 text-lg text-gray-600">Paste a job description, upload a CV – let AI do the rest.</p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Card className="border-2 border-gray-200 shadow-sm">
            <CardContent className="p-6">
              {step === 1 && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Paste Job Description</label>
                  <Textarea
                    placeholder="Paste your job description here..."
                    className="min-h-[200px] resize-none"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      className="bg-teal-600 hover:bg-teal-700"
                      onClick={() => setStep(2)}
                      disabled={!jobDescription.trim()}
                    >
                      Next Step
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Upload Candidate CV (PDF or .txt)</label>
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="mb-2 text-sm text-gray-600">Drag and drop your file here, or click to browse</p>
                    <p className="text-xs text-gray-500">PDF or TXT files only (max. 5MB)</p>
                    <input
                      type="file"
                      className="hidden"
                      id="cv-upload"
                      accept=".pdf,.txt"
                      onChange={handleFileChange}
                    />
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => document.getElementById("cv-upload")?.click()}
                    >
                      Browse Files
                    </Button>
                    {fileName && <p className="mt-2 text-sm text-teal-600">Selected: {fileName}</p>}
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      className="bg-teal-600 hover:bg-teal-700"
                      onClick={() => {
                        setStep(3)
                        handleMatch()
                      }}
                      disabled={!fileName}
                    >
                      Match Now
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && showResults && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="mb-2 text-xl font-semibold text-gray-900">Match Results</h3>
                    <p className="text-gray-600">Here's how this candidate matches with your job description</p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-6">
                    <div className="mb-4 text-center">
                      <p className="text-sm font-medium text-gray-600">Matching Score</p>
                      <div className="mb-2 flex items-center justify-center">
                        <span className="text-4xl font-bold text-teal-600">78%</span>
                      </div>
                      <Progress value={78} className="h-2 w-full bg-gray-200" />
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="mb-3 flex items-center text-sm font-semibold text-gray-900">
                          <CheckCircle className="mr-2 h-4 w-4 text-teal-600" />
                          Top 3 Strengths
                        </h4>
                        <ul className="space-y-2 pl-6 text-sm">
                          <li className="text-gray-700">5+ years of frontend development experience</li>
                          <li className="text-gray-700">Strong React.js and TypeScript skills</li>
                          <li className="text-gray-700">Experience with responsive design and UI frameworks</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="mb-3 flex items-center text-sm font-semibold text-gray-900">
                          <XCircle className="mr-2 h-4 w-4 text-red-500" />
                          Weaknesses / Gaps
                        </h4>
                        <ul className="space-y-2 pl-6 text-sm">
                          <li className="text-gray-700">Limited experience with GraphQL</li>
                          <li className="text-gray-700">No mention of CI/CD pipeline experience</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="mb-3 flex items-center text-sm font-semibold text-gray-900">
                        <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />
                        AI Summary
                      </h4>
                      <p className="text-sm text-gray-700">
                        This candidate is a strong match for the Frontend Developer position with excellent React and
                        TypeScript skills. While they lack some experience with GraphQL and CI/CD, their strong
                        foundation in frontend development and responsive design makes them a promising candidate worth
                        interviewing.
                      </p>
                    </div>
                  </div>

                  <p className="text-center text-xs text-gray-500">Powered by ChatGPT API. No data stored.</p>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep(2)
                        setShowResults(false)
                      }}
                    >
                      Back
                    </Button>
                    <Button className="bg-teal-600 hover:bg-teal-700">Save Results</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
