'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useTenant } from '@/lib/tenant-context'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Calendar } from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  tenant_id: string
  created_at: string
}

const POSITIONS = ['Beautician', 'Male Hairdresser', 'Unisex Hairdresser', 'Housekeeping']



export default function StaffManagement() {
  const { currentTenant, isLoading: isTenantLoading } = useTenant()
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [newStaffDialogOpen, setNewStaffDialogOpen] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('')

  const loadStaff = async () => {
    if (!currentTenant) return
    try {
      const response = await fetch('/api/staff', {
        headers: {
          'x-tenant-id': currentTenant.id
        }
      })
      const result = await response.json()
      if (result.data) setStaffMembers(result.data)
    } catch (err) {
      console.error('Failed to load staff:', err)
    }
  }

  useEffect(() => {
    if (!isTenantLoading) {
      loadStaff()
    }
  }, [currentTenant, isTenantLoading])

  const handleAddStaff = async () => {
    if (!name || !phone || !position || !currentTenant) {
      alert('Please fill in Name, Phone, and Role')
      return
    }

    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentTenant.id
        },
        body: JSON.stringify({
          fullName: name,
          email: email || null,
          phone,
          position
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to add staff')
      }

      setName('')
      setEmail('')
      setPhone('')
      setPosition('')
      setNewStaffDialogOpen(false)
      loadStaff()
    } catch (error: any) {
      console.error('Add staff error:', error)
      alert(error.message)
    }
  }

  const handleDeleteStaff = async () => {
    if (!staffToDelete || !currentTenant) return

    try {
      // Note: We'll need a DELETE route or use the existing one if supported
      // For now, let's stick to the POST/GET but ideally we have /api/staff/[id]
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffToDelete.id)
        .eq('tenant_id', currentTenant.id)

      if (error) throw error

      setStaffMembers(prev =>
        prev.filter((s: StaffMember) => s.id !== staffToDelete.id)
      )
      setDeleteDialogOpen(false)
      setStaffToDelete(null)
    } catch (error: any) {
      console.error('Delete staff error:', error)
      alert(error.message)
    }
  }

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch =
      (staff.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.email || '').toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground mt-2">Manage your salon staff</p>
        </div>

        {/* Add Staff Dialog */}
        <Dialog open={newStaffDialogOpen} onOpenChange={setNewStaffDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>Enter staff details</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Input placeholder="Full Name *" value={name} onChange={e => setName(e.target.value)} />
              <Input placeholder="Phone Number *" value={phone} onChange={e => setPhone(e.target.value)} />
              <Input placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} />

              <div>
                <input
                  list="positions"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Select or type a role"
                  className="w-full border rounded-md px-3 py-2"
                />

                <datalist id="positions">
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos} />
                  ))}
                </datalist>
              </div>


              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setNewStaffDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddStaff}>Add Staff</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-end">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map(staff => (
          <Card key={staff.id}>
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <CardTitle>{staff.name}</CardTitle>
                  <CardDescription>{staff.role}</CardDescription>
                </div>
                <Badge className="bg-green-500/20 text-green-500">
                  Active
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <p>📞 {staff.phone}</p>
              {staff.email && <p>✉️ {staff.email}</p>}

              <div className="flex gap-2 pt-2">

                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStaffToDelete(staff)
                    setDeleteDialogOpen(true)
                  }}
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Staff Member?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {staffToDelete?.name}?
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 text-white" onClick={handleDeleteStaff}>
              Yes, Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
