import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterService } from '../ai/services/openrouter.service';

export interface Transaction {
  date: string; // YYYY-MM-DD
  amount: number;
  type: 'credit' | 'debit';
  balance: number;
}

export interface EvvResults {
  overall_evv: number;
  monthly_evv: Array<{ month: string; evv: number }>;
  status: 'COMPUTED' | 'FAILED' | 'MANUAL_REVIEW';
}

@Injectable()
export class EvvEngineService {
  private readonly logger = new Logger(EvvEngineService.name);

  constructor(private readonly openRouter: OpenRouterService) {}

  /**
   * Extract transactions from a bank statement buffer using OpenRouter vision capability.
   */
  async extractTransactions(fileBuffer: Buffer, mimetype: string): Promise<Transaction[]> {
    this.logger.log(`Extracting transactions from bank statement with mimetype ${mimetype}`);

    const base64Data = fileBuffer.toString('base64');
    const dataUrl = `data:${mimetype};base64,${base64Data}`;

    const prompt = `
Extract the transaction history from this bank statement.
Analyze the document and locate all transaction entries.
For each transaction, extract:
- Date of transaction (in YYYY-MM-DD format)
- Amount of transaction (as a positive number)
- Transaction Type ('credit' or 'debit')
- Balance in account after this transaction (as a number)

Return a JSON object containing a "transactions" list:
{
  "transactions": [
    {
      "date": "2026-01-05",
      "amount": 1000,
      "type": "credit",
      "balance": 55000
    },
    ...
  ]
}

If no transactions can be found or the file is invalid, return:
{
  "transactions": [],
  "error": "No transactions found or document type mismatch"
}

IMPORTANT: Respond ONLY with a valid JSON object. Do not include markdown formatting.
`;

    try {
      const responseStr = await this.openRouter.chatWithVision(prompt, dataUrl, 'google/gemini-2.5-flash');
      this.logger.log(`OpenRouter response for statement parsing: ${responseStr.slice(0, 300)}...`);

      // Clean the response string to parse JSON
      let cleaned = responseStr.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        throw new Error('No JSON structure found in vision response');
      }

      const jsonString = cleaned.slice(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonString);

      if (parsed.error) {
        this.logger.warn(`AI parsing reported error: ${parsed.error}`);
        return [];
      }

      if (Array.isArray(parsed.transactions)) {
        return parsed.transactions.map((tx: any) => ({
          date: String(tx.date || ''),
          amount: Number(tx.amount || 0),
          type: String(tx.type || '').toLowerCase() === 'credit' ? 'credit' : 'debit',
          balance: Number(tx.balance || 0),
        }));
      }

      return [];
    } catch (error) {
      this.logger.error(`Failed to parse bank statement using OpenRouter: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run the 5-day snapshot loop calculation:
   * check balance on 5th, 10th, 15th, 20th, 25th, and 30th of each month,
   * average these snapshots to compute monthly EVV, and average monthly EVVs for overall.
   */
  computeEvv(transactions: Transaction[]): EvvResults {
    if (!transactions || transactions.length === 0) {
      return {
        overall_evv: 0,
        monthly_evv: [],
        status: 'FAILED',
      };
    }

    try {
      // Sort transactions by date ascending
      const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Get range of months present in transactions
      // Formats: "YYYY-MM"
      const monthsSet = new Set<string>();
      sortedTxs.forEach(tx => {
        if (tx.date && tx.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          monthsSet.add(tx.date.slice(0, 7));
        }
      });

      const months = Array.from(monthsSet).sort();
      if (months.length === 0) {
        return {
          overall_evv: 0,
          monthly_evv: [],
          status: 'FAILED',
        };
      }

      const monthlyEvvs: Array<{ month: string; evv: number }> = [];
      let totalEvvSum = 0;

      // Function to find balance on a specific YYYY-MM-DD date
      const getBalanceOnDate = (targetDateStr: string): number => {
        const targetTime = new Date(targetDateStr).getTime();
        // Find last transaction that happened on or before the target date
        let lastTx: Transaction | null = null;
        for (const tx of sortedTxs) {
          const txTime = new Date(tx.date).getTime();
          if (txTime <= targetTime) {
            lastTx = tx;
          } else {
            break; // Since transactions are sorted by date
          }
        }

        if (lastTx) {
          return lastTx.balance;
        }

        // If no transactions before target date, default to opening balance
        if (sortedTxs.length > 0) {
          const firstTx = sortedTxs[0];
          const offset = firstTx.type === 'credit' ? -firstTx.amount : firstTx.amount;
          return Math.max(0, firstTx.balance + offset);
        }

        return 0;
      };

      for (const m of months) {
        // We take snapshot on 5th, 10th, 15th, 20th, 25th, and 30th
        const snapshotDays = [5, 10, 15, 20, 25, 30];
        let snapshotSum = 0;

        for (const day of snapshotDays) {
          const dayStr = String(day).padStart(2, '0');
          const dateStr = `${m}-${dayStr}`;
          const balance = getBalanceOnDate(dateStr);
          snapshotSum += balance;
        }

        const monthlyAvg = Math.round(snapshotSum / snapshotDays.length);
        monthlyEvvs.push({ month: m, evv: monthlyAvg });
        totalEvvSum += monthlyAvg;
      }

      const overallEvv = Math.round(totalEvvSum / months.length);

      return {
        overall_evv: overallEvv,
        monthly_evv: monthlyEvvs,
        status: 'COMPUTED',
      };
    } catch (err) {
      this.logger.error(`Error in computeEvv calculation: ${err.message}`);
      return {
        overall_evv: 0,
        monthly_evv: [],
        status: 'FAILED',
      };
    }
  }
}
