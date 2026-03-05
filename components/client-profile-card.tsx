'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Phone, Mail, MapPin, MessageSquare, MoreVertical, Edit2, Trash2 } from 'lucide-react'


export interface ClientProfile {
  id: string
  name: string
  email: string
  phone: string
  address: string
  notes?: string
}

interface ClientProfileCardProps {
  client: ClientProfile
  onEdit?: (client: ClientProfile) => void
  onDelete?: (clientId: string) => void
  onClick?: () => void
}

export default function ClientProfileCard({
  client,
  onEdit,
  onDelete,
  onClick
}: ClientProfileCardProps) {

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer p-6 bg-card border-border hover:border-primary/50 transition-all h-full flex flex-col"
    >

      {/* Header */}
      <div className="flex items-start justify-between mb-4">

        <div>
          <h3 className="text-lg font-bold text-foreground">{client.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">ID: {client.id}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}   // ONLY dropdown stops click
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="bg-card border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              onClick={() => onEdit?.(client)}
              className="cursor-pointer flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onDelete?.(client.id)}
              className="text-destructive cursor-pointer flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contact */}
      <div className="space-y-3 mb-6 pb-6 border-b border-border">
        <a className="flex items-center gap-3 text-sm">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span>{client.phone}</span>
        </a>

        <a className="flex items-center gap-3 text-sm">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span>{client.email}</span>
        </a>

        
        
      </div>

      {/* Notes */}
      {client.notes && (
        <div className="mb-6 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs uppercase text-muted-foreground mb-1">Notes</p>
          <p className="text-sm text-foreground">{client.notes}</p>
        </div>
      )}

      

    </Card>
  )
}
