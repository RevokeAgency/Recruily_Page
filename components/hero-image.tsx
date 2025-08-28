"use client"

import { useState } from "react"
import Image from "next/image"

export default function HeroImage() {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
      {!imageError ? (
        <Image
          src="/images/ai-recruitment-interface.jpg"
          alt="AI-Powered Candidate Selection Interface"
          fill
          className="object-cover"
          priority
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 p-6">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-teal-600"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                <circle cx="9" cy="9" r="2"></circle>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">AI-Powered Recruitment</h3>
            <p className="mt-2 text-gray-600">Smart candidate selection interface</p>
          </div>
        </div>
      )}

      {/* Corner accents */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-teal-500/20 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-teal-500/20 to-transparent"></div>
    </div>
  )
}
