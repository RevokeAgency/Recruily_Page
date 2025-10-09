"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Calendar, 
  Star,
  MoreHorizontal,
  Mail,
  Phone,
  Download
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CandidateQuickActionsProps {
  candidate: {
    id: string
    name: string
    email?: string
    phone?: string
    resume_url?: string
  }
  jobId?: string
  onStatusUpdate?: (status: string) => void
}

export function CandidateQuickActions({ 
  candidate, 
  jobId, 
  onStatusUpdate 
}: CandidateQuickActionsProps) {
  const { toast } = useToast()
  const [updating, setUpdating] = useState(false)

  const handleStatusUpdate = async (status: string, message: string) => {
    setUpdating(true)
    
    try {
      const response = await fetch(`/api/candidates/${candidate.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          jobId,
          notes: `Status updated to ${status} via quick action`
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Status Updated",
          description: message,
          variant: "default"
        })
        
        if (onStatusUpdate) {
          onStatusUpdate(status)
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update candidate status",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleContact = (type: 'email' | 'phone') => {
    if (type === 'email' && candidate.email) {
      window.location.href = `mailto:${candidate.email}?subject=Job Opportunity - Interview Invitation&body=Dear ${candidate.name},%0D%0A%0D%0AWe would like to invite you for an interview...`
    } else if (type === 'phone' && candidate.phone) {
      window.location.href = `tel:${candidate.phone}`
    }
  }

  return (
    <div className="flex items-center space-x-1">
      {/* Primary Actions */}
      <Button 
        size="sm" 
        onClick={() => handleStatusUpdate('shortlisted', `${candidate.name} has been shortlisted`)}
        disabled={updating}
        className="bg-green-600 hover:bg-green-700"
      >
        <CheckCircle className="w-3 h-3 mr-1" />
        Shortlist
      </Button>

      <Button 
        size="sm" 
        variant="outline"
        onClick={() => handleStatusUpdate('interview_scheduled', `Interview scheduled for ${candidate.name}`)}
        disabled={updating}
      >
        <Calendar className="w-3 h-3 mr-1" />
        Interview
      </Button>

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Contact Actions */}
          {candidate.email && (
            <DropdownMenuItem onClick={() => handleContact('email')}>
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </DropdownMenuItem>
          )}
          
          {candidate.phone && (
            <DropdownMenuItem onClick={() => handleContact('phone')}>
              <Phone className="w-4 h-4 mr-2" />
              Call Candidate
            </DropdownMenuItem>
          )}

          {candidate.resume_url && (
            <DropdownMenuItem onClick={() => window.open(candidate.resume_url, '_blank')}>
              <Download className="w-4 h-4 mr-2" />
              Download CV
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Status Actions */}
          <DropdownMenuItem 
            onClick={() => handleStatusUpdate('starred', `${candidate.name} has been starred`)}
          >
            <Star className="w-4 h-4 mr-2" />
            Add to Favorites
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => handleStatusUpdate('needs_review', `${candidate.name} marked for review`)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Mark for Review
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={() => handleStatusUpdate('rejected', `${candidate.name} has been rejected`)}
            className="text-red-600 focus:text-red-600"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject Candidate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default CandidateQuickActions