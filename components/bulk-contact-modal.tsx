"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import {
  Mail,
  Phone,
  Linkedin,
  Send,
  Clock,
  Sparkles,
  FileText,
  Calendar,
  Users,
  X,
  Loader2,
  CheckCircle,
} from "lucide-react"

interface BulkContactModalProps {
  isOpen: boolean
  onClose: () => void
  candidates: any[]
  jobTitle?: string
  companyName?: string
}

interface Template {
  id: string
  name: string
  subject: string
  content: string
  category: "interview" | "rejection" | "follow-up" | "status-update" | "general"
}

const bulkTemplates: Template[] = [
  {
    id: "bulk-interview-invite",
    name: "Bulk Interview Invitation",
    subject: "Interview Opportunity - {{job.title}} at {{company.name}}",
    category: "interview",
    content: `Dear {{candidate.first_name}},

Thank you for your interest in the {{job.title}} position at {{company.name}}. We were impressed with your background and would like to invite you for an interview.

We are currently scheduling interviews for this week and next week. Please reply with your availability, and we'll send you a calendar invite.

Looking forward to speaking with you soon.

Best regards,
{{user.name}}
{{user.title}}
{{company.name}}`,
  },
  {
    id: "bulk-status-update",
    name: "Bulk Status Update",
    subject: "Update on your application - {{job.title}}",
    category: "status-update",
    content: `Dear {{candidate.first_name}},

I wanted to provide you with an update on your application for the {{job.title}} position at {{company.name}}.

We're currently reviewing all applications and will be in touch with next steps within the next few days.

Thank you for your patience and continued interest.

Best regards,
{{user.name}}`,
  },
  {
    id: "bulk-follow-up",
    name: "Bulk Follow-up",
    subject: "Following up on your application - {{job.title}}",
    category: "follow-up",
    content: `Hi {{candidate.first_name}},

I wanted to follow up on your application for the {{job.title}} position at {{company.name}}.

Your background looks interesting, and we'd like to learn more about your experience. Would you be available for a brief conversation this week?

Please let me know your availability.

Best regards,
{{user.name}}`,
  },
]

export function BulkContactModal({
  isOpen,
  onClose,
  candidates,
  jobTitle = "",
  companyName = "Your Company",
}: BulkContactModalProps) {
  const [activeChannel, setActiveChannel] = useState<"email" | "phone" | "linkedin">("email")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendingProgress, setSendingProgress] = useState(0)
  const [sentCandidates, setSentCandidates] = useState<string[]>([])

  const { toast } = useToast()
  const { language } = useLanguage()

  // Available variables for template substitution
  const variables = {
    job: {
      title: jobTitle || "Position",
    },
    company: {
      name: companyName || "Your Company",
    },
    user: {
      name: "John Doe", // This would come from auth context
      title: "Hiring Manager",
      email: "john@company.com",
    },
  }

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubject("")
      setContent("")
      setIsScheduled(false)
      setScheduledDate("")
      setScheduledTime("")
      setSelectedTemplate(null)
      setActiveChannel("email")
      setSendingProgress(0)
      setSentCandidates([])
    }
  }, [isOpen])

  const replaceVariables = (text: string, candidate: any): string => {
    let result = text

    // Replace candidate variables
    const candidateVars = {
      first_name: candidate?.name?.split(" ")[0] || "Candidate",
      last_name: candidate?.name?.split(" ").slice(1).join(" ") || "",
      full_name: candidate?.name || "Candidate",
      email: candidate?.email || "",
      phone: candidate?.phone || "",
      position: candidate?.position || "",
      location: candidate?.location || "",
    }

    Object.entries(candidateVars).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{candidate.${key}}}`, "g"), value)
    })

    // Replace job variables
    Object.entries(variables.job).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{job.${key}}}`, "g"), value)
    })

    // Replace company variables
    Object.entries(variables.company).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{company.${key}}}`, "g"), value)
    })

    // Replace user variables
    Object.entries(variables.user).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{user.${key}}}`, "g"), value)
    })

    return result
  }

  const applyTemplate = (template: Template) => {
    setSelectedTemplate(template)
    setSubject(template.subject)
    setContent(template.content)
  }

  const generateAiContent = async () => {
    setIsAiGenerating(true)
    try {
      // Simulate AI generation - in real app, this would call an AI service
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const aiContent = `Dear {{candidate.first_name}},

I hope this message finds you well. I wanted to reach out regarding the ${variables.job.title} position at ${variables.company.name}.

Based on your background, I believe you could be a great fit for our team. We're currently reviewing applications and would love to discuss this opportunity with you further.

Would you be available for a brief conversation this week?

Best regards,
${variables.user.name}`

      setContent(aiContent)
      setSubject(`Exciting opportunity - ${variables.job.title} at ${variables.company.name}`)

      toast({
        title: language === "EN" ? "AI Content Generated" : "KI-Inhalt generiert",
        description:
          language === "EN" ? "Content has been generated successfully" : "Inhalt wurde erfolgreich generiert",
      })
    } catch (error) {
      toast({
        title: language === "EN" ? "Error" : "Fehler",
        description: language === "EN" ? "Failed to generate AI content" : "Fehler beim Generieren des KI-Inhalts",
        variant: "destructive",
      })
    } finally {
      setIsAiGenerating(false)
    }
  }

  const handleBulkSend = async () => {
    if (!content.trim()) {
      toast({
        title: language === "EN" ? "Error" : "Fehler",
        description: language === "EN" ? "Please enter a message" : "Bitte geben Sie eine Nachricht ein",
        variant: "destructive",
      })
      return
    }

    if (activeChannel === "email" && !subject.trim()) {
      toast({
        title: language === "EN" ? "Error" : "Fehler",
        description: language === "EN" ? "Please enter a subject" : "Bitte geben Sie einen Betreff ein",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    setSendingProgress(0)
    setSentCandidates([])

    try {
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i]

        // Simulate sending delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        const personalizedSubject = replaceVariables(subject, candidate)
        const personalizedContent = replaceVariables(content, candidate)

        const contactLog = {
          id: Date.now().toString() + i,
          candidateId: candidate.id,
          channel: activeChannel,
          subject: activeChannel === "email" ? personalizedSubject : undefined,
          content: personalizedContent,
          status: "sent",
          scheduledAt: isScheduled ? new Date(`${scheduledDate}T${scheduledTime}`) : undefined,
          sentAt: !isScheduled ? new Date() : undefined,
          userId: "current-user", // This would come from auth context
          createdAt: new Date(),
        }

        // Save to localStorage
        const existingHistory = localStorage.getItem(`contact_history_${candidate.id}`)
        const history = existingHistory ? JSON.parse(existingHistory) : []
        history.unshift(contactLog)
        localStorage.setItem(`contact_history_${candidate.id}`, JSON.stringify(history))

        // Try to save via API
        try {
          await fetch(`/api/candidates/${candidate.id}/contact`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(contactLog),
          })
        } catch (apiError) {
          console.warn("API call failed, using localStorage only:", apiError)
        }

        setSentCandidates((prev) => [...prev, candidate.id])
        setSendingProgress(((i + 1) / candidates.length) * 100)
      }

      toast({
        title: language === "EN" ? "Success" : "Erfolg",
        description: isScheduled
          ? language === "EN"
            ? `Messages scheduled for ${candidates.length} candidates`
            : `Nachrichten für ${candidates.length} Kandidaten geplant`
          : language === "EN"
            ? `Messages sent to ${candidates.length} candidates`
            : `Nachrichten an ${candidates.length} Kandidaten gesendet`,
      })

      // Close modal after a brief delay to show completion
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error("Error sending bulk messages:", error)
      toast({
        title: language === "EN" ? "Error" : "Fehler",
        description: language === "EN" ? "Failed to send messages" : "Fehler beim Senden der Nachrichten",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-teal-600" />
                <div>
                  <div className="text-lg font-semibold">
                    {language === "EN" ? "Bulk Contact Candidates" : "Kandidaten in Masse kontaktieren"}
                  </div>
                  <div className="text-sm font-normal text-muted-foreground">
                    {language === "EN"
                      ? `Contact ${candidates.length} candidates at once`
                      : `${candidates.length} Kandidaten auf einmal kontaktieren`}
                  </div>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Main Composer */}
            <div className="lg:col-span-2 space-y-4 overflow-y-auto">
              {/* Channel Selection */}
              <div className="flex gap-2">
                <Button
                  variant={activeChannel === "email" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveChannel("email")}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {language === "EN" ? "Email" : "E-Mail"}
                </Button>
                <Button
                  variant={activeChannel === "phone" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveChannel("phone")}
                  className="flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  {language === "EN" ? "Phone" : "Telefon"}
                </Button>
                <Button
                  variant={activeChannel === "linkedin" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveChannel("linkedin")}
                  className="flex items-center gap-2"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </Button>
              </div>

              {/* Progress Bar (shown during sending) */}
              {isSending && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{language === "EN" ? "Sending messages..." : "Nachrichten werden gesendet..."}</span>
                        <span>{Math.round(sendingProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${sendingProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sentCandidates.length} of {candidates.length} sent
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Email Composer */}
              {activeChannel === "email" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject">{language === "EN" ? "Subject" : "Betreff"}</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={language === "EN" ? "Enter subject..." : "Betreff eingeben..."}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {language === "EN"
                        ? "Use {{candidate.first_name}} for personalization"
                        : "Verwenden Sie {{candidate.first_name}} für Personalisierung"}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="content-textarea">{language === "EN" ? "Message" : "Nachricht"}</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateAiContent}
                        disabled={isAiGenerating}
                        className="flex items-center gap-2 bg-transparent"
                      >
                        {isAiGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        {language === "EN" ? "AI Assist" : "KI-Hilfe"}
                      </Button>
                    </div>

                    <Textarea
                      id="content-textarea"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={language === "EN" ? "Enter your message..." : "Ihre Nachricht eingeben..."}
                      rows={12}
                      className="resize-none"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {language === "EN"
                        ? "Variables like {{candidate.first_name}}, {{job.title}}, {{company.name}} will be personalized for each candidate"
                        : "Variablen wie {{candidate.first_name}}, {{job.title}}, {{company.name}} werden für jeden Kandidaten personalisiert"}
                    </div>
                  </div>
                </div>
              )}

              {/* Scheduling */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{language === "EN" ? "Scheduling" : "Terminplanung"}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsScheduled(!isScheduled)}
                      className={isScheduled ? "bg-teal-50 border-teal-200" : ""}
                    >
                      {isScheduled
                        ? language === "EN"
                          ? "Scheduled"
                          : "Geplant"
                        : language === "EN"
                          ? "Send Now"
                          : "Jetzt senden"}
                    </Button>
                  </div>
                </CardHeader>
                {isScheduled && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="scheduled-date">{language === "EN" ? "Date" : "Datum"}</Label>
                        <Input
                          id="scheduled-date"
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div>
                        <Label htmlFor="scheduled-time">{language === "EN" ? "Time" : "Zeit"}</Label>
                        <Input
                          id="scheduled-time"
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 overflow-y-auto">
              {/* Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {language === "EN" ? "Bulk Templates" : "Massen-Vorlagen"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {bulkTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left h-auto p-3 bg-transparent"
                      onClick={() => applyTemplate(template)}
                    >
                      <div>
                        <div className="font-medium text-xs">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.subject}</div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Selected Candidates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {language === "EN" ? "Recipients" : "Empfänger"} ({candidates.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                  {candidates.map((candidate) => (
                    <div key={candidate.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={candidate.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">
                          {candidate.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{candidate.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{candidate.email}</div>
                      </div>
                      {sentCandidates.includes(candidate.id) && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t flex-shrink-0">
            <div className="flex items-center gap-2">
              {selectedTemplate && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {selectedTemplate.name}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSending}>
                {language === "EN" ? "Cancel" : "Abbrechen"}
              </Button>
              <Button
                onClick={handleBulkSend}
                disabled={isSending || !content.trim()}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isScheduled ? (
                  <Calendar className="h-4 w-4 mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {isSending
                  ? language === "EN"
                    ? "Sending..."
                    : "Wird gesendet..."
                  : isScheduled
                    ? language === "EN"
                      ? `Schedule for ${candidates.length}`
                      : `Planen für ${candidates.length}`
                    : language === "EN"
                      ? `Send to ${candidates.length}`
                      : `An ${candidates.length} senden`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
