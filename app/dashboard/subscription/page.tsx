"use client"

import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Infinity } from "lucide-react"
import { useState } from "react"
import { useQuota } from "@/hooks/use-quota"

// Mock subscription data and functions
const SUBSCRIPTION_PLANS = {
  STARTER: {
    name: "Starter",
    price: 49,
    matches: 250,
  },
  PROFESSIONAL: {
    name: "Professional",
    price: 129,
    matches: 1000,
  },
  SCALE_UP: {
    name: "Scale-Up",
    price: 249,
    matches: 3000,
  },
}

export default function SubscriptionPage() {
  const { t } = useLanguage()
  const { quota } = useQuota()
  const [currentPlan, setCurrentPlan] = useState("TESTING")

  const upgradePlan = (planId: keyof typeof SUBSCRIPTION_PLANS) => {
    setCurrentPlan(planId)
    // In a real app, this would call an API to upgrade the plan
    alert(`Plan upgraded to ${SUBSCRIPTION_PLANS[planId].name}`)
  }

  const buyMatchPackage = (packageIndex: number) => {
    const packages = [
      { matches: 100, price: 35 },
      { matches: 300, price: 75 },
      { matches: 1200, price: 180 },
    ]
    // In a real app, this would call an API to purchase matches
    alert(`Purchased ${packages[packageIndex].matches} additional matches`)
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-3xl font-bold">{t("subscription")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("subscriptionPlan")}</CardTitle>
          <CardDescription>{t("manageSubscription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4 bg-gradient-to-r from-teal-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Infinity className="h-5 w-5 text-teal-600" />
                  Testing Mode - Unlimited Matches
                </h3>
                <p className="text-sm text-muted-foreground">Free unlimited access for testing</p>
              </div>
              <Badge variant="outline" className="text-teal-600 border-teal-600 bg-teal-50">
                UNLIMITED
              </Badge>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Matches Used</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  {quota?.used || 0} / <Infinity className="h-4 w-4" /> (Unlimited)
                </span>
              </div>
              <div className="h-2 bg-gradient-to-r from-teal-400 to-blue-400 rounded-full"></div>
              <p className="text-sm text-teal-600 font-medium">
                ✨ Unlimited matches available for testing the enhanced CV extraction!
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">🧪 Testing Features Available:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Upload unlimited CVs to test name extraction</li>
              <li>• Test email address extraction from CV content</li>
              <li>• Verify realistic German name fallbacks</li>
              <li>• Match candidates to jobs without limits</li>
              <li>• Full access to all premium features</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-medium">Available Plans (After Testing)</h3>
            <div className="grid gap-6 py-4 md:grid-cols-3">
              {[
                {
                  id: "STARTER",
                  name: "Starter",
                  price: 49,
                  matches: 250,
                  features: ["250 matches per month", "Basic candidate filtering", "Email support", "1 user account"],
                },
                {
                  id: "PROFESSIONAL",
                  name: "Professional",
                  price: 129,
                  matches: 1000,
                  popular: true,
                  features: [
                    "1000 matches per month",
                    "Advanced filtering",
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
                    "Advanced filtering",
                    "Priority phone & email support",
                    "Unlimited user accounts",
                    "Custom job templates",
                    "Advanced analytics",
                    "API access",
                    "Dedicated account manager",
                  ],
                },
              ].map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-lg border p-6 shadow-sm transition-all hover:shadow-md ${
                    plan.popular ? "border-teal-600 ring-1 ring-teal-600" : ""
                  }`}
                >
                  {plan.popular && <Badge className="absolute right-4 top-4 bg-teal-600">Most Popular</Badge>}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">€{plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Billed monthly</p>
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
                    className={`w-full ${
                      plan.popular ? "bg-teal-600 hover:bg-teal-700" : "bg-gray-900 hover:bg-gray-800"
                    }`}
                    onClick={() => upgradePlan(plan.id as keyof typeof SUBSCRIPTION_PLANS)}
                    disabled={currentPlan === "TESTING"}
                  >
                    {currentPlan === "TESTING" ? "Currently Testing" : "Choose Plan"}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-medium">{t("additionalMatches")}</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { name: "100 Matches", matches: 100, price: 35 },
                { name: "300 Matches", matches: 300, price: 75 },
                { name: "1200 Matches", matches: 1200, price: 180 },
              ].map((pkg, index) => (
                <div key={index} className="rounded-lg border p-6 shadow-sm transition-all hover:shadow-md">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold">{pkg.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">€{pkg.price}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="font-medium text-teal-600">
                      {pkg.matches} {t("matches")}
                    </p>
                  </div>

                  <Button className="w-full" onClick={() => buyMatchPackage(index)}>
                    {t("purchase")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
