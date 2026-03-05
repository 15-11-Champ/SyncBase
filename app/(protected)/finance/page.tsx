'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTenant } from '@/lib/tenant-context';

import { SummaryCard } from '@/components/finance/summary-card';
import { EntryForm } from '@/components/finance/entry-form';
import { EntryList } from '@/components/finance/entry-list';
import { EditEntryModal } from '@/components/finance/EditEntryModal';
import { DeleteConfirm } from '@/components/finance/DeleteConfirm';
import { Calendar } from "lucide-react";




export default function FinancePage() {
  const { currentTenant, isLoading: isTenantLoading } = useTenant()
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingEntry, setEditingEntry] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [deletingEntry, setDeletingEntry] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [totalSales, setTotalSales] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const netProfit = totalSales - totalExpenses;

  // ⭐ SEARCH STATE
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");


  // ⭐ NEW — Date range states
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (!isTenantLoading && currentTenant) {
      fetchFinance();
      fetchSales();
    }
  }, [currentTenant, isTenantLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchFinance(debouncedSearch);
  }, [debouncedSearch]);



  // -----------------------------
  // FETCH ALL FINANCE
  // -----------------------------
  const fetchFinance = async (search = "") => {
    if (!currentTenant) return
    let query = supabase
      .from("finance")
      .select("*")
      .eq('tenant_id', currentTenant.id)
      .order("created_at", { ascending: false });

    if (search.trim() !== "") {
      query = query.ilike("expense_name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) console.error("Finance Fetch Error:", error);

    setEntries(data || []);

    const expensesSum = (data || []).reduce(
      (a, e) => a + Number(e.expenses || 0),
      0
    );

    setTotalExpenses(expensesSum);
    setLoading(false);
  };


  // -----------------------------
  // FETCH ALL SALES
  // -----------------------------
  const fetchSales = async () => {
    if (!currentTenant) return
    const { data, error } = await supabase
      .from("invoices")
      .select("total")
      .eq('tenant_id', currentTenant.id);

    if (error) console.error("Invoice Fetch Error:", error);

    const salesSum = (data || []).reduce(
      (a, i) => a + Number(i.total || 0),
      0
    );

    setTotalSales(salesSum);
  };

  // -----------------------------
  // ⭐ NEW: FETCH FINANCE by RANGE
  // -----------------------------
  const fetchFinanceRange = async () => {
    if (!fromDate || !toDate) {
      alert("Please select both dates");
      return;
    }

    const { data, error } = await supabase
      .from("finance")
      .select("*")
      .eq('tenant_id', currentTenant!.id)
      .gte("date", fromDate)
      .lte("date", toDate)
      .order("date", { ascending: false });

    if (error) console.error("Range Finance Error:", error);

    setEntries(data || []);

    const expensesSum = (data || []).reduce(
      (a, e) => a + Number(e.expenses || 0),
      0
    );
    setTotalExpenses(expensesSum);

    // ⭐ Also filter sales
    const sales = await supabase
      .from("invoices")
      .select("total, invoice_date")
      .eq('tenant_id', currentTenant!.id)
      .gte("invoice_date", fromDate)
      .lte("invoice_date", toDate);

    const salesSum = (sales.data || []).reduce(
      (a, s) => a + Number(s.total || 0),
      0
    );
    setTotalSales(salesSum);
  };

  // ⭐ NEW utility — dd-mm-yyyy → yyyy-mm-dd
  const convert = (d: string) => {
    const [dd, mm, yyyy] = d.split("-");
    return `${yyyy}-${mm}-${dd}`;
  };

  // -----------------------------
  // INSERT ENTRY
  // -----------------------------
  const addEntry = async (date: string, expenses: any, expenseName: string) => {
    try {
      if (!currentTenant) return { success: false, message: "No tenant selected" };
      const formattedDate = date; // already YYYY-MM-DD from your picker

      const { error } = await supabase.from("finance").insert({
        tenant_id: currentTenant.id,
        date: formattedDate,
        expenses: Number(expenses),
        expense_name: expenseName,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Insert Error:", error);
        return { success: false, message: "Failed to save entry." };
      }

      await fetchFinance();
      return { success: true };
    } catch (err) {
      console.error("Unexpected Insert Error:", err);
      return { success: false, message: "Unexpected error." };
    }
  };

  // -----------------------------
  // EDIT ENTRY
  // -----------------------------
  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setEditModalOpen(true);
  };

  const saveEditedEntry = async (updated: any) => {
    if (!currentTenant) return;

    const { error } = await supabase
      .from("finance")
      .update({
        date: updated.date,
        expenses: updated.expenses,
        expense_name: updated.expense_name,
      })
      .eq("id", updated.id)
      .eq('tenant_id', currentTenant.id);

    if (!error) {
      fetchFinance();
      setEditModalOpen(false);
    }
  };

  // -----------------------------
  // DELETE ENTRY
  // -----------------------------
  const handleDelete = (entry: any) => {
    setDeletingEntry(entry);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingEntry || !currentTenant) return;

    const { error } = await supabase
      .from("finance")
      .delete()
      .eq("id", (deletingEntry as any).id)
      .eq('tenant_id', currentTenant.id);

    if (!error) {
      fetchFinance();
      setDeleteModalOpen(false);
    }
  };

  if (isTenantLoading || loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );

  if (!currentTenant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">No tenant selected</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-10 space-y-12 max-w-7xl mx-auto">

      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold">Financial Health Management</h1>
      </div>

      {/* ⭐ DATE RANGE FILTER HERE ⭐ */}
      <div className="bg-white rounded-xl shadow-md p-8">
        <h2 className="text-xl font-bold mb-4">Filter by Date Range</h2>

        <div className="grid gap-6 md:grid-cols-3">

          {/* FROM DATE */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:border-black focus:outline-none transition-colors"
              required
            />
          </div>

          {/* TO DATE */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:border-black focus:outline-none transition-colors"
              required
            />
          </div>

          {/* GENERATE BUTTON */}
          <div className="flex items-end">
            <button
              onClick={fetchFinanceRange}
              className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg text-white bg-black hover:bg-gray-800 shadow-lg transition-all hover:shadow-xl"
            >
              Generate
            </button>
          </div>

        </div>
      </div>




      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard title="Total Sales" amount={totalSales} type="profit" />
        <SummaryCard title="Total Expenses" amount={totalExpenses} type="expense" />
        <SummaryCard title="Net Profit" amount={netProfit} type="net" />
      </div>

      {/* ADD ENTRY */}
      <div className="bg-white rounded-xl shadow-md p-8">
        <EntryForm onSubmit={addEntry} />
      </div>

      {/* EXPENSES HISTORY */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Search Expenses</h2> <br></br>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search expenses by name..."
          className="w-full rounded-lg border-3 border-white-200 px-4 py-3 text-sm
                          focus:border-black focus:outline-none transition-colors"
        />
      </div>

      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Expenses History</h2>
          <span className="text-sm text-gray-500">{entries.length} Entries</span>
        </div>

        <EntryList
          entries={entries}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* MODALS */}
      <EditEntryModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        entry={editingEntry}
        onSave={saveEditedEntry}
      />

      <DeleteConfirm
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />

    </div>
  );
}
