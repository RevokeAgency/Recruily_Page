"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, MapPin, Briefcase, GraduationCap, Award, Languages, Star } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface CandidateProfileProps {
  candidate: any
}

export function CandidateProfile({ candidate }: CandidateProfileProps) {
  const { language } = useLanguage()

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200"
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xl">
          {candidate.avatar}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{candidate.name}</h2>
          <p className="text-lg text-muted-foreground">{candidate.position}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {candidate.email}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {candidate.phone}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {candidate.location}
            </span>
          </div>
        </div>
        <div className="text-right">
          <Badge className={`text-lg px-3 py-1 ${getScoreColor(candidate.match)}`}>
            <Star className="h-4 w-4 mr-1" />
            {candidate.match}% {language === "EN" ? "Match" : "Übereinstimmung"}
          </Badge>
          <p className="text-sm text-muted-foreground mt-1">
            {language === "EN" ? "AI Match Score" : "KI-Match-Score"}
          </p>
        </div>
      </div>

      <Separator />

      {/* Summary */}
      {candidate.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {language === "EN" ? "Professional Summary" : "Berufliche Zusammenfassung"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{candidate.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {candidate.skills && candidate.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {language === "EN" ? "Skills & Technologies" : "Fähigkeiten & Technologien"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experience */}
      {candidate.fullProfile?.experience && candidate.fullProfile.experience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {language === "EN" ? "Work Experience" : "Berufserfahrung"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {candidate.fullProfile.experience.map((exp: any, index: number) => (
                <div key={index} className="border-l-2 border-teal-200 pl-4">
                  <h4 className="font-semibold">{exp.title}</h4>
                  <p className="text-muted-foreground">{exp.company}</p>
                  <p className="text-sm text-muted-foreground">{exp.duration}</p>
                  {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {candidate.education && candidate.education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {language === "EN" ? "Education" : "Bildung"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {candidate.education.map((edu: any, index: number) => (
                <div key={index}>
                  <h4 className="font-semibold">{edu.degree || edu}</h4>
                  {edu.field && <p className="text-muted-foreground">{edu.field}</p>}
                  {edu.institution && <p className="text-sm text-muted-foreground">{edu.institution}</p>}
                  {edu.year && <p className="text-sm text-muted-foreground">{edu.year}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {candidate.certifications && candidate.certifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {language === "EN" ? "Certifications" : "Zertifizierungen"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {candidate.certifications.map((cert: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-teal-600" />
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Languages */}
      {candidate.languages && candidate.languages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              {language === "EN" ? "Languages" : "Sprachen"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {candidate.languages.map((lang: string, index: number) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {lang}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis */}
      {candidate.aiProcessed && (
        <Card className="border-teal-200 bg-teal-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-700">
              <Star className="h-5 w-5" />
              {language === "EN" ? "AI Analysis" : "KI-Analyse"}
            </CardTitle>
            <CardDescription>
              {language === "EN"
                ? "This profile was automatically generated and analyzed by our AI system"
                : "Dieses Profil wurde automatisch von unserem KI-System generiert und analysiert"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-teal-700">
                  {language === "EN" ? "Years of Experience" : "Jahre Erfahrung"}
                </p>
                <p className="text-2xl font-bold text-teal-600">{candidate.fullProfile?.yearsOfExperience || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-teal-700">
                  {language === "EN" ? "Skills Identified" : "Identifizierte Fähigkeiten"}
                </p>
                <p className="text-2xl font-bold text-teal-600">{candidate.skills?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
