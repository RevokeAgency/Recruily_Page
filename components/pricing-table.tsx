"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"

export default function PricingTable() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  const { language } = useLanguage()

  const toggleBillingCycle = () => {
    setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")
  }

  const discount = 0.2 // 20% discount for annual billing

  return (
    <section id="pricing" className="bg-white py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            {language === "EN" ? "Simple, Transparent Pricing" : "Einfache, transparente Preise"}
          </h2>
          <p className="mb-12 text-lg text-gray-600">
            {language === "EN"
              ? "Choose the plan that works best for your business"
              : "Wählen Sie den Plan, der am besten zu Ihrem Unternehmen passt"}
          </p>
        </div>

        <div className="mb-10 flex items-center justify-center space-x-3">
          <Label
            htmlFor="billing-toggle"
            className={billingCycle === "monthly" ? "font-semibold text-gray-900" : "text-gray-600"}
          >
            {language === "EN" ? "Monthly" : "Monatlich"}
          </Label>
          <Switch id="billing-toggle" checked={billingCycle === "annual"} onCheckedChange={toggleBillingCycle} />
          <Label
            htmlFor="billing-toggle"
            className={billingCycle === "annual" ? "font-semibold text-gray-900" : "text-gray-600"}
          >
            {language === "EN" ? "Annually" : "Jährlich"}{" "}
            <span className="ml-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800">
              {language === "EN" ? "Save 20%" : "20% sparen"}
            </span>
          </Label>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <PricingCard
            title="Starter"
            price={billingCycle === "monthly" ? 49 : Math.round(49 * (1 - discount))}
            description={language === "EN" ? "Monatlich abgerechnet" : "Monatlich abgerechnet"}
            matchCount={250}
            features={[
              language === "EN" ? "250 matches per month" : "250 matches per month",
              language === "EN" ? "Basic candidate filtering" : "Basic candidate filtering",
              language === "EN" ? "Email support" : "Email support",
              language === "EN" ? "1 user account" : "1 user account",
            ]}
            buttonText={language === "EN" ? "Choose Plan" : "Plan wählen"}
            buttonStyle="dark"
          />

          <PricingCard
            title="Professional"
            price={billingCycle === "monthly" ? 129 : Math.round(129 * (1 - discount))}
            description={language === "EN" ? "Monatlich abgerechnet" : "Monatlich abgerechnet"}
            matchCount={1000}
            features={[
              language === "EN" ? "1000 matches per month" : "1000 matches per month",
              language === "EN" ? "Advanced filtering" : "Advanced filtering",
              language === "EN" ? "Priority email support" : "Priority email support",
              language === "EN" ? "5 user accounts" : "5 user accounts",
              language === "EN" ? "Custom job templates" : "Custom job templates",
              language === "EN" ? "Analytics dashboard" : "Analytics dashboard",
            ]}
            buttonText={language === "EN" ? "Current Plan" : "Aktueller Plan"}
            buttonStyle="teal"
            popular
          />

          <PricingCard
            title="Scale-Up"
            price={billingCycle === "monthly" ? 249 : Math.round(249 * (1 - discount))}
            description={language === "EN" ? "Monatlich abgerechnet" : "Monatlich abgerechnet"}
            matchCount={3000}
            features={[
              language === "EN" ? "3000 matches per month" : "3000 matches per month",
              language === "EN" ? "Advanced filtering" : "Advanced filtering",
              language === "EN" ? "Priority phone & email support" : "Priority phone & email support",
              language === "EN" ? "Unlimited user accounts" : "Unlimited user accounts",
              language === "EN" ? "Custom job templates" : "Custom job templates",
              language === "EN" ? "Advanced analytics" : "Advanced analytics",
              language === "EN" ? "API access" : "API access",
              language === "EN" ? "Dedicated account manager" : "Dedicated account manager",
            ]}
            buttonText={language === "EN" ? "Choose Plan" : "Plan wählen"}
            buttonStyle="dark"
          />
        </div>
      </div>
    </section>
  )
}

interface PricingCardProps {
  title: string
  price: number
  description: string
  matchCount: number
  features: string[]
  buttonText: string
  buttonStyle: "dark" | "teal"
  popular?: boolean
}

function PricingCard({
  title,
  price,
  description,
  matchCount,
  features,
  buttonText,
  buttonStyle,
  popular = false,
}: PricingCardProps) {
  const { language } = useLanguage()

  return (
    <div
      className={`flex flex-col rounded-lg border ${
        popular ? "border-teal-500 shadow-lg" : "border-gray-200 shadow-sm"
      } bg-white p-8`}
    >
      {popular && (
        <div className="mb-4 self-start rounded-full bg-teal-500 px-3 py-1 text-xs font-semibold text-white">
          {language === "EN" ? "Most Popular" : "Am beliebtesten"}
        </div>
      )}
      <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
      <div className="mt-4 flex items-baseline text-5xl font-extrabold text-gray-900">
        €{price}
        <span className="ml-1 text-xl font-medium text-gray-500">{language === "EN" ? "/month" : "/Monat"}</span>
      </div>
      <p className="mt-4 text-gray-600">{description}</p>

      <div className="mt-4 text-xl font-semibold text-teal-600">
        {matchCount} {language === "EN" ? "Matches" : "Übereinstimmungen"}
      </div>

      <ul className="mt-6 space-y-4 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-teal-500" />
            </div>
            <span className="ml-3 text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className={`mt-8 w-full ${
          buttonStyle === "dark" ? "bg-gray-900 hover:bg-gray-800" : "bg-teal-500 hover:bg-teal-600"
        }`}
      >
        {buttonText}
      </Button>
    </div>
  )
}
