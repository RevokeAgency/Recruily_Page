"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Define all translations in one place
const translations = {
  EN: {
    // Common
    dashboard: "Dashboard",
    jobs: "Jobs",
    candidates: "Candidates",
    matches: "Matches",
    settings: "Settings",
    team: "Team",
    analytics: "Analytics",
    profile: "Profile",
    logout: "Logout",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    search: "Search...",
    filter: "Filter",
    sort: "Sort",

    // Dashboard
    recentActivity: "Recent Activity",
    jobsCreated: "Jobs Created",
    candidatesAdded: "Candidates Added",
    matchesGenerated: "Matches Generated",

    // Jobs
    createJob: "Create Job",
    jobTitle: "Job Title",
    jobDescription: "Job Description",
    jobRequirements: "Job Requirements",
    jobLocation: "Job Location",
    jobType: "Job Type",
    salary: "Salary",
    department: "Department",
    uploadJobDescription: "Upload Job Description",
    enterJobUrl: "Enter Job URL",
    manualEntry: "Manual Entry",

    // Candidates
    addCandidate: "Add Candidate",
    uploadResume: "Upload Resume",
    candidateName: "Candidate Name",
    candidateEmail: "Candidate Email",
    experience: "Experience",
    education: "Education",
    skills: "Skills",

    // Matches
    matchScore: "Match Score",
    viewProfile: "View Profile",
    contactCandidate: "Contact Candidate",
    scheduleInterview: "Schedule Interview",
    reject: "Reject",
    shortlist: "Shortlist",

    // Settings
    accountSettings: "Account Settings",
    notificationSettings: "Notification Settings",
    securitySettings: "Security Settings",
    subscriptionPlan: "Subscription Plan",
    language: "Language",
    darkMode: "Dark Mode",

    // User Profile
    fullName: "Full Name",
    email: "Email",
    company: "Company",
    role: "Role",
    changePassword: "Change Password",

    // Subscription
    subscription: "Subscription",
    manageSubscription: "Manage your subscription and billing information.",
    currentPlan: "Current Plan",
    active: "Active",
    matchesRemaining: "matches remaining",
    availablePlans: "Available Plans",
    mostPopular: "Most Popular",
    month: "month",
    billedMonthly: "Billed monthly",
    choosePlan: "Choose Plan",
    additionalMatches: "Additional Matches",
    purchase: "Purchase",

    // Notifications
    notifications: "Notifications",
    emailNotifications: "Email Notifications",
    newCandidates: "New Candidates",
    matchUpdates: "Match Updates",
    weeklyReports: "Weekly Reports",
    marketingEmails: "Marketing Emails",

    // Security
    twoFactorAuth: "Two-Factor Authentication",
    sessionTimeout: "Session Timeout (minutes)",
    passwordExpiry: "Password Expiry (days)",
    resetPassword: "Reset Password",

    // Workflow
    defineJob: "Define Job",
    uploadResumes: "Upload Resumes",
    reviewMatches: "Review Matches",
    contactCandidates: "Contact Candidates",
    trackProgress: "Track Progress",

    // Workflow Guide
    recruitmentWorkflow: "Recruitment Workflow",
    defineJobDescription: "Create a detailed job description",
    uploadResumesDescription: "Upload candidate resumes",
    reviewMatchesDescription: "Review AI-matched candidates",
    contactCandidatesDescription: "Contact qualified candidates",
    trackProgressDescription: "Track recruitment progress",
    review: "Review",
    start: "Start",
    comingSoon: "Coming Soon",

    // Settings
    profileUpdated: "Profile updated",
    profileUpdatedDescription: "Your profile has been updated successfully.",
    notificationSettingsUpdated: "Notification settings updated",
    notificationSettingsUpdatedDescription: "Your notification preferences have been saved.",
    securitySettingsUpdated: "Security settings updated",
    securitySettingsUpdatedDescription: "Your security settings have been updated.",
    accountSettingsDescription: "Manage your account information and preferences.",

    // Sidebar
    monthlyQuota: "Monthly Quota",
    resetsOn: "Resets on",

    // User Menu
    userMenu: "User Menu",
    signOut: "Sign Out",
  },
  DE: {
    // Common
    dashboard: "Dashboard",
    jobs: "Stellenangebote",
    candidates: "Kandidaten",
    matches: "Übereinstimmungen",
    settings: "Einstellungen",
    team: "Team",
    analytics: "Analysen",
    profile: "Profil",
    logout: "Abmelden",
    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    create: "Erstellen",
    search: "Suchen...",
    filter: "Filtern",
    sort: "Sortieren",

    // Dashboard
    recentActivity: "Neueste Aktivitäten",
    jobsCreated: "Erstellte Stellenangebote",
    candidatesAdded: "Hinzugefügte Kandidaten",
    matchesGenerated: "Generierte Übereinstimmungen",

    // Jobs
    createJob: "Stellenangebot erstellen",
    jobTitle: "Stellentitel",
    jobDescription: "Stellenbeschreibung",
    jobRequirements: "Anforderungen",
    jobLocation: "Standort",
    jobType: "Beschäftigungsart",
    salary: "Gehalt",
    department: "Abteilung",
    uploadJobDescription: "Stellenbeschreibung hochladen",
    enterJobUrl: "Job-URL eingeben",
    manualEntry: "Manuelle Eingabe",

    // Candidates
    addCandidate: "Kandidat hinzufügen",
    uploadResume: "Lebenslauf hochladen",
    candidateName: "Name des Kandidaten",
    candidateEmail: "E-Mail des Kandidaten",
    experience: "Erfahrung",
    education: "Ausbildung",
    skills: "Fähigkeiten",

    // Matches
    matchScore: "Match-Bewertung",
    viewProfile: "Profil anzeigen",
    contactCandidate: "Kandidat kontaktieren",
    scheduleInterview: "Vorstellungsgespräch planen",
    reject: "Ablehnen",
    shortlist: "Auf die Shortlist",

    // Settings
    accountSettings: "Kontoeinstellungen",
    notificationSettings: "Benachrichtigungseinstellungen",
    securitySettings: "Sicherheitseinstellungen",
    subscriptionPlan: "Abonnementplan",
    language: "Sprache",
    darkMode: "Dunkelmodus",

    // User Profile
    fullName: "Vollständiger Name",
    email: "E-Mail",
    company: "Unternehmen",
    role: "Position",
    changePassword: "Passwort ändern",

    // Subscription
    subscription: "Abonnement",
    manageSubscription: "Verwalten Sie Ihr Abonnement und Ihre Zahlungsinformationen.",
    currentPlan: "Aktueller Plan",
    active: "Aktiv",
    matchesRemaining: "Übereinstimmungen verbleibend",
    availablePlans: "Verfügbare Pläne",
    mostPopular: "Am beliebtesten",
    month: "Monat",
    billedMonthly: "Monatlich abgerechnet",
    choosePlan: "Plan wählen",
    additionalMatches: "Zusätzliche Übereinstimmungen",
    purchase: "Kaufen",

    // Notifications
    notifications: "Benachrichtigungen",
    emailNotifications: "E-Mail-Benachrichtigungen",
    newCandidates: "Neue Kandidaten",
    matchUpdates: "Match-Updates",
    weeklyReports: "Wöchentliche Berichte",
    marketingEmails: "Marketing-E-Mails",

    // Security
    twoFactorAuth: "Zwei-Faktor-Authentifizierung",
    sessionTimeout: "Sitzungs-Timeout (Minuten)",
    passwordExpiry: "Passwort-Ablauf (Tage)",
    resetPassword: "Passwort zurücksetzen",

    // Workflow
    defineJob: "Stelle definieren",
    uploadResumes: "Lebensläufe hochladen",
    reviewMatches: "Matches überprüfen",
    contactCandidates: "Kandidaten kontaktieren",
    trackProgress: "Fortschritt verfolgen",

    // Workflow Guide
    recruitmentWorkflow: "Rekrutierungsworkflow",
    defineJobDescription: "Erstellen Sie eine detaillierte Stellenbeschreibung",
    uploadResumesDescription: "Laden Sie Kandidaten-Lebensläufe hoch",
    reviewMatchesDescription: "Überprüfen Sie KI-gematchte Kandidaten",
    contactCandidatesDescription: "Kontaktieren Sie qualifizierte Kandidaten",
    trackProgressDescription: "Verfolgen Sie den Rekrutierungsfortschritt",
    review: "Überprüfen",
    start: "Starten",
    comingSoon: "Demnächst",

    // Settings
    profileUpdated: "Profil aktualisiert",
    profileUpdatedDescription: "Ihr Profil wurde erfolgreich aktualisiert.",
    notificationSettingsUpdated: "Benachrichtigungseinstellungen aktualisiert",
    notificationSettingsUpdatedDescription: "Ihre Benachrichtigungseinstellungen wurden gespeichert.",
    securitySettingsUpdated: "Sicherheitseinstellungen aktualisiert",
    securitySettingsUpdatedDescription: "Ihre Sicherheitseinstellungen wurden aktualisiert.",
    accountSettingsDescription: "Verwalten Sie Ihre Kontoinformationen und Präferenzen.",

    // Sidebar
    monthlyQuota: "Monatliches Kontingent",
    resetsOn: "Zurückgesetzt am",

    // User Menu
    userMenu: "Benutzermenü",
    signOut: "Abmelden",
  },
}

type LanguageContextType = {
  language: string
  setLanguage: (language: string) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState("EN")
  const [mounted, setMounted] = useState(false)

  // Only run on client side and only once on mount
  useEffect(() => {
    setMounted(true)
    const storedLanguage = localStorage.getItem("language")
    if (storedLanguage) {
      setLanguage(storedLanguage)
    }
  }, [])

  // Update localStorage when language changes, but only after component is mounted
  useEffect(() => {
    if (mounted && language) {
      localStorage.setItem("language", language)
    }
  }, [language, mounted])

  // Translation function
  const t = (key: string): string => {
    const lang = language as keyof typeof translations
    return translations[lang]?.[key as keyof (typeof translations)[typeof lang]] || key
  }

  // Create a stable reference to the context value to prevent unnecessary re-renders
  const contextValue = {
    language,
    setLanguage,
    t,
  }

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
