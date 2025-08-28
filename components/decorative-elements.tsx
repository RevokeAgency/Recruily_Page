"use client"
import { cn } from "@/lib/utils"

export function DecorativeAccent({
  variant = "dots",
  position = "top-right",
  color = "primary",
  size = "md",
  className,
}: {
  variant?: "dots" | "lines" | "circles" | "wave" | "triangle" | "squares"
  position?: string
  color?: "primary" | "secondary" | "accent" | "muted"
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const colorMap = {
    primary: "text-primary",
    secondary: "text-teal-400",
    accent: "text-emerald-500",
    muted: "text-primary/20",
  }

  const sizeMap = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  }

  const positionClasses = {
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "center-right": "top-1/2 -translate-y-1/2 right-0",
    "center-left": "top-1/2 -translate-y-1/2 left-0",
  }

  return (
    <div
      className={cn(
        "absolute pointer-events-none z-0",
        positionClasses[position as keyof typeof positionClasses],
        sizeMap[size],
        colorMap[color],
        className,
      )}
    >
      {variant === "dots" && (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="3" fill="currentColor" opacity="0.4" />
          <circle cx="10" cy="30" r="3" fill="currentColor" opacity="0.6" />
          <circle cx="10" cy="50" r="3" fill="currentColor" opacity="0.8" />
          <circle cx="10" cy="70" r="3" fill="currentColor" opacity="0.6" />
          <circle cx="10" cy="90" r="3" fill="currentColor" opacity="0.4" />

          <circle cx="30" cy="10" r="3" fill="currentColor" opacity="0.6" />
          <circle cx="30" cy="30" r="3" fill="currentColor" opacity="0.8" />
          <circle cx="30" cy="50" r="3" fill="currentColor" />
          <circle cx="30" cy="70" r="3" fill="currentColor" opacity="0.8" />
          <circle cx="30" cy="90" r="3" fill="currentColor" opacity="0.6" />

          <circle cx="50" cy="10" r="3" fill="currentColor" opacity="0.8" />
          <circle cx="50" cy="30" r="3" fill="currentColor" />
          <circle cx="50" cy="50" r="3" fill="currentColor" />
          <circle cx="50" cy="70" r="3" fill="currentColor" />
          <circle cx="50" cy="90" r="3" fill="currentColor" opacity="0.8" />

          <circle cx="70" cy="10" r="3" fill="currentColor" opacity="0.6" />
          <circle cx="70" cy="30" r="3" fill="currentColor" opacity="0.8" />
          <circle cx="70" cy="50" r="3" fill="currentColor" />
          <circle cx="70" cy="70" r="3" fill="currentColor" opacity="0.8" />
          <circle cx="70" cy="90" r="3" fill="currentColor" opacity="0.6" />

          <circle cx="90" cy="10" r="3" fill="currentColor" opacity="0.4" />
          <circle cx="90" cy="30" r="3" fill="currentColor" opacity="0.6" />
          <circle cx="90" cy="50" r="3" fill="currentColor" opacity="0.8" />
          <circle cx="90" cy="70" r="3" fill="currentColor" opacity="0.6" />
          <circle cx="90" cy="90" r="3" fill="currentColor" opacity="0.4" />
        </svg>
      )}

      {variant === "lines" && (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="10" y1="0" x2="10" y2="100" stroke="currentColor" strokeWidth="2" opacity="0.2" />
          <line x1="30" y1="0" x2="30" y2="100" stroke="currentColor" strokeWidth="2" opacity="0.4" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="2" opacity="0.6" />
          <line x1="70" y1="0" x2="70" y2="100" stroke="currentColor" strokeWidth="2" opacity="0.4" />
          <line x1="90" y1="0" x2="90" y2="100" stroke="currentColor" strokeWidth="2" opacity="0.2" />
        </svg>
      )}

      {variant === "circles" && (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" opacity="0.2" />
          <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="2" opacity="0.4" />
          <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="2" opacity="0.6" />
          <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="2" opacity="0.8" />
        </svg>
      )}

      {variant === "wave" && (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,50 C20,30 30,70 50,50 C70,30 80,70 100,50"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M0,30 C20,10 30,50 50,30 C70,10 80,50 100,30"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            opacity="0.4"
          />
          <path
            d="M0,70 C20,50 30,90 50,70 C70,50 80,90 100,70"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            opacity="0.4"
          />
        </svg>
      )}

      {variant === "triangle" && (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M50 10L90 80H10L50 10Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="currentColor"
            fillOpacity="0.1"
          />
        </svg>
      )}

      {variant === "squares" && (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="30" height="30" stroke="currentColor" strokeWidth="2" opacity="0.8" />
          <rect x="20" y="20" width="30" height="30" stroke="currentColor" strokeWidth="2" opacity="0.6" />
          <rect x="30" y="30" width="30" height="30" stroke="currentColor" strokeWidth="2" opacity="0.4" />
          <rect x="40" y="40" width="30" height="30" stroke="currentColor" strokeWidth="2" opacity="0.2" />
        </svg>
      )}
    </div>
  )
}

export function GlowingDot({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-2 w-2", className)}>
      <div className="absolute inset-0 rounded-full bg-primary animate-pulse" />
      <div className="absolute inset-0 rounded-full bg-primary blur-sm animate-pulse" />
    </div>
  )
}

export function AccentBorder({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 rounded-lg overflow-hidden pointer-events-none", className)}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
    </div>
  )
}

export function CornerAccent({ position = "top-right", className }: { position?: string; className?: string }) {
  const positionClasses = {
    "top-right": "top-0 right-0 rotate-0",
    "top-left": "top-0 left-0 rotate-90",
    "bottom-right": "bottom-0 right-0 -rotate-90",
    "bottom-left": "bottom-0 left-0 rotate-180",
  }

  return (
    <div
      className={cn(
        "absolute w-12 h-12 pointer-events-none",
        positionClasses[position as keyof typeof positionClasses],
        className,
      )}
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,0 L100,0 C100,50 50,100 0,100 L0,0 Z" fill="currentColor" className="text-primary/10" />
        <path
          d="M20,0 L100,0 C100,40 40,100 0,100 L0,20 C0,10 10,0 20,0 Z"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary/30"
          fill="none"
        />
      </svg>
    </div>
  )
}

export function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-primary/40 animate-float-slow" />
      <div className="absolute top-3/4 left-1/3 w-3 h-3 rounded-full bg-teal-400/30 animate-float-medium" />
      <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-emerald-500/30 animate-float-fast" />
      <div className="absolute bottom-1/4 right-1/3 w-3 h-3 rounded-full bg-primary/30 animate-float-medium" />
    </div>
  )
}

export function CardDecoration({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}>
      <div className="absolute -top-6 -right-6 w-12 h-12 rounded-full bg-primary/10 blur-xl" />
      <div className="absolute -bottom-6 -left-6 w-12 h-12 rounded-full bg-teal-400/10 blur-xl" />
    </div>
  )
}

export function SectionDivider({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-24 w-full overflow-hidden", className)}>
      <svg className="absolute w-full h-24 text-primary/10" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
      </svg>
    </div>
  )
}
