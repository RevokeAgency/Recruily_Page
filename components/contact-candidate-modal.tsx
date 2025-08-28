"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
  User,
  MapPin,
  Briefcase,
  X,
  Plus,
  Eye,
  Loader2,
  Paperclip,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ContactCandidateModalProps {
  isOpen: boolean
  onClose: () => void
  candidate: any
  jobTitle?: string
  companyName?: string
  applicationId?: string
}

interface Template {
  id: string
  name: string
  subject: string
  content: string
  category: "interview" | "rejection" | "follow-up" | "status-update" | "general"
}

interface ContactLog {
  id: string
  candidateId: string
  applicationId?: string
  channel: "email" | "phone" | "linkedin"
  subject?: string
  content: string
  status: "sent" | "delivered" | "read" | "replied" | "failed"
  scheduledAt?: Date
  sentAt?: Date
  userId: string
  createdAt: Date
}

const defaultTemplates: Template[] = [
  {
    id: "interview-invite",
    name: "Interview Invitation",
    subject: "Interview Invitation - {{job.title}} at {{company.name}}",
    category: "interview",
    content: `Dear {{candidate.first_name}},

Thank you for your interest in the {{job.title}} position at {{company.name}}. We were impressed with your background and would like to invite you for an interview.

We would like to schedule a {{interview.type}} interview at your convenience. Please let us know your availability for the coming week.

Looking forward to speaking with you soon.

Best regards,
{{user.name}}
{{user.title}}
{{company.name}}`,
  },
  {
    id: "follow-up",
    name: "Follow-up",
    subject: "Following up on your application - {{job.title}}",
    category: "follow-up",
    content: `Hi {{candidate.first_name}},

I wanted to follow up on your application for the {{job.title}} position at {{company.name}}.

We're currently reviewing applications and will be in touch soon with next steps.

Thank you for your patience.

Best regards,
{{user.name}}`,
  },
  {
    id: "status-update",
    name: "Status Update",
    subject: "Update on your application - {{job.title}}",
    category: "status-update",
    content: `Dear {{candidate.first_name}},

I wanted to provide you with an update on your application for the {{job.title}} position.

{{status.message}}

Please don't hesitate to reach out if you have any questions.

Best regards,
{{user.name}}`,
  },
  {
    id: "rejection",
    name: "Polite Rejection",
    subject: "Thank you for your interest - {{job.title}}",
    category: "rejection",
    content: `Dear {{candidate.first_name}},

Thank you for taking the time to apply for the {{job.title}} position at {{company.name}}.

After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.

We were impressed with your background and encourage you to apply for future opportunities that align with your skills.

Thank you again for your interest in {{company.name}}.

Best regards,
{{user.name}}`,
  },
]

export function ContactCandidateModal({
  isOpen,
  onClose,
  candidate,
  jobTitle = "",
  companyName = "Your Company",
  applicationId,
}: ContactCandidateModalProps) {
  const [activeChannel, setActiveChannel] = useState<"email" | "phone" | "linkedin">("email")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const [contactHistory, setContactHistory] = useState<ContactLog[]>([])
  const [showVariablePicker, setShowVariablePicker] = useState(false)

  const { toast } = useToast()
  const { language } = useLanguage()

  // Available variables for template substitution
  const variables = {
    candidate: {
      first_name: candidate?.name?.split(" ")[0] || "Candidate",
      last_name: candidate?.name?.split(" ").slice(1).join(" ") || "",
      full_name: candidate?.name || "Candidate",
      email: candidate?.email || "",
      phone: candidate?.phone || "",
      position: candidate?.position || "",
      location: candidate?.location || "",
    },
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

  // Load contact history on mount
  useEffect(() => {
    if (isOpen && candidate?.id) {
      loadContactHistory()
    }
  }, [isOpen, candidate?.id])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubject("")
      setContent("")
      setIsScheduled(false)
      setScheduledDate("")
      setScheduledTime("")
      setSelectedTemplate(null)
      setShowPreview(false)
      setAttachments([])
      setActiveChannel("email")
    }
  }, [isOpen])

  const loadContactHistory = async () => {
    try {
      // Load from localStorage first
      const storedHistory = localStorage.getItem(`contact_history_${candidate.id}`)
      if (storedHistory) {
        setContactHistory(JSON.parse(storedHistory))
      }

      // Try API as fallback
      try {
        const response = await fetch(`/api/candidates/${candidate.id}/contact-history`)
        if (response.ok) {
          const data = await response.json()
          setContactHistory(data.history || [])
        }
      } catch (apiError) {
        console.warn("API call for contact history failed:", apiError)
      }
    } catch (error) {
      console.error("Error loading contact history:", error)
    }
  }

  const replaceVariables = (text: string): string => {
    let result = text

    // Replace candidate variables
    Object.entries(variables.candidate).forEach(([key, value]) => {
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
    setSubject(replaceVariables(template.subject))
    setContent(replaceVariables(template.content))
  }

  const generateAiContent = async () => {
    setIsAiGenerating(true)
    try {
      // Simulate AI generation - in real app, this would call an AI service
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const aiContent = `Dear ${variables.candidate.first_name},

I hope this message finds you well. I wanted to reach out regarding your application for the ${variables.job.title} position at ${variables.company.name}.

Based on your background in ${candidate?.skills?.slice(0, 2)?.join(" and ") || "your field"}, I believe you could be a great fit for our team. Your experience aligns well with what we're looking for.

Would you be available for a brief conversation this week to discuss the opportunity further?

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

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + `{{${variable}}}` + content.substring(end)
      setContent(newContent)

      // Reset cursor position
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4)
      }, 0)
    }
    setShowVariablePicker(false)
  }

  const handleSend = async () => {
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

    try {
      const contactLog: ContactLog = {
        id: Date.now().toString(),
        candidateId: candidate.id,
        applicationId,
        channel: activeChannel,
        subject: activeChannel === "email" ? subject : undefined,
        content,
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

      // Update contact history
      setContactHistory((prev) => [contactLog, ...prev])

      toast({
        title: language === "EN" ? "Success" : "Erfolg",
        description: isScheduled
          ? language === "EN"
            ? `Message scheduled for ${scheduledDate} at ${scheduledTime}`
            : `Nachricht geplant für ${scheduledDate} um ${scheduledTime}`
          : language === "EN"
            ? "Message sent successfully"
            : "Nachricht erfolgreich gesendet",
      })

      onClose()
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: language === "EN" ? "Error" : "Fehler",
        description: language === "EN" ? "Failed to send message" : "Fehler beim Senden der Nachricht",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachments((prev) => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="h-4 w-4" />
      case "phone":
        return <Phone className="h-4 w-4" />
      case "linkedin":
        return <Linkedin className="h-4 w-4" />
      default:
        return <Mail className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "read":
        return "bg-purple-100 text-purple-800"
      case "replied":
        return "bg-emerald-100 text-emerald-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={candidate?.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-teal-100 text-teal-700">
                  {candidate?.name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("") || "C"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-semibold">
                  {language === "EN" ? "Contact" : "Kontaktieren"} {candidate?.name}
                </div>
                <div className="text-sm font-normal text-muted-foreground flex items-center gap-2">
                  <User className="h-3 w-3" />
                  {candidate?.position || "Professional"}
                  {jobTitle && (
                    <>
                      <Separator orientation="vertical" className="h-3" />
                      <Briefcase className="h-3 w-3" />
                      {jobTitle}
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="compose" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="compose">{language === "EN" ? "Compose" : "Verfassen"}</TabsTrigger>
              <TabsTrigger value="history">{language === "EN" ? "History" : "Verlauf"}</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="flex-1 overflow-hidden">
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

                  {/* Email Composer */}
                  {activeChannel === "email" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="to">{language === "EN" ? "To" : "An"}</Label>
                          <Input id="to" value={candidate?.email || ""} disabled className="bg-muted" />
                        </div>
                        <div>
                          <Label htmlFor="from">{language === "EN" ? "From" : "Von"}</Label>
                          <Input id="from" value={variables.user.email} disabled className="bg-muted" />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="subject">{language === "EN" ? "Subject" : "Betreff"}</Label>
                        <div className="flex gap-2">
                          <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder={language === "EN" ? "Enter subject..." : "Betreff eingeben..."}
                          />
                          <DropdownMenu open={showVariablePicker} onOpenChange={setShowVariablePicker}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => insertVariable("candidate.first_name")}>
                                {variables.candidate.first_name}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => insertVariable("candidate.full_name")}>
                                {variables.candidate.full_name}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => insertVariable("job.title")}>
                                {variables.job.title}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => insertVariable("company.name")}>
                                {variables.company.name}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="content-textarea">{language === "EN" ? "Message" : "Nachricht"}</Label>
                          <div className="flex gap-2">
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowPreview(!showPreview)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              {language === "EN" ? "Preview" : "Vorschau"}
                            </Button>
                          </div>
                        </div>

                        {showPreview ? (
                          <Card>
                            <CardContent className="p-4">
                              <div className="whitespace-pre-wrap text-sm">
                                {replaceVariables(content) ||
                                  (language === "EN" ? "No content to preview" : "Kein Inhalt zur Vorschau")}
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Textarea
                            id="content-textarea"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={language === "EN" ? "Enter your message..." : "Ihre Nachricht eingeben..."}
                            rows={12}
                            className="resize-none"
                          />
                        )}
                      </div>

                      {/* Attachments */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>{language === "EN" ? "Attachments" : "Anhänge"}</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("file-upload")?.click()}
                            className="flex items-center gap-2"
                          >
                            <Paperclip className="h-4 w-4" />
                            {language === "EN" ? "Add File" : "Datei hinzufügen"}
                          </Button>
                          <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} />
                        </div>

                        {attachments.length > 0 && (
                          <div className="space-y-2">
                            {attachments.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  <span className="text-sm">{file.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({Math.round(file.size / 1024)}KB)
                                  </span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Phone Composer */}
                  {activeChannel === "phone" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone-number">{language === "EN" ? "Phone Number" : "Telefonnummer"}</Label>
                          <Input id="phone-number" value={candidate?.phone || ""} disabled className="bg-muted" />
                        </div>
                        <div>
                          <Label htmlFor="call-type">{language === "EN" ? "Call Type" : "Anruftyp"}</Label>
                          <select className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm">
                            <option value="screening">
                              {language === "EN" ? "Screening Call" : "Screening-Anruf"}
                            </option>
                            <option value="interview">
                              {language === "EN" ? "Phone Interview" : "Telefoninterview"}
                            </option>
                            <option value="follow-up">{language === "EN" ? "Follow-up" : "Nachfassen"}</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="call-notes">
                          {language === "EN" ? "Call Notes / Agenda" : "Anrufnotizen / Agenda"}
                        </Label>
                        <Textarea
                          id="call-notes"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder={
                            language === "EN" ? "Enter call notes or agenda..." : "Anrufnotizen oder Agenda eingeben..."
                          }
                          rows={10}
                        />
                      </div>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {language === "EN"
                              ? "This will log a manual call. For AI-powered calls with transcription, upgrade to Pro."
                              : "Dies protokolliert einen manuellen Anruf. Für KI-gestützte Anrufe mit Transkription upgraden Sie auf Pro."}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* LinkedIn Composer */}
                  {activeChannel === "linkedin" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="linkedin-profile">
                          {language === "EN" ? "LinkedIn Profile" : "LinkedIn-Profil"}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="linkedin-profile"
                            value={
                              candidate?.linkedin ||
                              `https://linkedin.com/in/${candidate?.name?.toLowerCase().replace(" ", "-")}`
                            }
                            disabled
                            className="bg-muted"
                          />
                          <Button
                            variant="outline"
                            onClick={() =>
                              window.open(
                                candidate?.linkedin ||
                                  `https://linkedin.com/in/${candidate?.name?.toLowerCase().replace(" ", "-")}`,
                                "_blank",
                              )
                            }
                          >
                            {language === "EN" ? "Open" : "Öffnen"}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="linkedin-message">
                          {language === "EN" ? "LinkedIn Message" : "LinkedIn-Nachricht"}
                        </Label>
                        <Textarea
                          id="linkedin-message"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder={
                            language === "EN" ? "Enter your LinkedIn message..." : "Ihre LinkedIn-Nachricht eingeben..."
                          }
                          rows={8}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {content.length}/300 {language === "EN" ? "characters" : "Zeichen"}
                        </div>
                      </div>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Linkedin className="h-4 w-4" />
                            {language === "EN"
                              ? "This will open LinkedIn in a new tab. Manually send the message and mark as sent."
                              : "Dies öffnet LinkedIn in einem neuen Tab. Senden Sie die Nachricht manuell und markieren Sie sie als gesendet."}
                          </div>
                        </CardContent>
                      </Card>
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
                        {language === "EN" ? "Templates" : "Vorlagen"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {defaultTemplates.map((template) => (
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

                  {/* Candidate Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {language === "EN" ? "Candidate Info" : "Kandidateninfo"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{candidate?.email}</span>
                      </div>
                      {candidate?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{candidate.phone}</span>
                        </div>
                      )}
                      {candidate?.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate">{candidate.location}</span>
                        </div>
                      )}
                      {candidate?.skills && (
                        <div>
                          <div className="text-xs font-medium mb-1">{language === "EN" ? "Skills" : "Fähigkeiten"}</div>
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(candidate.skills) ? candidate.skills : candidate.skills.split(","))
                              .slice(0, 3)
                              .map((skill: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {skill.trim()}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  {contactHistory.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {language === "EN" ? "Recent Activity" : "Letzte Aktivität"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {contactHistory.slice(0, 3).map((log) => (
                          <div key={log.id} className="flex items-start gap-2 text-xs">
                            <div className="flex-shrink-0 mt-0.5">{getChannelIcon(log.channel)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{log.subject || `${log.channel} contact`}</div>
                              <div className="text-muted-foreground">
                                {new Date(log.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <Badge className={getStatusColor(log.status)} variant="secondary">
                              {log.status}
                            </Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
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
                  <Button variant="outline" onClick={onClose}>
                    {language === "EN" ? "Cancel" : "Abbrechen"}
                  </Button>
                  <Button
                    onClick={handleSend}
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
                          ? "Schedule"
                          : "Planen"
                        : language === "EN"
                          ? "Send"
                          : "Senden"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{language === "EN" ? "Contact History" : "Kontaktverlauf"}</h3>
                  <Badge variant="outline">
                    {contactHistory.length} {language === "EN" ? "contacts" : "Kontakte"}
                  </Badge>
                </div>

                {contactHistory.length > 0 ? (
                  <div className="space-y-4">
                    {contactHistory.map((log) => (
                      <Card key={log.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {getChannelIcon(log.channel)}
                              <span className="font-medium capitalize">{log.channel}</span>
                              <Badge className={getStatusColor(log.status)} variant="secondary">
                                {log.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {log.sentAt
                                ? new Date(log.sentAt).toLocaleString()
                                : log.scheduledAt
                                  ? `Scheduled for ${new Date(log.scheduledAt).toLocaleString()}`
                                  : new Date(log.createdAt).toLocaleString()}
                            </div>
                          </div>

                          {log.subject && <div className="font-medium mb-2">{log.subject}</div>}

                          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {log.content.length > 200 ? `${log.content.substring(0, 200)}...` : log.content}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        {language === "EN" ? "No contact history" : "Kein Kontaktverlauf"}
                      </h3>
                      <p className="text-muted-foreground">
                        {language === "EN"
                          ? "Start a conversation with this candidate"
                          : "Beginnen Sie ein Gespräch mit diesem Kandidaten"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
