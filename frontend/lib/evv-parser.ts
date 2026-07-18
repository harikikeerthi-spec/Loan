/**
 * ─────────────────────────────────────────────────────────────────────────────
 * EVV Analysis Engine  –  VidyaLoans Staff Portal
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Pipeline
 *   1.  Extract transactions from PDF / pasted text
 *   2.  Group transactions by month
 *   3.  Generate daily closing balances  (O(n) carry-forward)
 *   4.  Generate snapshot days per month  (dynamic, user-configurable interval)
 *   5.  Sample snapshot balances
 *   6.  Calculate per-month financial metrics
 *   7.  Risk analysis  (bounce, EMI, salary, inflation, low-balance)
 *   8.  Compute weighted EVV score  (0-100)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Transaction {
  date: Date;
  balance: number;
  debit: number;
  credit: number;
  narration: string;
  raw: string;
}

/** One day's reconstructed closing balance within a month */
export interface DailyBalance {
  day: number;   // 1-31
  balance: number;
}

export interface Snapshot {
  date: Date;
  balance: number;
}

export interface MonthlyMetric {
  label: string;          // "May 2026"
  month: string;          // "2026-05"  (for sorting)
  points: number;         // snapshot count
  avg: number;            // mean of snapshot balances
  min: number;
  max: number;
  median: number;
  stdDev: number;         // standard deviation of snapshots
  credits: number;        // sum of all credits in the month
  debits: number;         // sum of all debits in the month
  netCashFlow: number;    // credits - debits
  avgDailyBalance: number;// sum(daily balances) / daysInMonth
  transactions: number;   // raw transaction count
  lowBalanceDays: number; // days where closing balance < 1000
  riskGrade: string;      // A / B / C / D / F
}

export interface EVVResult {
  overallEVV: number;                        // 0-100 weighted score
  overallEVVValue: number;                   // mean of all snapshot balances (₹)
  overallGrade: string;
  overallRisk: "Low" | "Medium" | "High";
  totalMonths: number;
  totalTransactions: number;
  overallAverageBalance: number;             // ADB across the full period
  overallAverageCredits: number;             // monthly avg credits
  overallAverageDebits: number;              // monthly avg debits
  salaryStability: number;                   // % of months with salary credit
  cashFlowStatus: "Positive" | "Negative";
  snapshotInterval: number;
  snapshots: Snapshot[];
  transactions: Transaction[];
  monthlyMetrics: MonthlyMetric[];
  period: { start: Date; end: Date };
  riskAnalysis: {
    lowBalanceDays: number;
    negativeBalanceDays: number;
    largeDepositsCount: number;
    inflationEventsCount: number;
    bounceCount: number;
    salaryConsistencyScore: number;
    emiPaymentsCount: number;
    emiTransactions: Transaction[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internals
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseDateToken(tok: string): Date | null {
  // DD/MM/YYYY  or  DD-MM-YYYY
  let m = tok.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const year = m[3].length === 2 ? "20" + m[3] : m[3];
    return new Date(+year, +m[2] - 1, +m[1]);
  }
  // DD-MMM-YYYY  or  DD MMM YYYY  or  DD-MMM-YY
  m = tok.match(/^(\d{1,2})[\-\s]([A-Za-z]{3,})[\-\s](\d{2,4})$/);
  if (m) {
    const mi = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (mi === undefined) return null;
    const year = m[3].length === 2 ? "20" + m[3] : m[3];
    return new Date(+year, mi, +m[1]);
  }
  return null;
}

/** YYYY-MM key for a Date */
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** YYYY-MM-DD key for a Date */
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthLabel(mKey: string): string {
  const [y, mo] = mKey.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 0 – PDF extraction
// ─────────────────────────────────────────────────────────────────────────────

export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) throw new Error("PDF.js not loaded. Please wait and try again.");

  if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  let fullText = "";

  for (let i = 1; i <= doc.numPages; i++) {
    const page  = await doc.getPage(i);
    const items = (await page.getTextContent()).items as any[];

    // Group text by Y position so a row stays on one line
    const byY: Record<number, string[]> = {};
    items.forEach((item: any) => {
      const y = Math.round(item.transform[5]);
      (byY[y] ??= []).push(item.str);
    });

    Object.keys(byY)
      .map(Number)
      .sort((a, b) => b - a)           // top-to-bottom
      .forEach((y) => { fullText += byY[y].join(" ") + "\n"; });
  }
  return fullText;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 – Parse transactions from raw text
// ─────────────────────────────────────────────────────────────────────────────

export function parseTransactions(
  text: string
): { transactions: Transaction[]; skipped: number } {
  const lines      = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const dateRegex  = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}[\-\s][A-Za-z]{3,}[\-\s]\d{2,4})/;
  const numToken   = /[\d,]+(?:\.\d{1,2})?/g;   // matches "1,23,456.78" and "8000"

  const rows: (Transaction & { _idx: number })[] = [];
  let skipped = 0;

  lines.forEach((line) => {
    const dm = line.match(dateRegex);
    if (!dm) return;

    const date = parseDateToken(dm[1]);
    if (!date || isNaN(date.getTime())) return;

    // Everything after the date token
    const afterDate  = line.slice(line.indexOf(dm[1]) + dm[1].length);
    const nums       = afterDate.match(numToken);
    if (!nums || nums.length === 0) { skipped++; return; }

    // Rule: rightmost number is always the closing balance
    const balance = parseFloat(nums[nums.length - 1].replace(/,/g, ""));
    if (isNaN(balance)) { skipped++; return; }

    // Heuristic debit / credit from the second-to-last number
    let debit  = 0;
    let credit = 0;
    if (nums.length >= 2) {
      const secondLast = parseFloat(nums[nums.length - 2].replace(/,/g, ""));
      const lineLower  = line.toLowerCase();
      const isDebitNarr =
        lineLower.includes("dr") ||
        lineLower.includes("wdr") ||
        lineLower.includes("debit") ||
        lineLower.includes("charges") ||
        lineLower.includes("payment to") ||
        lineLower.includes("transfer to");
      if (isDebitNarr) { debit  = secondLast; }
      else             { credit = secondLast; }
    }

    const narration = afterDate.replace(numToken, "").replace(/\s+/g, " ").trim() || "Transaction";

    rows.push({ date, balance, debit, credit, narration, raw: line, _idx: rows.length });
  });

  // Sort chronologically; preserve original order for same-date entries
  rows.sort((a, b) => a.date.getTime() - b.date.getTime() || a._idx - b._idx);

  return {
    transactions: rows.map(({ _idx, ...t }) => t),
    skipped,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 – Group transactions by month
// ─────────────────────────────────────────────────────────────────────────────

function groupByMonth(txs: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};
  txs.forEach((tx) => {
    const key = monthKey(tx.date);
    (groups[key] ??= []).push(tx);
  });
  return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 – Generate daily closing balances for one calendar month  O(n)
// ─────────────────────────────────────────────────────────────────────────────

function generateDailyBalances(
  txs: Transaction[],      // already sorted for this month
  year: number,
  month: number,           // 1-based
  openingBalance: number   // carry-in from last day of previous month
): DailyBalance[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const daily: DailyBalance[] = [];

  let currentBalance = openingBalance;
  let txIdx = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    // Advance through all transactions that fall on `day`
    while (txIdx < txs.length && txs[txIdx].date.getDate() === day) {
      currentBalance = txs[txIdx].balance;   // last one wins per the spec
      txIdx++;
    }
    daily.push({ day, balance: currentBalance });
  }

  return daily;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 – Generate snapshot day numbers for a given month  (dynamic)
// ─────────────────────────────────────────────────────────────────────────────

export function generateSnapshotDays(daysInMonth: number, interval: number): number[] {
  const days: number[] = [];
  for (let d = 1; d <= daysInMonth; d += interval) days.push(d);
  if (days[days.length - 1] !== daysInMonth) days.push(daysInMonth);
  return days;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 5 – Sample snapshot balances from the daily series
// ─────────────────────────────────────────────────────────────────────────────

function sampleSnapshots(
  daily: DailyBalance[],
  snapDays: number[],
  year: number,
  month: number   // 1-based
): Snapshot[] {
  const byDay = new Map<number, number>(daily.map((d) => [d.day, d.balance]));
  return snapDays
    .filter((d) => byDay.has(d))
    .map((d) => ({ date: new Date(year, month - 1, d), balance: byDay.get(d)! }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Steps 6-8 – Pure statistical helpers
// ─────────────────────────────────────────────────────────────────────────────

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid    = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = average(values);
  return Math.sqrt(values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length);
}

function totalCredits(txs: Transaction[]): number {
  return txs.filter((t) => t.credit > 0).reduce((s, t) => s + t.credit, 0);
}

function totalDebits(txs: Transaction[]): number {
  return txs.filter((t) => t.debit > 0).reduce((s, t) => s + t.debit, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Monthly grade heuristic
// ─────────────────────────────────────────────────────────────────────────────

function monthRiskGrade(avgDaily: number, netCF: number, lowBalDays: number): string {
  if (avgDaily >= 50000 && netCF >= 0  && lowBalDays === 0) return "A";
  if (avgDaily >= 20000 && netCF >= -5000 && lowBalDays <= 2) return "B";
  if (avgDaily >= 8000  && lowBalDays <= 5)                  return "C";
  if (avgDaily >= 1000)                                       return "D";
  return "F";
}

// ─────────────────────────────────────────────────────────────────────────────
// Risk keyword lists
// ─────────────────────────────────────────────────────────────────────────────

const SALARY_KW  = ["salary", "payroll", "wages", "sal cr", "direct dep", "payslip", "sal credit"];
const EMI_KW     = ["ach", "nach", "ecs", "emi", "loan", "auto debit", "finance", "equated"];
const BOUNCE_KW  = ["return", "failed", "reverse", "insufficient", "chargeback", "dishonour", "bounced"];

function hasKeyword(narr: string, kws: string[]): boolean {
  const lower = narr.toLowerCase();
  return kws.some((k) => lower.includes(k));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main public API
// ─────────────────────────────────────────────────────────────────────────────

export function calculateEVV(
  transactions: Transaction[],
  intervalDays: number
): EVVResult {
  // ── Empty guard ────────────────────────────────────────────────────────────
  const empty = (): EVVResult => ({
    overallEVV: 0, overallEVVValue: 0, overallGrade: "F", overallRisk: "High",
    totalMonths: 0, totalTransactions: 0, overallAverageBalance: 0,
    overallAverageCredits: 0, overallAverageDebits: 0,
    salaryStability: 0, cashFlowStatus: "Negative", snapshotInterval: intervalDays,
    snapshots: [], transactions: [], monthlyMetrics: [],
    period: { start: new Date(), end: new Date() },
    riskAnalysis: {
      lowBalanceDays: 0, negativeBalanceDays: 0, largeDepositsCount: 0,
      inflationEventsCount: 0, bounceCount: 0, salaryConsistencyScore: 0,
      emiPaymentsCount: 0, emiTransactions: [],
    },
  });

  if (transactions.length === 0) return empty();

  // ── Step 2 – Group by month ────────────────────────────────────────────────
  const byMonth   = groupByMonth(transactions);
  const monthKeys = Object.keys(byMonth).sort();

  // ── Steps 3-6 – Per-month pipeline ────────────────────────────────────────
  const allSnapshots:     Snapshot[]      = [];
  const monthlyMetrics:   MonthlyMetric[] = [];
  let   carryBalance      = transactions[0].balance;  // opening balance

  for (const mKey of monthKeys) {
    const [year, month] = mKey.split("-").map(Number);
    const daysInMonth   = new Date(year, month, 0).getDate();
    const monthTxs      = byMonth[mKey];

    // Step 3 – daily closing balances
    const daily = generateDailyBalances(monthTxs, year, month, carryBalance);
    carryBalance = daily[daily.length - 1].balance;   // carry to next month

    // Step 4 – snapshot day numbers
    const snapDays = generateSnapshotDays(daysInMonth, intervalDays);

    // Step 5 – sample
    const monthSnaps = sampleSnapshots(daily, snapDays, year, month);
    allSnapshots.push(...monthSnaps);

    const snapVals   = monthSnaps.map((s) => s.balance);
    const dailyVals  = daily.map((d) => d.balance);

    // Step 6 – financial metrics
    const credits        = totalCredits(monthTxs);
    const debits         = totalDebits(monthTxs);
    const netCashFlow    = credits - debits;
    const avgDailyBal    = average(dailyVals);
    const lowBalDays     = daily.filter((d) => d.balance < 1000).length;

    monthlyMetrics.push({
      label:           monthLabel(mKey),
      month:           mKey,
      points:          snapVals.length,
      avg:             average(snapVals),
      min:             snapVals.length > 0 ? Math.min(...snapVals) : 0,
      max:             snapVals.length > 0 ? Math.max(...snapVals) : 0,
      median:          median(snapVals),
      stdDev:          standardDeviation(snapVals),
      credits,
      debits,
      netCashFlow,
      avgDailyBalance: avgDailyBal,
      transactions:    monthTxs.length,
      lowBalanceDays:  lowBalDays,
      riskGrade:       monthRiskGrade(avgDailyBal, netCashFlow, lowBalDays),
    });
  }

  // ── Step 7 – Global risk analysis ─────────────────────────────────────────

  // Build a full day-by-day series across the entire period for global stats
  const eodByDate: Record<string, number> = {};
  transactions.forEach((tx) => { eodByDate[dateKey(tx.date)] = tx.balance; });

  const startDate = new Date(
    transactions[0].date.getFullYear(),
    transactions[0].date.getMonth(),
    transactions[0].date.getDate()
  );
  const endDate = new Date(
    transactions[transactions.length - 1].date.getFullYear(),
    transactions[transactions.length - 1].date.getMonth(),
    transactions[transactions.length - 1].date.getDate()
  );

  let globalLowBalDays  = 0;
  let globalNegDays     = 0;
  let runBal            = transactions[0].balance;
  let globalBalSum      = 0;
  let totalDays         = 0;

  const cur = new Date(startDate);
  while (cur <= endDate) {
    const k = dateKey(cur);
    if (eodByDate[k] !== undefined) runBal = eodByDate[k];
    if (runBal < 1000) globalLowBalDays++;
    if (runBal <    0) globalNegDays++;
    globalBalSum += runBal;
    totalDays++;
    cur.setDate(cur.getDate() + 1);
  }

  const overallAverageBalance = totalDays > 0 ? globalBalSum / totalDays : 0;

  // Large cash deposits (>= 50 000)
  const largeDeposits = transactions.filter((t) => t.credit >= 50000);

  // Temporary inflation: big credit followed by ≥ 80 % debit within 2 days
  let inflationCount = 0;
  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].credit < 20000) continue;
    for (let j = i + 1; j < transactions.length; j++) {
      const dayDiff = (transactions[j].date.getTime() - transactions[i].date.getTime()) / 86_400_000;
      if (dayDiff > 2) break;
      if (transactions[j].debit >= transactions[i].credit * 0.8) { inflationCount++; break; }
    }
  }

  // Bounce events
  const bounceCount = transactions.filter((t) => hasKeyword(t.narration + " " + t.raw, BOUNCE_KW)).length;

  // EMI / loan obligations
  const emiTxs = transactions.filter(
    (t) => t.debit > 0 && hasKeyword(t.narration + " " + t.raw, EMI_KW)
  );

  // Salary stability (% months that have a salary credit or large standalone credit)
  let salaryMonths = 0;
  monthKeys.forEach((mKey) => {
    const mTxs = byMonth[mKey];
    const hasSalary =
      mTxs.some((t) => t.credit >= 10000 && hasKeyword(t.narration + " " + t.raw, SALARY_KW)) ||
      mTxs.some((t) => t.credit >= 15000);   // fallback: large credit
    if (hasSalary) salaryMonths++;
  });
  const salaryStability = monthKeys.length > 0
    ? Math.round((salaryMonths / monthKeys.length) * 100)
    : 100;

  // ── Step 8 – Weighted EVV score ────────────────────────────────────────────
  const snapBalances     = allSnapshots.map((s) => s.balance);
  const snapshotAvg      = average(snapBalances);
  const snapshotStdDev   = standardDeviation(snapBalances);
  const coefVar          = snapshotAvg > 0 ? snapshotStdDev / snapshotAvg : 1;

  const totalCr          = monthlyMetrics.reduce((s, m) => s + m.credits, 0);
  const totalDb          = monthlyMetrics.reduce((s, m) => s + m.debits,  0);
  const netCF            = totalCr - totalDb;

  // Normalise each component to 0-100
  const adbScore          = Math.min(100, (overallAverageBalance / 50_000) * 100);
  const snapshotScore     = Math.min(100, (snapshotAvg            / 50_000) * 100);
  const stabilityScore    = Math.max(0, 100 - coefVar * 100);          // lower coefVar = more stable
  const incomeScore       = salaryStability;
  const cashFlowScore     = netCF >= 0 ? 100 : Math.max(0, 100 + (netCF / (totalCr || 1)) * 100);
  const behaviourScore    = Math.max(0, 100 - inflationCount * 25 - bounceCount * 10);
  const riskScore         = Math.max(0, 100 - globalNegDays * 20 - largeDeposits.length * 5);

  const overallEVV = Math.round(
    adbScore       * 0.30 +
    snapshotScore  * 0.20 +
    incomeScore    * 0.15 +
    cashFlowScore  * 0.10 +
    stabilityScore * 0.10 +
    behaviourScore * 0.10 +
    riskScore      * 0.05
  );

  const overallGrade =
    overallEVV >= 85 ? "A" :
    overallEVV >= 70 ? "B" :
    overallEVV >= 55 ? "C" :
    overallEVV >= 40 ? "D" : "F";

  const overallRisk: "Low" | "Medium" | "High" =
    overallEVV >= 75 ? "Low" :
    overallEVV >= 50 ? "Medium" : "High";

  return {
    overallEVV,
    overallEVVValue:       snapshotAvg,
    overallGrade,
    overallRisk,
    totalMonths:           monthKeys.length,
    totalTransactions:     transactions.length,
    overallAverageBalance,
    overallAverageCredits: totalCr / (monthKeys.length || 1),
    overallAverageDebits:  totalDb / (monthKeys.length || 1),
    salaryStability,
    cashFlowStatus:        netCF >= 0 ? "Positive" : "Negative",
    snapshotInterval:      intervalDays,
    snapshots:             allSnapshots,
    transactions,
    monthlyMetrics,
    period: { start: transactions[0].date, end: transactions[transactions.length - 1].date },
    riskAnalysis: {
      lowBalanceDays:        globalLowBalDays,
      negativeBalanceDays:   globalNegDays,
      largeDepositsCount:    largeDeposits.length,
      inflationEventsCount:  inflationCount,
      bounceCount,
      salaryConsistencyScore: salaryStability,
      emiPaymentsCount:      emiTxs.length,
      emiTransactions:       emiTxs,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo data generator  (realistic 6-month pattern)
// ─────────────────────────────────────────────────────────────────────────────

export function generateDemoData(): Transaction[] {
  const txs: Transaction[] = [];
  let balance = 82_000;

  const push = (date: Date, debit: number, credit: number, narr: string) => {
    balance += credit - debit;
    txs.push({ date, balance: Math.max(0, balance), debit, credit, narration: narr, raw: "" });
  };

  for (let m = 0; m < 6; m++) {
    const y = 2026, mo = m + 1;
    const days = new Date(y, mo, 0).getDate();

    // Salary on day 1
    push(new Date(y, mo - 1, 1, 9, 0), 0, 55_000, "SALARY CREDIT / VidyaCorp Payroll");
    // Rent on day 4
    push(new Date(y, mo - 1, 4, 10, 0), 14_000, 0, "RENT ACH / NACH0028481");
    // EMI on day 8
    push(new Date(y, mo - 1, 8, 11, 0), 4_200, 0, "EMI NACH / LOAN DEBIT AUTO");
    // Simulate March low-balance dip
    if (m === 2) {
      push(new Date(y, mo - 1, 26, 18, 0), 48_000, 0, "ATM CASH WITHDRAWAL");
    }
    // Random daily UPI flows
    for (let d = 2; d <= days; d += 3) {
      const amt = Math.round(Math.random() * 5_000 + 500);
      const isCr = Math.sin(d + m) > 0;
      if (isCr) push(new Date(y, mo - 1, d, 14, 0), 0, amt, `UPI/CR/${d}${m} / NEFT INWARD`);
      else       push(new Date(y, mo - 1, d, 16, 0), amt, 0, `UPI/DR/${d}${m} / MERCHANT PAY`);
    }
  }

  return txs.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatters (re-exported for UI)
// ─────────────────────────────────────────────────────────────────────────────

export function formatCurrency(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
