const { EvvEngineService } = require('../dist/application/evv-engine');

function generateDailyBalances(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const daily = [];
  const cursor = new Date(start);
  
  // Let's create a balance that changes in a predictable way: e.g. starts at 10000 and goes up by 500 each day
  let balance = 10000;
  while (cursor <= end) {
    daily.push({
      date: cursor.toISOString().slice(0, 10),
      balance: balance,
      isTransactionDay: true
    });
    balance += 500;
    cursor.setDate(cursor.getDate() + 1);
  }
  return daily;
}

async function runTest() {
  const engine = new EvvEngineService(null);
  console.log('Testing custom date range snapshotting directly...');
  
  // 182 days: Jan 1 to Jul 1 inclusive (Jan 31, Feb 28, Mar 31, Apr 30, May 31, Jun 30, Jul 1)
  const dailyBalances = generateDailyBalances('2026-01-01', '2026-07-01');
  console.log(`Generated ${dailyBalances.length} daily balances from 2026-01-01 to 2026-07-01.`);
  
  const snapshots = engine.calculateSnapshots(dailyBalances, 5);
  console.log(`Generated ${snapshots.length} snapshots using 5-day interval.`);
  
  // Let's see all snapshot dates:
  console.log('Snapshot dates:', snapshots.map(s => s.date));
  
  const monthlyMetrics = engine.calculateMonthlyMetrics(dailyBalances, [], snapshots);
  
  console.log('\nMonthly Metrics Breakdown:');
  for (const m of monthlyMetrics) {
    console.log(`Month: ${m.month} | Points: ${m.snapshotPoints} | Avg: ${m.snapshotAvg} | Min: ${m.snapshotMin} | Max: ${m.snapshotMax}`);
  }
  
  console.log('\nVerification:');
  const janStats = monthlyMetrics.find(m => m.month === '2026-01');
  if (janStats) {
    console.log(`- Jan 2026 Points count: ${janStats.snapshotPoints} (Expected: 7)`);
    if (janStats.snapshotPoints === 7) {
      console.log('  SUCCESS: January points count verified!');
    } else {
      console.error('  FAILED: January points count mismatch.');
    }
  } else {
    console.error('  FAILED: January stats not found.');
  }

  console.log(`- Total snapshots: ${snapshots.length} (Expected: 37)`);
  if (snapshots.length === 37) {
    console.log('  SUCCESS: Total snapshots count verified!');
  } else {
    console.error('  FAILED: Total snapshots count mismatch.');
  }
}

runTest().catch(console.error);
