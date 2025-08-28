"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KanbanColumn } from "@/components/kanban-column"
import { useCandidates } from "@/hooks/use-candidates"
import { Users, UserCheck, Calendar, TrendingUp } from "lucide-react"

// Translations
const translations = {
  en: {
    title: "Candidate Pipeline",
    description: "Manage candidates through your recruitment pipeline",
    totalCandidates: "Total Candidates",
    activeInterviews: "Active Interviews",
    avgMatchScore: "Avg Match Score",
    thisWeek: "This Week",
    applied: "Applied",
    contacted: "Contacted",
    interviewing: "Interviewing",
    offered: "Offered",
    hired: "Hired",
    rejected: "Rejected",
  },
  es: {
    title: "Pipeline de Candidatos",
    description: "Gestiona candidatos a través de tu pipeline de reclutamiento",
    totalCandidates: "Total de Candidatos",
    activeInterviews: "Entrevistas Activas",
    avgMatchScore: "Puntuación Media",
    thisWeek: "Esta Semana",
    applied: "Aplicado",
    contacted: "Contactado",
    interviewing: "Entrevistando",
    offered: "Ofertado",
    hired: "Contratado",
    rejected: "Rechazado",
  },
  fr: {
    title: "Pipeline des Candidats",
    description: "Gérez les candidats dans votre pipeline de recrutement",
    totalCandidates: "Total des Candidats",
    activeInterviews: "Entretiens Actifs",
    avgMatchScore: "Score Moyen",
    thisWeek: "Cette Semaine",
    applied: "Postulé",
    contacted: "Contacté",
    interviewing: "En Entretien",
    offered: "Offre Faite",
    hired: "Embauché",
    rejected: "Rejeté",
  },
}

type Language = "en" | "es" | "fr"

export default function KanbanPage() {
  const [language, setLanguage] = useState<Language>("en")
  const { candidates, loading, updateCandidate } = useCandidates()

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && ["en", "es", "fr"].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, [])

  const t = translations[language]

  // Group candidates by status
  const candidatesByStatus = {
    applied: candidates.filter((c) => c.status === "Applied"),
    contacted: candidates.filter((c) => c.status === "Contacted"),
    interviewing: candidates.filter((c) => c.status === "Interviewing"),
    offered: candidates.filter((c) => c.status === "Offered"),
    hired: candidates.filter((c) => c.status === "Hired"),
    rejected: candidates.filter((c) => c.status === "Rejected"),
  }

  // Calculate statistics
  const totalCandidates = candidates.length
  const activeInterviews = candidatesByStatus.interviewing.length
  const avgMatchScore =
    candidates.length > 0 ? Math.round(candidates.reduce((sum, c) => sum + c.match, 0) / candidates.length) : 0

  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    try {
      await updateCandidate(candidateId, { status: newStatus })
    } catch (error) {
      console.error("Failed to update candidate status:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">{t.description}</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalCandidates}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCandidates}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.activeInterviews}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInterviews}</div>
            <p className="text-xs text-muted-foreground">{t.thisWeek}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.avgMatchScore}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMatchScore}%</div>
            <p className="text-xs text-muted-foreground">+5% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24%</div>
            <p className="text-xs text-muted-foreground">+2% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 min-h-[600px]">
        <KanbanColumn
          title={t.applied}
          status="Applied"
          candidates={candidatesByStatus.applied}
          onStatusChange={handleStatusChange}
          language={language}
          color="bg-blue-50 border-blue-200"
        />

        <KanbanColumn
          title={t.contacted}
          status="Contacted"
          candidates={candidatesByStatus.contacted}
          onStatusChange={handleStatusChange}
          language={language}
          color="bg-yellow-50 border-yellow-200"
        />

        <KanbanColumn
          title={t.interviewing}
          status="Interviewing"
          candidates={candidatesByStatus.interviewing}
          onStatusChange={handleStatusChange}
          language={language}
          color="bg-purple-50 border-purple-200"
        />

        <KanbanColumn
          title={t.offered}
          status="Offered"
          candidates={candidatesByStatus.offered}
          onStatusChange={handleStatusChange}
          language={language}
          color="bg-orange-50 border-orange-200"
        />

        <KanbanColumn
          title={t.hired}
          status="Hired"
          candidates={candidatesByStatus.hired}
          onStatusChange={handleStatusChange}
          language={language}
          color="bg-green-50 border-green-200"
        />

        <KanbanColumn
          title={t.rejected}
          status="Rejected"
          candidates={candidatesByStatus.rejected}
          onStatusChange={handleStatusChange}
          language={language}
          color="bg-red-50 border-red-200"
        />
      </div>
    </div>
  )
}
