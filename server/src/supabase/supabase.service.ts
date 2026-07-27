import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as https from 'https';
import * as dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // ignore if unsupported
}

const normalizeHeaders = (h: any) => {
  if (!h) return {};
  const obj: Record<string, string> = {};
  if (typeof h.forEach === 'function') {
    h.forEach((v: string, k: string) => {
      obj[k] = v;
    });
    return obj;
  }
  return h;
};

// High-performance IPv4 HTTPS fetch wrapper for Supabase REST API
const customIPv4Fetch = async (url: string | URL, options: any = {}) => {
  const parsed = typeof url === 'string' ? new URL(url) : url;
  return new Promise<Response>((resolve, reject) => {
    const headers = normalizeHeaders(options.headers);
    const req = https.request(
      parsed,
      {
        method: options.method || 'GET',
        headers,
        family: 4, // Explicitly force IPv4 socket connection to avoid 10s-20s IPv6 timeouts
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString();
          const headerObj: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (v) headerObj[k] = Array.isArray(v) ? v.join(', ') : v;
          }
          const statusCode = res.statusCode || 200;
          const nullBodyStatuses = [204, 205, 304];
          const responseBody = nullBodyStatuses.includes(statusCode) ? null : body;
          resolve(
            new Response(responseBody, {
              status: statusCode,
              statusText: res.statusMessage,
              headers: headerObj,
            }),
          );
        });
      },
    );
    req.on('error', (err) => {
      console.error('[SupabaseIPv4Fetch] Request error:', err);
      reject(err);
    });
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
};

@Injectable()
export class SupabaseService {
  public readonly client: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables',
      );
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: {
        fetch: customIPv4Fetch as any,
      },
    });
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  from(table: string) {
    return this.client.from(table);
  }
}
