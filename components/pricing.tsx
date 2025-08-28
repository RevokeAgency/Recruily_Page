"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  const { language } = useLanguage()

  const toggleBillingCycle = () => {
    setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")
  }

  const discount = 0.2 // 20% discount for annual billing

  return (
    <section id="pricing" className="container space-y-12 py-12 md:py-16 lg:py-24">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {language === "EN" ? "Simple, Transparent Pricing" : "Einfache, transparente Preise"}
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          {language === "EN"
            ? "Choose the plan that works best for your business."
            : "Wählen Sie den Plan, der am besten zu Ihrem Unternehmen passt."}
        </p>
      </div>

      <div className="mx-auto flex max-w-[58rem] items-center justify-center space-x-2">
        <Label htmlFor="billing-toggle" className={billingCycle === "monthly" ? "font-semibold" : ""}>
          {language === "EN" ? "Monthly" : "Monatlich"}
        </Label>
        <Switch id="billing-toggle" checked={billingCycle === "annual"} onCheckedChange={toggleBillingCycle} />
        <Label htmlFor="billing-toggle" className={billingCycle === "annual" ? "font-semibold" : ""}>
          {language === "EN" ? "Annual" : "Jährlich"}{" "}
          <span className="ml-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800">
            {language === "EN" ? "Save 20%" : "20% sparen"}
          </span>
        </Label>
      </div>

      <div className="mx-auto grid max-w-[64rem] gap-8 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Starter</CardTitle>
            <div className="mt-4 flex items-baseline text-5xl font-bold">
              €{billingCycle === "monthly" ? "49" : Math.round(49 * (1 - discount))}
              <span className="ml-1 text-lg font-medium text-muted-foreground">
                {language === "EN" ? "/month" : "/Monat"}
              </span>
            </div>
            <CardDescription className="mt-4">
              {language === "EN" ? "Monatlich abgerechnet" : "Monatlich abgerechnet"}
            </CardDescription>
            <div className="mt-4 text-xl font-semibold text-teal-600">
              {language === "EN" ? "250 Matches" : "250 Übereinstimmungen"}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "250 matches per month" : "250 matches per month"}</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "Basic candidate filtering" : "Basic candidate filtering"}</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "Email support" : "Email support"}</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "1 user account" : "1 user account"}</span>
              </li>
            </ul>
            <Button className="mt-8 w-full bg-gray-900 hover:bg-gray-800">
              {language === "EN" ? "Choose Plan" : "Plan wählen"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-teal-600 shadow-lg">
          <CardHeader>
            <div className="flex justify-center">
              <div className="rounded-full bg-teal-500 px-3 py-1 text-xs font-semibold text-white">
                {language === "EN" ? "Most Popular" : "Am beliebtesten"}
              </div>
            </div>
            <CardTitle className="mt-4">Professional</CardTitle>
            <div className="mt-4 flex items-baseline text-5xl font-bold">
              €{billingCycle === "monthly" ? "129" : Math.round(129 * (1 - discount))}
              <span className="ml-1 text-lg font-medium text-muted-foreground">
                {language === "EN" ? "/month" : "/Monat"}
              </span>
            </div>
            <CardDescription className="mt-4">
              {language === "EN" ? "Monatlich abgerechnet" : "Monatlich abgerechnet"}
            </CardDescription>
            <div className="mt-4 text-xl font-semibold text-teal-600">
              {language === "EN" ? "1000 Matches" : "1000 Übereinstimmungen"}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "1000 matches per month" : "1000 matches per month"}</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "Advanced filtering" : "Advanced filtering"}</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "Priority email support" : "Priority email support"}</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "5 user accounts" : "5 user accounts"}</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "Custom job templates" : "Custom job templates"}</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "Analytics dashboard" : "Analytics dashboard"}</span>
              </li>
            </ul>
            <Button className="mt-8 w-full bg-teal-500 hover:bg-teal-600">
              {language === "EN" ? "Current Plan" : "Aktueller Plan"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scale-Up</CardTitle>
            <div className="mt-4 flex items-baseline text-5xl font-bold">
              €{billingCycle === "monthly" ? "249" : Math.round(249 * (1 - discount))}
              <span className="ml-1 text-lg font-medium text-muted-foreground">
                {language === "EN" ? "/month" : "/Monat"}
              </span>
            </div>
            <CardDescription className="mt-4">
              {language === "EN" ? "Monatlich abgerechnet" : "Monatlich abgerechnet"}
            </CardDescription>
            <div className="mt-4 text-xl font-semibold text-teal-600">
              {language === "EN" ? "3000 Matches" : "3000 Übereinstimmungen"}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "3000 matches per month" : "3000 matches per month"}</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "Advanced filtering" : "Advanced filtering"}</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "Priority phone & email support" : "Priority phone & email support"}</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "Unlimited user accounts" : "Unlimited user accounts"}</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "Custom job templates" : "Custom job templates"}</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "Advanced analytics" : "Advanced analytics"}</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "API access" : "API access"}</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-teal-500" />
                <span>{language === "EN" ? "Dedicated account manager" : "Dedicated account manager"}</span>
              </li>
            </ul>
            <Button className="mt-8 w-full bg-gray-900 hover:bg-gray-800">
              {language === "EN" ? "Choose Plan" : "Plan wählen"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
