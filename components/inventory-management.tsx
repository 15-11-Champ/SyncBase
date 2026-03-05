'use client'

import React, { useEffect, useState } from 'react'
import { useTenant } from '@/lib/tenant-context'

import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type InventoryRow = {
  id: string
  name: string
  description?: string | null
  quantity: number
  price?: number | null
  category?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export default function InventoryManagement() {
  const { currentTenant, isLoading: isTenantLoading } = useTenant()
  const [items, setItems] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)

  // Form state for Add / Edit
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryRow | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState<number>(0)
  const [price, setPrice] = useState<number | ''>('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    if (!isTenantLoading && currentTenant) {
      fetchInventory()
    }
  }, [currentTenant, isTenantLoading])

  async function fetchInventory() {
    if (!currentTenant) return
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('tenant_id', currentTenant.id)
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
      setItems([])
    } else {
      setItems(data ?? [])
    }
    setLoading(false)
  }

  function openAddDialog() {
    resetForm()
    setIsEditMode(false)
    setEditingItem(null)
    setDialogOpen(true)
  }

  function openEditDialog(item: InventoryRow) {
    setIsEditMode(true)
    setEditingItem(item)
    setName(item.name)
    setDescription(item.description ?? '')
    setQuantity(item.quantity ?? 0)
    setPrice(item.price ?? '')
    setCategory(item.category ?? '')
    setDialogOpen(true)
  }

  function resetForm() {
    setName('')
    setDescription('')
    setQuantity(0)
    setPrice('')
    setCategory('')
  }

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    try {
      if (isEditMode && editingItem) {
        const updates = {
          name: name.trim(),
          description: description || null,
          quantity: Number(quantity || 0),
          price: price === '' ? null : Number(price),
          category: category || null,
          updated_at: new Date().toISOString(),
        }

        const { error } = await supabase
          .from('inventory')
          .update(updates)
          .eq('id', editingItem.id)
          .eq('tenant_id', currentTenant!.id)

        if (error) throw error
      } else {
        const newItem = {
          tenant_id: currentTenant!.id,
          name: name.trim(),
          description: description || null,
          quantity: Number(quantity || 0),
          price: price === '' ? null : Number(price),
          category: category || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { error } = await supabase.from('inventory').insert([newItem])
        if (error) throw error
      }

      await fetchInventory()

      resetForm()
      setIsEditMode(false)
      setEditingItem(null)
      setDialogOpen(false)

    } catch (err: any) {
      setError(err.message || 'Failed to save item')
    }
  }

  async function handleDelete(itemId: string) {
    if (!confirm('Delete this inventory item?') || !currentTenant) return
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', itemId)
      .eq('tenant_id', currentTenant.id)
    if (error) {
      alert('Failed to delete: ' + error.message)
    } else {
      fetchInventory()
    }
  }

  if (isTenantLoading) {
    return <div className="text-sm text-muted-foreground py-12 text-center">Loading inventory...</div>
  }

  if (!currentTenant) {
    return <div className="text-sm text-muted-foreground py-12 text-center">No tenant selected</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">Manage your inventory items</div>

        <Button onClick={openAddDialog} variant="default" size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Inventory
        </Button>
      </div>

      {/* Shared Add/Edit Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Inventory' : 'Add Inventory'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update inventory details.' : 'Create a new inventory item.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" min={0} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" step="0.01" value={price === '' ? '' : price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}

            <div className="flex items-center gap-2 justify-end">
              <Button type="submit">{isEditMode ? 'Save changes' : 'Create item'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Items grid */}
      {loading ? (
        <div>Loading inventory...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No inventory items yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it) => (
            <Card key={it.id} className="shadow-sm">
              <CardContent>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{it.name}</h3>
                    {it.category && <Badge className="mt-2">{it.category}</Badge>}
                    {it.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{it.description}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Qty</div>
                    <div className="font-medium">{it.quantity}</div>

                    {it.price != null && (
                      <>
                        <div className="text-sm text-muted-foreground mt-2">Price</div>
                        <div className="font-medium">₹{Number(it.price).toFixed(2)}</div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(it)}
                >
                  <Edit2 className="mr-2 h-4 w-4" /> Edit
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(it.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
