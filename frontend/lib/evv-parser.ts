/**
 * EVV Parser Utilities
 * Parses bank statements, extracts transactions, calculates snapshots and EVV
 */

export interface Transaction {
  date: Date;
  balance: number;
  debit?: number;
  credit?: number;
  narration?: string;
  channel?: string;
  referenceNumber?: string;
  raw: string;
}

export interface Snapshot {
  date: Date;
  balance: number;
}

export interface MonthlyMetric {
  label: string;
  points: number;
  avg: number;
  min: number;
  max: number;
}

export interface EVVResult {
  overallEVV: number;
  snapshots: Snapshot[];
  transactions: Transaction[];
  monthlyMetrics: MonthlyMetric[];
  period: {
    start: Date;
    end: Date;
  };
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

/**
 * Parse a date token from various formats
 * Supports: DD/MM/YYYY, DD-MM-YYYY, DD-MMM-YYYY, DD MMM YYYY, DD-MMM-YY
 */
function parseDateToken(tok: string): Date | null {
  // DD/MM/YYYY or DD-MM-YYYY
  let m = tok.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const year = y.length === 2 ? "20" + y : y;
    return new Date(+year, +mo - 1, +d);
  }

  // DD-MMM-YYYY or DD MMM YYYY or DD-MMM-YY
  m = tok.match(/^(\d{1,2})[\-\s]([A-Za-z]{3,})[\-\s](\d{2,4})$/);
  if (m) {
    const [, d, mon, y] = m;
    const mi = MONTHS[mon.slice(0, 3).toLowerCase()];
    if (mi === undefined) return null;
    const year = y.length === 2 ? "20" + y : y;
    return new Date(+year, mi, +d);
  }

  return null;
}

/**
 * Extract PDF text using pdf.js
 */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) {
    throw new Error("PDF.js not loaded. Please wait and try again.");
  }

  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  let fullText = "";

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    // Group text items by approximate line (y position) so columns stay on one row
    const lines: Record<number, string[]> = {};
    content.items.forEach((item: any) => {
      const y = Math.round(item.transform[5]);
      if (!lines[y]) lines[y] = [];
      lines[y].push(item.str);
    });

    const sortedY = Object.keys(lines)
      .map(Number)
      .sort((a, b) => b - a);
    sortedY.forEach((y) => {
      fullText += lines[y].join(" ") + "\n";
    });
  }

  return fullText;
}

/**
 * Parse transactions from bank statement text
 * Extracts date, balance, and optionally amounts from each line
 */
export function parseTransactions(text: string): { transactions: Transaction[]; skipped: number } {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const dateAtStart = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}[\-\s][A-Za-z]{3,}[\-\s]\d{2,4})/;
  const numberToken = /[\d,]+\.\d{1,2}/g;

  const txs: Transaction[] = [];
  let skipped = 0;

  lines.forEach((line) => {
    const dm = line.match(dateAtStart);
    if (!dm) return;

    const date = parseDateToken(dm[1]);
    if (!date || isNaN(date.getTime())) return;

    const rest = line.slice(dm[1].length);
    const numMatches = rest.match(numberToken);
    if (!numMatches || numMatches.length === 0) {
      skipped++;
      return;
    }

    const balance = parseFloat(numMatches[numMatches.length - 1].replace(/,/g, ""));
    if (isNaN(balance)) {
      skipped++;
      return;
    }

    // Extract debit/credit if available (usually the two largest numbers before balance)
    let debit = 0, credit = 0;
    if (numMatches.length >= 2) {
      const amounts = numMatches.slice(0, -1).map(n => parseFloat(n.replace(/,/g, "")));
      if (amounts.length >= 1) {
        credit = amounts[amounts.length - 1];
      }
    }

    txs.push({
      date,
      balance,
      debit,
      credit,
      raw: line
    });
  });

  txs.sort((a, b) => a.date.getTime() - b.date.getTime());

  return { transactions: txs, skipped };
}

/**
 * Build snapshots at fixed intervals
 */
export function buildSnapshots(
  transactions: Transaction[],
  intervalDays: number
): Snapshot[] {
  if (transactions.length === 0) return [];

  const snapshots: Snapshot[] = [];
  const start = new Date(transactions[0].date);
  const end = new Date(transactions[transactions.length - 1].date);

  let cursor = new Date(start);
  let txIdx = 0;
  let lastKnownBalance: number | null = null;

  while (cursor <= end) {
    while (txIdx < transactions.length && transactions[txIdx].date <= cursor) {
      lastKnownBalance = transactions[txIdx].balance;
      txIdx++;
    }

    if (lastKnownBalance !== null) {
      snapshots.push({
        date: new Date(cursor),
        balance: lastKnownBalance
      });
    }

    cursor.setDate(cursor.getDate() + intervalDays);
  }

  return snapshots;
}

/**
 * Get month key (YYYY-MM)
 */
function monthKey(d: Date): string {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

/**
 * Format date as label
 */
function monthLabel(d: Date): string {
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

/**
 * Aggregate snapshots by month
 */
export function aggregateByMonth(snapshots: Snapshot[]): MonthlyMetric[] {
  const groups: Record<string, { label: string; values: number[]; sortKey: string }> = {};

  snapshots.forEach((s) => {
    const key = monthKey(s.date);
    if (!groups[key]) {
      groups[key] = { label: monthLabel(s.date), values: [], sortKey: key };
    }
    groups[key].values.push(s.balance);
  });

  return Object.values(groups)
    .sort((a, b) => (a.sortKey > b.sortKey ? 1 : -1))
    .map((g) => ({
      label: g.label,
      points: g.values.length,
      avg: g.values.reduce((a, b) => a + b, 0) / g.values.length,
      min: Math.min(...g.values),
      max: Math.max(...g.values),
    }));
}

/**
 * Calculate EVV from transactions and interval
 */
export function calculateEVV(
  transactions: Transaction[],
  intervalDays: number
): EVVResult {
  if (transactions.length === 0) {
    return {
      overallEVV: 0,
      snapshots: [],
      transactions: [],
      monthlyMetrics: [],
      period: {
        start: new Date(),
        end: new Date(),
      },
    };
  }

  const snapshots = buildSnapshots(transactions, intervalDays);
  const monthlyMetrics = aggregateByMonth(snapshots);

  const overallEVV =
    snapshots.length > 0
      ? snapshots.reduce((a, b) => a + b.balance, 0) / snapshots.length
      : 0;

  return {
    overallEVV,
    snapshots,
    transactions,
    monthlyMetrics,
    period: {
      start: transactions[0].date,
      end: transactions[transactions.length - 1].date,
    },
  };
}

/**
 * Generate demo data for preview
 */
export function generateDemoData(): Transaction[] {
  const start = new Date(2026, 0, 1);
  const end = new Date(2026, 6, 1);
  const txs: Transaction[] = [];
  let balance = 48000;
  let d = new Date(start);
  let dayCount = 0;

  while (d <= end) {
    const txToday = 3 + (dayCount % 3 === 0 ? 1 : 0);
    for (let i = 0; i < txToday; i++) {
      const swing = Math.sin(dayCount * 0.37 + i) * 6000 + (Math.random() - 0.5) * 4000;
      balance = Math.max(4500, balance + swing * 0.15);

      const txDate = new Date(d);
      txDate.setHours(9 + i * 3);

      txs.push({
        date: txDate,
        balance: Math.round(balance * 100) / 100,
        raw: `${txDate.toLocaleDateString("en-GB")}  Transaction  ${balance.toFixed(2)}`
      });
    }
    d.setDate(d.getDate() + 1);
    dayCount++;
  }

  return txs.slice(0, 700);
}

/**
 * Format currency
 */
export function formatCurrency(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/**
 * Format date
 */
export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
