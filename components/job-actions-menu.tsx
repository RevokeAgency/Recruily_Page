"use client"

import { MoreHorizontal, Eye, Edit, Trash2, Users, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface JobActionsMenuProps {
  job: any
  onDelete: (id: string, title: string) => void
}

export default function JobActionsMenu({ job, onDelete }: JobActionsMenuProps) {
  const router = useRouter()
  const { toast } = useToast()

  const handleViewJob = () => {
    router.push(`/dashboard/jobs/${job.id}`)
  }

  const handleEditJob = () => {
    router.push(`/dashboard/jobs/${job.id}/edit`)
  }

  const handleViewCandidates = () => {
    router.push(`/dashboard/matches?job=${job.id}`)
  }

  const handleCopyLink = () => {
    const jobUrl = `${window.location.origin}/jobs/${job.id}`
    navigator.clipboard.writeText(jobUrl)
    toast({
      title: "Link copied",
      description: "Job link copied to clipboard",
      duration: 2000,
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleViewJob} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEditJob} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          Edit Job
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleViewCandidates} className="cursor-pointer">
          <Users className="mr-2 h-4 w-4" />
          View Candidates
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onDelete(job.id, job.title)} 
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Job
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}