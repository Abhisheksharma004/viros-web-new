import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

function formatBytes(bytes: number, decimals = 2): string {
    if (!bytes || bytes <= 0) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

interface TableRow extends RowDataPacket {
    tableSchema: string;
    tableName: string;
    totalRows: number;
    dataLengthBytes: number;
    indexLengthBytes: number;
    dataFreeBytes: number;
    totalSizeBytes: number;
    tableComment: string | null;
    createTime: string | null;
    updateTime: string | null;
    engine: string | null;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const requestedDb = searchParams.get("database");

        // 1. Fetch current default database name
        const [[currentDbRow]] = await pool.query<RowDataPacket[]>("SELECT DATABASE() as dbName");
        const defaultDbName = (currentDbRow as { dbName?: string })?.dbName || "viros_website";

        // 2. Fetch all databases available on the MySQL server
        const [dbRows] = await pool.query<RowDataPacket[]>(`
            SELECT SCHEMA_NAME as dbName 
            FROM information_schema.SCHEMATA 
            ORDER BY SCHEMA_NAME ASC
        `);
        const allDatabases = dbRows.map((r: any) => r.dbName as string);

        const selectedDb = requestedDb && requestedDb.trim() !== "" ? requestedDb.trim() : defaultDbName;

        let query = "";
        let queryParams: any[] = [];

        if (selectedDb === "all") {
            // All user databases on server (excluding system schemas if desired or include all)
            query = `
                SELECT 
                    TABLE_SCHEMA AS tableSchema,
                    TABLE_NAME AS tableName,
                    COALESCE(TABLE_ROWS, 0) AS totalRows,
                    COALESCE(DATA_LENGTH, 0) AS dataLengthBytes,
                    COALESCE(INDEX_LENGTH, 0) AS indexLengthBytes,
                    COALESCE(DATA_FREE, 0) AS dataFreeBytes,
                    (COALESCE(DATA_LENGTH, 0) + COALESCE(INDEX_LENGTH, 0)) AS totalSizeBytes,
                    TABLE_COMMENT AS tableComment,
                    CREATE_TIME AS createTime,
                    UPDATE_TIME AS updateTime,
                    ENGINE AS engine
                FROM 
                    information_schema.TABLES
                WHERE 
                    TABLE_SCHEMA NOT IN ('information_schema', 'performance_schema', 'sys')
                ORDER BY 
                    (COALESCE(DATA_LENGTH, 0) + COALESCE(INDEX_LENGTH, 0)) DESC;
            `;
        } else {
            query = `
                SELECT 
                    TABLE_SCHEMA AS tableSchema,
                    TABLE_NAME AS tableName,
                    COALESCE(TABLE_ROWS, 0) AS totalRows,
                    COALESCE(DATA_LENGTH, 0) AS dataLengthBytes,
                    COALESCE(INDEX_LENGTH, 0) AS indexLengthBytes,
                    COALESCE(DATA_FREE, 0) AS dataFreeBytes,
                    (COALESCE(DATA_LENGTH, 0) + COALESCE(INDEX_LENGTH, 0)) AS totalSizeBytes,
                    TABLE_COMMENT AS tableComment,
                    CREATE_TIME AS createTime,
                    UPDATE_TIME AS updateTime,
                    ENGINE AS engine
                FROM 
                    information_schema.TABLES
                WHERE 
                    TABLE_SCHEMA = ?
                ORDER BY 
                    (COALESCE(DATA_LENGTH, 0) + COALESCE(INDEX_LENGTH, 0)) DESC;
            `;
            queryParams = [selectedDb];
        }

        const [rows] = await pool.query<TableRow[]>(query, queryParams);

        let totalDbSizeBytes = 0;
        let totalDataSizeBytes = 0;
        let totalIndexSizeBytes = 0;
        let totalRowsCount = 0;

        for (const row of rows) {
            const dataBytes = Number(row.dataLengthBytes) || 0;
            const indexBytes = Number(row.indexLengthBytes) || 0;
            const totalBytes = Number(row.totalSizeBytes) || 0;
            const rowCount = Number(row.totalRows) || 0;

            totalDataSizeBytes += dataBytes;
            totalIndexSizeBytes += indexBytes;
            totalDbSizeBytes += totalBytes;
            totalRowsCount += rowCount;
        }

        const tables = rows.map((row) => {
            const dataBytes = Number(row.dataLengthBytes) || 0;
            const indexBytes = Number(row.indexLengthBytes) || 0;
            const totalBytes = Number(row.totalSizeBytes) || 0;
            const freeBytes = Number(row.dataFreeBytes) || 0;
            const rowCount = Number(row.totalRows) || 0;
            const percentOfTotal = totalDbSizeBytes > 0 ? (totalBytes / totalDbSizeBytes) * 100 : 0;

            return {
                tableSchema: row.tableSchema,
                tableName: row.tableName,
                rows: rowCount,
                dataSizeBytes: dataBytes,
                dataSizeFormatted: formatBytes(dataBytes),
                indexSizeBytes: indexBytes,
                indexSizeFormatted: formatBytes(indexBytes),
                totalSizeBytes: totalBytes,
                totalSizeFormatted: formatBytes(totalBytes),
                dataFreeBytes: freeBytes,
                dataFreeFormatted: formatBytes(freeBytes),
                percentOfTotal: Number(percentOfTotal.toFixed(2)),
                engine: row.engine || "InnoDB",
                comment: row.tableComment || "",
                createdAt: row.createTime,
                updatedAt: row.updateTime,
            };
        });

        return NextResponse.json({
            success: true,
            databaseName: selectedDb,
            defaultDbName,
            availableDatabases: allDatabases,
            summary: {
                totalTables: tables.length,
                totalRows: totalRowsCount,
                totalDataSizeBytes,
                totalDataSizeFormatted: formatBytes(totalDataSizeBytes),
                totalIndexSizeBytes,
                totalIndexSizeFormatted: formatBytes(totalIndexSizeBytes),
                totalDbSizeBytes,
                totalDbSizeFormatted: formatBytes(totalDbSizeBytes),
                largestTable: tables[0]?.tableName || "N/A",
            },
            tables,
        });
    } catch (error: any) {
        console.error("Error fetching database table sizes:", error);
        return NextResponse.json(
            {
                success: false,
                error: error?.message || "Failed to fetch table sizes",
            },
            { status: 500 }
        );
    }
}
