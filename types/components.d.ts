// Type declarations for UI components to help with module resolution

declare module '@/components/ui/button' {
  import { ButtonProps, Button, buttonVariants } from '../components/ui/button'
  export { ButtonProps, Button, buttonVariants }
}

declare module '@/components/ui/card' {
  import { 
    Card, 
    CardHeader, 
    CardTitle, 
    CardDescription, 
    CardContent, 
    CardFooter 
  } from '../components/ui/card'
  export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
}

declare module '@/components/ui/tabs' {
  import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent
  } from '../components/ui/tabs'
  export { Tabs, TabsList, TabsTrigger, TabsContent }
}

declare module '@/lib/email-service' {
  import { 
    sendEmail, 
    verifyConfirmationToken, 
    resendConfirmationEmail, 
    sendConfirmationEmail 
  } from '../lib/email-service'
  export { sendEmail, verifyConfirmationToken, resendConfirmationEmail, sendConfirmationEmail }
}