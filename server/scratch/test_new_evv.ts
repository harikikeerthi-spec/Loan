import { EvvEngineService, ExtractedTransaction } from '../src/application/evv-engine';

// Mock transactions representing a standard 6-month statement
// Period: 2026-01-01 to 2026-07-01 (181 days total)
const transactions: ExtractedTransaction[] = [
  {
    date: '2026-01-01', narration: 'Initial deposit', debit: 0, credit: 50000, balance: 50000,
    amount: 50000, type: 'credit', channel: 'ONLINE', referenceNumber: '', month: '2026-01'
  },
  {
    date: '2026-01-15', narration: 'Withdrawal', debit: 20000, credit: 0, balance: 30000,
    amount: 20000, type: 'debit', channel: 'CASH', referenceNumber: '', month: '2026-01'
  },
  {
    date: '2026-06-30', narration: 'Closing entry', debit: 0, credit: 10000, balance: 40000,
    amount: 10000, type: 'credit', channel: 'ONLINE', referenceNumber: '', month: '2026-06'
  },
  {
    date: '2026-07-01', narration: 'July first', debit: 0, credit: 0, balance: 40000,
    amount: 0, type: 'credit', channel: 'ONLINE', referenceNumber: '', month: '2026-07'
  }
];

async function runTest() {
  const engine = new EvvEngineService(null as any);
  console.log('Testing computeFullEvv...');
  
  // Directly calling the calculation logic (mock statement buffer)
  const report = await engine.computeFullEvv(Buffer.from(''), 'application/pdf', 'statement.pdf');
  
  console.log('\n--- CALCULATED REPORT ---');
  console.log('Overall EVV (MAB):', report.overallEvv);
  console.log('Total Snapshots:', report.totalSnapshots);
  console.log('Total Transactions:', report.totalTransactions);
  console.log('Period:', report.period);
  console.log('\nMonthly Breakdown:');
  for (const m of report.monthly_evv) {
    console.log(`Month: ${m.month} | Points: ${m.points} | Avg: ${m.avg} | Min: ${m.min} | Max: ${m.max}`);
  }
  
  console.log('\nVerification checklist:');
  const janStats = report.monthly_evv.find(m => m.month === '2026-01');
  if (janStats) {
    console.log(`- Jan 2026 Points count: ${janStats.points} (Expected: 7)`);
    if (janStats.points === 7) {
      console.log('  SUCCESS: January points count verified!');
    } else {
      console.error('  FAILED: January points count mismatch.');
    }
  } else {
    console.error('  FAILED: January stats not found.');
  }

  // Check overall snapshots count:
  console.log(`- Total snapshots: ${report.totalSnapshots} (Expected: 37)`);
  if (report.totalSnapshots === 37) {
    console.log('  SUCCESS: Total snapshots count verified!');
  } else {
    console.error('  FAILED: Total snapshots count mismatch.');
  }
}

runTest().catch(console.error);
