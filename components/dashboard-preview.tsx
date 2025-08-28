import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function DashboardPreview() {
  return (
    <section className="container py-12 md:py-16 lg:py-24">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Powerful Admin Dashboard</h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Get a complete overview of your recruitment process in one place.
        </p>
      </div>

      <div className="mt-12 overflow-hidden rounded-lg border bg-white shadow-xl">
        <div className="flex h-12 items-center border-b bg-slate-50 px-4">
          <div className="flex space-x-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <div className="mx-auto flex h-6 w-80 items-center justify-center rounded-full bg-white text-xs text-slate-500">
            recruitify.app/dashboard
          </div>
        </div>
        <div className="relative h-[500px] w-full">
          <Image
            src="/placeholder.svg?height=1000&width=1920&text=AI+Recruiting+Dashboard+Preview"
            alt="Recruitify Dashboard Preview"
            fill
            className="object-cover"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Button className="bg-teal-600 hover:bg-teal-700">See the full dashboard</Button>
      </div>
    </section>
  )
}
