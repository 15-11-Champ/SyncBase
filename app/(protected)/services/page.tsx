import ServicesManagement from '@/components/services-management'
import InventoryManagement from '@/components/inventory-management'

export default function ServicesPage() {
  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Services section */}
      <ServicesManagement />

      {/* Divider + Inventory section */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold text-sidebar-primary mb-2">
          Inventory
        </h2>
        <hr className="border-gray-200 dark:border-gray-700 mb-6" />

        <InventoryManagement />
      </div>
    </div>
  )
}

