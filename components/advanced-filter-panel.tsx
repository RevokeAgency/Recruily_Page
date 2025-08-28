"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"

interface AdvancedFilterPanelProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: any) => void
}

export default function AdvancedFilterPanel({ isOpen, onClose, onApply }: AdvancedFilterPanelProps) {
  const [matchScoreRange, setMatchScoreRange] = useState<[number, number]>([60, 100])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [experienceLevel, setExperienceLevel] = useState<string>("any")
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [educationLevel, setEducationLevel] = useState<string>("any")
  const [dateAdded, setDateAdded] = useState<string>("any")
  const { language } = useLanguage()

  const [availableSkills] = useState([
    "Marketing",
    "Social Media",
    "Content Creation",
    "SEO",
    "SEM",
    "Analytics",
    "Brand Development",
    "Email Marketing",
    "CRM",
    "Project Management",
    "Adobe Creative Suite",
    "Copywriting",
  ])

  const handleSkillToggle = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill))
    } else {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  const handleLocationToggle = (location: string) => {
    if (selectedLocations.includes(location)) {
      setSelectedLocations(selectedLocations.filter((l) => l !== location))
    } else {
      setSelectedLocations([...selectedLocations, location])
    }
  }

  const handleApply = () => {
    onApply({
      matchScoreRange,
      selectedSkills,
      experienceLevel,
      selectedLocations,
      educationLevel,
      dateAdded,
    })
    onClose()
  }

  const handleReset = () => {
    setMatchScoreRange([60, 100])
    setSelectedSkills([])
    setExperienceLevel("any")
    setSelectedLocations([])
    setEducationLevel("any")
    setDateAdded("any")
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative mx-auto w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{language === "EN" ? "Advanced Filters" : "Erweiterte Filter"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-6">
            {/* Match Score Range */}
            <div>
              <Label className="mb-2 block font-medium">
                {language === "EN" ? "Match Score Range" : "Übereinstimmungsbereich"}
              </Label>
              <div className="mb-2 flex justify-between text-sm">
                <span>{matchScoreRange[0]}%</span>
                <span>{matchScoreRange[1]}%</span>
              </div>
              <Slider
                defaultValue={matchScoreRange}
                min={0}
                max={100}
                step={5}
                onValueChange={(value) => setMatchScoreRange(value as [number, number])}
                className="py-4"
              />
            </div>

            {/* Skills */}
            <Accordion type="single" collapsible defaultValue="skills">
              <AccordionItem value="skills">
                <AccordionTrigger className="font-medium">
                  {language === "EN" ? "Skills" : "Fähigkeiten"}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="mb-2">
                    <Input
                      placeholder={language === "EN" ? "Search skills..." : "Fähigkeiten suchen..."}
                      className="mb-2"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant={selectedSkills.includes(skill) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleSkillToggle(skill)}
                      >
                        {skill}
                        {selectedSkills.includes(skill) && <X className="ml-1 h-3 w-3" />}
                      </Badge>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Experience Level */}
            <div>
              <Label className="mb-2 block font-medium">
                {language === "EN" ? "Experience Level" : "Erfahrungsstufe"}
              </Label>
              <RadioGroup value={experienceLevel} onValueChange={setExperienceLevel}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="any" id="exp-any" />
                  <Label htmlFor="exp-any">{language === "EN" ? "Any" : "Beliebig"}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="entry" id="exp-entry" />
                  <Label htmlFor="exp-entry">
                    {language === "EN" ? "Entry Level (0-2 years)" : "Einstiegsniveau (0-2 Jahre)"}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mid" id="exp-mid" />
                  <Label htmlFor="exp-mid">
                    {language === "EN" ? "Mid Level (3-5 years)" : "Mittleres Niveau (3-5 Jahre)"}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="senior" id="exp-senior" />
                  <Label htmlFor="exp-senior">
                    {language === "EN" ? "Senior Level (6+ years)" : "Erfahrene Fachkraft (6+ Jahre)"}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Location */}
            <Accordion type="single" collapsible defaultValue="location">
              <AccordionItem value="location">
                <AccordionTrigger className="font-medium">
                  {language === "EN" ? "Location" : "Standort"}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="location-remote"
                        checked={selectedLocations.includes("Remote")}
                        onCheckedChange={() => handleLocationToggle("Remote")}
                      />
                      <Label htmlFor="location-remote">{language === "EN" ? "Remote" : "Remote"}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="location-berlin"
                        checked={selectedLocations.includes("Berlin")}
                        onCheckedChange={() => handleLocationToggle("Berlin")}
                      />
                      <Label htmlFor="location-berlin">Berlin</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="location-munich"
                        checked={selectedLocations.includes("Munich")}
                        onCheckedChange={() => handleLocationToggle("Munich")}
                      />
                      <Label htmlFor="location-munich">{language === "EN" ? "Munich" : "München"}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="location-hamburg"
                        checked={selectedLocations.includes("Hamburg")}
                        onCheckedChange={() => handleLocationToggle("Hamburg")}
                      />
                      <Label htmlFor="location-hamburg">Hamburg</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="location-frankfurt"
                        checked={selectedLocations.includes("Frankfurt")}
                        onCheckedChange={() => handleLocationToggle("Frankfurt")}
                      />
                      <Label htmlFor="location-frankfurt">Frankfurt</Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Education */}
            <div>
              <Label className="mb-2 block font-medium">
                {language === "EN" ? "Education Level" : "Bildungsniveau"}
              </Label>
              <Select value={educationLevel} onValueChange={setEducationLevel}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={language === "EN" ? "Select education level" : "Bildungsniveau auswählen"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{language === "EN" ? "Any" : "Beliebig"}</SelectItem>
                  <SelectItem value="high-school">{language === "EN" ? "High School" : "Abitur"}</SelectItem>
                  <SelectItem value="bachelors">
                    {language === "EN" ? "Bachelor's Degree" : "Bachelor-Abschluss"}
                  </SelectItem>
                  <SelectItem value="masters">{language === "EN" ? "Master's Degree" : "Master-Abschluss"}</SelectItem>
                  <SelectItem value="phd">{language === "EN" ? "PhD" : "Promotion"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Added */}
            <div>
              <Label className="mb-2 block font-medium">{language === "EN" ? "Date Added" : "Hinzugefügt am"}</Label>
              <Select value={dateAdded} onValueChange={setDateAdded}>
                <SelectTrigger>
                  <SelectValue placeholder={language === "EN" ? "Select date range" : "Datumsbereich auswählen"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{language === "EN" ? "Any time" : "Jederzeit"}</SelectItem>
                  <SelectItem value="today">{language === "EN" ? "Today" : "Heute"}</SelectItem>
                  <SelectItem value="week">{language === "EN" ? "This week" : "Diese Woche"}</SelectItem>
                  <SelectItem value="month">{language === "EN" ? "This month" : "Diesen Monat"}</SelectItem>
                  <SelectItem value="quarter">{language === "EN" ? "Last 3 months" : "Letzte 3 Monate"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="outline" onClick={handleReset}>
            {language === "EN" ? "Reset" : "Zurücksetzen"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            {language === "EN" ? "Cancel" : "Abbrechen"}
          </Button>
          <Button onClick={handleApply} className="bg-teal-600 hover:bg-teal-700">
            {language === "EN" ? "Apply Filters" : "Filter anwenden"}
          </Button>
        </div>
      </div>
    </div>
  )
}
