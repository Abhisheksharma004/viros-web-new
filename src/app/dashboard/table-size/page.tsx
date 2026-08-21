"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Database,
    HardDrive,
    Layers,
    ListFilter,
    RefreshCw,
    Search,
    Server,
    Table as TableIcon,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    FileSpreadsheet,
    Activity,
    Info,
    AlertCircle,
    ChevronDown
} from "lucide-react";

interface TableInfo {
    tableSchema: string;
    tableName: string;
    rows: number;
    dataSizeBytes: number;
    dataSizeFormatted: string;
    indexSizeBytes: number;
    indexSizeFormatted: string;
    totalSizeBytes: number;
    totalSizeFormatted: string;
    dataFreeBytes: number;
    dataFreeFormatted: string;
    percentOfTotal: number;
    engine: string;
    comment: string;
    createdAt: string | null;
    updatedAt: string | null;
}

interface TableSizeSummary {
    totalTables: number;
    totalRows: number;
    totalDataSizeBytes: number;
    totalDataSizeFormatted: string;
    totalIndexSizeBytes: number;
    totalIndexSizeFormatted: string;
    totalDbSizeBytes: number;
    totalDbSizeFormatted: string;
    largestTable: string;
}

type SortField = "tableName" | "tableSchema" | "rows" | "dataSizeBytes" | "indexSizeBytes" | "totalSizeBytes";
type SortDirection = "asc" | "desc";

export default function TableSizePage() {
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [summary, setSummary] = useState<TableSizeSummary | null>(null);
    const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
    const [selectedDatabase, setSelectedDatabase] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [sortField, setSortField] = useState<SortField>("totalSizeBytes");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    const fetchTableSizes = async (targetDb?: string, isManualRefresh = false) => {
        if (isManualRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        setError(null);

        try {
            const dbParam = targetDb !== undefined ? targetDb : selectedDatabase;
            const url = dbParam ? `/api/table-sizes?database=${encodeURIComponent(dbParam)}` : "/api/table-sizes";

            const res = await fetch(url);
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to load database table sizes");
            }

            setTables(data.tables || []);
            setSummary(data.summary || null);
            setAvailableDatabases(data.availableDatabases || []);

            if (!selectedDatabase && data.databaseName) {
                setSelectedDatabase(data.databaseName);
            }
        } catch (err: any) {
            console.error("Error fetching table sizes:", err);
            setError(err?.message || "Failed to load table information. Please check database permissions.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTableSizes();
    }, []);

    const handleDatabaseChange = (newDb: string) => {
        setSelectedDatabase(newDb);
        fetchTableSizes(newDb, false);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    };

    const filteredAndSortedTables = useMemo(() => {
        let result = tables.filter((t) =>
            t.tableName.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
            t.tableSchema.toLowerCase().includes(searchTerm.toLowerCase().trim())
        );

        result.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];

            if (typeof valA === "string" && typeof valB === "string") {
                return sortDirection === "asc"
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            return sortDirection === "asc"
                ? (valA as number) - (valB as number)
                : (valB as number) - (valA as number);
        });

        return result;
    }, [tables, searchTerm, sortField, sortDirection]);

    const handleExportCSV = () => {
        if (tables.length === 0) return;

        const headers = ["Database", "Table Name", "Rows", "Data Size", "Index Size", "Total Size", "Engine", "Share (%)"];
        const rows = tables.map((t) => [
            `"${t.tableSchema}"`,
            `"${t.tableName}"`,
            t.rows,
            `"${t.dataSizeFormatted}"`,
            `"${t.indexSizeFormatted}"`,
            `"${t.totalSizeFormatted}"`,
            `"${t.engine}"`,
            `${t.percentOfTotal}%`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `database_table_sizes_${selectedDatabase || "all"}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />;
        }
        return sortDirection === "asc" ? (
            <ArrowUp className="w-3.5 h-3.5 text-[#06124f] font-bold" />
        ) : (
            <ArrowDown className="w-3.5 h-3.5 text-[#06124f] font-bold" />
        );
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-[#06124f] rounded-xl">
                            <Database className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Database & Table Storage</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Server par maujood kisi bhi database ka table size aur storage metrics check karein.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Database Selector & Actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Database Dropdown */}
                    <div className="relative min-w-[200px]">
                        <div className="relative">
                            <select
                                value={selectedDatabase}
                                onChange={(e) => handleDatabaseChange(e.target.value)}
                                disabled={isLoading}
                                className="w-full appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-sm font-semibold py-2.5 pl-3.5 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#06b6d4] transition-all cursor-pointer disabled:opacity-60"
                            >
                                <option value="all">⚡ All Databases (Server Total)</option>
                                {availableDatabases.map((db) => (
                                    <option key={db} value={db}>
                                        📁 {db}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex items-end gap-2 pt-4 sm:pt-0">
                        <button
                            type="button"
                            onClick={handleExportCSV}
                            disabled={isLoading || tables.length === 0}
                            className="inline-flex items-center px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl shadow-xs transition-all disabled:opacity-50"
                            title="Export to CSV"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
                            CSV
                        </button>
                        <button
                            type="button"
                            onClick={() => fetchTableSizes(selectedDatabase, true)}
                            disabled={isLoading || isRefreshing}
                            className="inline-flex items-center px-4 py-2.5 bg-[#06124f] hover:bg-[#0a1e7a] text-white text-sm font-medium rounded-xl shadow-sm transition-all disabled:opacity-60"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                            {isRefreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5 text-red-600 shrink-0" />
                    <div>
                        <h4 className="font-semibold text-sm">Failed to retrieve database tables</h4>
                        <p className="text-xs text-red-600 mt-0.5">{error}</p>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">Total Tables</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{summary.totalTables}</h3>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                {selectedDatabase === "all" ? "Across all server DBs" : `In ${selectedDatabase}`}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                            <HardDrive className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">Total Database Size</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{summary.totalDbSizeBytes > 0 ? summary.totalDbSizeFormatted : "0 B"}</h3>
                            <p className="text-[11px] text-gray-400 mt-0.5">Data + Index combined</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Server className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">Data vs Index</p>
                            <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                                {summary.totalDataSizeFormatted}
                            </h3>
                            <p className="text-[11px] text-gray-400 mt-0.5">Index: {summary.totalIndexSizeFormatted}</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">Total Records (Rows)</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{summary.totalRows.toLocaleString()}</h3>
                            <p className="text-[11px] text-gray-400 mt-0.5">Largest: {summary.largestTable}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Table Search & Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search table or database name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="font-medium">
                            Showing <strong className="text-gray-900">{filteredAndSortedTables.length}</strong> of{" "}
                            <strong className="text-gray-900">{tables.length}</strong> tables
                        </span>
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-4 border-[#06124f]/20 border-t-[#06124f] rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-sm font-medium text-gray-600">Querying MySQL schema and calculating sizes...</p>
                            <p className="text-xs text-gray-400 mt-1">Please wait a moment</p>
                        </div>
                    ) : filteredAndSortedTables.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-400">
                                <TableIcon className="w-7 h-7" />
                            </div>
                            <h3 className="text-base font-semibold text-gray-900">No tables found</h3>
                            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                                {searchTerm
                                    ? `No table matching "${searchTerm}". Try another search term.`
                                    : "Selected database contains 0 tables or access is restricted."}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <th className="py-3.5 px-4 sm:px-6 w-12 text-center">#</th>
                                    {selectedDatabase === "all" && (
                                        <th
                                            onClick={() => handleSort("tableSchema")}
                                            className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/70 transition-colors group"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span>Database</span>
                                                {renderSortIcon("tableSchema")}
                                            </div>
                                        </th>
                                    )}
                                    <th
                                        onClick={() => handleSort("tableName")}
                                        className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/70 transition-colors group"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Table Name</span>
                                            {renderSortIcon("tableName")}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort("rows")}
                                        className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/70 transition-colors group text-right"
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            <span>Estimated Rows</span>
                                            {renderSortIcon("rows")}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort("dataSizeBytes")}
                                        className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/70 transition-colors group text-right"
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            <span>Data Size</span>
                                            {renderSortIcon("dataSizeBytes")}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort("indexSizeBytes")}
                                        className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/70 transition-colors group text-right"
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            <span>Index Size</span>
                                            {renderSortIcon("indexSizeBytes")}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort("totalSizeBytes")}
                                        className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/70 transition-colors group text-right"
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            <span>Total Size</span>
                                            {renderSortIcon("totalSizeBytes")}
                                        </div>
                                    </th>
                                    <th className="py-3.5 px-4 sm:px-6 w-44">Share</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {filteredAndSortedTables.map((table, index) => (
                                    <tr
                                        key={`${table.tableSchema}-${table.tableName}`}
                                        className="hover:bg-blue-50/30 transition-colors group"
                                    >
                                        <td className="py-3.5 px-4 sm:px-6 text-center text-xs text-gray-400 font-mono">
                                            {index + 1}
                                        </td>
                                        {selectedDatabase === "all" && (
                                            <td className="py-3.5 px-4 font-mono text-xs text-gray-600">
                                                <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-medium">
                                                    {table.tableSchema}
                                                </span>
                                            </td>
                                        )}
                                        <td className="py-3.5 px-4 font-medium text-gray-900">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-blue-100 text-gray-600 group-hover:text-[#06124f] flex items-center justify-center shrink-0 transition-colors">
                                                    <TableIcon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <span className="font-mono text-sm font-semibold text-gray-900 group-hover:text-[#06124f]">
                                                        {table.tableName}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[10px] uppercase font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded">
                                                            {table.engine}
                                                        </span>
                                                        {table.comment && (
                                                            <span className="text-[11px] text-gray-400 truncate max-w-xs">
                                                                {table.comment}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                                {table.rows.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-medium text-gray-700">
                                            {table.dataSizeFormatted}
                                        </td>
                                        <td className="py-3.5 px-4 text-right text-xs text-gray-500">
                                            {table.indexSizeFormatted}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                                            {table.totalSizeFormatted}
                                        </td>
                                        <td className="py-3.5 px-4 sm:px-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <span className="font-medium text-[11px]">{table.percentOfTotal}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${table.percentOfTotal > 20
                                                            ? "bg-[#06124f]"
                                                            : table.percentOfTotal > 5
                                                                ? "bg-[#06b6d4]"
                                                                : "bg-blue-300"
                                                            }`}
                                                        style={{ width: `${Math.min(100, Math.max(table.percentOfTotal, 2))}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer notes */}
                <div className="p-4 bg-gray-50/80 border-t border-gray-100 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-gray-400" />
                        <span>Real-time calculation from MySQL <code>information_schema.TABLES</code> & <code>information_schema.SCHEMATA</code>.</span>
                    </div>
                    <span className="text-gray-400">Database: <strong>{selectedDatabase}</strong> | Total Size: {summary?.totalDbSizeFormatted || "0 B"}</span>
                </div>
            </div>
        </div>
    );
}
