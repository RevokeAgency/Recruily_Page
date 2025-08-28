"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

type Testimonial = {
  id: number
  quote: string
  author: string
  position: string
  company: string
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      "Recruitify has completely transformed our hiring process. We've reduced time-to-hire by 60% and found better candidates.",
    author: "Sarah Johnson",
    position: "HR Director",
    company: "TechGrowth Inc.",
  },
  {
    id: 2,
    quote:
      "The AI matching is incredibly accurate. We're now only interviewing candidates who are truly qualified for the role.",
    author: "Michael Chen",
    position: "Talent Acquisition Manager",
    company: "Innovate Solutions",
  },
  {
    id: 3,
    quote:
      "Setup was quick and the interface is intuitive. Our entire HR team was able to start using it immediately with minimal training.",
    author: "Emma Rodriguez",
    position: "Head of People",
    company: "Future Finance",
  },
]

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(true)

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1))
  }

  useEffect(() => {
    if (!autoplay) return

    const interval = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => clearInterval(interval)
  }, [autoplay, currentIndex])

  return (
    <section id="testimonials" className="container space-y-12 bg-slate-50 py-12 md:py-16 lg:py-24">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Why HR Teams Love Recruitify</h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          See what our customers have to say about Recruitify.
        </p>
      </div>
      <div className="relative">
        <div className="flex items-center justify-center">
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 z-10 hidden md:flex"
            onClick={() => {
              prevSlide()
              setAutoplay(false)
            }}
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="w-full overflow-hidden px-4 py-12">
            <div className="flex flex-col items-center space-y-4">
              <Card className="w-full max-w-3xl border-none bg-white shadow-sm">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="flex space-x-1">
                      {testimonials.map((_, index) => (
                        <div
                          key={index}
                          className={`h-1.5 w-6 rounded-full ${index === currentIndex ? "bg-teal-500" : "bg-gray-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <blockquote className="mb-6 text-xl font-medium italic">
                    "{testimonials[currentIndex].quote}"
                  </blockquote>
                  <div className="flex flex-col items-center">
                    <div className="mb-2 h-12 w-12 overflow-hidden rounded-full bg-gray-200">
                      <Image
                        src={`/placeholder.svg?height=48&width=48&text=${testimonials[currentIndex].author.charAt(0)}`}
                        alt={testimonials[currentIndex].author}
                        width={48}
                        height={48}
                      />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{testimonials[currentIndex].author}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonials[currentIndex].position}, {testimonials[currentIndex].company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-center space-x-2 pt-4 md:hidden">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    prevSlide()
                    setAutoplay(false)
                  }}
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    nextSlide()
                    setAutoplay(false)
                  }}
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 z-10 hidden md:flex"
            onClick={() => {
              nextSlide()
              setAutoplay(false)
            }}
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
          <div className="h-8 w-24 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0">
            <Image
              src="/placeholder.svg?height=32&width=96&text=TechGrowth"
              alt="TechGrowth Inc."
              width={96}
              height={32}
            />
          </div>
          <div className="h-8 w-24 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0">
            <Image
              src="/placeholder.svg?height=32&width=96&text=Innovate"
              alt="Innovate Solutions"
              width={96}
              height={32}
            />
          </div>
          <div className="h-8 w-24 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0">
            <Image src="/placeholder.svg?height=32&width=96&text=Future" alt="Future Finance" width={96} height={32} />
          </div>
        </div>
      </div>
    </section>
  )
}
