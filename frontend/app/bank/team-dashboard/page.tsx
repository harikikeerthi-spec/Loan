"use client";

import { useState, useEffect } from "react";
import { assignmentApi } from "@/lib/api";
import { PageHeader, DataTable, Spinner, ColumnDef } from "@/components/bank/SharedUI";

export default function TeamDashboard() {
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<any[]>([]);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const res: any = await assignmentApi.getTeamDashboard();
      if (res?.success && Array.isArray(res.data)) {
        setTeamData(res.data);
      } else if (Array.isArray(res)) {
        setTeamData(res);
      } else if (Array.isArray(res?.data)) {
        setTeamData(res.data);
      } else {
        setTeamData([]);
      }
    } catch (err) {
      console.error("Failed to fetch team data:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (staffId: string, currentStatus: boolean) => {
    try {
      await assignmentApi.updateStaffAvailability(staffId, {
        isAvailable: !currentStatus
      });
      fetchTeamData();
    } catch (err) {
      console.error("Failed to update availability:", err);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      header: "Staff Member",
      accessorKey: "name",
      sortable: true,
      cell: (row: any) => (
        <div>
          <div className="font-bold text-slate-900 text-[14px]">{row.name}</div>
          <div className="text-xs text-slate-500 font-sans">{row.email}</div>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "isAvailable",
      sortable: true,
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          {row.isOnLeave ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
              On Leave
            </span>
          ) : row.isAvailable ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
              Available
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800">
              Offline
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Current Workload",
      accessorKey: "currentWorkload",
      sortable: true,
      cell: (row: any) => {
        const max = row.maxWorkload || 10;
        const current = row.currentWorkload || 0;
        const ratio = current / max;
        return (
          <div className="flex items-center gap-2">
            <div className="w-full bg-slate-200 rounded-full h-2 max-w-[100px]">
              <div
                className={`h-2 rounded-full ${
                  ratio > 0.8
                    ? 'bg-red-500'
                    : ratio > 0.5
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, ratio * 100)}%` }}
              ></div>
            </div>
            <span className="text-xs font-semibold text-slate-700">
              {current} / {max}
            </span>
          </div>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "id",
      sortable: false,
      cell: (row: any) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleAvailability(row.id, row.isAvailable);
          }}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition-colors"
        >
          {row.isAvailable ? 'Mark Offline' : 'Mark Available'}
        </button>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Team Workload Dashboard"
        description="Monitor staff availability and manage application assignments."
        moduleName="Bank Portal"
        icon="groups"
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4">
        {loading ? (
          <Spinner message="Loading team workload data..." />
        ) : (
          <DataTable
            columns={columns}
            data={teamData}
            emptyMessage="No team members found."
          />
        )}
      </div>
    </div>
  );
}
