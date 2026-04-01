"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Mail, Phone, MapPin, MoreVertical, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface Candidate {
  id: string
  name: string
  email: string
  phone?: string
  position: string
  experience: string
  skills: string[]
  summary: string
  location?: string
  education: string[]
  certifications: string[]
  languages: string[]
  match: number
  status: string
  applied: string
  jobId?: string
  source?: string
  yearsOfExperience?: number
  workExperience?: any[]
}

interface KanbanColumnProps {
  title: string
  status: string
  candidates: Candidate[]
  onStatusChange: (candidateId: string, newStatus: string) => void
  language: "en" | "es" | "fr"
  color?: string
}

// Translations for actions
const actionTranslations = {
  en: {
    moveToContacted: "Move to Contacted",
    moveToInterviewing: "Move to Interviewing",
    moveToOffered: "Move to Offered",
    moveToHired: "Move to Hired",
    moveToRejected: "Move to Rejected",
    viewProfile: "View Profile",
    sendEmail: "Send Email",
    scheduleInterview: "Schedule Interview",
    match: "Match",
    applied: "Applied",
    yearsExp: "years exp",
  },
  es: {
    moveToContacted: "Mover a Contactado",
    moveToInterviewing: "Mover a Entrevistando",
    moveToOffered: "Mover a Ofertado",
    moveToHired: "Mover a Contratado",
    moveToRejected: "Mover a Rechazado",
    viewProfile: "Ver Perfil",
    sendEmail: "Enviar Email",
    scheduleInterview: "Programar Entrevista",
    match: "Coincidencia",
    applied: "Aplicado",
    yearsExp: "años exp",
  },
  fr: {
    moveToContacted: "Déplacer vers Contacté",
    moveToInterviewing: "Déplacer vers En Entretien",
    moveToOffered: "Déplacer vers Offre Faite",
    moveToHired: "Déplacer vers Embauché",
    moveToRejected: "Déplacer vers Rejeté",
    viewProfile: "Voir le Profil",
    sendEmail: "Envoyer un Email",
    scheduleInterview: "Programmer un Entretien",
    match: "Correspondance",
    applied: "Postulé",
    yearsExp: "ans d'exp",
  },
}

export function KanbanColumn({
  title,
  status,
  candidates,
  onStatusChange,
  language,
  color = "bg-gray-50 border-gray-200",
}: KanbanColumnProps) {
  const [draggedOver, setDraggedOver] = useState(false)
  const t = actionTranslations[language]

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDraggedOver(true)
  }

  const handleDragLeave = () => {
    setDraggedOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDraggedOver(false)

    const candidateId = e.dataTransfer.getData("text/plain")
    if (candidateId) {
      onStatusChange(candidateId, status)
    }
  }

  const getStatusActions = (currentStatus: string) => {
    const actions = []

    if (currentStatus !== "Contacted") actions.push({ label: t.moveToContacted, status: "Contacted" })
    if (currentStatus !== "Interviewing") actions.push({ label: t.moveToInterviewing, status: "Interviewing" })
    if (currentStatus !== "Offered") actions.push({ label: t.moveToOffered, status: "Offered" })
    if (currentStatus !== "Hired") actions.push({ label: t.moveToHired, status: "Hired" })
    if (currentStatus !== "Rejected") actions.push({ label: t.moveToRejected, status: "Rejected" })

    return actions
  }

  const getMatchColor = (match: number) => {
    if (match >= 90) return "text-green-600 bg-green-100"
    if (match >= 80) return "text-blue-600 bg-blue-100"
    if (match >= 70) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full min-h-[600px] rounded-lg border-2 border-dashed transition-colors",
        color,
        draggedOver && "border-blue-400 bg-blue-50",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{title}</h3>
          <Badge variant="secondary" className="ml-2">
            {candidates.length}
          </Badge>
        </div>
      </div>

      {/* Candidates List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {candidates.map((candidate) => (
          <Card
            key={candidate.id}
            className="cursor-move hover:shadow-md transition-shadow"
            draggable
            onDragStart={(e: React.DragEvent) => {
              e.dataTransfer.setData("text/plain", candidate.id)
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${candidate.name}`} />
                    <AvatarFallback>
                      {candidate.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm font-medium">{candidate.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{candidate.position}</p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>{t.viewProfile}</DropdownMenuItem>
                    <DropdownMenuItem>{t.sendEmail}</DropdownMenuItem>
                    <DropdownMenuItem>{t.scheduleInterview}</DropdownMenuItem>
                    {getStatusActions(candidate.status).map((action) => (
                      <DropdownMenuItem key={action.status} onClick={() => onStatusChange(candidate.id, action.status)}>
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
              {/* Match Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">{t.match}</span>
                </div>
                <Badge className={cn("text-xs", getMatchColor(candidate.match))}>{candidate.match}%</Badge>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{candidate.email}</span>
                </div>
                {candidate.phone && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{candidate.phone}</span>
                  </div>
                )}
                {candidate.location && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{candidate.location}</span>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {candidate.skills.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {candidate.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{candidate.skills.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Experience & Applied Date */}
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>
                  {candidate.yearsOfExperience || 0} {t.yearsExp}
                </span>
                <span>
                  {t.applied}: {candidate.applied}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {candidates.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">No candidates in this stage</p>
          </div>
        )}
      </div>
    </div>
  )
}
