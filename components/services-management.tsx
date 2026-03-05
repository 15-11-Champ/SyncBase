
'use client'

import { useState, useEffect } from 'react'
import { useTenant } from '@/lib/tenant-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Trash2, Edit2 } from 'lucide-react'
import AddServiceModal from './add-service-modal'
import { formatPrice } from '@/lib/currency'

function EditServiceModal({ service, onUpdate }: any) {
  const { currentTenant } = useTenant()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(service.name)
  const [price, setPrice] = useState(service.price)
  const [duration, setDuration] = useState(service.duration ?? "")
  const [gender, setGender] = useState(service.gender)
  const [category, setCategory] = useState(service.category)

  const handleSave = async () => {
    const response = await fetch(`/api/services/${service.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": currentTenant?.id || ""
      },
      body: JSON.stringify({
        name,
        price: Number(price),
        duration: duration ? Number(duration) : null,
        gender,
        category,
      }),
    })

    const result = await response.json()
    if (result.success) {
      onUpdate(service.id, result.data)
      setOpen(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex-1 border-border text-foreground hover:bg-muted gap-2"
        onClick={() => setOpen(true)}
      >
        <Edit2 className="w-4 h-4" />
        Edit
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border-border border rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-semibold">Edit Service</h2>

            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" />
            <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration (optional)" />
            <Input value={gender} onChange={(e) => setGender(e.target.value)} placeholder="Gender (men/women)" />
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />

            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={handleSave}>Save</Button>
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


interface Service {
  id: string
  name: string
  price: number
  duration: number | null
  category: string
  gender: string    // <-- added gender
  created_at?: string
}

export default function ServicesManagement() {
  const { currentTenant, isLoading: isTenantLoading } = useTenant()
  const [searchTerm, setSearchTerm] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isTenantLoading && currentTenant) {
      fetchServices()
    }
  }, [currentTenant, isTenantLoading])

  const fetchServices = async () => {
    if (!currentTenant) return
    try {
      setLoading(true)
      const response = await fetch('/api/services', {
        headers: {
          'x-tenant-id': currentTenant.id
        }
      })
      const result = await response.json()
      if (result.data) {
        setServices(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddService = async (serviceData: { name: string; price: string; duration: string; category: string; gender: string; }) => {
    try {
      if (!currentTenant) return
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentTenant.id
        },
        body: JSON.stringify({
          name: serviceData.name,
          price: parseFloat(serviceData.price),
          duration: serviceData.duration ? parseInt(serviceData.duration) : null,
          category: serviceData.category,
          gender: serviceData.gender
        }),
      })

      const result = await response.json()
      if (result.success) {
        setServices(prev => [...prev, result.service])
      } else {
        console.error('Add service failed. Status:', response.status, 'Result:', JSON.stringify(result, null, 2))
        alert(`Failed to add service: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Fatal error adding service:', error)
      alert('A network error occurred while adding the service.')
    }
  }



  const handleDeleteService = async (id: string) => {
    if (!currentTenant) return
    console.log("DELETE clicked for", id);

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
        headers: {
          'x-tenant-id': currentTenant.id
        }
      });

      console.log("DELETE response:", response.status);

      if (response.ok) {
        setServices((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete service:", error);
    }
  };

  // ⭐ FIXED: this should be OUTSIDE delete function
  const handleUpdateService = (id: string, updatedData: Service) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updatedData } : s))
    );
  };




  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group by gender (men / women) instead of category
  const groupedServices = filteredServices.reduce((acc, service) => {
    const key = service.gender || 'men' // fallback to 'men' if missing
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  // internal keys (DB values)
  const genderKeys = ['men', 'women', 'unisex']
  const genderLabels: Record<string, string> = {
    men: "Men's Services",
    women: "Women's Services",
    unisex: "Unisex Services",
  }

  if (isTenantLoading) {
    return <div className="space-y-6 flex items-center justify-center py-12">Loading...</div>
  }

  if (!currentTenant) {
    return <div className="space-y-6 flex items-center justify-center py-12">No tenant selected</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Services</h1>
          <p className="text-muted-foreground mt-2">Manage your salon services and pricing</p>
        </div>
        <AddServiceModal onSubmit={handleAddService} />
      </div>

      {/* Search */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search services by name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Services by Gender */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      ) : (
        <>
          {genderKeys.map((gKey) => {
            const categoryServices = groupedServices[gKey] || []
            const label = genderLabels[gKey] || gKey

            return (
              <div key={gKey} className="space-y-4">
                {/* Category Header */}
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-foreground">{label}</h2>
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    {categoryServices.length} services
                  </Badge>
                </div>

                {/* Category Services Grid */}
                {categoryServices.length === 0 ? (
                  <Card className="bg-card border-border">
                    <CardContent className="pt-12 text-center">
                      <p className="text-muted-foreground">
                        No services in this category yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryServices.map(service => (
                      <Card key={service.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg text-foreground">{service.name}</CardTitle>
                          <CardDescription className="text-muted-foreground text-sm">
                            Service ID: {service.id.slice(0, 8)}...
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Service Details */}
                          <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Price</p>
                              <p className="text-xl font-bold text-primary">{formatPrice(service.price)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Duration</p>
                              <p className="text-xl font-bold text-primary">{service.duration ? `${service.duration} min` : 'N/A'}</p>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="flex gap-2">

                            {/* show gender badge if you want */}
                            <Badge className="bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20">
                              {gKey.charAt(0).toUpperCase() + gKey.slice(1)}
                            </Badge>


                            {service.category && (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                {service.category}
                              </Badge>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <EditServiceModal service={service} onUpdate={handleUpdateService} />
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
