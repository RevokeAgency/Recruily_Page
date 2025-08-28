"use client"

import type React from "react"

import { Tabs } from "@/components/ui/tabs"

interface TabsWrapperProps {
  children: React.ReactNode
  defaultValue?: string
}

export default function TabsWrapper({ children, defaultValue = "overview" }: TabsWrapperProps) {
  return (
    <Tabs defaultValue={defaultValue} className="w-full p-0 m-0">
      {children}
    </Tabs>
  )
}
