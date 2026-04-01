"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSubscription } from "@/hooks/use-subscription"
import { useLanguage } from "@/contexts/language-context"
import { Badge } from "@/components/ui/badge"

export function PlanSelector() {
  const { language } = useLanguage()
  const { isPlanSelectorOpen, closePlanSelector, upgradePlan, currentPlan } = useSubscription() as any

  const plans = [
    {
      id: "STARTER",
      name: "Starter",
      price: 49,
      matches: 200, // Changed from 250 to 200
      features: ["200 matches per month", "Basic candidate filtering", "Email support", "1 user account"],
    },
    {
      id: "PROFESSIONAL",
      name: "Professional",
      price: 129,
      matches: 1000,
      popular: true,
      features: [
        "1000 matches per month",
        "Advanced candidate filtering",
        "Priority email support",
        "5 user accounts",
        "Custom job templates",
        "Analytics dashboard",
      ],
    },
    {
      id: "SCALE_UP",
      name: "Scale-Up",
      price: 249,
      matches: 3000,
      features: [
        "3000 matches per month",
        "Advanced candidate filtering",
        "Priority phone & email support",
        "Unlimited user accounts",
        "Custom job templates",
        // Removed "Advanced analytics"
        "API access",
        "Dedicated account manager",
      ],
    },
  ]

  return (
    <Dialog open={isPlanSelectorOpen} onOpenChange={closePlanSelector}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>
            {language === "EN" ? "Choose Your Subscription Plan" : "Wählen Sie Ihren Abonnementplan"}
          </DialogTitle>
          <DialogDescription>
            {language === "EN"
              ? "Select the plan that best fits your recruitment needs."
              : "Wählen Sie den Plan, der am besten zu Ihren Rekrutierungsbedürfnissen passt."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg border p-6 shadow-sm transition-all hover:shadow-md ${
                plan.popular ? "border-teal-600 ring-1 ring-teal-600" : ""
              }`}
            >
              {plan.popular && (
                <Badge className="absolute right-4 top-4 bg-teal-600">
                  {language === "EN" ? "Most Popular" : "Am beliebtesten"}
                </Badge>
              )}
              <div className="mb-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">€{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {language === "EN" ? "Billed monthly" : "Monatlich abgerechnet"}
                </p>
              </div>

              <div className="mb-6">
                <p className="font-medium text-teal-600">{plan.matches} matches</p>
              </div>

              <ul className="mb-6 space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-teal-600" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${plan.popular ? "bg-teal-600 hover:bg-teal-700" : "bg-gray-900 hover:bg-gray-800"}`}
                onClick={() => upgradePlan(plan.id as any)}
                disabled={currentPlan === plan.id}
              >
                {currentPlan === plan.id
                  ? language === "EN"
                    ? "Current Plan"
                    : "Aktueller Plan"
                  : language === "EN"
                    ? "Choose Plan"
                    : "Plan wählen"}
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="outline" onClick={closePlanSelector}>
            {language === "EN" ? "Cancel" : "Abbrechen"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {language === "EN"
              ? "All plans include a 14-day money-back guarantee"
              : "Alle Pläne beinhalten eine 14-tägige Geld-zurück-Garantie"}
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
