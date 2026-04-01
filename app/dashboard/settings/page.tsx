"use client"

import type React from "react"

import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useSubscription } from "@/hooks/use-subscription"
import { Bell, User, Shield, Globe } from "lucide-react"

export default function SettingsPage() {
  const { language, setLanguage } = useLanguage()
  const { toast } = useToast()
  const { currentPlan, totalMatches, usedMatches, remainingMatches, upgradePlan, buyMatchPackage } = useSubscription() as any

  const [profileForm, setProfileForm] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    company: "Acme Inc.",
    role: "HR Manager",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newCandidates: true,
    matchUpdates: true,
    weeklyReports: true,
    marketingEmails: false,
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
    passwordExpiry: "90",
  })

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleNotificationChange = (setting: string, checked: boolean) => {
    setNotificationSettings((prev) => ({ ...prev, [setting]: checked }))
  }

  const handleSecurityChange = (setting: string, value: string | boolean) => {
    setSecuritySettings((prev) => ({ ...prev, [setting]: value }))
  }

  const handleSaveProfile = () => {
    toast({
      title: language === "EN" ? "Profile updated" : "Profil aktualisiert",
      description:
        language === "EN"
          ? "Your profile has been updated successfully."
          : "Ihr Profil wurde erfolgreich aktualisiert.",
    })
  }

  const handleSaveNotifications = () => {
    toast({
      title: language === "EN" ? "Notification settings updated" : "Benachrichtigungseinstellungen aktualisiert",
      description:
        language === "EN"
          ? "Your notification preferences have been saved."
          : "Ihre Benachrichtigungseinstellungen wurden gespeichert.",
    })
  }

  const handleSaveSecurity = () => {
    toast({
      title: language === "EN" ? "Security settings updated" : "Sicherheitseinstellungen aktualisiert",
      description:
        language === "EN"
          ? "Your security settings have been updated."
          : "Ihre Sicherheitseinstellungen wurden aktualisiert.",
    })
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-3xl font-bold">{language === "EN" ? "Settings" : "Einstellungen"}</h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            {language === "EN" ? "Profile" : "Profil"}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            {language === "EN" ? "Notifications" : "Benachrichtigungen"}
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            {language === "EN" ? "Security" : "Sicherheit"}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{language === "EN" ? "Profile Settings" : "Profileinstellungen"}</CardTitle>
              <CardDescription>
                {language === "EN"
                  ? "Manage your account information and preferences."
                  : "Verwalten Sie Ihre Kontoinformationen und Präferenzen."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{language === "EN" ? "Full Name" : "Vollständiger Name"}</Label>
                  <Input id="name" name="name" value={profileForm.name} onChange={handleProfileChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{language === "EN" ? "Email" : "E-Mail"}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">{language === "EN" ? "Company" : "Unternehmen"}</Label>
                  <Input id="company" name="company" value={profileForm.company} onChange={handleProfileChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">{language === "EN" ? "Role" : "Position"}</Label>
                  <Input id="role" name="role" value={profileForm.role} onChange={handleProfileChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">{language === "EN" ? "Language" : "Sprache"}</Label>
                <div className="flex space-x-4">
                  <Button
                    variant={language === "EN" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setLanguage("EN")
                    }}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    English
                  </Button>
                  <Button
                    variant={language === "DE" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setLanguage("DE")
                    }}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Deutsch
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} className="bg-teal-600 hover:bg-teal-700">
                {language === "EN" ? "Save Changes" : "Änderungen speichern"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{language === "EN" ? "Notification Settings" : "Benachrichtigungseinstellungen"}</CardTitle>
              <CardDescription>
                {language === "EN"
                  ? "Configure how and when you receive notifications."
                  : "Konfigurieren Sie, wie und wann Sie Benachrichtigungen erhalten."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{language === "EN" ? "Email Notifications" : "E-Mail-Benachrichtigungen"}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "EN"
                      ? "Receive notifications via email"
                      : "Erhalten Sie Benachrichtigungen per E-Mail"}
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{language === "EN" ? "New Candidates" : "Neue Kandidaten"}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "EN"
                      ? "Get notified when new candidates are added"
                      : "Werden Sie benachrichtigt, wenn neue Kandidaten hinzugefügt werden"}
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.newCandidates}
                  onCheckedChange={(checked) => handleNotificationChange("newCandidates", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{language === "EN" ? "Match Updates" : "Match-Updates"}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "EN"
                      ? "Get notified about new matches and updates"
                      : "Erhalten Sie Benachrichtigungen über neue Matches und Updates"}
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.matchUpdates}
                  onCheckedChange={(checked) => handleNotificationChange("matchUpdates", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{language === "EN" ? "Weekly Reports" : "Wöchentliche Berichte"}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "EN"
                      ? "Receive weekly summary reports"
                      : "Erhalten Sie wöchentliche Zusammenfassungsberichte"}
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.weeklyReports}
                  onCheckedChange={(checked) => handleNotificationChange("weeklyReports", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{language === "EN" ? "Marketing Emails" : "Marketing-E-Mails"}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "EN"
                      ? "Receive marketing and promotional emails"
                      : "Erhalten Sie Marketing- und Werbe-E-Mails"}
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.marketingEmails}
                  onCheckedChange={(checked) => handleNotificationChange("marketingEmails", checked)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNotifications} className="bg-teal-600 hover:bg-teal-700">
                {language === "EN" ? "Save Preferences" : "Einstellungen speichern"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>{language === "EN" ? "Security Settings" : "Sicherheitseinstellungen"}</CardTitle>
              <CardDescription>
                {language === "EN"
                  ? "Manage your account security and privacy."
                  : "Verwalten Sie die Sicherheit und Privatsphäre Ihres Kontos."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{language === "EN" ? "Two-Factor Authentication" : "Zwei-Faktor-Authentifizierung"}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "EN"
                      ? "Add an extra layer of security to your account"
                      : "Fügen Sie Ihrem Konto eine zusätzliche Sicherheitsebene hinzu"}
                  </p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorAuth}
                  onCheckedChange={(checked) => handleSecurityChange("twoFactorAuth", checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">
                  {language === "EN" ? "Session Timeout (minutes)" : "Sitzungs-Timeout (Minuten)"}
                </Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => handleSecurityChange("sessionTimeout", e.target.value)}
                  min="5"
                  max="120"
                />
                <p className="text-sm text-muted-foreground">
                  {language === "EN"
                    ? "Automatically log out after inactivity"
                    : "Automatisch abmelden nach Inaktivität"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordExpiry">
                  {language === "EN" ? "Password Expiry (days)" : "Passwort-Ablauf (Tage)"}
                </Label>
                <Input
                  id="passwordExpiry"
                  type="number"
                  value={securitySettings.passwordExpiry}
                  onChange={(e) => handleSecurityChange("passwordExpiry", e.target.value)}
                  min="30"
                  max="365"
                />
                <p className="text-sm text-muted-foreground">
                  {language === "EN"
                    ? "Require password change after specified days"
                    : "Passwortänderung nach angegebenen Tagen erforderlich"}
                </p>
              </div>
              <div className="pt-4">
                <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                  {language === "EN" ? "Reset Password" : "Passwort zurücksetzen"}
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSecurity} className="bg-teal-600 hover:bg-teal-700">
                {language === "EN" ? "Save Settings" : "Einstellungen speichern"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
