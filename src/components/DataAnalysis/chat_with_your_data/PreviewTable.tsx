import React, { useContext, useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableSortLabel,
  TablePagination,
  Button,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { httpPost } from '@/helpers/http';

export const PreviewPaneSql = ({
  height,
  initialSqlString,
}: {
  height: number;
  initialSqlString: any;
}) => {
  // const [modelToPreview, setModelToPreview] = useState();
  const { data: session } = useSession();
  const toastContext = useContext(GlobalContext);

  const [columns, setColumns] = useState<any[]>([]);

  // Row Data: The data to be displayed.
  const [data, setData] = useState<any[]>([]);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0); // Total count of rows
  const [pageCount, setPageCount] = useState(0); // Total number of pages
  const [currentPageIndex, setCurrentPageIndex] = useState(1); // Page index
  const [sortedColumn, setSortedColumn] = useState<string | undefined>(); // Track sorted column
  const [sortOrder, setSortOrder] = useState(1); // Track sort order (1 for ascending, -1 for descending)
  const [loading, setLoading] = useState<boolean>(false);
  // download in progress flag

  const handleSort = (columnId: string) => {
    if (sortedColumn === columnId) {
      setSortOrder(sortOrder === 1 ? -1 : 1);
    } else {
      setSortedColumn(columnId);
      setSortOrder(1);
    }
  };

  const tableData = useMemo(() => {
    return {
      columns,
      data,
    };
  }, [columns, data]);
  const fetchData = async () => {
    console.log(initialSqlString, 'intitiasqlstring');
    setLoading(true);
    try {
      const response = await httpPost(session, `warehouse/v1/table_data/run_sql`, {
        sql: initialSqlString,
        limit: 500,
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
    if (initialSqlString) {
      fetchData();
    } else {
      setData([]);
      setColumns([]);
    }
  }, [session, initialSqlString]);
  // Update useTable hook
  const { getHeaderGroups, getRowModel } = useReactTable({
    columns: tableData.columns,
    data: tableData.data,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return data ? (
    <Box>
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 20px 8px 44px',
          border: '1px solid grey',
        }}
      ></Box>
      <Box>
        <Box sx={{ height: '25vh', overflow: 'auto' }}>
          <Table stickyHeader sx={{ width: '100%', borderSpacing: 0 }}>
            <TableHead>
              {getHeaderGroups().map((headerGroup: any) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header: any, i: number) => (
                    <TableCell
                      key={header.id}
                      colSpan={header.colSpan}
                      sx={{
                        backgroundColor: '#F5FAFA',
                        border: '1px solid #dddddd',
                        borderLeft: 'unset',
                        padding: i == 0 ? '8px 0 8px 40px' : '8px',
                        textAlign: 'left',
                        fontWeight: 700,
                        color: 'rgba(15, 36, 64, 0.57)',
                      }}
                    >
                      <Box display="flex" alignItems="center">
                        <TableSortLabel
                          active={sortedColumn === header.id}
                          direction={
                            sortedColumn === header.id ? (sortOrder === 1 ? 'asc' : 'desc') : 'asc'
                          }
                          onClick={() => handleSort(header.id)}
                          sx={{ marginLeft: '4px' }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableSortLabel>
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>
            <TableBody sx={{ borderColor: '#dddddd' }}>
              {getRowModel().rows.map((row: any) => {
                return (
                  <TableRow key={row.id} sx={{ boxShadow: 'unset' }}>
                    {row.getVisibleCells().map((cell: any, i: number) => (
                      <TableCell
                        key={cell.id}
                        sx={{
                          fontWeight: 600,
                          borderBottom: '1px solid #dddddd',
                          borderRight: '1px solid #dddddd',
                          padding: i === 0 ? '8px 40px 8px 44px' : '8px',
                          textAlign: 'left',
                          fontSize: '0.8rem',
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={pageSize}
          page={currentPageIndex - 1}
          onPageChange={(e, newPage) => setCurrentPageIndex(newPage + 1)}
          onRowsPerPageChange={(e: any) => {
            setPageSize(e.target.value);
            setCurrentPageIndex(1);
          }}
          sx={{ marginRight: '20px' }}
        />
      </Box>
    </Box>
  ) : (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: height,
      }}
    >
      Dalgo
    </Box>
  );
};
