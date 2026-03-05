'use client'
import { useState, useEffect, useRef } from 'react'

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
import { Plus, Trash2 } from 'lucide-react'
import { formatPrice } from '@/lib/currency'
import { useTenant } from '@/lib/tenant-context'
import { supabase } from '@/lib/supabaseClient'



interface InvoiceItem {
  description: string
  quantity: number
  rateInr: number
  staffId: string
  staffName: string
}


interface InvoiceFormData {
  clientName: string
  clientContact: string
  clientAddress: string
  invoiceDate?: string
  items: InvoiceItem[]

}

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  onSubmit,
  businessSettings,
  clients,
}: any) {
  const { currentTenant, isLoading: isTenantLoading } = useTenant()
  // ---------------------------
  // FORM STATE
  // ---------------------------
  const today = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState<InvoiceFormData>({
    clientName: '',
    clientContact: '',
    clientAddress: '',
    invoiceDate: today,
    items: [
      {
        description: '',
        quantity: 1,
        rateInr: 0,
        staffId: '',
        staffName: '',
      },
    ],
  })

  const [clientMatches, setClientMatches] = useState<any[]>([])
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [isSearchingClient, setIsSearchingClient] = useState(false)
  const phoneDebounceRef = useRef<NodeJS.Timeout | null>(null)



  // ---------------------------
  // STAFF LOADING
  // ---------------------------
  const [staffList, setStaffList] = useState<any[]>([])

  useEffect(() => {
    async function loadStaff() {
      if (!currentTenant) return
      const { data, error } = await supabase
        .from('staff')
        .select('id, name')
        .eq('tenant_id', currentTenant.id)

      if (!error && data) setStaffList(data)
    }
    if (isOpen && !isTenantLoading) {
      loadStaff()
    }
  }, [isOpen, currentTenant, isTenantLoading])

  // ---------------------------
  // CLIENT HANDLING
  // ---------------------------
  const handleClientSelect = (clientId: string) => {
    const client = (clients || []).find((c: any) => c.id === clientId)
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientName: client.name,
        clientContact: client.phone,
        clientAddress: client.address,
      }))
    }
  }

  const handlePhoneLookup = (input: string) => {
    const phone = input.replace(/\D/g, "")

    setFormData(prev => ({ ...prev, clientContact: input }))

    if (phoneDebounceRef.current)
      clearTimeout(phoneDebounceRef.current)

    phoneDebounceRef.current = setTimeout(async () => {
      if (phone.length < 4) {
        setClientMatches([])
        setShowClientDropdown(false)
        return
      }

      setIsSearchingClient(true)

      const { data, error } = await supabase
        .from("clients")
        .select("full_name, phone, address")
        .eq('tenant_id', currentTenant!.id)
        .or(`phone.ilike.%${phone}%,phone.ilike.%+91${phone}%`)

      setIsSearchingClient(false)

      if (error || !data || data.length === 0) {
        setClientMatches([])
        setShowClientDropdown(false)
        return
      }

      setClientMatches(data)
      setShowClientDropdown(true)
    }, 500)
  }

  const handleSearchClients = async (phone: string) => {
    if (!currentTenant) return
    const { data, error } = await supabase
      .from("clients")
      .select("full_name, phone, address")
      .eq('tenant_id', currentTenant.id)
      .or(`phone.ilike.%${phone}%,phone.ilike.%+91${phone}%`)

    if (!error && data) {
      setClientMatches(data)
      setShowClientDropdown(data.length > 0)
    }
  }


  // ---------------------------
  // ITEMS HANDLING
  // ---------------------------
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: '',
          quantity: 1,
          rateInr: 0,
          staffId: '',
          staffName: '',
        },
      ],
    }))
  }


  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      items: prev.items.map((item: any, i: number) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  // ---------------------------
  // SERVICE SEARCH DROPDOWN (SIMPLE)
  // ---------------------------
  // ---------------------------
  // SERVICE + INVENTORY SEARCH DROPDOWN
  // ---------------------------
  function SimpleServiceSelector({ value, onSelect }: any) {
    const [services, setServices] = useState<any[]>([])
    const [inventory, setInventory] = useState<any[]>([])
    const [query, setQuery] = useState('')
    const [showList, setShowList] = useState(false)

    useEffect(() => {
      async function loadData() {
        if (!currentTenant) return
        // Fetch Services
        const { data: serviceData } = await supabase
          .from('services')
          .select('id, name, price')
          .eq('tenant_id', currentTenant.id)

        // Fetch Inventory
        const { data: inventoryData } = await supabase
          .from('inventory')
          .select('id, name, price')
          .eq('tenant_id', currentTenant.id)

        setServices(serviceData || [])
        setInventory(inventoryData || [])
      }

      if (showList && !isTenantLoading) {
        loadData()
      }
    }, [showList, currentTenant, isTenantLoading])

    // Merge both lists & filter
    const combined = [
      ...services.map(s => ({ ...s, type: 'service' })),
      ...inventory.map(i => ({ ...i, type: 'inventory' })),
    ]

    const filtered = combined.filter(item =>
      item.name?.toLowerCase().includes(query.toLowerCase())
    )

    return (
      <div className="relative w-full">
        <Input
          placeholder="Search service or inventory..."
          value={query || value}
          onChange={e => {
            setQuery(e.target.value)
            setShowList(true)
          }}
          onFocus={() => setShowList(true)}
          className="bg-background border-border text-foreground text-sm"
        />

        {showList && filtered.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded shadow max-h-60 overflow-y-auto">
            {filtered.map(item => (
              <div
                key={item.id}
                className="p-2 hover:bg-muted cursor-pointer text-sm flex justify-between"
                onClick={() => {
                  onSelect(item)
                  setQuery(item.name)
                  setShowList(false)
                }}
              >
                <span>
                  {item.name}
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {item.type === 'service' ? 'Service' : 'Inventory'}
                  </span>
                </span>
                <span>₹{item.price}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }


  // ---------------------------
  // TOTALS
  // ---------------------------
  const subtotal = formData.items.reduce(
    (sum, item) => sum + item.quantity * item.rateInr,
    0
  )
  const total = subtotal

  // ---------------------------
  // SUBMIT
  // ---------------------------
  const handleSubmit = async () => {
    if (
      !formData.clientName ||
      formData.items.length === 0 ||
      formData.items.some(
        item =>
          !item.description ||
          !item.staffId
      )
    ) {
      alert('Each service must have staff assigned')
      return
    }




    // ✅ AUTO-SAVE CLIENT
    if (formData.clientContact && formData.clientName && currentTenant) {
      // First try to find if client exists
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("tenant_id", currentTenant.id)
        .eq("phone", formData.clientContact)
        .single();

      if (!existingClient) {
        const { error } = await supabase
          .from("clients")
          .insert({
            tenant_id: currentTenant.id,
            phone: formData.clientContact,
            full_name: formData.clientName,
          })

        if (error) {
          console.error("Client auto-save failed:", error.message || error)
        }
      }
    }

    // ✅ CREATE INVOICE
    await onSubmit(formData)

    // ✅ RESET FORM
    setFormData({
      clientName: '',
      clientContact: '',
      clientAddress: '',
      invoiceDate: today,
      items: [
        {
          description: '',
          quantity: 1,
          rateInr: 0,
          staffId: '',
          staffName: '',
        },
      ],
    })


    onClose()
  }


  // ---------------------------
  // RENDER
  // ---------------------------
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
              <DialogTitle className="text-foreground">Create Invoice</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Generate a new invoice for your clients
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Client Selection */}




              {/* Client Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Client Name *</Label>
                  <Input
                    value={formData.clientName}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        clientName: e.target.value,
                      }))
                    }
                    className="bg-input border-border text-foreground"
                  />
                </div>


                <div className="space-y-2 relative">
                  <Label className="text-foreground">Contact</Label>
                  <Input
                    value={formData.clientContact}
                    onChange={e => handlePhoneLookup(e.target.value)}
                    className="bg-input border-border text-foreground"
                  />

                  {isSearchingClient && (
                    <div className="absolute right-2 top-9 text-xs text-muted-foreground">
                      Searching...
                    </div>
                  )}

                  {showClientDropdown && clientMatches.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border rounded mt-1 shadow max-h-52 overflow-y-auto">
                      {clientMatches.map((c, i) => (
                        <div
                          key={i}
                          className="p-2 hover:bg-slate-100 cursor-pointer"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              clientName: c.full_name,
                              clientContact: c.phone || prev.clientContact,
                              clientAddress: c.address || "",
                            }))
                            setShowClientDropdown(false)
                            setClientMatches([])
                          }}
                        >
                          <div className="font-medium">{c.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {c.phone} • {c.address}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>



                <div className="space-y-2">
                  <Label className="text-foreground">Address</Label>
                  <Input
                    value={formData.clientAddress}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        clientAddress: e.target.value,
                      }))
                    }
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>

              {/* Invoice Date */}
              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-2">
                  Date
                </Label>

                <Input
                  type="date"
                  value={formData.invoiceDate || ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      invoiceDate: e.target.value || undefined,
                    }))
                  }
                  className="bg-input border-border text-foreground"
                />
              </div>


              {/* Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground">Services/Items *</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddItem}
                    className="gap-2 border-border hover:bg-muted"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {formData.items.map((item: any, index: number) => (
                    <Card key={index} className="bg-input border-border">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-12 gap-2 items-end">
                          {/* Service Selector */}
                          <div className="col-span-5">
                            <Label className="text-xs text-muted-foreground">
                              Description
                            </Label>
                            <SimpleServiceSelector
                              value={item.description}
                              onSelect={(service: any) => {
                                handleItemChange(index, 'description', service.name)
                                handleItemChange(
                                  index,
                                  'rateInr',
                                  Number(service.price)
                                )
                              }}
                            />
                          </div>

                          {/* Qty */}
                          <div className="col-span-2">
                            <Label className="text-xs text-muted-foreground">
                              Qty
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={e =>
                                handleItemChange(
                                  index,
                                  'quantity',
                                  Number(e.target.value)
                                )
                              }
                              className="bg-background border-border text-foreground text-sm"
                            />
                          </div>

                          {/* Rate */}
                          <div className="col-span-3">
                            <Label className="text-xs text-muted-foreground">
                              Rate (₹)
                            </Label>
                            <Input
                              type="number"
                              value={item.rateInr}
                              min={0}
                              onChange={e =>
                                handleItemChange(
                                  index,
                                  'rateInr',
                                  Number(e.target.value)
                                )
                              }
                              className="bg-background border-border text-foreground text-sm"
                            />
                          </div>
                          {/* Staff per item */}
                          <div className="col-span-3">
                            <Label className="text-xs text-muted-foreground">
                              Staff *
                            </Label>

                            <Select
                              value={item.staffId}
                              onValueChange={(value) => {
                                const staff = staffList.find(s => s.id === value)

                                handleItemChange(index, 'staffId', value)
                                handleItemChange(index, 'staffName', staff?.name || '')
                              }}
                            >
                              <SelectTrigger className="bg-background border-border text-foreground text-sm">
                                <SelectValue placeholder="Select staff" />
                              </SelectTrigger>

                              <SelectContent>
                                {staffList.map(staff => (
                                  <SelectItem key={staff.id} value={staff.id}>
                                    {staff.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>


                          {/* Delete */}
                          <div className="col-span-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveItem(index)}
                              className="w-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <Card className="bg-muted border-border">
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-foreground">
                      <span>Subtotal:</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>

                    <div className="flex justify-between font-bold text-foreground border-t border-border pt-2">
                      <span>Total:</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Create Invoice
                </Button>

                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </Button>
              </div>
            </div>

          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
