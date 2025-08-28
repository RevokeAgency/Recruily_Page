"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function BackgroundElements({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className={cn("pointer-events-none fixed inset-0 z-[-1] overflow-hidden", className)}>
      {/* Large gradient blob in the top right */}
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gradient-to-b from-primary/20 to-transparent blur-3xl" />

      {/* Small accent circles */}
      <div className="absolute left-1/4 top-1/3 h-16 w-16 rounded-full bg-primary/10 blur-xl" />
      <div className="absolute bottom-1/4 right-1/3 h-24 w-24 rounded-full bg-primary/15 blur-xl" />

      {/* Abstract shapes */}
      <svg
        className="absolute bottom-0 left-0 h-64 w-64 opacity-10"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="hsl(var(--primary))"
          d="M42.8,-57.2C55.9,-49.3,67.2,-37.4,71.4,-23.4C75.5,-9.4,72.5,6.7,67.2,21.5C61.9,36.3,54.3,49.8,42.3,57.4C30.3,65,14.1,66.7,-1.2,68.2C-16.5,69.7,-33,71,-45.4,63.5C-57.8,56,-66.1,39.7,-70.8,22.6C-75.5,5.5,-76.7,-12.4,-70.8,-27.2C-64.9,-42,-52,-53.7,-38.1,-61.3C-24.2,-68.9,-9.3,-72.3,3.4,-76.8C16.1,-81.3,29.7,-65.1,42.8,-57.2Z"
          transform="translate(100 100)"
        />
      </svg>

      <svg
        className="absolute right-0 top-1/3 h-80 w-80 opacity-10"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="hsl(var(--primary))"
          d="M47.7,-51.2C59.5,-42.9,65.8,-25.9,67.3,-9.2C68.8,7.5,65.5,23.9,56.5,36.1C47.5,48.3,32.8,56.3,16.9,61.5C1,66.7,-16.2,69.1,-31.8,64.1C-47.5,59.1,-61.6,46.7,-67.4,31.1C-73.2,15.5,-70.7,-3.3,-64.3,-19.9C-57.9,-36.5,-47.5,-50.9,-34.5,-58.7C-21.4,-66.5,-5.7,-67.7,8.5,-77.1C22.7,-86.5,35.9,-59.5,47.7,-51.2Z"
          transform="translate(100 100)"
        />
      </svg>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,transparent_49.5%,hsl(var(--primary)/5%)_49.5%,hsl(var(--primary)/5%)_50.5%,transparent_50.5%,transparent_100%),linear-gradient(to_bottom,transparent_0%,transparent_49.5%,hsl(var(--primary)/5%)_49.5%,hsl(var(--primary)/5%)_50.5%,transparent_50.5%,transparent_100%)] bg-[length:4rem_4rem] opacity-30" />
    </div>
  )
}

export function SectionAccent({ position = "top-right", className }: { position?: string; className?: string }) {
  return (
    <div
      className={cn(
        "absolute pointer-events-none z-0 opacity-50",
        position === "top-right" && "right-0 top-0 h-64 w-64 translate-x-1/4 -translate-y-1/4",
        position === "bottom-left" && "bottom-0 left-0 h-64 w-64 -translate-x-1/4 translate-y-1/4",
        className,
      )}
    >
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path
          fill="hsl(var(--primary)/20%)"
          d="M39.9,-46.1C52.5,-34.5,64.2,-21.8,68.1,-6.4C72,9,68.2,27.1,57.9,39.7C47.6,52.3,30.9,59.3,13.6,63.1C-3.7,66.9,-21.5,67.5,-35.9,60.2C-50.3,52.9,-61.2,37.8,-67.1,20.4C-73,3,-73.9,-16.6,-65.5,-31.8C-57.1,-47,-39.5,-57.8,-23.2,-67.5C-6.9,-77.2,8.1,-85.8,20.5,-79.9C32.9,-74,45.7,-53.6,39.9,-46.1Z"
          transform="translate(100 100)"
        />
      </svg>
    </div>
  )
}

export function DashboardBackgroundElements() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
      {/* Top gradient */}
      <div className="absolute -top-24 left-1/4 h-64 w-1/2 rounded-full bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />

      {/* Bottom right accent */}
      <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="opacity-10">
          <path
            fill="hsl(var(--primary))"
            d="M47.5,-57.2C59.9,-45.3,67.5,-28.5,70.8,-10.8C74.1,7,73.1,25.6,64.4,39.8C55.7,53.9,39.3,63.5,22.1,68.1C4.9,72.7,-13.2,72.3,-28.2,65.5C-43.3,58.7,-55.3,45.6,-62.9,30C-70.5,14.4,-73.7,-3.7,-69.3,-19.9C-64.9,-36.1,-52.9,-50.4,-38.8,-61.5C-24.7,-72.6,-8.5,-80.5,5.4,-87.1C19.3,-93.7,35.1,-69.1,47.5,-57.2Z"
            transform="translate(100 100)"
          />
        </svg>
      </div>

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,transparent_49.8%,hsl(var(--primary)/3%)_49.8%,hsl(var(--primary)/3%)_50.2%,transparent_50.2%,transparent_100%),linear-gradient(to_bottom,transparent_0%,transparent_49.8%,hsl(var(--primary)/3%)_49.8%,hsl(var(--primary)/3%)_50.2%,transparent_50.2%,transparent_100%)] bg-[length:3rem_3rem] opacity-30" />
    </div>
  )
}
