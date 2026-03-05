import fs from 'fs';
import path from 'path';
import csv from 'csv-parse';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function seedServices() {
  try {
    const csvPath = path.join(process.cwd(), 'user_read_only_context/text_attachments/Mirror_and_Mane_Services-YR8sw.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    const services = [];
    const lines = csvContent.split('\n');

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line (handle quoted fields)
      const fields = [];
      let currentField = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(currentField);
          currentField = '';
        } else {
          currentField += char;
        }
      }
      fields.push(currentField);

      const category = fields[0]?.trim();
      const serviceName = fields[1]?.trim();
      let price = fields[2]?.trim();

      // Parse price - extract first number if it contains ranges
      if (price && price !== 'N/A') {
        const match = price.match(/₹?(\d+)/);
        price = match ? parseFloat(match[1]) : null;
      } else {
        price = null;
      }

      if (category && serviceName) {
        services.push({
          name: serviceName,
          price: price,
          duration: null,
          category: category
        });
      }
    }

    console.log(`[v0] Seeding ${services.length} services...`);

    // Insert services
    const { data, error } = await supabase
      .from('services')
      .insert(services);

    if (error) {
      console.error('[v0] Error seeding services:', error);
    } else {
      console.log(`[v0] Successfully seeded ${services.length} services`);
    }
  } catch (error) {
    console.error('[v0] Script error:', error);
  }
}

seedServices();
