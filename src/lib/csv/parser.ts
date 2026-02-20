import Papa from "papaparse";

export interface ParseResult {
  data: Record<string, string>[];
  headers: string[];
  rowCount: number;
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const headers = results.meta.fields || [];
        const data = results.data as Record<string, string>[];
        resolve({
          data,
          headers,
          rowCount: data.length,
        });
      },
      error: (error) => {
        reject(new Error(`CSV parse error: ${error.message}`));
      },
    });
  });
}

// Auto-detect which CSV column maps to which contact field
const FIELD_PATTERNS: Record<string, RegExp[]> = {
  first_name: [/first.?name/i, /fname/i, /^first$/i, /given.?name/i],
  last_name: [/last.?name/i, /lname/i, /^last$/i, /surname/i, /family.?name/i],
  address_line1: [/address.?(1|line.?1)?$/i, /street/i, /^address$/i, /mailing.?address/i],
  address_line2: [/address.?(2|line.?2)/i, /apt/i, /suite/i, /unit/i],
  city: [/^city$/i, /^town$/i],
  state: [/^state$/i, /^st$/i, /province/i, /state.?province/i, /^region$/i],
  zip: [/^zip$/i, /zip.?code/i, /postal/i, /^zp$/i, /postal.?code/i],
  email: [/e.?mail/i, /^email$/i],
  phone: [/phone/i, /mobile/i, /cell/i, /tel/i],
};

export function autoMapColumns(
  headers: string[]
): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const header of headers) {
      if (mapping[field]) break;
      for (const pattern of patterns) {
        if (pattern.test(header)) {
          mapping[field] = header;
          break;
        }
      }
    }
  }

  return mapping;
}

// Transform CSV rows using the column mapping
export function applyColumnMapping(
  data: Record<string, string>[],
  mapping: Record<string, string>
): Record<string, string>[] {
  return data.map((row) => {
    const mapped: Record<string, string> = {};
    for (const [contactField, csvColumn] of Object.entries(mapping)) {
      if (csvColumn && row[csvColumn] !== undefined) {
        mapped[contactField] = row[csvColumn];
      }
    }
    return mapped;
  });
}
