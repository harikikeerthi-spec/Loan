"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { assignmentApi } from "@/lib/api";
import { PageHeader, DataTable, StatusBadge, Spinner, ColumnDef } from "@/components/bank/SharedUI";
import { format } from "date-fns";

export default function MyApplications() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      const res: any = await assignmentApi.getMyApplications();
      if (res?.success && Array.isArray(res.data)) {
        setApplications(res.data);
      } else if (Array.isArray(res)) {
        setApplications(res);
      } else if (Array.isArray(res?.data)) {
        setApplications(res.data);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      header: "Application",
      accessorKey: "firstName",
      sortable: true,
      cell: (row: any) => (
        <div>
          <div className="font-bold text-slate-900 text-[14px]">
            {row.firstName ? `${row.firstName} ${row.lastName || ""}` : (row.applicantName || "N/A")}
          </div>
          <div className="text-xs text-indigo-600 font-mono font-medium mt-0.5">
            {row.applicationNumber || `#${row.id?.substring(0, 8)}`}
          </div>
        </div>
      ),
    },
    {
      header: "Assigned At",
      accessorKey: "assignedAt",
      sortable: true,
      cell: (row: any) => (
        <span className="text-xs font-medium text-slate-600">
          {row.assignedAt ? format(new Date(row.assignedAt), "MMM d, yyyy h:mm a") : "N/A"}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      header: "Type",
      accessorKey: "loanType",
      sortable: true,
      cell: (row: any) => (
        <span className="text-xs font-semibold text-slate-700 capitalize bg-slate-100 px-2.5 py-1 rounded-md">
          {row.loanType?.replace('_', ' ') || 'Education Loan'}
        </span>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="My Task Queue"
        description="Loan applications currently assigned to you for review and processing."
        moduleName="Bank Portal"
        icon="assignment_ind"
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4">
        {loading ? (
          <Spinner message="Loading assigned task queue..." />
        ) : (
          <DataTable
            columns={columns}
            data={applications}
            emptyMessage="No applications are currently assigned to you."
            onRowClick={(row) => router.push(`/bank/applications?id=${row.id}`)}
          />
        )}
      </div>
    </div>
  );
}
