import { useState, useMemo } from "react";
import { useCompanies } from "../../hooks/useCompanies";
import CompanyForm from "./CompanyForm";
import type { CreateCompanyInput } from "@shared/types/crm";

interface CompanyListProps {
  onSelectCompany: (id: string) => void;
}

export default function CompanyList({ onSelectCompany }: CompanyListProps) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "industry" | "created_at">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (search) f.search = search;
    return Object.keys(f).length ? f : undefined;
  }, [search]);

  const { companies, loading, error, create } = useCompanies(filters);

  const sorted = useMemo(() => {
    const arr = [...companies];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortBy === "industry") {
        cmp = (a.industry || "").localeCompare(b.industry || "");
      } else if (sortBy === "created_at") {
        cmp = a.created_at.localeCompare(b.created_at);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [companies, sortBy, sortDir]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return null;
    return (
      <svg className="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {sortDir === "asc"
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        }
      </svg>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 py-4 border-b border-surface-200 bg-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-surface-800">Companies</h2>
          <span className="text-sm text-surface-400">{companies.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 w-64"
            />
          </div>
          <button onClick={() => setShowForm(true)} className="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors">
            + Company
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 px-4 py-2 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-surface-400">Loading companies...</div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-surface-500 text-sm">No companies found</p>
            <button onClick={() => setShowForm(true)} className="mt-2 text-sm text-brand-600 hover:text-brand-700">Create your first company</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-surface-50 sticky top-0">
              <tr>
                <th onClick={() => handleSort("name")} className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider cursor-pointer hover:text-surface-700">
                  Name <SortIcon col="name" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Domain</th>
                <th onClick={() => handleSort("industry")} className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider cursor-pointer hover:text-surface-700">
                  Industry <SortIcon col="industry" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Contacts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Deals</th>
                <th onClick={() => handleSort("created_at")} className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider cursor-pointer hover:text-surface-700">
                  Created <SortIcon col="created_at" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {sorted.map((c) => (
                <tr key={c.id} onClick={() => onSelectCompany(c.id)} className="hover:bg-surface-50 cursor-pointer transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-surface-100 text-surface-600 flex items-center justify-center text-xs font-medium shrink-0">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-surface-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-surface-600">{c.domain || "-"}</td>
                  <td className="px-6 py-3 text-sm text-surface-600">{c.industry || "-"}</td>
                  <td className="px-6 py-3 text-sm text-surface-600">{c.size || "-"}</td>
                  <td className="px-6 py-3 text-sm text-surface-600">{c.contact_count ?? 0}</td>
                  <td className="px-6 py-3 text-sm text-surface-600">{c.deal_count ?? 0}</td>
                  <td className="px-6 py-3 text-sm text-surface-400">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <CompanyForm
          onSave={async (input) => { await create(input as CreateCompanyInput); setShowForm(false); }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
