import React from 'react';

interface DataTableProps {
  headers: string[];
  children: React.ReactNode;
  empty?: boolean;
  emptyNode?: React.ReactNode;
}

export const DataTable: React.FC<DataTableProps> = ({
  headers,
  children,
  empty,
  emptyNode
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-sm">
            {empty ? (
              <tr>
                <td colSpan={headers.length} className="p-0">
                  {emptyNode}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
