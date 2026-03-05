'use client';

import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";

export default function ExportClientsButton() {

  const exportToExcel = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Export error:", error);
      return;
    }

    if (!data || data.length === 0) {
      alert("No clients to export");
      return;
    }

    // 🟢 FIXED — Now includes name + email + proper labels
    const formatted = data.map((c) => ({
      ID: c.id,
      Name: c.full_name,
      Email: c.email,
      Phone: c.phone,
      Address: c.address || "",
      Notes: c.notes || "",
      Created_At: c.created_at,
      Updated_At: c.updated_at,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");

    XLSX.writeFile(workbook, "clients_export.xlsx");
  };

  return (
    <Button
      onClick={exportToExcel}
      className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
    >
      <FileSpreadsheet className="w-4 h-4" />
      Export Clients
    </Button>
  );
}
