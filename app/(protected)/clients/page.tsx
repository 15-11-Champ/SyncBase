'use client';

import { useState, useEffect } from 'react';
import ClientProfileCard from '@/components/client-profile-card';
import ClientDetailsModal from '@/components/client-details-modal';

import ExportClientsButton from '@/components/export-clients-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useTenant } from '@/lib/tenant-context';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

interface ClientProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export default function ClientsPage() {
  const { currentTenant, isLoading: isTenantLoading } = useTenant()
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Editing state
  const [editOpen, setEditOpen] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const loadClients = async () => {
    if (!currentTenant) return
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', currentTenant.id)
      .order('created_at', { ascending: false });

    setClients(data || []);
  };

  useEffect(() => {
    if (!isTenantLoading) {
      loadClients();
    }
  }, [currentTenant, isTenantLoading]);

  const filteredClients = clients.filter((client) =>
    client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  const openModal = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsModalOpen(true);
  };

  // -----------------------
  // EDIT FUNCTIONS
  // -----------------------
  const handleEdit = (client: any) => {
    setEditClient({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone
    });
    setEditOpen(true);
  };

  const saveEditedClient = async () => {
    if (!editClient || !currentTenant) return;

    setLoading(true);

    const { error } = await supabase
      .from("clients")
      .update({
        full_name: editClient.name,
        email: editClient.email,
        phone: editClient.phone
      })
      .eq("id", editClient.id)
      .eq("tenant_id", currentTenant.id);

    setLoading(false);

    if (!error) {
      setEditOpen(false);
      loadClients();
    }
  };

  // -----------------------
  // DELETE FUNCTIONS
  // -----------------------
  const handleDelete = (clientId: string) => {
    setDeleteClientId(clientId);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteClientId || !currentTenant) return;

    setLoading(true);

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", deleteClientId)
      .eq("tenant_id", currentTenant.id);

    setLoading(false);

    if (!error) {
      setDeleteOpen(false);
      loadClients();
    }
  };

  if (isTenantLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>
  }

  if (!currentTenant) {
    return <div className="flex-1 flex items-center justify-center">No tenant selected</div>
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Clients</h2>
            <p className="text-sm text-muted-foreground">{clients.length} registered clients</p>
          </div>

          <div className="flex items-center gap-3">
            <ExportClientsButton />
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientProfileCard
              key={client.id}
              client={{
                id: client.id,
                name: client.full_name,
                email: client.email,
                phone: client.phone,
                address: client.address || '',
                notes: client.notes || '',
              }}
              onClick={() => openModal(client.id)}
              onEdit={() => handleEdit({
                id: client.id,
                name: client.full_name,
                email: client.email,
                phone: client.phone
              })}
              onDelete={() => handleDelete(client.id)}
            />
          ))}
        </div>

        {/* Modal */}
        <ClientDetailsModal
          isOpen={isModalOpen}
          clientId={selectedClientId}
          onClose={() => setIsModalOpen(false)}
        />

        {/* Edit Client Modal */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
            </DialogHeader>

            {editClient && (
              <div className="space-y-4">
                <Input value={editClient.name} onChange={(e) => setEditClient((prev: any) => ({ ...prev, name: e.target.value }))} />
                <Input value={editClient.email} onChange={(e) => setEditClient((prev: any) => ({ ...prev, email: e.target.value }))} />
                <Input value={editClient.phone} onChange={(e) => setEditClient((prev: any) => ({ ...prev, phone: e.target.value }))} />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={saveEditedClient} disabled={loading}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Client?</DialogTitle>
            </DialogHeader>

            <p className="text-muted-foreground">This action cannot be undone.</p>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={loading}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
