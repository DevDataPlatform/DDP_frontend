import React, { useState, useEffect, useContext } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { httpGet, httpPost } from '@/helpers/http';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import { useSession } from 'next-auth/react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';

const PreviewPaneSql_ishan = ({
  height,
  initialSqlString,
}: {
  height: number;
  initialSqlString: string | undefined;
}) => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { data: session } = useSession();
  const toastContext = useContext(GlobalContext);

  const fetchData = async () => {
    console.log(initialSqlString, 'intitiasqlstring');
    setLoading(true);
    try {
      const response = await httpPost(session, `warehouse/v1/table_data/run_sql`, {
        sql: initialSqlString,
        limit: 10,
        offset: 0,
      });
      console.log(response, 'responseof the fetch data.');
      const { rows, columns } = response;
      setData(rows);
      setColumns(columns.map((col: string) => ({ accessorKey: col, header: col })));
    } catch (error) {
      errorToast('Error fetching preview data', [], toastContext);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Box sx={{ height, overflow: 'auto' }}>
      {loading ? (
        <CircularProgress />
      ) : (
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Box>
  );
};

export default PreviewPaneSql_ishan;
