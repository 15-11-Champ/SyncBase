'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'

interface ServiceFormData {
  name: string
  price: string
  duration: string
  category: string    // e.g., Haircut, Facial, Spa
  gender: string      // 'men' | 'women'
}

interface AddServiceModalProps {
  onSubmit: (serviceData: ServiceFormData) => void
}

export default function AddServiceModal({ onSubmit }: AddServiceModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    price: '',
    duration: '',
    category: '',
    gender: ''
  })

  const [errors, setErrors] = useState<Partial<ServiceFormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<ServiceFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required'
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required'
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      newErrors.price = 'Please enter a valid price'
    }

    if (
      formData.duration.trim() &&
      (isNaN(parseInt(formData.duration)) || parseInt(formData.duration) <= 0)
    ) {
      newErrors.duration = 'Please enter a valid duration in minutes'
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required'
    }

    if (!formData.gender.trim()) {
      newErrors.gender = 'Select gender'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof ServiceFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }))
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: undefined }))
    }
  }

  const handleGenderChange = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value }))
    if (errors.gender) {
      setErrors(prev => ({ ...prev, gender: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
      setFormData({ name: '', price: '', duration: '', category: '', gender: '' })
      setErrors({})
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="w-4 h-4" />
          Add Service
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New Service</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new service with name, price, duration, category, and gender
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Category *</label>
            <Select value={formData.category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="Packages">Packages</SelectItem>
                <SelectItem value="Hair">Hair</SelectItem>
                <SelectItem value="Skin">Skin</SelectItem>
                <SelectItem value="Waxing">Waxing</SelectItem>
                <SelectItem value="Spa">Spa</SelectItem>
                <SelectItem value="Relaxing services">Relaxing services</SelectItem>
                <SelectItem value="Choose any 2">Choose any 2</SelectItem>
                <SelectItem value="Choose any 3">Choose any 3</SelectItem>
                <SelectItem value="Choose any 4">Choose any 4</SelectItem>
                <SelectItem value="Choose any 5">Choose any 5</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-red-500 text-xs mt-1">{errors.category}</p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Gender *</label>
            <Select value={formData.gender} onValueChange={handleGenderChange}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
                <SelectItem value="unisex">Unisex</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
            )}
          </div>

          {/* Service Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Service Name *</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Haircut, Color Treatment"
              className={`bg-input border-border text-foreground ${
                errors.name ? 'border-red-500' : ''
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Price (₹) *</label>
            <Input
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              placeholder="250.00"
              className={`bg-input border-border text-foreground ${
                errors.price ? 'border-red-500' : ''
              }`}
            />
            {errors.price && (
              <p className="text-red-500 text-xs mt-1">{errors.price}</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Duration (minutes)</label>
            <Input
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleChange}
              placeholder="30"
              className={`bg-input border-border text-foreground ${
                errors.duration ? 'border-red-500' : ''
              }`}
            />
            {errors.duration && (
              <p className="text-red-500 text-xs mt-1">{errors.duration}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Add Service
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  )
}
