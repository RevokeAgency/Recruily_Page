"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
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

export default function TestimonialsSlider() {
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
    <section className="bg-white py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">Testimonials</h2>
          <p className="mb-12 text-lg text-gray-600">See what our customers have to say about Recruitify</p>
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-lg bg-white px-10 py-12 shadow-lg">
            <div className="absolute top-0 left-0 h-full w-2 bg-teal-500"></div>

            <blockquote className="mb-8 text-xl font-medium italic text-gray-900">
              "{testimonials[currentIndex].quote}"
            </blockquote>

            <div className="flex items-center">
              <div className="mr-4 h-12 w-12 overflow-hidden rounded-full bg-gray-200">
                <Image
                  src={`/placeholder.svg?height=48&width=48&text=${testimonials[currentIndex].author.charAt(0)}`}
                  alt={testimonials[currentIndex].author}
                  width={48}
                  height={48}
                />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{testimonials[currentIndex].author}</div>
                <div className="text-sm text-gray-600">
                  {testimonials[currentIndex].position}, {testimonials[currentIndex].company}
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  prevSlide()
                  setAutoplay(false)
                }}
                aria-label="Previous testimonial"
                className="h-8 w-8 rounded-full border-gray-300"
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
                className="h-8 w-8 rounded-full border-gray-300"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
