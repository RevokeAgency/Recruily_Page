"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/contexts/language-context"
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react"
import { DecorativeAccent } from "@/components/decorative-elements"

export default function ContactSection() {
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In a real implementation, you would send the data to your backend
    // const response = await fetch('/api/contact', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(formData)
    // })

    setIsSubmitting(false)
    setSubmitted(true)
    setFormData({ name: "", email: "", company: "", message: "" })
  }

  return (
    <section id="contact" className="relative overflow-hidden bg-white py-24">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-teal-100/20 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-teal-100/30 blur-3xl"></div>
      <DecorativeAccent variant="wave" position="top-right" color="primary" size="lg" className="opacity-10" />
      <DecorativeAccent variant="dots" position="bottom-left" color="secondary" size="md" className="opacity-20" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-600 mb-4">
            <span className="mr-1 h-2 w-2 rounded-full bg-teal-500"></span>
            {language === "EN" ? "Support & Inquiries" : "Support & Anfragen"}
          </div>
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            {language === "EN" ? "Get in Touch" : "Kontaktieren Sie uns"}
          </h2>
          <p className="mb-12 text-lg text-gray-600">
            {language === "EN"
              ? "Have questions or need a personalized demo? We're here to help."
              : "Haben Sie Fragen oder benötigen Sie eine persönliche Demo? Wir sind hier, um zu helfen."}
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
          <div className="relative rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-teal-50/30 p-8 shadow-sm">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-teal-100/20 blur-xl"></div>

            <h3 className="mb-6 text-xl font-semibold text-gray-900">
              {language === "EN" ? "Contact Information" : "Kontaktinformationen"}
            </h3>

            <div className="relative space-y-6">
              <div className="flex items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
                  <Mail className="h-5 w-5 text-teal-600" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">Email</p>
                  <a href="mailto:info@recruitify.com" className="text-gray-600 hover:text-teal-600 transition-colors">
                    info@recruitify.com
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
                  <Phone className="h-5 w-5 text-teal-600" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">{language === "EN" ? "Phone" : "Telefon"}</p>
                  <a href="tel:+4930123456789" className="text-gray-600 hover:text-teal-600 transition-colors">
                    +49 30 123 456 789
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
                  <MapPin className="h-5 w-5 text-teal-600" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">{language === "EN" ? "Address" : "Adresse"}</p>
                  <p className="text-gray-600">
                    Friedrichstraße 123
                    <br />
                    10117 Berlin, Germany
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative element */}
            <div className="absolute bottom-4 left-4 h-24 w-24 rounded-full border border-teal-100 opacity-30"></div>
          </div>

          <div className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-md">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent to-teal-50/30 pointer-events-none"></div>

            {submitted ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal-100">
                  <CheckCircle className="h-10 w-10 text-teal-600" />
                </div>
                <h3 className="mb-3 text-2xl font-semibold text-gray-900">
                  {language === "EN" ? "Message Sent!" : "Nachricht gesendet!"}
                </h3>
                <p className="mb-8 text-gray-600 max-w-md">
                  {language === "EN"
                    ? "Thank you for reaching out. We'll get back to you shortly."
                    : "Vielen Dank für Ihre Nachricht. Wir werden uns in Kürze bei Ihnen melden."}
                </p>
                <Button className="bg-teal-600 hover:bg-teal-700 transition-colors" onClick={() => setSubmitted(false)}>
                  {language === "EN" ? "Send Another Message" : "Weitere Nachricht senden"}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative space-y-6">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                    {language === "EN" ? "Full Name" : "Vollständiger Name"}
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    placeholder={language === "EN" ? "John Doe" : "Max Mustermann"}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    placeholder={language === "EN" ? "john@example.com" : "max@beispiel.de"}
                  />
                </div>

                <div>
                  <label htmlFor="company" className="mb-2 block text-sm font-medium text-gray-700">
                    {language === "EN" ? "Company" : "Unternehmen"}
                  </label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    className="w-full border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    placeholder={language === "EN" ? "Your Company" : "Ihr Unternehmen"}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="mb-2 block text-sm font-medium text-gray-700">
                    {language === "EN" ? "Message" : "Nachricht"}
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="min-h-[120px] w-full border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    placeholder={language === "EN" ? "How can we help you?" : "Wie können wir Ihnen helfen?"}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {language === "EN" ? "Sending..." : "Wird gesendet..."}
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Send className="mr-2 h-4 w-4" />
                      {language === "EN" ? "Send Message" : "Nachricht senden"}
                    </span>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
