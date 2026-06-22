import { AnimatedTestimonials } from "@/components/ui/animated-testimonials"

const testimonials = [
  {
    id: 1,
    name: "Sarah M.",
    role: "Talent Acquisition Lead",
    company: "TechGrowth GmbH",
    content:
      "RECRUILY hat unsere Time-to-Hire halbiert. Wir finden jetzt in Minuten die wirklich passenden Kandidaten – nicht nur Keyword-Treffer, sondern echte Matches.",
    rating: 5,
    avatar: "https://i.pravatar.cc/120?img=47",
  },
  {
    id: 2,
    name: "Thomas K.",
    role: "HR-Direktor",
    company: "Innovate Solutions",
    content:
      "Das KI-Matching ist beeindruckend präzise. Wir interviewen jetzt nur noch Kandidaten, die wirklich zum Job passen – inklusive Anschreiben-Analyse. Genau das haben wir gesucht.",
    rating: 5,
    avatar: "https://i.pravatar.cc/120?img=33",
  },
  {
    id: 3,
    name: "Julia R.",
    role: "Head of People",
    company: "Future Finance AG",
    content:
      "Die Einrichtung war einfach, die Oberfläche intuitiv. Unser gesamtes HR-Team konnte RECRUILY sofort nutzen – ohne lange Schulungen. DSGVO-Konformität war für uns entscheidend.",
    rating: 5,
    avatar: "https://i.pravatar.cc/120?img=25",
  },
  {
    id: 4,
    name: "Markus B.",
    role: "Recruiting Manager",
    company: "Mittelstand Digital",
    content:
      "Endlich ein Tool, das CV und Anschreiben gemeinsam bewertet. Die erklärbaren Scores geben uns Sicherheit bei jeder Entscheidung. Absolute Empfehlung für den DACH-Mittelstand.",
    rating: 5,
    avatar: "https://i.pravatar.cc/120?img=52",
  },
  {
    id: 5,
    name: "Nina H.",
    role: "Personalreferentin",
    company: "Handwerk Plus",
    content:
      "Als kleines Unternehmen hatten wir nie die Ressourcen für professionelles Recruiting. RECRUILY gibt uns die Power eines Senior-Recruiters – zu einem Bruchteil der Kosten.",
    rating: 5,
    avatar: "https://i.pravatar.cc/120?img=44",
  },
]

export default function Testimonials() {
  return (
    <AnimatedTestimonials
      badgeText="Von HR-Teams geliebt"
      title="Warum HR-Teams RECRUILY lieben"
      subtitle="Erleben Sie, was unsere Kunden über RECRUILY sagen – echte Ergebnisse aus dem DACH-Mittelstand."
      testimonials={testimonials}
      autoRotateInterval={6000}
      trustedCompanies={["TechGrowth", "Innovate", "Future Finance", "Mittelstand Digital", "Handwerk Plus"]}
      trustedCompaniesTitle="Genutzt von Unternehmen im DACH-Raum"
    />
  )
}
