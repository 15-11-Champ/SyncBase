'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTenant } from '@/lib/tenant-context'
import { supabase } from '@/lib/supabaseClient'

export default function EditInvoiceModal({
  isOpen,
  onClose,
  invoice,
  onUpdated,
}: any) {
  const { currentTenant, isLoading: isTenantLoading } = useTenant()
  const [staffList, setStaffList] = useState<any[]>([])

  const [formData, setFormData] = useState<any>({
    clientName: '',
    clientContact: '',
    clientAddress: '',
    invoice_date: '',
    items: [] as any[],
  })


  // Load staff
  useEffect(() => {
    async function loadStaff() {
      if (!currentTenant) return
      const { data } = await supabase
        .from('staff')
        .select('id, name')
        .eq('tenant_id', currentTenant.id)
      if (data) setStaffList(data)
    }
    if (isOpen && !isTenantLoading) {
      loadStaff()
    }
  }, [isOpen, currentTenant, isTenantLoading])

  // Prefill values
  useEffect(() => {
    if (invoice) {
      setFormData({
        clientName: invoice.client_name,
        clientContact: invoice.client_contact,
        clientAddress: invoice.client_address,
        invoiceDate: invoice.invoice_date || '',
        items: invoice.items?.map((i: any) => ({
          description: i.description,
          quantity: i.quantity,
          rateInr: i.rate,
          staffId: i.staffId || '',
          staffName: i.staffName || '',
        })) || [],
      })
    }
  }, [invoice])


  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      items: prev.items.map((item: any, i: number) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const handleSubmit = async () => {

    // 🔒 HARD RULE (non-negotiable)
    if (formData.items.some((item: any) => !item.staffId)) {
      alert('Each service must have a staff assigned')
      return
    }

    const updatedItems = formData.items.map((i: any) => ({
      description: i.description,
      quantity: i.quantity,
      rate: i.rateInr,
      amount: i.quantity * i.rateInr,
      staffId: i.staffId,
      staffName: i.staffName,
    }))

    const subtotal = updatedItems.reduce((s: number, it: any) => s + it.amount, 0)
    const total = subtotal

    const payload = {
      client_name: formData.clientName,
      client_contact: formData.clientContact,
      client_address: formData.clientAddress,
      invoice_date: formData.invoiceDate || invoice.invoice_date,
      items: updatedItems,
      subtotal,
      total,
    }


    const { data: updated, error } = await supabase
      .from("invoices")
      .update(payload)
      .eq("id", invoice.id)
      .eq('tenant_id', currentTenant!.id)
      .select("*, staff:staff_id(name)")
      .single()

    if (error) {
      console.error(error)
      alert("Failed to update invoice")
      return
    }

    // 🔥 RETURN UPDATED INVOICE TO PARENT
    onUpdated(updated)

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        {isTenantLoading ? (
          <div className="flex items-center justify-center py-20">Loading...</div>
        ) : !currentTenant ? (
          <div className="flex items-center justify-center py-20 text-destructive font-bold">No tenant found</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Edit Invoice</DialogTitle>
              <DialogDescription>Modify invoice details</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">



              {/* CLIENT */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Client Name</Label>
                  <Input
                    value={formData.clientName}
                    onChange={(e: any) =>
                      setFormData((prev: any) => ({ ...prev, clientName: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <Label>Contact</Label>
                  <Input
                    value={formData.clientContact}
                    onChange={(e: any) =>
                      setFormData((prev: any) => ({ ...prev, clientContact: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <Label>Address</Label>
                  <Input
                    value={formData.clientAddress}
                    onChange={(e: any) =>
                      setFormData((prev: any) => ({ ...prev, clientAddress: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Invoice Date */}
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.invoiceDate || ''}
                  onChange={(e: any) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      invoiceDate: e.target.value || '',
                    }))
                  }
                />
              </div>


              {/* ITEMS */}
              <div>
                <Label>Invoice Items</Label>
                <div className="space-y-2">
                  {formData.items.map((item: any, idx: number) => (
                    <Card key={idx}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-4 gap-2">

                          <Input
                            value={item.description}
                            onChange={(e: any) =>
                              handleItemChange(idx, "description", e.target.value)
                            }
                            placeholder="Service"
                          />

                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e: any) =>
                              handleItemChange(idx, "quantity", Number(e.target.value))
                            }
                            placeholder="Qty"
                          />

                          <Input
                            type="number"
                            value={item.rateInr}
                            onChange={(e: any) =>
                              handleItemChange(idx, "rateInr", Number(e.target.value))
                            }
                            placeholder="Rate"

                          />
                          <Select
                            value={item.staffId}
                            onValueChange={(value: string) => {
                              const staff = staffList.find((s: any) => s.id === value)
                              handleItemChange(idx, 'staffId', value)
                              handleItemChange(idx, 'staffName', staff?.name || '')
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Staff" />
                            </SelectTrigger>

                            <SelectContent>
                              {staffList.map((s: any) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSubmit} className="w-auto px-5 py-1.5 text-xs">Save Changes</Button>
                <Button variant="outline" onClick={onClose} className="w-auto px-5 py-1.5 text-m">Cancel</Button>
              </div>
            </div>

          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
