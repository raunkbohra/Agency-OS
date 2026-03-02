'use client';

import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';

interface Deliverable {
  id: string;
  client_id: string;
  client_name?: string;
  title: string;
  status: string;
  month_year: string;
  due_date: string | null;
}

interface DeliverableCalendarProps {
  deliverables: Deliverable[];
}

const STATUSES = [
  'draft',
  'in_review',
  'approved',
  'changes_requested',
  'done',
] as const;

type Status = (typeof STATUSES)[number];

const STATUS_LABELS: Record<Status, string> = {
  draft: 'Draft',
  in_review: 'In Review',
  approved: 'Approved',
  changes_requested: 'Changes Requested',
  done: 'Done',
};

const STATUS_STYLES: Record<Status, { pill: string; dot: string }> = {
  draft: {
    pill: 'bg-bg-hover text-text-primary',
    dot: 'bg-text-tertiary',
  },
  in_review: {
    pill: 'bg-accent-blue/10 text-accent-blue',
    dot: 'bg-accent-blue',
  },
  approved: {
    pill: 'bg-accent-green/10 text-accent-green',
    dot: 'bg-accent-green',
  },
  changes_requested: {
    pill: 'bg-accent-amber/10 text-accent-amber',
    dot: 'bg-accent-amber',
  },
  done: {
    pill: 'bg-accent-purple/10 text-accent-purple',
    dot: 'bg-accent-purple',
  },
};

function formatMonthYear(monthYear: string): string {
  const [year, month] = monthYear.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const COMPLETED_STATUSES = new Set<string>(['done', 'approved']);

interface CellData {
  count: number;
  completedCount: number;
}

interface CalendarGridData {
  months: string[];
  cells: Record<string, Record<string, CellData>>;
  monthTotals: Record<string, { total: number; completedCount: number }>;
}

function buildCalendarGrid(deliverables: Deliverable[]): CalendarGridData {
  const monthSet = new Set<string>();
  const cells: Record<string, Record<string, CellData>> = {};
  const monthTotals: Record<string, { total: number; completedCount: number }> = {};

  for (const status of STATUSES) {
    cells[status] = {};
  }

  for (const d of deliverables) {
    const { status, month_year } = d;
    if (!month_year) continue;

    monthSet.add(month_year);

    const targetStatus = STATUSES.includes(status as Status) ? status : 'draft';
    if (!cells[targetStatus][month_year]) {
      cells[targetStatus][month_year] = { count: 0, completedCount: 0 };
    }
    cells[targetStatus][month_year].count += 1;
    if (COMPLETED_STATUSES.has(status)) {
      cells[targetStatus][month_year].completedCount += 1;
    }

    if (!monthTotals[month_year]) {
      monthTotals[month_year] = { total: 0, completedCount: 0 };
    }
    monthTotals[month_year].total += 1;
    if (COMPLETED_STATUSES.has(status)) {
      monthTotals[month_year].completedCount += 1;
    }
  }

  const months = Array.from(monthSet).sort();

  return { months, cells, monthTotals };
}

export default function DeliverableCalendar({ deliverables }: DeliverableCalendarProps) {
  const { months, cells, monthTotals } = useMemo(
    () => buildCalendarGrid(deliverables),
    [deliverables]
  );

  if (deliverables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-bg-secondary rounded-xl border border-border-default">
        <div className="rounded-xl bg-bg-tertiary p-4 mb-4">
          <CalendarDays className="h-8 w-8 text-text-tertiary" />
        </div>
        <h3 className="text-md font-medium text-text-primary mb-1">No deliverables to display</h3>
        <p className="text-sm text-text-secondary max-w-sm">
          Adjust your filters or create a new deliverable to see the calendar view.
        </p>
      </div>
    );
  }

  if (months.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-bg-secondary rounded-xl border border-border-default">
        <div className="rounded-xl bg-bg-tertiary p-4 mb-4">
          <CalendarDays className="h-8 w-8 text-text-tertiary" />
        </div>
        <h3 className="text-md font-medium text-text-primary mb-1">No month data available</h3>
        <p className="text-sm text-text-secondary max-w-sm">
          Deliverables without a month assignment will not appear in calendar view.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: `${180 + months.length * 120}px` }}>
          <thead>
            <tr className="bg-bg-tertiary border-b border-border-default">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-bg-tertiary px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide border-r border-border-default w-44"
              >
                Status
              </th>
              {months.map((month) => (
                <th
                  key={month}
                  scope="col"
                  className="px-3 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wide min-w-[112px]"
                >
                  {formatMonthYear(month)}
                </th>
              ))}
            </tr>

            <tr className="bg-bg-tertiary border-b-2 border-border-default">
              <td className="sticky left-0 z-10 bg-bg-tertiary px-4 py-2 text-xs text-text-tertiary font-medium border-r border-border-default">
                Completion
              </td>
              {months.map((month) => {
                const totals = monthTotals[month] ?? { total: 0, completedCount: 0 };
                const pct = totals.total === 0 ? 0 : Math.round((totals.completedCount / totals.total) * 100);
                return (
                  <td key={month} className="px-3 py-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-text-primary">{pct}%</span>
                      <div className="w-full h-1 bg-bg-hover rounded-full overflow-hidden">
                        <div
                          className="h-1 bg-accent-green rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-text-tertiary">
                        {totals.completedCount}/{totals.total}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-border-default">
            {STATUSES.map((status) => {
              const styles = STATUS_STYLES[status];
              return (
                <tr key={status} className="hover:bg-bg-hover transition-colors">
                  <td className="sticky left-0 z-10 bg-bg-secondary hover:bg-bg-hover px-4 py-3 border-r border-border-default transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${styles.dot}`} />
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${styles.pill}`}>
                        {STATUS_LABELS[status]}
                      </span>
                    </div>
                  </td>

                  {months.map((month) => {
                    const cell = cells[status][month];
                    const count = cell?.count ?? 0;
                    const completedCount = cell?.completedCount ?? 0;
                    const cellPct = count === 0 ? 0 : Math.round((completedCount / count) * 100);

                    if (count === 0) {
                      return (
                        <td key={month} className="px-3 py-3 text-center">
                          <span className="text-text-quaternary text-xs">—</span>
                        </td>
                      );
                    }

                    return (
                      <td key={month} className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span
                            className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${styles.pill}`}
                          >
                            {count}
                          </span>
                          {(status === 'done' || status === 'approved') ? null : (
                            <span className="text-[10px] text-text-tertiary font-medium">
                              {cellPct}% done
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="bg-bg-tertiary border-t-2 border-border-default">
              <td className="sticky left-0 z-10 bg-bg-tertiary px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide border-r border-border-default">
                Total
              </td>
              {months.map((month) => {
                const totals = monthTotals[month] ?? { total: 0, completedCount: 0 };
                return (
                  <td key={month} className="px-3 py-3 text-center">
                    <span className="text-sm font-bold text-text-primary">{totals.total}</span>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-border-default bg-bg-tertiary flex flex-wrap gap-x-4 gap-y-2">
        <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mr-1 self-center">
          Legend:
        </span>
        {STATUSES.map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[status].dot}`} />
            <span className="text-[10px] text-text-secondary">{STATUS_LABELS[status]}</span>
          </div>
        ))}
        <span className="text-[10px] text-text-tertiary self-center ml-auto">
          Completion = approved + done / total per month
        </span>
      </div>
    </div>
  );
}
