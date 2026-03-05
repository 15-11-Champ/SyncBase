'use client'

import { useState, useEffect } from 'react'
import CreateInvoiceModal from '@/components/create-invoice-modal'
import InvoicePreview from '@/components/invoice-preview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Eye, Trash2, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/currency'
import EditInvoiceModal from '@/components/edit-invoice-modal'
import { useAuth } from '@/lib/auth/auth-context'
import { useTenant } from '@/lib/tenant-context'



const mockClients = [
  {
    id: 'CLI-001',
    name: 'Sarah Johnson',
    phone: '(555) 123-4567',
    address: '123 Main St, New York, NY 10001',
  },
  {
    id: 'CLI-002',
    name: 'Emma Davis',
    phone: '(555) 234-5678',
    address: '456 Oak Ave, New York, NY 10002',
  },
]

const businessSettings = {
  businessName: 'Syncbase',
  businessPhone: '+1 (555) 123-4567',
  businessEmail: 'contact@syncbase.com',
  businessAddress: '123 Style Street, Fashion City, FC 12345',
  businessWebsite: 'syncbase.com',
}

const normalizeInvoice = (dbInvoice: any) => ({
  id: dbInvoice.id,
  invoiceNo: dbInvoice.invoice_no,
  invoiceDate: dbInvoice.invoice_date,
  clientName: dbInvoice.client_name,
  clientContact: dbInvoice.client_contact,
  clientAddress: dbInvoice.client_address,
  subtotalInr: dbInvoice.subtotal,
  totalInr: dbInvoice.total,
  businessSettings: dbInvoice.business_settings || {},
  items: (dbInvoice.items || []).map((item: any) => ({
    description: item.description,
    quantity: item.quantity,
    rateInr: item.rate,
    amountInr: item.amount,
    staffId: item.staff_id,
    staffName: item.staff_name,
  })),
})

function getLocalDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function InvoicesPage() {
  const { user } = useAuth()
  const { currentTenant, isLoading: isTenantLoading } = useTenant()

  const [invoices, setInvoices] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const [selectedDate, setSelectedDate] = useState<string>("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [invoiceToEdit, setInvoiceToEdit] = useState<any>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [autoDownload, setAutoDownload] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<any | null>(null)

  // ⭐ On mount: set default date → today
  useEffect(() => {
    if (!isTenantLoading && currentTenant) {
      const today = new Date().toISOString().split("T")[0]
      setSelectedDate(today)
      fetchInvoices({ date: today, search: "" })
    }
  }, [currentTenant, isTenantLoading])

  // ⭐ Fetch invoices with optional date + search
  async function fetchInvoices(opts?: { date?: string; search?: string }) {
    if (!currentTenant) return

    const date = opts?.date ?? selectedDate
    const search = opts?.search ?? searchTerm

    let query = supabase
      .from("invoices")
      .select("*, staff:staff_id(name)")
      .eq('tenant_id', currentTenant.id)
      .order("created_at", { ascending: false })

    // Filter by date (single-day only)
    if (date) {
      query = query.eq("invoice_date", date)
    }

    // Search
    if (search && search.trim() !== "") {
      query = query.or(
        `client_name.ilike.%${search}%,invoice_no.ilike.%${search}%`
      )
    }

    const { data, error } = await query
    if (!error) {
      setInvoices(data || [])
    }
  }

  // ⭐ When search term changes, refetch
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchInvoices({ date: selectedDate, search: searchTerm })
    }, 200)

    return () => clearTimeout(timeout)
  }, [searchTerm])

  // ⭐ Today button handler
  const resetToToday = () => {
    const today = new Date().toISOString().split("T")[0]
    setSelectedDate(today)
    setSearchTerm("")
    fetchInvoices({ date: today, search: "" })
  }

  // CREATE
  const handleCreateInvoice = async (data: any) => {
    const now = new Date()
    const invoiceNo = `INV-${Date.now()}`
    const invoiceDate = data.invoiceDate || getLocalDate()


    const items = data.items.map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rateInr,
      amount: item.quantity * item.rateInr,
      staff_id: item.staffId,
      staff_name: item.staffName,
    }))

    if (!currentTenant) return


    const subtotal = items.reduce((sum: number, x: any) => sum + x.amount, 0)
    const total = subtotal

    const payload = {
      tenant_id: currentTenant.id,
      invoice_no: invoiceNo,
      invoice_date: invoiceDate,
      client_name: data.clientName,
      client_contact: data.clientContact,
      client_address: data.clientAddress,
      items,
      subtotal,
      total,
      business_settings: businessSettings,
    }

    const { data: inserted } = await supabase
      .from("invoices")
      .insert([payload])
      .select("id")
      .single()

    if (!inserted) {
      console.error("Failed to insert invoice")
      return
    }

    const { data: fullInvoice } = await supabase
      .from("invoices")
      .select("*, staff:staff_id(name)")
      .eq("id", inserted.id)
      .eq("tenant_id", currentTenant.id)
      .single()

    if (fullInvoice) {
      setInvoices(prev => [fullInvoice, ...prev])
      setSelectedInvoice(normalizeInvoice(fullInvoice))
      setIsPreviewOpen(true)
    }
  }

  const openPreview = (invoice: any, shouldDownload = false) => {
    setSelectedInvoice(normalizeInvoice(invoice))
    setAutoDownload(shouldDownload)
    setIsPreviewOpen(true)
  }

  const openEditModal = async (invoice: any) => {
    if (!currentTenant) return
    const { data } = await supabase
      .from("invoices")
      .select("*, staff:staff_id(name)")
      .eq("id", invoice.id)
      .eq("tenant_id", currentTenant.id)
      .single()

    setInvoiceToEdit(data)
    setIsEditOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete || !currentTenant) return

    await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceToDelete.id)
      .eq("tenant_id", currentTenant.id)

    setInvoices(prev => prev.filter(inv => inv.id !== invoiceToDelete.id))
    setDeleteOpen(false)
    setInvoiceToDelete(null)
  }

  if (isTenantLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>
  }

  if (!currentTenant) {
    return <div className="flex-1 flex items-center justify-center">No tenant selected</div>
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Invoices</h2>
            <p className="text-sm text-muted-foreground">
              {invoices.length} invoices found
            </p>
          </div>

          <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-primary">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </div>

        {/* ⭐ SINGLE DATE SELECTOR */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Select Date</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </label>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  fetchInvoices({ date: e.target.value, search: searchTerm })
                }}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* ⭐ SEARCH INPUT */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by client or invoice number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* ⭐ INVOICE LIST */}
        {invoices.length > 0 ? (
          <div className="space-y-4">
            {invoices.map(inv => (
              <Card key={inv.id}>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Invoice No</p>
                      <p className="font-semibold">{inv.invoice_no}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Client</p>
                      <p className="font-semibold">{inv.client_name}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-semibold">{inv.invoice_date}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-semibold">{formatPrice(inv.total)}</p>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => openPreview(inv, false)}>
                        <Eye className="w-4 h-4" /> View
                      </Button>

                      {user?.role !== 'manager' && (
                        <Button size="sm" variant="secondary" onClick={() => openEditModal(inv)}>
                          Edit
                        </Button>
                      )}

                      <Button size="sm" className="bg-primary text-white" onClick={() => openPreview(inv, true)}>
                        Export PDF
                      </Button>

                      {/* ⭐ WhatsApp Button */}
                      {inv.client_contact && (
                        <a
                          href={`https://wa.me/${inv.client_contact}?text=${encodeURIComponent(
                            `Hello ${inv.client_name}, here is your invoice ${inv.invoice_no}.\nThank you for visiting Syncbase!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-green-500 hover:bg-green-600 rounded-md flex items-center justify-center"
                          title="Send WhatsApp Message"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 32 32"
                            fill="white"
                          >
                            <path d="M16.04 2.003a13.96 13.96 0 00-11.99 21.36L2 30l6.78-2.02A13.94 13.94 0 0016 30c7.73 0 14-6.27 14-14s-6.27-14-14-14z"></path>
                            <path d="M22.18 18.3c-.33-.17-1.96-.97-2.26-1.08-.3-.11-.52-.17-.74.17-.22.33-.85 1.08-1.05 1.3-.19.22-.37.25-.7.08-.33-.17-1.4-.52-2.67-1.67-.99-.88-1.66-1.96-1.85-2.29-.19-.33-.02-.51.14-.67.14-.14.33-.37.49-.55.16-.19.22-.31.33-.52.11-.22.05-.41-.03-.58-.08-.17-.74-1.78-1.02-2.44-.27-.66-.55-.56-.76-.57l-.65-.01c-.22 0-.58.08-.89.41-.3.33-1.17 1.14-1.17 2.78s1.2 3.22 1.37 3.44c.17.22 2.36 3.61 5.72 5.06 3.36 1.45 3.36.97 3.96.91.6-.06 1.96-.8 2.24-1.58.27-.78.27-1.45.19-1.58-.08-.14-.3-.22-.63-.39z"></path>
                          </svg>
                        </a>
                      )}

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setInvoiceToDelete(inv)
                          setDeleteOpen(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">
            No invoices found for this date.
          </p>
        )}
      </div>

      {/* CREATE MODAL */}
      <CreateInvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateInvoice}
        businessSettings={businessSettings}
        clients={mockClients}
      />

      {/* PREVIEW MODAL */}
      {isPreviewOpen && selectedInvoice && (
        <InvoicePreview
          invoice={selectedInvoice}
          autoDownload={autoDownload}
          onClose={() => {
            setIsPreviewOpen(false)
            setAutoDownload(false)
          }}
        />
      )}

      {/* EDIT MODAL */}
      {isEditOpen && invoiceToEdit && (
        <EditInvoiceModal
          isOpen={isEditOpen}
          invoice={invoiceToEdit}
          onClose={() => setIsEditOpen(false)}
          onUpdated={(updated: any) => {
            setInvoices(prev =>
              prev.map(inv => inv.id === updated.id ? updated : inv)
            )
          }}
        />
      )}

      {/* DELETE CONFIRM */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Confirm Delete</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this invoice?
            </p>
            <div className="text-sm mb-4">
              <p><strong>Invoice:</strong> {invoiceToDelete?.invoice_no}</p>
              <p><strong>Client:</strong> {invoiceToDelete?.client_name}</p>
              <p><strong>Amount:</strong> {formatPrice(invoiceToDelete?.total || 0)}</p>
            </div>
            <p className="text-xs text-red-500 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setDeleteOpen(false)
                  setInvoiceToDelete(null)
                }}
              >
                No
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleConfirmDelete}
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
