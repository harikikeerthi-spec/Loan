import { EvvEngineService, Transaction } from '../src/application/evv-engine';

const transactions: Transaction[] = [
  // Jan 2026 transactions
  { date: '2026-01-01', amount: 10000, type: 'credit', balance: 10000 },
  { date: '2026-01-06', amount: 5000, type: 'credit', balance: 15000 },
  { date: '2026-01-16', amount: 2000, type: 'debit', balance: 13000 },
  { date: '2026-01-26', amount: 7000, type: 'credit', balance: 20000 },

  // Feb 2026 transactions
  { date: '2026-02-04', amount: 10000, type: 'debit', balance: 10000 },
  { date: '2026-02-12', amount: 8000, type: 'credit', balance: 18000 },
  { date: '2026-02-22', amount: 3000, type: 'debit', balance: 15000 }
];

const engine = new EvvEngineService(null as any);
const results = engine.computeEvv(transactions);
console.log('Results:', JSON.stringify(results, null, 2));

// Manually verify Jan 2026 calculation:
// Snapshots on 5th, 10th, 15th, 20th, 25th, 30th
// 5th: last transaction date is Jan 01 -> balance = 10000
// 10th: last transaction date is Jan 06 -> balance = 15000
// 15th: last transaction date is Jan 06 -> balance = 15000
// 20th: last transaction date is Jan 16 -> balance = 13000
// 25th: last transaction date is Jan 16 -> balance = 13000
// 30th: last transaction date is Jan 26 -> balance = 20000
// Sum = 10000 + 15000 + 15000 + 13000 + 13000 + 20000 = 86000
// Average = 86000 / 6 = 14333.33 -> rounded = 14333

// Manually verify Feb 2026 calculation:
// 5th: last transaction date is Feb 04 -> balance = 10000
// 10th: last transaction date is Feb 04 -> balance = 10000
// 15th: last transaction date is Feb 12 -> balance = 18000
// 20th: last transaction date is Feb 12 -> balance = 18000
// 25th: last transaction date is Feb 22 -> balance = 15000
// 30th: last transaction date is Feb 22 -> balance = 15000
// Sum = 10000 + 10000 + 18000 + 18000 + 15000 + 15000 = 86000
// Average = 86000 / 6 = 14333.33 -> rounded = 14333

// Overall = (14333 + 14333) / 2 = 14333
const expectedOverall = 14333;

if (results.overall_evv === expectedOverall) {
  console.log('SUCCESS: EVV engine calculation verified correctly!');
} else {
  console.error(`FAILED: Expected overall EVV to be ${expectedOverall}, got ${results.overall_evv}`);
}
