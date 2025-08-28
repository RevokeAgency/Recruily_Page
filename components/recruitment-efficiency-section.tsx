"use client"
import { Clock, TrendingUp, CheckCircle, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

export default function RecruitmentEfficiencySection() {
  const { language } = useLanguage()

  return (
    <section id="recruitment-efficiency" className="bg-gray-50 py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            {language === "EN" ? "Streamline Your Recruitment Process" : "Optimieren Sie Ihren Rekrutierungsprozess"}
          </h2>
          <p className="mb-12 text-lg text-gray-600">
            {language === "EN"
              ? "Reduce time-to-hire and improve candidate quality with our intelligent platform"
              : "Reduzieren Sie die Einstellungszeit und verbessern Sie die Kandidatenqualität mit unserer intelligenten Plattform"}
          </p>
        </div>

        <Tabs defaultValue="time-savings" className="mx-auto max-w-4xl">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="time-savings">{language === "EN" ? "Time Savings" : "Zeitersparnis"}</TabsTrigger>
            <TabsTrigger value="quality">
              {language === "EN" ? "Quality Improvement" : "Qualitätsverbesserung"}
            </TabsTrigger>
            <TabsTrigger value="cost">{language === "EN" ? "Cost Reduction" : "Kostenreduzierung"}</TabsTrigger>
          </TabsList>

          <TabsContent value="time-savings" className="mt-8">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {language === "EN"
                    ? "Reduce Time-to-Hire by up to 60%"
                    : "Reduzieren Sie die Einstellungszeit um bis zu 60%"}
                </h3>
                <p className="text-gray-600">
                  {language === "EN"
                    ? "Our platform automates the most time-consuming parts of the recruitment process. No more manual résumé screening or endless email exchanges."
                    : "Unsere Plattform automatisiert die zeitaufwändigsten Teile des Rekrutierungsprozesses. Keine manuelle Lebenslaufprüfung oder endlose E-Mail-Kommunikation mehr."}
                </p>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <Clock className="mr-3 h-5 w-5 text-teal-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {language === "EN" ? "Automated Screening" : "Automatisierte Vorauswahl"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {language === "EN"
                          ? "Screen hundreds of applications in minutes, not days"
                          : "Prüfen Sie Hunderte von Bewerbungen in Minuten, nicht in Tagen"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <TrendingUp className="mr-3 h-5 w-5 text-teal-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {language === "EN" ? "Streamlined Workflow" : "Optimierter Arbeitsablauf"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {language === "EN"
                          ? "Integrated scheduling, feedback, and communication tools"
                          : "Integrierte Terminplanung, Feedback und Kommunikationstools"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CheckCircle className="mr-3 h-5 w-5 text-teal-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {language === "EN" ? "Quick Decision Making" : "Schnelle Entscheidungsfindung"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {language === "EN"
                          ? "Clear candidate insights help you make faster hiring decisions"
                          : "Klare Kandidateneinblicke helfen Ihnen, schnellere Einstellungsentscheidungen zu treffen"}
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="mt-4 w-fit bg-teal-600 hover:bg-teal-700">
                  {language === "EN" ? "Learn More" : "Mehr erfahren"}
                </Button>
              </div>

              <div className="relative rounded-lg border bg-white p-2 shadow-md">
                <div className="aspect-video w-full overflow-hidden rounded-md">
                  {/* Using direct img tag with the blob URL for the teal hourglass image */}
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%207.%20Mai%202025%2C%2008_06_30-HgDufZ1GpCTCr7DKl5UT6dSBjCKw6Q.png"
                    alt={language === "EN" ? "Time savings demonstration" : "Zeitersparnis-Demonstration"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-4 p-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">
                      {language === "EN" ? "Average Time-to-Hire" : "Durchschnittliche Einstellungszeit"}
                    </div>
                    <div className="text-sm text-gray-500">{language === "EN" ? "Days" : "Tage"}</div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <div className="flex-1">
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 w-[35%] rounded-full bg-teal-500"></div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {language === "EN" ? "With Recruitify: 14 days" : "Mit Recruitify: 14 Tage"}
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 w-[85%] rounded-full bg-gray-400"></div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {language === "EN" ? "Industry Average: 36 days" : "Branchendurchschnitt: 36 Tage"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quality" className="mt-8">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {language === "EN"
                    ? "Improve Candidate Quality by 45%"
                    : "Verbessern Sie die Kandidatenqualität um 45%"}
                </h3>
                <p className="text-gray-600">
                  {language === "EN"
                    ? "Our intelligent matching algorithms ensure you only interview candidates who truly fit your requirements, leading to better hires and lower turnover."
                    : "Unsere intelligenten Matching-Algorithmen stellen sicher, dass Sie nur Kandidaten interviewen, die wirklich zu Ihren Anforderungen passen, was zu besseren Einstellungen und geringerer Fluktuation führt."}
                </p>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <Users className="mr-3 h-5 w-5 text-teal-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {language === "EN" ? "Better Candidate Fit" : "Bessere Kandidatenpassung"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {language === "EN"
                          ? "Match candidates based on skills, experience, and cultural alignment"
                          : "Finden Sie Kandidaten basierend auf Fähigkeiten, Erfahrung und kultureller Übereinstimmung"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <TrendingUp className="mr-3 h-5 w-5 text-teal-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {language === "EN" ? "Reduced Turnover" : "Reduzierte Fluktuation"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {language === "EN"
                          ? "Employees who are a good fit stay longer and perform better"
                          : "Mitarbeiter, die gut passen, bleiben länger und leisten mehr"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CheckCircle className="mr-3 h-5 w-5 text-teal-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {language === "EN" ? "Objective Evaluation" : "Objektive Bewertung"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {language === "EN"
                          ? "Reduce bias and make data-driven hiring decisions"
                          : "Reduzieren Sie Vorurteile und treffen Sie datengestützte Einstellungsentscheidungen"}
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="mt-4 w-fit bg-teal-600 hover:bg-teal-700">
                  {language === "EN" ? "See How It Works" : "Sehen Sie, wie es funktioniert"}
                </Button>
              </div>

              <div className="relative rounded-lg border bg-white p-2 shadow-md">
                <div className="aspect-video w-full overflow-hidden rounded-md">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%207.%20Mai%202025%2C%2008_05_01-RSNtNc8UycT0yOuE5mbYf5fqQRTRef.png"
                    alt={
                      language === "EN" ? "Quality improvement demonstration" : "Qualitätsverbesserung-Demonstration"
                    }
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-4 p-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">
                      {language === "EN" ? "First-Year Retention Rate" : "Verbleibrate im ersten Jahr"}
                    </div>
                    <div className="text-sm text-gray-500">{language === "EN" ? "Percentage" : "Prozentsatz"}</div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <div className="flex-1">
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 w-[85%] rounded-full bg-teal-500"></div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {language === "EN" ? "With Recruitify: 85%" : "Mit Recruitify: 85%"}
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 w-[60%] rounded-full bg-gray-400"></div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {language === "EN" ? "Industry Average: 60%" : "Branchendurchschnitt: 60%"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cost" className="mt-8">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {language === "EN" ? "Reduce Recruitment Costs by 35%" : "Senken Sie die Rekrutierungskosten um 35%"}
                </h3>
                <p className="text-gray-600">
                  {language === "EN"
                    ? "Streamline your recruitment process and reduce the costs associated with hiring, from job advertising to recruiter time and onboarding expenses."
                    : "Optimieren Sie Ihren Rekrutierungsprozess und reduzieren Sie die mit der Einstellung verbundenen Kosten, von der Stellenanzeige bis hin zu Recruiter-Zeit und Onboarding-Kosten."}
                </p>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <Clock className="mr-3 h-5 w-5 text-teal-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {language === "EN" ? "Reduced Time Investment" : "Reduzierter Zeitaufwand"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {language === "EN"
                          ? "Your HR team spends less time on administrative tasks"
                          : "Ihr HR-Team verbringt weniger Zeit mit administrativen Aufgaben"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <TrendingUp className="mr-3 h-5 w-5 text-teal-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {language === "EN" ? "Lower Advertising Spend" : "Geringere Werbeausgaben"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {language === "EN"
                          ? "More efficient job postings and targeted candidate sourcing"
                          : "Effizientere Stellenanzeigen und gezielte Kandidatensuche"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CheckCircle className="mr-3 h-5 w-5 text-teal-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {language === "EN" ? "Decreased Turnover Costs" : "Verringerte Fluktuationskosten"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {language === "EN"
                          ? "Better hires mean less money spent on replacing employees"
                          : "Bessere Einstellungen bedeuten weniger Ausgaben für den Ersatz von Mitarbeitern"}
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="mt-4 w-fit bg-teal-600 hover:bg-teal-700">
                  {language === "EN" ? "Calculate Your Savings" : "Berechnen Sie Ihre Einsparungen"}
                </Button>
              </div>

              <div className="relative rounded-lg border bg-white p-2 shadow-md">
                <div className="aspect-video w-full overflow-hidden rounded-md">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%207.%20Mai%202025%2C%2008_18_16-fRKow5NJh6lz8z8CDj52MnW5DiT51b.png"
                    alt={language === "EN" ? "Cost reduction demonstration" : "Kostenreduktion-Demonstration"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-4 p-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">
                      {language === "EN" ? "Average Cost Per Hire" : "Durchschnittliche Kosten pro Einstellung"}
                    </div>
                    <div className="text-sm text-gray-500">{language === "EN" ? "Euros" : "Euro"}</div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <div className="flex-1">
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 w-[40%] rounded-full bg-teal-500"></div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {language === "EN" ? "With Recruitify: €2,500" : "Mit Recruitify: 2.500 €"}
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 w-[75%] rounded-full bg-gray-400"></div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {language === "EN" ? "Industry Average: €4,000" : "Branchendurchschnitt: 4.000 €"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
