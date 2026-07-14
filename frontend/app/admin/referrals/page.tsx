import React from 'react';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import AdminReferralsClient from './AdminReferralsClient';

async function getAdminData(token: string) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const [statsRes, listRes] = await Promise.all([
      fetch(`${backendUrl}/api/referral/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
        next: { revalidate: 0 }
      }),
      fetch(`${backendUrl}/api/referral/admin/list`, {
        headers: { 'Authorization': `Bearer ${token}` },
        next: { revalidate: 0 }
      })
    ]);

    if (!statsRes.ok || !listRes.ok) {
      return null;
    }

    const stats = await statsRes.json();
    const list = await listRes.json();

    return {
      stats: stats.stats,
      referrals: list.referrals
    };
  } catch (error) {
    console.error('[AdminReferralsPage] Fetch failed:', error);
    return null;
  }
}

export default async function AdminReferralsPage() {
  const cookieStore = await cookies();
  // Get token either from adminAccessToken or regular accessToken
  const token = cookieStore.get('adminAccessToken')?.value || cookieStore.get('accessToken')?.value;

  if (!token) {
    notFound();
  }

  const data = await getAdminData(token);
  if (!data) {
    notFound();
  }

  return (
    <AdminReferralsClient 
      initialStats={data.stats}
      initialReferrals={data.referrals}
      token={token}
    />
  );
}
