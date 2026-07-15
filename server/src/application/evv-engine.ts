import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterService } from '../ai/services/openrouter.service';

// ============================================================
// CORE INTERFACES
// ============================================================

/** Raw transaction as extracted from a bank statement */
export interface ExtractedTransaction {
  date: string;           // YYYY-MM-DD
  narration: string;      // Description / narration field
  debit: number;          // Debit amount (0 if credit)
  credit: number;         // Credit amount (0 if debit)
  balance: number;        // Running balance after transaction
  referenceNumber?: string;
  channel?: string;       // UPI | NEFT | RTGS | IMPS | CHEQUE | CASH | ATM | ONLINE
  utr?: string;           // UTR number
  mode?: string;          // Payment mode

  // Derived fields (computed post-extraction)
  amount: number;         // Max(debit, credit)
  type: 'credit' | 'debit';
  month: string;          // YYYY-MM (computed)
}

/** Backward-compat alias used by the old computeEvv path */
export interface Transaction {
  date: string;
  amount: number;
  type: 'credit' | 'debit';
  balance: number;
}

/** One record per calendar day */
export interface DailyBalance {
  date: string;           // YYYY-MM-DD
  balance: number;
  isTransactionDay: boolean;
}

/** Balance on a configurable snapshot day */
export interface SnapshotBalance {
  date: string;           // YYYY-MM-DD
  balance: number;
  month: string;          // YYYY-MM
  snapshotDay: number;    // 1, 5, 10, 15, 20, 25, or last-day-of-month
}

/** Full set of metrics for a single calendar month */
export interface MonthlyStatistics {
  month: string;          // YYYY-MM
  monthLabel: string;     // "Jan 2025"
  avgBalance: number;
  highestBalance: number;
  lowestBalance: number;
  medianBalance: number;
  avgDailyBalance: number;
  openingBalance: number;
  closingBalance: number;

  totalCredits: number;
  totalDebits: number;
  avgCredit: number;
  avgDebit: number;

  transactionCount: number;
  creditCount: number;
  debitCount: number;
  cashDepositCount: number;
  cashWithdrawalCount: number;
  upiCount: number;
  neftCount: number;
  rtgsCount: number;
  impsCount: number;
  chequeCount: number;
  bounceCount: number;
  chargeCount: number;
  emiCount: number;

  // Snapshot-based EVV (5-point: 1,10,15,20,25)
  snapshotAvg: number;
  snapshotMin: number;
  snapshotMax: number;
  snapshotPoints: number;
  evv: number;            // Legacy alias for snapshotAvg
}

/** Detected financial behaviour */
export interface FinancialBehaviour {
  type: string;
  label: string;
  detected: boolean;
  confidence: number;     // 0-1
  evidence: string;
  severity: 'positive' | 'neutral' | 'warning' | 'critical';
}

/** Detected risk flag */
export interface RiskFlag {
  type: string;
  label: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  month?: string;
}

/** Data validation report */
export interface ValidationReport {
  isValid: boolean;
  confidenceScore: number;  // 0-100
  checks: {
    name: string;
    passed: boolean;
    detail: string;
  }[];
  warnings: string[];
  errors: string[];
}

/** Weight-based EVV score breakdown */
export interface EVVWeightBreakdown {
  component: string;
  weight: number;           // e.g., 0.30
  rawScore: number;         // 0-100
  weightedScore: number;    // rawScore * weight
  evidence: string;
}

/** Final 0-100 EVV score with grade */
export interface EVVScore {
  score: number;            // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  gradeLabel: string;
  breakdown: EVVWeightBreakdown[];
  summary: string;
}

/** Underwriting decision */
export interface UnderwritingDecision {
  decision: 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'MANUAL_REVIEW' | 'REJECT';
  decisionLabel: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
  conditions?: string[];
  supportingEvidence: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/** Complete EVV report — full audit trail */
export interface EVVReport {
  // Statement metadata
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  ifsc?: string;
  statementPeriod?: { from: string; to: string };
  openingBalance: number;
  closingBalance: number;

  // Extracted data
  transactions: ExtractedTransaction[];
  totalTransactions: number;

  // Validation
  validation: ValidationReport;

  // Computed series
  dailyBalances: DailyBalance[];
  snapshots: SnapshotBalance[];
  monthlyMetrics: MonthlyStatistics[];

  // Behaviours & risks
  behaviours: FinancialBehaviour[];
  riskFlags: RiskFlag[];

  // Scores
  evvScore: EVVScore;
  overallEvv: number;          // Average monthly balance (rupees)
  period: { from: string; to: string } | null;
  status: 'COMPUTED' | 'FAILED' | 'MANUAL_REVIEW';

  // Decision
  underwritingDecision: UnderwritingDecision;

  // Legacy monthly breakdown (backward compat)
  monthly_evv: EvvMonthBreakdown[];
  totalSnapshots: number;
}

/** Legacy month breakdown (backward compat with old frontend) */
export interface EvvMonthBreakdown {
  month: string;
  points: number;
  avg: number;
  min: number;
  max: number;
  evv: number;
  // New extended fields
  totalCredits?: number;
  totalDebits?: number;
  transactionCount?: number;
  creditCount?: number;
  debitCount?: number;
}

/** Legacy results shape (backward compat) */
export interface EvvResults {
  overall_evv: number;
  monthly_evv: EvvMonthBreakdown[];
  totalSnapshots: number;
  totalTransactions: number;
  period: { from: string; to: string } | null;
  status: 'COMPUTED' | 'FAILED' | 'MANUAL_REVIEW';
}

// ============================================================
// EVV SCORE WEIGHTS (configurable)
// ============================================================

const EVV_WEIGHTS = {
  averageBalance: 0.30,
  balanceStability: 0.20,
  incomeConsistency: 0.15,
  transactionBehaviour: 0.10,
  liquidity: 0.10,
  existingEmi: 0.05,
  minimumBalance: 0.05,
  riskFlags: 0.05,
};

// Minimum balance benchmark (₹ — typical Indian savings account)
const MIN_BALANCE_BENCHMARK = 10000;

// ============================================================
// CHANNEL CLASSIFIERS
// ============================================================

const CASH_KEYWORDS = ['cash', 'atm', 'cdm', 'atm w/d', 'cash dep', 'cash wd', 'cash withdrawal', 'cash deposit', 'atm cash'];
const UPI_KEYWORDS = ['upi', 'upi/', '/upi', 'upi-', 'upi cr', 'upi dr', 'paytm', 'phonepe', 'gpay', 'google pay', 'bhim'];
const NEFT_KEYWORDS = ['neft', 'neft cr', 'neft dr', 'neft/'];
const RTGS_KEYWORDS = ['rtgs', 'rtgs/', 'rtgs cr', 'rtgs dr'];
const IMPS_KEYWORDS = ['imps', 'imps/', 'imps cr', 'imps dr'];
const CHEQUE_KEYWORDS = ['chq', 'cheque', 'clg', 'clearing', 'ecs', 'micr'];
const BOUNCE_KEYWORDS = ['return', 'bounce', 'dishonour', 'returned', 'dishonored', 'chg-ret', 'rtn'];
const CHARGE_KEYWORDS = ['charge', 'fee', 'gst', 'service charge', 'annual fee', 'maintenance', 'sms charge', 'incidental charge'];
const EMI_KEYWORDS = ['emi', 'loan', 'instalment', 'installment', 'principal', 'interest', 'mandate', 'nach', 'auto debit', 'si-'];
const CREDIT_CARD_KEYWORDS = ['credit card', 'cc payment', 'hdfc cc', 'sbi card', 'icici card'];
const SALARY_KEYWORDS = ['salary', 'sal/', 'sal-', 'payroll', 'payroll cr', 'employer', 'wages', 'hysalary'];
const RENT_KEYWORDS = ['rent', 'rental', 'house rent', 'property rent', 'lease'];
const GOVT_KEYWORDS = ['govt', 'government', 'pm kisan', 'scholarship', 'scholarship cr', 'stipend', 'subsidy'];
const SCHOLARSHIP_KEYWORDS = ['scholarship', 'stipend', 'fellowship', 'grant'];


// ============================================================
// HELPER UTILITIES
// ============================================================

function detectChannel(narration: string): string {
  const n = narration.toLowerCase();
  if (UPI_KEYWORDS.some(k => n.includes(k))) return 'UPI';
  if (NEFT_KEYWORDS.some(k => n.includes(k))) return 'NEFT';
  if (RTGS_KEYWORDS.some(k => n.includes(k))) return 'RTGS';
  if (IMPS_KEYWORDS.some(k => n.includes(k))) return 'IMPS';
  if (CHEQUE_KEYWORDS.some(k => n.includes(k))) return 'CHEQUE';
  if (CASH_KEYWORDS.some(k => n.includes(k))) return 'CASH';
  return 'ONLINE';
}

function isBounceTx(narration: string): boolean {
  const n = narration.toLowerCase();
  return BOUNCE_KEYWORDS.some(k => n.includes(k));
}

function isChargeTx(narration: string): boolean {
  const n = narration.toLowerCase();
  return CHARGE_KEYWORDS.some(k => n.includes(k));
}

function isEmiTx(narration: string, debit: number): boolean {
  const n = narration.toLowerCase();
  return debit > 0 && EMI_KEYWORDS.some(k => n.includes(k));
}

function isSalaryTx(narration: string, credit: number): boolean {
  const n = narration.toLowerCase();
  return credit > 0 && SALARY_KEYWORDS.some(k => n.includes(k));
}

function isScholarshipTx(narration: string, credit: number): boolean {
  const n = narration.toLowerCase();
  return credit > 0 && SCHOLARSHIP_KEYWORDS.some(k => n.includes(k));
}

function isGovtTx(narration: string, credit: number): boolean {
  const n = narration.toLowerCase();
  return credit > 0 && GOVT_KEYWORDS.some(k => n.includes(k));
}

function isCashDeposit(narration: string, credit: number): boolean {
  const n = narration.toLowerCase();
  return credit > 0 && CASH_KEYWORDS.some(k => n.includes(k));
}

function isCashWithdrawal(narration: string, debit: number): boolean {
  const n = narration.toLowerCase();
  return debit > 0 && CASH_KEYWORDS.some(k => n.includes(k));
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function formatPeriodDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).replace(/ /g, '-');
  } catch {
    return dateStr;
  }
}

function formatMonthLabel(monthStr: string): string {
  try {
    const [y, m] = monthStr.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, 1)
      .toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  } catch {
    return monthStr;
  }
}

function clampScore(s: number): number {
  return Math.max(0, Math.min(100, Math.round(s)));
}

// ============================================================
// MAIN EVV ENGINE SERVICE
// ============================================================

@Injectable()
export class EvvEngineService {
  private readonly logger = new Logger(EvvEngineService.name);

  constructor(private readonly openRouter: OpenRouterService) {}

  // ──────────────────────────────────────────────────────────
  // 1. TRANSACTION EXTRACTION
  // ──────────────────────────────────────────────────────────

  async extractTransactions(
    fileBuffer: Buffer,
    mimetype: string,
    originalName?: string,
    seed?: string,
  ): Promise<ExtractedTransaction[]> {
    this.logger.log(`[EVV] Extracting transactions from ${originalName || 'statement'} (${mimetype})`);

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      this.logger.warn(`[EVV] OpenRouter API key not configured — generating mock transactions.`);
      return this.generateMockTransactions(originalName, seed);
    }

    const base64Data = fileBuffer.toString('base64');
    const dataUrl = `data:${mimetype};base64,${base64Data}`;

    const prompt = `You are a bank statement OCR parser for Indian banks. Extract ALL transactions from this bank statement.

For each transaction row, output a JSON object with these exact fields:
- date: string "YYYY-MM-DD"
- narration: string (full transaction description)
- debit: number (0 if it's a credit)
- credit: number (0 if it's a debit)
- balance: number (running balance after transaction)
- referenceNumber: string or "" (cheque no / ref no if visible)
- channel: string (one of: UPI, NEFT, RTGS, IMPS, CHEQUE, CASH, ATM, ONLINE) — infer from narration

Also extract statement metadata:
- openingBalance: number
- closingBalance: number
- accountNumber: string or ""
- accountHolder: string or ""
- ifsc: string or ""
- bankName: string or ""
- statementFrom: "YYYY-MM-DD" or ""
- statementTo: "YYYY-MM-DD" or ""

Respond ONLY with this exact JSON structure, no markdown, no explanation:
{
  "metadata": {
    "openingBalance": 0,
    "closingBalance": 0,
    "accountNumber": "",
    "accountHolder": "",
    "ifsc": "",
    "bankName": "",
    "statementFrom": "",
    "statementTo": ""
  },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "narration": "",
      "debit": 0,
      "credit": 0,
      "balance": 0,
      "referenceNumber": "",
      "channel": "ONLINE"
    }
  ]
}

If the PDF is unreadable: {"metadata":{},"transactions":[],"error":"reason"}`;

    try {
      const responseStr = await this.openRouter.chatWithVision(
        prompt,
        dataUrl,
        'google/gemini-2.5-flash',
      );
      this.logger.log(`[EVV] OpenRouter response (first 400 chars): ${responseStr.slice(0, 400)}`);

      // Strip markdown fences
      let cleaned = responseStr.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('No JSON found in AI response');
      }

      const jsonStr = cleaned.slice(firstBrace, lastBrace + 1);
      let parsed: any;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseErr: any) {
        this.logger.warn(`[EVV] JSON parse failed: ${parseErr.message}. Attempting salvage...`);
        const salvaged = this.salvageTransactions(responseStr);
        if (salvaged.length > 0) {
          this.logger.log(`[EVV] Salvaged ${salvaged.length} transactions.`);
          return salvaged;
        }
        throw parseErr;
      }

      if (parsed.error && (!parsed.transactions || parsed.transactions.length === 0)) {
        this.logger.warn(`[EVV] AI reported error: ${parsed.error}`);
        return [];
      }

      const rawTxs: any[] = Array.isArray(parsed.transactions) ? parsed.transactions : [];
      return rawTxs.map((tx: any) => this.normaliseTransaction(tx));
    } catch (err: any) {
      this.logger.error(`[EVV] Extraction failed: ${err.message}`);
      throw err;
    }
  }

  /** Normalise a raw AI-extracted row into ExtractedTransaction */
  private normaliseTransaction(tx: any): ExtractedTransaction {
    const debit = Math.abs(Number(tx.debit ?? tx.Debit ?? 0));
    const credit = Math.abs(Number(tx.credit ?? tx.Credit ?? 0));
    const balance = Number(tx.balance ?? tx.Balance ?? 0);
    const narration = String(tx.narration ?? tx.Narration ?? tx.description ?? '');
    const date = String(tx.date ?? tx.Date ?? '');
    const channel = tx.channel || detectChannel(narration);

    return {
      date,
      narration,
      debit,
      credit,
      balance,
      referenceNumber: String(tx.referenceNumber ?? ''),
      channel,
      utr: String(tx.utr ?? ''),
      mode: channel,
      amount: Math.max(debit, credit),
      type: credit > 0 ? 'credit' : 'debit',
      month: date.slice(0, 7),
    };
  }

  /** Regex-based salvage from malformed JSON */
  private salvageTransactions(content: string): ExtractedTransaction[] {
    const results: ExtractedTransaction[] = [];
    const braceRe = /\{[^{}]*\}/g;
    let match: RegExpExecArray | null;
    while ((match = braceRe.exec(content)) !== null) {
      try {
        const obj = JSON.parse(match[0]);
        const dateVal = obj.date || obj.Date;
        const debitVal = Number(obj.debit ?? obj.Debit ?? 0);
        const creditVal = Number(obj.credit ?? obj.Credit ?? 0);
        const balanceVal = Number(obj.balance ?? obj.Balance);
        const narration = String(obj.narration ?? obj.Narration ?? '');
        if (dateVal && (debitVal > 0 || creditVal > 0) && !isNaN(balanceVal)) {
          results.push(this.normaliseTransaction({ ...obj, date: dateVal, narration, debit: debitVal, credit: creditVal, balance: balanceVal }));
        }
      } catch { /* skip */ }
    }
    return results;
  }

  // ──────────────────────────────────────────────────────────
  // 2. DATA VALIDATION
  // ──────────────────────────────────────────────────────────

  validateExtractedData(
    transactions: ExtractedTransaction[],
    openingBalance: number,
    closingBalance: number,
  ): ValidationReport {
    const checks: { name: string; passed: boolean; detail: string }[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    // Sort by date
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

    // Check 1: Non-empty
    const notEmpty = sorted.length > 0;
    checks.push({ name: 'Transactions Extracted', passed: notEmpty, detail: `${sorted.length} transactions found` });
    if (!notEmpty) errors.push('No transactions could be extracted from the statement');

    // Check 2: Valid dates
    const validDates = sorted.every(tx => /^\d{4}-\d{2}-\d{2}$/.test(tx.date));
    checks.push({ name: 'Valid Date Format', passed: validDates, detail: validDates ? 'All dates in YYYY-MM-DD format' : 'Some dates have invalid format' });
    if (!validDates) warnings.push('Some transaction dates could not be parsed correctly');

    // Check 3: No negative balances
    const negativeBalances = sorted.filter(tx => tx.balance < 0);
    const noNegativeBalance = negativeBalances.length === 0;
    checks.push({
      name: 'No Negative Balances',
      passed: noNegativeBalance,
      detail: noNegativeBalance ? 'All balances are non-negative' : `${negativeBalances.length} transaction(s) show negative balance`
    });
    if (!noNegativeBalance) warnings.push(`${negativeBalances.length} instances of negative balance detected`);

    // Check 4: Running balance continuity
    let balanceBreaks = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const expectedBalance = prev.balance - curr.debit + curr.credit;
      const diff = Math.abs(curr.balance - expectedBalance);
      if (diff > 5) balanceBreaks++; // Allow ₹5 tolerance for rounding
    }
    const balanceContinuous = balanceBreaks === 0;
    checks.push({
      name: 'Running Balance Continuity',
      passed: balanceContinuous,
      detail: balanceContinuous ? 'Running balance is continuous' : `${balanceBreaks} balance discontinuity/ies detected`
    });
    if (!balanceContinuous) warnings.push(`Balance sequence broken at ${balanceBreaks} points — may indicate missing transactions`);

    // Check 5: No duplicate transactions (same date + amount + type)
    const txKeys = sorted.map(tx => `${tx.date}|${tx.amount}|${tx.type}`);
    const uniqueKeys = new Set(txKeys);
    const noDuplicates = uniqueKeys.size === txKeys.length;
    const dupCount = txKeys.length - uniqueKeys.size;
    checks.push({
      name: 'No Duplicate Transactions',
      passed: noDuplicates,
      detail: noDuplicates ? 'No duplicates detected' : `${dupCount} potential duplicate(s) found`
    });
    if (!noDuplicates) warnings.push(`${dupCount} potential duplicate transactions detected`);

    // Check 6: Closing balance match
    const lastTx = sorted[sorted.length - 1];
    const closingMatch = lastTx ? Math.abs(lastTx.balance - closingBalance) < 100 : false;
    checks.push({
      name: 'Closing Balance Match',
      passed: closingMatch || closingBalance === 0,
      detail: closingBalance > 0
        ? (closingMatch ? `Closing balance matches: ₹${closingBalance.toLocaleString('en-IN')}` : `Mismatch: extracted ₹${lastTx?.balance?.toLocaleString('en-IN')}, expected ₹${closingBalance.toLocaleString('en-IN')}`)
        : 'Closing balance not extracted'
    });
    if (!closingMatch && closingBalance > 0) warnings.push('Closing balance does not match last transaction balance');

    // Check 7: Missing date gaps (> 60 days)
    let hasBigGap = false;
    if (sorted.length > 1) {
      for (let i = 1; i < sorted.length; i++) {
        const d1 = new Date(sorted[i - 1].date);
        const d2 = new Date(sorted[i].date);
        const gapDays = (d2.getTime() - d1.getTime()) / 86400000;
        if (gapDays > 60) { hasBigGap = true; break; }
      }
    }
    checks.push({
      name: 'No Large Date Gaps',
      passed: !hasBigGap,
      detail: hasBigGap ? 'Transaction date gap > 60 days detected (possible missing pages)' : 'Transaction dates are reasonably continuous'
    });
    if (hasBigGap) warnings.push('Large gap between transactions detected — statement may have missing pages');

    const passCount = checks.filter(c => c.passed).length;
    const confidenceScore = Math.round((passCount / checks.length) * 100);

    return {
      isValid: errors.length === 0,
      confidenceScore,
      checks,
      warnings,
      errors,
    };
  }

  // ──────────────────────────────────────────────────────────
  // 3. DAILY BALANCE RECONSTRUCTION
  // ──────────────────────────────────────────────────────────

  reconstructDailyBalances(
    transactions: ExtractedTransaction[],
    openingBalance: number,
  ): DailyBalance[] {
    if (transactions.length === 0) return [];

    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    const firstDate = new Date(sorted[0].date);
    const lastDate = new Date(sorted[sorted.length - 1].date);

    // Build a map: date string → final balance on that day
    const dateBalanceMap = new Map<string, number>();
    for (const tx of sorted) {
      dateBalanceMap.set(tx.date, tx.balance); // Last tx of the day wins
    }

    const result: DailyBalance[] = [];
    const cursor = new Date(firstDate);
    let currentBalance = openingBalance > 0 ? openingBalance : sorted[0].balance;

    while (cursor <= lastDate) {
      const dateStr = cursor.toISOString().slice(0, 10);
      const isTransactionDay = dateBalanceMap.has(dateStr);
      if (isTransactionDay) {
        currentBalance = dateBalanceMap.get(dateStr)!;
      }
      result.push({ date: dateStr, balance: currentBalance, isTransactionDay });
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }

  // ──────────────────────────────────────────────────────────
  // 4. SNAPSHOT CALCULATION
  // ──────────────────────────────────────────────────────────

  calculateSnapshots(
    dailyBalances: DailyBalance[],
    intervalOrDays: number | number[] = 5,
  ): SnapshotBalance[] {
    if (dailyBalances.length === 0) return [];

    let snapshotDays: number[];
    if (typeof intervalOrDays === 'number') {
      const interval = intervalOrDays;
      if (interval === 1) {
        snapshotDays = Array.from({ length: 31 }, (_, i) => i + 1);
      } else if (interval === 5) {
        snapshotDays = [5, 10, 15, 20, 25, 30];
      } else if (interval === 7) {
        snapshotDays = [7, 14, 21, 28];
      } else if (interval === 10) {
        snapshotDays = [10, 20, 30];
      } else if (interval === 15) {
        snapshotDays = [15, 30];
      } else {
        snapshotDays = [];
        for (let d = interval; d <= 30; d += interval) {
          snapshotDays.push(d);
        }
      }
    } else {
      snapshotDays = intervalOrDays;
    }

    const balanceMap = new Map<string, number>();
    for (const db of dailyBalances) {
      balanceMap.set(db.date, db.balance);
    }

    const getBalance = (targetDateStr: string): number => {
      const target = new Date(targetDateStr);
      for (let i = 0; i <= 31; i++) {
        const d = new Date(target);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().slice(0, 10);
        if (balanceMap.has(ds)) return balanceMap.get(ds)!;
      }
      return dailyBalances[0]?.balance ?? 0;
    };

    const months = new Set<string>();
    for (const db of dailyBalances) months.add(db.date.slice(0, 7));

    const snapshots: SnapshotBalance[] = [];
    for (const month of Array.from(months).sort()) {
      const [y, m] = month.split('-').map(Number);
      const lastDay = daysInMonth(y, m);
      const days = [...snapshotDays];
      if (!days.includes(lastDay)) {
        days.push(lastDay);
      }

      for (const day of days) {
        if (day > lastDay) continue;
        const dateStr = `${month}-${String(day).padStart(2, '0')}`;
        const balance = getBalance(dateStr);
        snapshots.push({ date: dateStr, balance, month, snapshotDay: day });
      }
    }
    return snapshots.sort((a, b) => a.date.localeCompare(b.date));
  }

  // ──────────────────────────────────────────────────────────
  // 5. MONTHLY METRICS
  // ──────────────────────────────────────────────────────────

  calculateMonthlyMetrics(
    dailyBalances: DailyBalance[],
    transactions: ExtractedTransaction[],
    snapshots: SnapshotBalance[],
  ): MonthlyStatistics[] {
    if (dailyBalances.length === 0) return [];

    // Group daily balances by month
    const dailyByMonth = new Map<string, DailyBalance[]>();
    for (const db of dailyBalances) {
      const m = db.date.slice(0, 7);
      if (!dailyByMonth.has(m)) dailyByMonth.set(m, []);
      dailyByMonth.get(m)!.push(db);
    }

    // Group transactions by month
    const txByMonth = new Map<string, ExtractedTransaction[]>();
    for (const tx of transactions) {
      const m = tx.date.slice(0, 7);
      if (!txByMonth.has(m)) txByMonth.set(m, []);
      txByMonth.get(m)!.push(tx);
    }

    // Group snapshots by month
    const snap5ByMonth = new Map<string, SnapshotBalance[]>();
    for (const s of snapshots) {
      if (!snap5ByMonth.has(s.month)) snap5ByMonth.set(s.month, []);
      snap5ByMonth.get(s.month)!.push(s);
    }

    const months = Array.from(dailyByMonth.keys()).sort();
    const stats: MonthlyStatistics[] = [];

    for (const month of months) {
      const dayBalances = (dailyByMonth.get(month) || []).map(d => d.balance);
      const txList = txByMonth.get(month) || [];
      const snap5 = snap5ByMonth.get(month) || [];

      const credits = txList.filter(tx => tx.credit > 0).map(tx => tx.credit);
      const debits = txList.filter(tx => tx.debit > 0).map(tx => tx.debit);

      const avgBalance = dayBalances.length > 0
        ? Number((dayBalances.reduce((s, b) => s + b, 0) / dayBalances.length).toFixed(2))
        : 0;
      const snapshotBalances = snap5.map(s => s.balance);
      const snapshotAvg = snapshotBalances.length > 0
        ? Number((snapshotBalances.reduce((s, b) => s + b, 0) / snapshotBalances.length).toFixed(2))
        : avgBalance;
      const snapshotMin = snapshotBalances.length > 0
        ? Number(Math.min(...snapshotBalances).toFixed(2))
        : Number(Math.min(...dayBalances).toFixed(2));
      const snapshotMax = snapshotBalances.length > 0
        ? Number(Math.max(...snapshotBalances).toFixed(2))
        : Number(Math.max(...dayBalances).toFixed(2));

      // Classify each transaction
      let cashDepositCount = 0, cashWithdrawalCount = 0;
      let upiCount = 0, neftCount = 0, rtgsCount = 0, impsCount = 0, chequeCount = 0;
      let bounceCount = 0, chargeCount = 0, emiCount = 0;

      for (const tx of txList) {
        const n = tx.narration;
        if (isCashDeposit(n, tx.credit)) cashDepositCount++;
        if (isCashWithdrawal(n, tx.debit)) cashWithdrawalCount++;
        if (tx.channel === 'UPI') upiCount++;
        else if (tx.channel === 'NEFT') neftCount++;
        else if (tx.channel === 'RTGS') rtgsCount++;
        else if (tx.channel === 'IMPS') impsCount++;
        else if (tx.channel === 'CHEQUE') chequeCount++;
        if (isBounceTx(n)) bounceCount++;
        if (isChargeTx(n)) chargeCount++;
        if (isEmiTx(n, tx.debit)) emiCount++;
      }

      const totalCredits = credits.reduce((s, c) => s + c, 0);
      const totalDebits = debits.reduce((s, d) => s + d, 0);

      stats.push({
        month,
        monthLabel: formatMonthLabel(month),
        avgBalance,
        highestBalance: dayBalances.length > 0 ? Math.max(...dayBalances) : 0,
        lowestBalance: dayBalances.length > 0 ? Math.min(...dayBalances) : 0,
        medianBalance: median(dayBalances),
        avgDailyBalance: avgBalance,
        openingBalance: dayBalances[0] ?? 0,
        closingBalance: dayBalances[dayBalances.length - 1] ?? 0,

        totalCredits,
        totalDebits,
        avgCredit: credits.length > 0 ? Math.round(totalCredits / credits.length) : 0,
        avgDebit: debits.length > 0 ? Math.round(totalDebits / debits.length) : 0,

        transactionCount: txList.length,
        creditCount: credits.length,
        debitCount: debits.length,
        cashDepositCount,
        cashWithdrawalCount,
        upiCount,
        neftCount,
        rtgsCount,
        impsCount,
        chequeCount,
        bounceCount,
        chargeCount,
        emiCount,

        snapshotAvg,
        snapshotMin,
        snapshotMax,
        snapshotPoints: snap5.length,
        evv: snapshotAvg,
      });
    }

    return stats;
  }

  // ──────────────────────────────────────────────────────────
  // 6. FINANCIAL BEHAVIOUR DETECTION
  // ──────────────────────────────────────────────────────────

  detectFinancialBehaviour(
    transactions: ExtractedTransaction[],
    monthlyMetrics: MonthlyStatistics[],
  ): FinancialBehaviour[] {
    const behaviours: FinancialBehaviour[] = [];
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

    const totalCredits = transactions.reduce((s, tx) => s + tx.credit, 0);
    const totalCashCredits = transactions.filter(tx => isCashDeposit(tx.narration, tx.credit)).reduce((s, tx) => s + tx.credit, 0);
    const totalBounces = monthlyMetrics.reduce((s, m) => s + m.bounceCount, 0);
    const totalEMIs = monthlyMetrics.reduce((s, m) => s + m.emiCount, 0);
    const salaryTxs = sorted.filter(tx => isSalaryTx(tx.narration, tx.credit));
    const scholarshipTxs = sorted.filter(tx => isScholarshipTx(tx.narration, tx.credit));
    const govtTxs = sorted.filter(tx => isGovtTx(tx.narration, tx.credit));

    // ── Salary Pattern
    const salaryMonths = new Set(salaryTxs.map(tx => tx.date.slice(0, 7)));
    const salaryConsistency = monthlyMetrics.length > 0 ? salaryMonths.size / monthlyMetrics.length : 0;
    behaviours.push({
      type: 'SALARY_PATTERN',
      label: 'Regular Salary Credits',
      detected: salaryTxs.length > 0,
      confidence: salaryConsistency,
      evidence: salaryTxs.length > 0
        ? `${salaryTxs.length} salary-type credits detected across ${salaryMonths.size} months`
        : 'No salary-type credits detected',
      severity: salaryTxs.length > 0 ? 'positive' : 'warning',
    });

    // ── Business Income (high credit frequency)
    const avgCreditCount = monthlyMetrics.reduce((s, m) => s + m.creditCount, 0) / (monthlyMetrics.length || 1);
    const hasBusinessIncome = avgCreditCount > 8 && salaryTxs.length === 0;
    behaviours.push({
      type: 'BUSINESS_INCOME',
      label: 'Business / Freelance Income',
      detected: hasBusinessIncome,
      confidence: hasBusinessIncome ? 0.65 : 0.2,
      evidence: hasBusinessIncome
        ? `Avg ${avgCreditCount.toFixed(1)} credits/month without clear salary pattern — likely business income`
        : 'No clear business income pattern',
      severity: hasBusinessIncome ? 'positive' : 'neutral',
    });

    // ── Rental Income
    const rentTxs = sorted.filter(tx => RENT_KEYWORDS.some(k => tx.narration.toLowerCase().includes(k)) && tx.credit > 0);
    behaviours.push({
      type: 'RENTAL_INCOME',
      label: 'Rental Income',
      detected: rentTxs.length > 0,
      confidence: rentTxs.length > 0 ? 0.75 : 0,
      evidence: rentTxs.length > 0 ? `${rentTxs.length} rental income credits detected` : 'No rental income detected',
      severity: rentTxs.length > 0 ? 'positive' : 'neutral',
    });

    // ── Cash Intensive Account
    const cashRatio = totalCredits > 0 ? totalCashCredits / totalCredits : 0;
    const isCashIntensive = cashRatio > 0.4;
    behaviours.push({
      type: 'CASH_INTENSIVE',
      label: 'Cash-Intensive Account',
      detected: isCashIntensive,
      confidence: cashRatio,
      evidence: `${(cashRatio * 100).toFixed(1)}% of credits are cash deposits`,
      severity: isCashIntensive ? 'warning' : 'neutral',
    });

    // ── Circular Transactions (same amounts credit+debit within same month)
    const circularSets = new Set<number>();
    for (const m of monthlyMetrics) {
      const mTxs = sorted.filter(tx => tx.date.startsWith(m.month));
      const creditAmounts = new Set(mTxs.filter(tx => tx.credit > 0).map(tx => tx.credit));
      const debitAmounts = mTxs.filter(tx => tx.debit > 0).map(tx => tx.debit);
      for (const da of debitAmounts) {
        if (creditAmounts.has(da) && da > 5000) circularSets.add(da);
      }
    }
    const hasCircular = circularSets.size >= 2;
    behaviours.push({
      type: 'CIRCULAR_TRANSACTIONS',
      label: 'Circular Transactions',
      detected: hasCircular,
      confidence: hasCircular ? 0.7 : 0.1,
      evidence: hasCircular
        ? `${circularSets.size} amounts appear as both credit and debit within same month`
        : 'No circular transaction pattern',
      severity: hasCircular ? 'critical' : 'neutral',
    });

    // ── Large Withdrawals (single debit > ₹1 lakh)
    const largeWithdrawals = sorted.filter(tx => tx.debit >= 100000);
    behaviours.push({
      type: 'LARGE_WITHDRAWALS',
      label: 'Large Withdrawals',
      detected: largeWithdrawals.length > 0,
      confidence: largeWithdrawals.length > 0 ? 0.9 : 0,
      evidence: largeWithdrawals.length > 0
        ? `${largeWithdrawals.length} debit(s) ≥ ₹1,00,000`
        : 'No unusually large withdrawals',
      severity: largeWithdrawals.length > 0 ? 'warning' : 'neutral',
    });

    // ── Sudden Balance Spikes (credit > 3× previous month avg)
    let balanceSpikes = 0;
    for (let i = 1; i < monthlyMetrics.length; i++) {
      const prev = monthlyMetrics[i - 1].avgBalance;
      const curr = monthlyMetrics[i].avgBalance;
      if (prev > 0 && curr > prev * 3) balanceSpikes++;
    }
    behaviours.push({
      type: 'SUDDEN_BALANCE_SPIKES',
      label: 'Sudden Balance Spikes',
      detected: balanceSpikes > 0,
      confidence: balanceSpikes > 0 ? 0.8 : 0,
      evidence: balanceSpikes > 0
        ? `${balanceSpikes} month(s) show balance spike >3× previous month`
        : 'No sudden balance spikes detected',
      severity: balanceSpikes > 0 ? 'warning' : 'neutral',
    });

    // ── Account Draining (closing balance < 10% of month avg consistently)
    const drainingMonths = monthlyMetrics.filter(m => m.avgBalance > 10000 && m.closingBalance < m.avgBalance * 0.1);
    behaviours.push({
      type: 'ACCOUNT_DRAINING',
      label: 'Month-End Account Draining',
      detected: drainingMonths.length >= 2,
      confidence: drainingMonths.length / (monthlyMetrics.length || 1),
      evidence: drainingMonths.length > 0
        ? `${drainingMonths.length} month(s) show closing balance < 10% of monthly average`
        : 'No account draining pattern',
      severity: drainingMonths.length >= 2 ? 'critical' : 'neutral',
    });

    // ── Month-end Balance Inflation (large credit in last 3 days of month)
    const monthEndInflation = sorted.filter(tx => {
      const date = new Date(tx.date);
      const day = date.getDate();
      const lastDay = daysInMonth(date.getFullYear(), date.getMonth() + 1);
      return tx.credit > 50000 && day >= lastDay - 2;
    });
    behaviours.push({
      type: 'MONTH_END_INFLATION',
      label: 'Month-End Balance Inflation',
      detected: monthEndInflation.length >= 2,
      confidence: monthEndInflation.length / (monthlyMetrics.length || 1),
      evidence: monthEndInflation.length >= 2
        ? `${monthEndInflation.length} large credits (>₹50,000) in last 3 days of month`
        : 'No month-end inflation pattern',
      severity: monthEndInflation.length >= 2 ? 'critical' : 'neutral',
    });

    // ── Minimum Balance Violations
    const minBalViolations = monthlyMetrics.filter(m => m.lowestBalance < MIN_BALANCE_BENCHMARK);
    behaviours.push({
      type: 'MIN_BALANCE_VIOLATION',
      label: 'Minimum Balance Violations',
      detected: minBalViolations.length > 0,
      confidence: minBalViolations.length / (monthlyMetrics.length || 1),
      evidence: minBalViolations.length > 0
        ? `${minBalViolations.length} month(s) with balance below ₹${MIN_BALANCE_BENCHMARK.toLocaleString('en-IN')}`
        : 'Balance consistently above minimum',
      severity: minBalViolations.length > 0 ? 'warning' : 'positive',
    });

    // ── Frequent Overdrafts / Bounces
    behaviours.push({
      type: 'FREQUENT_BOUNCES',
      label: 'Returned / Bounced Payments',
      detected: totalBounces > 0,
      confidence: Math.min(1, totalBounces / 5),
      evidence: totalBounces > 0
        ? `${totalBounces} returned/bounced payment(s) across the statement period`
        : 'No returned or bounced payments',
      severity: totalBounces >= 3 ? 'critical' : totalBounces > 0 ? 'warning' : 'positive',
    });

    // ── Loan EMI Deductions
    behaviours.push({
      type: 'LOAN_EMI_DEDUCTIONS',
      label: 'Existing Loan EMI Payments',
      detected: totalEMIs > 0,
      confidence: Math.min(1, totalEMIs / monthlyMetrics.length),
      evidence: totalEMIs > 0
        ? `${totalEMIs} EMI/loan-linked debit(s) detected`
        : 'No existing EMI obligations detected',
      severity: totalEMIs > 0 ? 'warning' : 'positive',
    });

    // ── Scholarship / Government Credits
    const govtScholarship = [...scholarshipTxs, ...govtTxs];
    behaviours.push({
      type: 'SCHOLARSHIP_CREDITS',
      label: 'Scholarship / Government Credits',
      detected: govtScholarship.length > 0,
      confidence: govtScholarship.length > 0 ? 0.85 : 0,
      evidence: govtScholarship.length > 0
        ? `${scholarshipTxs.length} scholarship and ${govtTxs.length} government credit(s) detected`
        : 'No scholarship or government credits detected',
      severity: 'positive',
    });

    return behaviours;
  }

  // ──────────────────────────────────────────────────────────
  // 7. RISK FLAG DETECTION
  // ──────────────────────────────────────────────────────────

  detectRiskFlags(
    transactions: ExtractedTransaction[],
    behaviours: FinancialBehaviour[],
    monthlyMetrics: MonthlyStatistics[],
  ): RiskFlag[] {
    const flags: RiskFlag[] = [];
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    const getBehaviour = (type: string) => behaviours.find(b => b.type === type);

    // ── Round Tripping
    const circular = getBehaviour('CIRCULAR_TRANSACTIONS');
    if (circular?.detected) {
      flags.push({
        type: 'ROUND_TRIPPING',
        label: 'Round Tripping Detected',
        severity: 'high',
        description: 'Same amounts appearing as both credits and debits within the same month, suggesting artificial fund circulation.',
        evidence: circular.evidence,
      });
    }

    // ── Large Cash Deposits
    const largeCashDeposits = sorted.filter(tx => isCashDeposit(tx.narration, tx.credit) && tx.credit >= 50000);
    if (largeCashDeposits.length > 0) {
      flags.push({
        type: 'LARGE_CASH_DEPOSITS',
        label: 'Large Cash Deposits',
        severity: largeCashDeposits.length >= 3 ? 'critical' : 'high',
        description: 'Large single cash deposits (≥₹50,000) may indicate undisclosed income sources.',
        evidence: `${largeCashDeposits.length} cash deposit(s) each ≥ ₹50,000`,
      });
    }

    // ── Temporary Balance Inflation
    const monthEndInflation = getBehaviour('MONTH_END_INFLATION');
    if (monthEndInflation?.detected) {
      flags.push({
        type: 'TEMPORARY_BALANCE_INFLATION',
        label: 'Temporary Balance Inflation',
        severity: 'high',
        description: 'Large credits at month-end suggest artificial inflation of balance before statement generation.',
        evidence: monthEndInflation.evidence,
      });
    }

    // ── Salary Missing
    const salaryBehaviour = getBehaviour('SALARY_PATTERN');
    if (!salaryBehaviour?.detected && monthlyMetrics.length >= 3) {
      flags.push({
        type: 'SALARY_MISSING',
        label: 'No Salary Credit Detected',
        severity: 'medium',
        description: 'No recognizable salary credit pattern found in the statement. Income source unclear.',
        evidence: `Checked ${sorted.length} transactions — no salary-type credit found`,
      });
    }

    // ── High Cash Dependency
    const cashIntensive = getBehaviour('CASH_INTENSIVE');
    if (cashIntensive?.detected) {
      flags.push({
        type: 'HIGH_CASH_DEPENDENCY',
        label: 'High Cash Dependency',
        severity: 'medium',
        description: 'More than 40% of credits are cash-based, making income difficult to trace.',
        evidence: cashIntensive.evidence,
      });
    }

    // ── Multiple Inward Transfers per month
    const highInwardMonths = monthlyMetrics.filter(m => m.creditCount > 15);
    if (highInwardMonths.length >= 2) {
      flags.push({
        type: 'MULTIPLE_INWARD_TRANSFERS',
        label: 'Excessive Inward Transfers',
        severity: 'medium',
        description: 'Unusually high number of credit transactions per month (>15) suggesting fragmented fund sources.',
        evidence: `${highInwardMonths.length} month(s) with >15 credit transactions`,
      });
    }

    // ── Multiple Outward Transfers per month
    const highOutwardMonths = monthlyMetrics.filter(m => m.debitCount > 15);
    if (highOutwardMonths.length >= 2) {
      flags.push({
        type: 'MULTIPLE_OUTWARD_TRANSFERS',
        label: 'Excessive Outward Transfers',
        severity: 'low',
        description: 'High number of debit transactions per month may indicate fund distribution activity.',
        evidence: `${highOutwardMonths.length} month(s) with >15 debit transactions`,
      });
    }

    // ── Returned Transactions
    const totalBounces = monthlyMetrics.reduce((s, m) => s + m.bounceCount, 0);
    if (totalBounces >= 2) {
      flags.push({
        type: 'RETURNED_TRANSACTIONS',
        label: 'Returned / Bounced Payments',
        severity: totalBounces >= 5 ? 'critical' : 'high',
        description: 'Multiple returned or bounced payments indicate potential payment default risk.',
        evidence: `${totalBounces} returned/bounced transaction(s) detected`,
      });
    }

    // ── Account Draining
    const draining = getBehaviour('ACCOUNT_DRAINING');
    if (draining?.detected) {
      flags.push({
        type: 'ACCOUNT_DRAINING',
        label: 'Systematic Account Draining',
        severity: 'critical',
        description: 'Balance consistently drained to near-zero at month-end — strong indicator of financial distress.',
        evidence: draining.evidence,
      });
    }

    return flags;
  }

  // ──────────────────────────────────────────────────────────
  // 8. EVV SCORE CALCULATION (0-100)
  // ──────────────────────────────────────────────────────────

  computeEVVScore(
    monthlyMetrics: MonthlyStatistics[],
    behaviours: FinancialBehaviour[],
    riskFlags: RiskFlag[],
  ): EVVScore {
    if (monthlyMetrics.length === 0) {
      return {
        score: 0,
        grade: 'D',
        gradeLabel: 'Very Poor',
        breakdown: [],
        summary: 'Insufficient data to compute EVV score',
      };
    }

    const avgBalances = monthlyMetrics.map(m => m.avgBalance);
    const overallAvgBalance = avgBalances.reduce((s, b) => s + b, 0) / avgBalances.length;

    const getBehaviour = (type: string) => behaviours.find(b => b.type === type);

    // ── Component 1: Average Balance Score (30%)
    // Benchmark: ₹1L = 100, ₹50k = 75, ₹25k = 55, ₹10k = 35, ₹5k = 20
    const avgBalanceScore = clampScore(
      overallAvgBalance >= 200000 ? 100 :
      overallAvgBalance >= 100000 ? 85 :
      overallAvgBalance >= 50000  ? 70 :
      overallAvgBalance >= 25000  ? 55 :
      overallAvgBalance >= 10000  ? 40 :
      overallAvgBalance >= 5000   ? 25 : 10
    );

    // ── Component 2: Balance Stability Score (20%)
    const avgBals = avgBalances;
    const mean = avgBals.reduce((s, b) => s + b, 0) / avgBals.length;
    const variance = avgBals.reduce((s, b) => s + Math.pow(b - mean, 2), 0) / avgBals.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 1; // Coefficient of Variation
    const balanceStabilityScore = clampScore(
      cv <= 0.1 ? 100 :
      cv <= 0.2 ? 85 :
      cv <= 0.35 ? 70 :
      cv <= 0.5  ? 55 :
      cv <= 0.75 ? 35 : 15
    );

    // ── Component 3: Income Consistency Score (15%)
    const salaryBehaviour = getBehaviour('SALARY_PATTERN');
    const salaryConsistency = salaryBehaviour?.confidence ?? 0;
    const incomeConsistencyScore = clampScore(
      salaryBehaviour?.detected ? salaryConsistency * 100 :
      getBehaviour('BUSINESS_INCOME')?.detected ? 60 :
      getBehaviour('RENTAL_INCOME')?.detected ? 55 : 30
    );

    // ── Component 4: Transaction Behaviour Score (10%)
    const totalBounces = monthlyMetrics.reduce((s, m) => s + m.bounceCount, 0);
    const hasCircular = getBehaviour('CIRCULAR_TRANSACTIONS')?.detected ?? false;
    const hasDraining = getBehaviour('ACCOUNT_DRAINING')?.detected ?? false;
    const txBehaviourScore = clampScore(
      100
      - (totalBounces * 15)
      - (hasCircular ? 30 : 0)
      - (hasDraining ? 25 : 0)
    );

    // ── Component 5: Liquidity Score (10%)
    const minBalances = monthlyMetrics.map(m => m.lowestBalance);
    const avgMinBalance = minBalances.reduce((s, b) => s + b, 0) / (minBalances.length || 1);
    const liquidityScore = clampScore(
      avgMinBalance >= 50000 ? 100 :
      avgMinBalance >= 20000 ? 80 :
      avgMinBalance >= 10000 ? 60 :
      avgMinBalance >= 5000  ? 45 :
      avgMinBalance >= 1000  ? 25 : 10
    );

    // ── Component 6: Existing EMI Score (5%) — lower EMI burden = higher score
    const totalEMIs = monthlyMetrics.reduce((s, m) => s + m.emiCount, 0);
    const avgEMIsPerMonth = totalEMIs / (monthlyMetrics.length || 1);
    const emiScore = clampScore(
      avgEMIsPerMonth === 0 ? 100 :
      avgEMIsPerMonth <= 1  ? 80 :
      avgEMIsPerMonth <= 2  ? 60 :
      avgEMIsPerMonth <= 4  ? 40 : 20
    );

    // ── Component 7: Minimum Balance Score (5%)
    const minBalViolations = monthlyMetrics.filter(m => m.lowestBalance < MIN_BALANCE_BENCHMARK).length;
    const minBalScore = clampScore(100 - (minBalViolations / (monthlyMetrics.length || 1)) * 100);

    // ── Component 8: Risk Flags Score (5%) — deductions per flag
    const flagSeverityDeductions: Record<string, number> = {
      critical: 25, high: 15, medium: 8, low: 3
    };
    const riskDeduction = riskFlags.reduce((s, f) => s + (flagSeverityDeductions[f.severity] ?? 5), 0);
    const riskFlagsScore = clampScore(100 - riskDeduction);

    // Compose final score
    const breakdown: EVVWeightBreakdown[] = [
      {
        component: 'Average Balance',
        weight: EVV_WEIGHTS.averageBalance,
        rawScore: avgBalanceScore,
        weightedScore: Math.round(avgBalanceScore * EVV_WEIGHTS.averageBalance),
        evidence: `Overall average: ₹${Math.round(overallAvgBalance).toLocaleString('en-IN')}`,
      },
      {
        component: 'Balance Stability',
        weight: EVV_WEIGHTS.balanceStability,
        rawScore: balanceStabilityScore,
        weightedScore: Math.round(balanceStabilityScore * EVV_WEIGHTS.balanceStability),
        evidence: `Coefficient of variation: ${(cv * 100).toFixed(1)}%`,
      },
      {
        component: 'Income Consistency',
        weight: EVV_WEIGHTS.incomeConsistency,
        rawScore: incomeConsistencyScore,
        weightedScore: Math.round(incomeConsistencyScore * EVV_WEIGHTS.incomeConsistency),
        evidence: salaryBehaviour?.detected
          ? `Salary detected in ${Math.round(salaryConsistency * 100)}% of months`
          : 'No regular salary pattern',
      },
      {
        component: 'Transaction Behaviour',
        weight: EVV_WEIGHTS.transactionBehaviour,
        rawScore: txBehaviourScore,
        weightedScore: Math.round(txBehaviourScore * EVV_WEIGHTS.transactionBehaviour),
        evidence: `${totalBounces} bounce(s), circular: ${hasCircular}, draining: ${hasDraining}`,
      },
      {
        component: 'Liquidity',
        weight: EVV_WEIGHTS.liquidity,
        rawScore: liquidityScore,
        weightedScore: Math.round(liquidityScore * EVV_WEIGHTS.liquidity),
        evidence: `Avg minimum monthly balance: ₹${Math.round(avgMinBalance).toLocaleString('en-IN')}`,
      },
      {
        component: 'Existing EMI Burden',
        weight: EVV_WEIGHTS.existingEmi,
        rawScore: emiScore,
        weightedScore: Math.round(emiScore * EVV_WEIGHTS.existingEmi),
        evidence: `${totalEMIs} EMI payment(s) detected (${avgEMIsPerMonth.toFixed(1)}/month)`,
      },
      {
        component: 'Minimum Balance Compliance',
        weight: EVV_WEIGHTS.minimumBalance,
        rawScore: minBalScore,
        weightedScore: Math.round(minBalScore * EVV_WEIGHTS.minimumBalance),
        evidence: `${minBalViolations} month(s) below minimum ₹${MIN_BALANCE_BENCHMARK.toLocaleString('en-IN')}`,
      },
      {
        component: 'Risk Flags',
        weight: EVV_WEIGHTS.riskFlags,
        rawScore: riskFlagsScore,
        weightedScore: Math.round(riskFlagsScore * EVV_WEIGHTS.riskFlags),
        evidence: riskFlags.length > 0 ? riskFlags.map(f => f.label).join(', ') : 'No risk flags',
      },
    ];

    const totalScore = clampScore(breakdown.reduce((s, b) => s + b.weightedScore, 0));

    const grade =
      totalScore >= 90 ? 'A+' :
      totalScore >= 80 ? 'A' :
      totalScore >= 65 ? 'B' :
      totalScore >= 50 ? 'C' : 'D';

    const gradeLabel =
      grade === 'A+' ? 'Excellent' :
      grade === 'A'  ? 'Good' :
      grade === 'B'  ? 'Average' :
      grade === 'C'  ? 'Below Average' : 'Poor';

    return {
      score: totalScore,
      grade,
      gradeLabel,
      breakdown,
      summary: `${gradeLabel} financial profile. Score: ${totalScore}/100. ${riskFlags.length > 0 ? `${riskFlags.length} risk flag(s) detected.` : 'No risk flags.'}`,
    };
  }

  // ──────────────────────────────────────────────────────────
  // 9. UNDERWRITING DECISION
  // ──────────────────────────────────────────────────────────

  generateUnderwritingDecision(
    evvScore: EVVScore,
    riskFlags: RiskFlag[],
    behaviours: FinancialBehaviour[],
    monthlyMetrics: MonthlyStatistics[],
  ): UnderwritingDecision {
    const criticalFlags = riskFlags.filter(f => f.severity === 'critical');
    const highFlags = riskFlags.filter(f => f.severity === 'high');
    const score = evvScore.score;

    const reasons: string[] = [];
    const conditions: string[] = [];
    const supportingEvidence: string[] = [];

    // Always add score context
    supportingEvidence.push(`EVV Score: ${score}/100 (Grade: ${evvScore.grade} — ${evvScore.gradeLabel})`);

    const totalBounces = monthlyMetrics.reduce((s, m) => s + m.bounceCount, 0);
    const avgBalance = monthlyMetrics.length > 0
      ? monthlyMetrics.reduce((s, m) => s + m.avgBalance, 0) / monthlyMetrics.length
      : 0;

    // REJECT conditions
    if (criticalFlags.length >= 2) {
      reasons.push(`${criticalFlags.length} critical risk flags detected`);
      criticalFlags.forEach(f => reasons.push(`• ${f.label}: ${f.evidence}`));
      return { decision: 'REJECT', decisionLabel: 'Reject', confidence: 'HIGH', reasons, supportingEvidence, riskLevel: 'CRITICAL' };
    }
    if (score < 30) {
      reasons.push(`EVV score ${score}/100 is critically low`);
      reasons.push(`Financial profile does not meet minimum lending criteria`);
      return { decision: 'REJECT', decisionLabel: 'Reject', confidence: 'HIGH', reasons, supportingEvidence, riskLevel: 'CRITICAL' };
    }

    // APPROVE conditions
    if (score >= 80 && criticalFlags.length === 0 && highFlags.length === 0 && totalBounces === 0) {
      reasons.push(`Strong EVV score of ${score}/100 (${evvScore.grade})`);
      reasons.push(`No critical or high severity risk flags`);
      reasons.push(`No returned or bounced payments`);
      if (avgBalance > 0) supportingEvidence.push(`Average monthly balance: ₹${Math.round(avgBalance).toLocaleString('en-IN')}`);
      return { decision: 'APPROVE', decisionLabel: 'Approve', confidence: 'HIGH', reasons, supportingEvidence, riskLevel: 'LOW' };
    }

    // APPROVE WITH CONDITIONS
    if (score >= 60 && criticalFlags.length === 0) {
      reasons.push(`Adequate EVV score of ${score}/100 with manageable risk profile`);
      if (highFlags.length > 0) {
        conditions.push(`Provide satisfactory explanation for: ${highFlags.map(f => f.label).join(', ')}`);
      }
      if (totalBounces > 0) {
        conditions.push(`Explain ${totalBounces} returned/bounced payment(s)`);
      }
      if (behaviours.find(b => b.type === 'CASH_INTENSIVE')?.detected) {
        conditions.push('Provide income proof to explain cash-intensive transaction pattern');
      }
      if (avgBalance > 0) supportingEvidence.push(`Average monthly balance: ₹${Math.round(avgBalance).toLocaleString('en-IN')}`);
      return {
        decision: 'APPROVE_WITH_CONDITIONS',
        decisionLabel: 'Approve with Conditions',
        confidence: 'MEDIUM',
        reasons,
        conditions,
        supportingEvidence,
        riskLevel: 'MEDIUM',
      };
    }

    // MANUAL REVIEW (default)
    reasons.push(`EVV score of ${score}/100 requires human review`);
    if (criticalFlags.length > 0) reasons.push(`${criticalFlags.length} critical flag(s) need investigation`);
    if (totalBounces > 0) reasons.push(`${totalBounces} returned payment(s) detected`);
    highFlags.forEach(f => reasons.push(`• ${f.label}`));
    return {
      decision: 'MANUAL_REVIEW',
      decisionLabel: 'Manual Review Required',
      confidence: 'LOW',
      reasons,
      conditions,
      supportingEvidence,
      riskLevel: 'HIGH',
    };
  }

  // ──────────────────────────────────────────────────────────
  // 10. FULL EVV ORCHESTRATION
  // ──────────────────────────────────────────────────────────

  async computeFullEvv(
    fileBuffer: Buffer,
    mimetype: string,
    originalName?: string,
    seed?: string,
  ): Promise<EVVReport> {
    this.logger.log(`[EVV Full] Starting full EVV computation for ${originalName}`);

    // Step 1: Extract
    const rawTransactions = await this.extractTransactions(fileBuffer, mimetype, originalName, seed);

    if (rawTransactions.length === 0) {
      return this.buildFailedReport('No transactions could be extracted from the statement.');
    }

    const transactions = rawTransactions.map(tx => ({
      ...tx,
      month: tx.date.slice(0, 7),
    }));

    // Step 2: Validate
    const openingBalance = 0; // Will be updated if AI extracts metadata
    const closingBalance = 0;
    const validation = this.validateExtractedData(transactions, openingBalance, closingBalance);

    if (!validation.isValid && transactions.length < 3) {
      return this.buildFailedReport(`Validation failed: ${validation.errors.join('; ')}`);
    }

    // Step 3: Daily balances
    const dailyBalances = this.reconstructDailyBalances(transactions, openingBalance);

    // Step 4: Snapshots (5-day continuous interval for EVV)
    const snapshots = this.calculateSnapshots(dailyBalances, 5);

    // Step 5: Monthly metrics
    const monthlyMetrics = this.calculateMonthlyMetrics(dailyBalances, transactions, snapshots);

    // Step 6: Behaviours
    const behaviours = this.detectFinancialBehaviour(transactions, monthlyMetrics);

    // Step 7: Risk flags
    const riskFlags = this.detectRiskFlags(transactions, behaviours, monthlyMetrics);

    // Step 8: EVV Score
    const evvScore = this.computeEVVScore(monthlyMetrics, behaviours, riskFlags);

    // Step 9: Underwriting decision
    const underwritingDecision = this.generateUnderwritingDecision(evvScore, riskFlags, behaviours, monthlyMetrics);

    // Step 10: Overall EVV balance (average of all snapshots)
    const overallEvv = snapshots.length > 0
      ? Math.round(snapshots.reduce((s, b) => s + b.balance, 0) / snapshots.length)
      : 0;

    // Period
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    const period = sorted.length > 0
      ? { from: formatPeriodDate(sorted[0].date), to: formatPeriodDate(sorted[sorted.length - 1].date) }
      : null;

    // Legacy monthly_evv (backward compat)
    const monthly_evv: EvvMonthBreakdown[] = monthlyMetrics.map(m => ({
      month: m.month,
      points: m.snapshotPoints,
      avg: m.snapshotAvg,
      min: m.snapshotMin,
      max: m.snapshotMax,
      evv: m.snapshotAvg,
      totalCredits: m.totalCredits,
      totalDebits: m.totalDebits,
      transactionCount: m.transactionCount,
      creditCount: m.creditCount,
      debitCount: m.debitCount,
    }));

    const totalSnapshots = snapshots.length;

    return {
      bankName: undefined,
      accountNumber: undefined,
      accountHolder: undefined,
      ifsc: undefined,
      statementPeriod: period
        ? { from: sorted[0].date, to: sorted[sorted.length - 1].date }
        : undefined,
      openingBalance,
      closingBalance,

      transactions,
      totalTransactions: transactions.length,

      validation,
      dailyBalances,
      snapshots,
      monthlyMetrics,
      behaviours,
      riskFlags,

      evvScore,
      overallEvv,
      period,
      status: 'COMPUTED',

      underwritingDecision,
      monthly_evv,
      totalSnapshots,
    };
  }

  private buildFailedReport(reason: string): EVVReport {
    return {
      openingBalance: 0,
      closingBalance: 0,
      transactions: [],
      totalTransactions: 0,
      validation: { isValid: false, confidenceScore: 0, checks: [], warnings: [], errors: [reason] },
      dailyBalances: [],
      snapshots: [],
      monthlyMetrics: [],
      behaviours: [],
      riskFlags: [],
      evvScore: { score: 0, grade: 'D', gradeLabel: 'Poor', breakdown: [], summary: reason },
      overallEvv: 0,
      period: null,
      status: 'MANUAL_REVIEW',
      underwritingDecision: {
        decision: 'MANUAL_REVIEW',
        decisionLabel: 'Manual Review Required',
        confidence: 'LOW',
        reasons: [reason],
        supportingEvidence: [],
        riskLevel: 'HIGH',
      },
      monthly_evv: [],
      totalSnapshots: 0,
    };
  }

  // ──────────────────────────────────────────────────────────
  // LEGACY: computeEvv (backward compat — still used by simple path)
  // ──────────────────────────────────────────────────────────

  computeEvv(transactions: Transaction[]): EvvResults {
    if (!transactions || transactions.length === 0) {
      return { overall_evv: 0, monthly_evv: [], totalSnapshots: 0, totalTransactions: 0, period: null, status: 'FAILED' };
    }

    try {
      const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const monthsSet = new Set<string>();
      sorted.forEach(tx => { if (/^\d{4}-\d{2}-\d{2}$/.test(tx.date)) monthsSet.add(tx.date.slice(0, 7)); });
      const months = Array.from(monthsSet).sort();

      if (months.length === 0) {
        return { overall_evv: 0, monthly_evv: [], totalSnapshots: 0, totalTransactions: transactions.length, period: null, status: 'FAILED' };
      }

      const firstDate = sorted[0].date;
      const lastDate = sorted[sorted.length - 1].date;
      const monthlyBreakdown: EvvMonthBreakdown[] = [];
      let totalEvvSum = 0;
      let totalSnapshots = 0;

      const getBalanceOnDate = (targetDateStr: string): number => {
        const targetTime = new Date(targetDateStr).getTime();
        let lastTx: Transaction | null = null;
        for (const tx of sorted) {
          if (new Date(tx.date).getTime() <= targetTime) lastTx = tx;
          else break;
        }
        if (lastTx) return lastTx.balance;
        if (sorted.length > 0) {
          const f = sorted[0];
          return Math.max(0, f.balance + (f.type === 'credit' ? -f.amount : f.amount));
        }
        return 0;
      };

      for (const m of months) {
        const snapshotDays = [1, 10, 15, 20, 25];
        const snapshotBalances = snapshotDays.map(day => {
          const dayStr = String(day).padStart(2, '0');
          return getBalanceOnDate(`${m}-${dayStr}`);
        });
        const points = snapshotBalances.length;
        const avg = Math.round(snapshotBalances.reduce((s, b) => s + b, 0) / points);
        const min = Math.min(...snapshotBalances);
        const max = Math.max(...snapshotBalances);
        totalSnapshots += points;
        monthlyBreakdown.push({ month: m, points, avg, min, max, evv: avg });
        totalEvvSum += avg;
      }

      const overallEvv = Math.round(totalEvvSum / months.length);
      return {
        overall_evv: overallEvv,
        monthly_evv: monthlyBreakdown,
        totalSnapshots,
        totalTransactions: transactions.length,
        period: { from: formatPeriodDate(firstDate), to: formatPeriodDate(lastDate) },
        status: 'COMPUTED',
      };
    } catch (err: any) {
      this.logger.error(`[EVV Legacy] computeEvv error: ${err.message}`);
      return { overall_evv: 0, monthly_evv: [], totalSnapshots: 0, totalTransactions: 0, period: null, status: 'FAILED' };
    }
  }

  // ──────────────────────────────────────────────────────────
  // MOCK TRANSACTION GENERATOR (dev / no API key)
  // ──────────────────────────────────────────────────────────

  generateMockTransactions(fileName?: string, seed?: string): ExtractedTransaction[] {
    let numMonths = 6;
    const name = (fileName || '').toLowerCase();
    const match = name.match(/(\d+)\s*month/);
    if (match?.[1]) numMonths = parseInt(match[1], 10);
    else if (name.includes('3')) numMonths = 3;
    else if (name.includes('12')) numMonths = 12;

    const randSeed = seed || fileName || String(Math.random());
    const rand = this.getSeededRandom(randSeed);
    this.logger.log(`[EVV Mock] Generating ${numMonths} months with seed: ${randSeed}`);

    const currentDate = new Date();
    let balance = Math.round(30000 + rand() * 70000);
    const txs: ExtractedTransaction[] = [];

    const channels = ['UPI', 'NEFT', 'RTGS', 'IMPS', 'CASH', 'CHEQUE'] as const;
    const salaryNarrations = ['SALARY CREDIT', 'PAYROLL CR', 'SAL/EMP001'];
    const debitNarrations = ['UPI/FOOD DELIVERY', 'NEFT/EMI DEBIT', 'ATM WD', 'UPI/RENT', 'UPI/UTILITY'];
    const creditNarrations = ['NEFT/BUSINESS', 'UPI/FREELANCE', 'IMPS/TRANSFER'];

    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const y = d.getFullYear();
      const mo = d.getMonth();
      const monthStr = `${y}-${String(mo + 1).padStart(2, '0')}`;

      // Salary credit (1st week)
      const salaryAmt = Math.round(30000 + rand() * 20000);
      balance += salaryAmt;
      txs.push({
        date: `${monthStr}-03`, narration: salaryNarrations[Math.floor(rand() * salaryNarrations.length)],
        debit: 0, credit: salaryAmt, balance, amount: salaryAmt, type: 'credit',
        channel: 'NEFT', month: monthStr,
      });

      // EMI debit
      const emiAmt = Math.round(8000 + rand() * 5000);
      balance -= emiAmt;
      txs.push({
        date: `${monthStr}-05`, narration: 'EMI/LOAN DEBIT/NACH',
        debit: emiAmt, credit: 0, balance, amount: emiAmt, type: 'debit',
        channel: 'NACH', month: monthStr,
      });

      // Various credits and debits mid-month
      for (let d2 = 0; d2 < 3 + Math.floor(rand() * 3); d2++) {
        const isCredit = rand() > 0.55;
        const amt = Math.round(1000 + rand() * 12000);
        const day = String(8 + Math.floor(rand() * 12)).padStart(2, '0');
        if (isCredit) {
          balance += amt;
          txs.push({
            date: `${monthStr}-${day}`,
            narration: creditNarrations[Math.floor(rand() * creditNarrations.length)],
            debit: 0, credit: amt, balance, amount: amt, type: 'credit',
            channel: channels[Math.floor(rand() * channels.length)], month: monthStr,
          });
        } else {
          balance -= amt;
          txs.push({
            date: `${monthStr}-${day}`,
            narration: debitNarrations[Math.floor(rand() * debitNarrations.length)],
            debit: amt, credit: 0, balance, amount: amt, type: 'debit',
            channel: channels[Math.floor(rand() * channels.length)], month: monthStr,
          });
        }
      }

      // Month-end debit
      const endDebit = Math.round(2000 + rand() * 6000);
      balance -= endDebit;
      txs.push({
        date: `${monthStr}-28`, narration: 'UPI/MISC PAYMENT',
        debit: endDebit, credit: 0, balance, amount: endDebit, type: 'debit',
        channel: 'UPI', month: monthStr,
      });
    }

    return txs.sort((a, b) => a.date.localeCompare(b.date));
  }

  private getSeededRandom(seed: string) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    return function () {
      h = Math.imul(h ^ h >>> 16, 2246822507) | 0;
      h = Math.imul(h ^ h >>> 13, 3266489909) | 0;
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }
}
