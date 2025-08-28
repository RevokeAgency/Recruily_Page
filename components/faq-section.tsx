"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { DecorativeAccent } from "@/components/decorative-elements"

interface FaqItem {
  question: {
    en: string
    de: string
  }
  answer: {
    en: string
    de: string
  }
}

const faqs: FaqItem[] = [
  {
    question: {
      en: "How does the AI matching technology work?",
      de: "Wie funktioniert die KI-Matching-Technologie?",
    },
    answer: {
      en: "Our AI analyzes both job descriptions and candidate résumés to identify matching skills, experience, and qualifications. It goes beyond keyword matching by understanding context and semantic meaning to provide more accurate matches.",
      de: "Unsere KI analysiert sowohl Stellenbeschreibungen als auch Lebensläufe der Kandidaten, um passende Fähigkeiten, Erfahrungen und Qualifikationen zu identifizieren. Sie geht über das einfache Abgleichen von Schlüsselwörtern hinaus, indem sie den Kontext und die semantische Bedeutung versteht, um genauere Übereinstimmungen zu liefern.",
    },
  },
  {
    question: {
      en: "Can I integrate Recruitify with my existing ATS?",
      de: "Kann ich Recruitify in mein bestehendes ATS integrieren?",
    },
    answer: {
      en: "Yes, Recruitify offers API integration with most popular Applicant Tracking Systems. Our team can help you set up a seamless connection to ensure data flows smoothly between systems.",
      de: "Ja, Recruitify bietet API-Integration mit den meisten gängigen Bewerbermanagementsystemen. Unser Team kann Ihnen helfen, eine nahtlose Verbindung einzurichten, um sicherzustellen, dass Daten reibungslos zwischen den Systemen fließen.",
    },
  },
  {
    question: {
      en: "How long does the free trial last?",
      de: "Wie lange dauert die kostenlose Testphase?",
    },
    answer: {
      en: "Our free trial lasts for 14 days with full access to all features. No credit card is required to start, and you can cancel anytime.",
      de: "Unsere kostenlose Testphase dauert 14 Tage mit vollem Zugriff auf alle Funktionen. Keine Kreditkarte erforderlich, um zu beginnen, und Sie können jederzeit kündigen.",
    },
  },
  {
    question: {
      en: "Is my data secure with Recruitify?",
      de: "Sind meine Daten bei Recruitify sicher?",
    },
    answer: {
      en: "Absolutely. We use enterprise-grade encryption and comply with GDPR, CCPA, and other data protection regulations. Your data is stored securely and never shared with third parties without your explicit consent.",
      de: "Absolut. Wir verwenden Verschlüsselung auf Unternehmensebene und entsprechen der DSGVO, CCPA und anderen Datenschutzbestimmungen. Ihre Daten werden sicher gespeichert und niemals ohne Ihre ausdrückliche Zustimmung an Dritte weitergegeben.",
    },
  },
  {
    question: {
      en: "Can I upgrade or downgrade my plan later?",
      de: "Kann ich meinen Plan später upgraden oder downgraden?",
    },
    answer: {
      en: "Yes, you can change your subscription plan at any time. Changes take effect at the start of your next billing cycle, and we'll prorate any difference in cost.",
      de: "Ja, Sie können Ihren Abonnementplan jederzeit ändern. Änderungen werden zu Beginn Ihres nächsten Abrechnungszeitraums wirksam, und wir berechnen etwaige Kostenunterschiede anteilig.",
    },
  },
]

export default function FaqSection() {
  const { language } = useLanguage()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="relative overflow-hidden bg-gradient-to-b from-white to-teal-50/30 py-24">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-teal-100/20 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-teal-100/30 blur-3xl"></div>
      <DecorativeAccent variant="dots" position="top-right" color="primary" size="lg" className="opacity-20" />
      <DecorativeAccent variant="circles" position="bottom-left" color="primary" size="md" className="opacity-10" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-600 mb-4">
            <span className="mr-1 h-2 w-2 rounded-full bg-teal-500"></span>
            {language === "EN" ? "Common Questions" : "Häufige Fragen"}
          </div>
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            {language === "EN" ? "Frequently Asked Questions" : "Häufig gestellte Fragen"}
          </h2>
          <p className="mb-12 text-lg text-gray-600">
            {language === "EN"
              ? "Find answers to common questions about Recruitify."
              : "Finden Sie Antworten auf häufig gestellte Fragen zu Recruitify."}
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`mb-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 ${
                openIndex === index ? "ring-2 ring-teal-200" : "hover:border-teal-200"
              }`}
            >
              <button
                onClick={() => toggleFaq(index)}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <h3 className="text-lg font-medium text-gray-900">
                  {language === "EN" ? faq.question.en : faq.question.de}
                </h3>
                <span className="ml-6 flex h-7 items-center">
                  <ChevronDown
                    className={`h-6 w-6 text-teal-500 transition-transform duration-300 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="border-t border-gray-100 bg-gray-50/50 p-6">
                  <p className="text-base text-gray-600">{language === "EN" ? faq.answer.en : faq.answer.de}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Decorative element at the bottom */}
        <div className="absolute bottom-0 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-teal-300 to-transparent"></div>
      </div>
    </section>
  )
}
