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
  Button,
  Skeleton,
  CircularProgress,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { httpGet, httpPost } from '@/helpers/http';
import { DbtSourceModel } from '../Canvas';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { RangeChart } from '@/components/Charts/RangeChart';
import { delay } from '@/utils/common';
import { Session } from 'next-auth';
import { DateTimeInsights } from '@/components/Charts/DateTimeInsights';
import { StringInsights } from '@/components/Charts/StringInsights';
import { NumberInsights } from '@/components/Charts/NumberInsights';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';

const useDebounce = (value: number, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface StatisticsPaneProps {
  height: number;
}

export interface DateTimeFilter {
  range: 'year' | 'month' | 'day';
  limit: number;
  offset: number;
}
interface PostBody {
  db_schema: string;
  db_table: string;
  column_name: string;
  filter?: DateTimeFilter;
}

type ColumnTypes = 'Numeric' | 'String' | 'Datetime' | 'Json' | 'Boolean';

interface ColumnData {
  name: string;
  type: ColumnTypes;
  distinct?: number | string;
  null?: number | string;
  distribution?: any;
  postBody?: PostBody;
}

interface TableDetailsResponse {
  name: string;
  translated_type: ColumnTypes;
}

const metricsApiUrl = `warehouse/insights/metrics/`;

export const pollTaskStatus = async (
  session: Session | null,
  taskId: string,
  postBody: PostBody,
  setData: any,
  interval = 5000
) => {
  const hashKey = `data-insights`;
  const taskUrl = `tasks/${taskId}?hashkey=${hashKey}`;

  const poll = async (resolve: (value?: unknown) => void, reject: (reason?: any) => void) => {
    try {
      const response = await httpGet(session, taskUrl);
      const latestProgress = response.progress[response.progress.length - 1];
      if (latestProgress.status === 'completed') {
        const result = latestProgress.results;
        setData((columnData: ColumnData[]) =>
          columnData.map((data) => {
            if (data.name === postBody.column_name) {
              return {
                ...data,
                null: result.countNull,
                distinct: result.countDistinct,
                distribution: result,
                postBody,
              };
            }
            return data;
          })
        );
        resolve(latestProgress.results);
      } else if (latestProgress.status === 'failed' || latestProgress.status === 'error') {
        setData((columnData: ColumnData[]) =>
          columnData.map((data) => {
            if (data.name === postBody.column_name) {
              return {
                ...data,
                null: '',
                distinct: '',
                distribution: 'failed',
                postBody,
              };
            }
            return data;
          })
        );
        reject({ reason: 'Failed' });
      } else {
        setTimeout(() => poll(resolve, reject), interval);
      }
    } catch (error) {
      reject(error);
    }
  };

  return new Promise(poll);
};

export const StatisticsPane: React.FC<StatisticsPaneProps> = ({ height }) => {
  const [modelToPreview, setModelToPreview] = useState<DbtSourceModel | null>();

  const debouncedHeight = useDebounce(height, 500);

  const [rowCount, setRowCount] = useState(-1);
  const { data: session } = useSession();
  const toastContext = useContext(GlobalContext);

  // Row Data: The data to be displayed.
  const [data, setData] = useState<ColumnData[]>([]);

  const { previewAction } = usePreviewAction();

  const columns: ColumnDef<ColumnData, any>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Column name',
        size: 160,
        enableSorting: true,
      },
      {
        accessorKey: 'type',
        header: 'Column type',
        size: 150,
        enableSorting: true,
      },
      {
        accessorKey: 'distinct',
        header: 'Distinct',
        size: 100,
        enableSorting: true,
      },
      { accessorKey: 'null', header: 'Null', size: 100, enableSorting: true },
      {
        accessorKey: 'distribution',
        header: 'Data distribution',
        size: 800,
        enableSorting: false,
        cell: ({ row }) => {
          const { type, distribution, postBody } = row.original;
          if (distribution === 'failed' && postBody !== undefined) {
            return (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: '100px',
                }}
              >
                -- -- -- No data available -- -- --
                {/* commenting it out for now until we need the try again option */}
                {/* <ErrorOutlineIcon sx={{ mr: 1 }} /> Error fetching stats{' '}
                <Button
                  sx={{ ml: 2 }}
                  variant="outlined"
                  size="small"
                  onClick={async () => {
                    const metrics: { task_id: string } = await httpPost(
                      session,
                      metricsApiUrl,
                      postBody
                    );

                    setData((columnData: ColumnData[]) =>
                      columnData.map((data) => {
                        if (data.name === postBody.column_name) {
                          return {
                            ...data,
                            null: undefined,
                            distinct: undefined,
                            distribution: undefined,
                            postBody,
                          };
                        }
                        return data;
                      })
                    );
                    await delay(1000);
                    pollTaskStatus(session, metrics.task_id, postBody, setData);
                  }}
                >
                  Try again
                </Button> */}
              </Box>
            );
          }
          switch (type) {
            case 'Numeric':
              return distribution ? (
                <NumberInsights
                  type="chart"
                  data={{
                    minimum: distribution.minVal,
                    maximum: distribution.maxVal,
                    mean: distribution.mean,
                    median: distribution.median,
                    mode: distribution.mode,
                    otherModes: distribution.other_modes,
                  }}
                />
              ) : (
                <Skeleton variant="rectangular" height={100} />
              );
            case 'String':
              const chartData = distribution.charts[0].data;
              if (distribution.count === distribution.countNull) {
                return <Box>All values are null</Box>;
              }
              if (distribution.count === distribution.countDistinct) {
                return <Box>All values are distinct</Box>;
              }
              return (
                <StringInsights
                  data={chartData.map((data: any) => ({
                    name: data.category,
                    percentage: ((data.count * 100) / distribution.count).toFixed(1),
                    count: data.count,
                  }))}
                  statsData={{
                    minimum: distribution.minVal,
                    maximum: distribution.maxVal,
                    mean: distribution.mean,
                    median: distribution.median,
                    mode: distribution.mode,
                    otherModes: distribution.other_modes,
                  }}
                />
              );

            case 'Boolean':
              return (
                <RangeChart
                  data={[
                    {
                      name: 'True',
                      percentage: ((distribution.countTrue * 100) / distribution.count).toFixed(1),
                      count: distribution.countTrue,
                    },
                    {
                      name: 'False',
                      percentage: ((distribution.countFalse * 100) / distribution.count).toFixed(1),
                      count: distribution.countFalse,
                    },
                  ]}
                  colors={['#00897b', '#c7d8d7']}
                  barHeight={12}
                />
              );

            case 'Datetime':
              const dateTimeData = distribution.charts[0].data;
              return (
                <DateTimeInsights
                  barProps={{
                    data: dateTimeData,
                  }}
                  minDate={distribution.minVal}
                  maxDate={distribution.maxVal}
                  type="chart"
                  postBody={postBody}
                />
              );
            default:
              return (
                <Box sx={{ alignItems: 'center', display: 'flex' }}>
                  -- -- -- No data available -- -- --
                </Box>
              );
          }
        },
      },
    ],
    []
  );

  const fetchColumns = async (schema: string, table: string) => {
    try {
      const dataUrl = `warehouse/v1/table_data/${schema}/${table}`;

      const tableDetails: TableDetailsResponse[] = await httpGet(session, dataUrl);
      const tableData: ColumnData[] = tableDetails.map((data) => {
        if (data.translated_type === 'Json') {
          return {
            name: data.name,
            type: data.translated_type,
            null: '',
            distinct: '',
            distribution: '',
          };
        }
        return {
          name: data.name,
          type: data.translated_type,
        };
      });

      setData(tableData);

      tableDetails.forEach(async (column) => {
        if (
          !['Datetime', 'Json', 'Boolean', 'String', 'Numeric'].includes(column.translated_type)
        ) {
          return;
        }

        const postBody: PostBody = {
          db_schema: schema,
          db_table: table,
          column_name: column.name,
        };

        const metrics: { task_id: string } = await httpPost(session, metricsApiUrl, postBody);

        await delay(1000);

        pollTaskStatus(session, metrics.task_id, postBody, setData);
      });
    } catch (error: any) {
      errorToast(error.message, [], toastContext);
    }
  };

  const fetchRowCountAndColumns = async (schema: string, table: string) => {
    try {
      const count = await httpGet(session, `warehouse/table_count/${schema}/${table}`);
      setRowCount(count.total_rows);

      if (count.total_rows > 0) {
        fetchColumns(schema, table);
      }
    } catch (error: any) {
      errorToast(error.message, [], toastContext);
    }
  };

  useEffect(() => {
    return () => {
      const highestId = window.setTimeout(() => {
        for (let i = highestId; i >= 0; i--) {
          window.clearInterval(i);
        }
      }, 0);
    };
  }, []);

  useEffect(() => {
    if (previewAction.type === 'preview') {
      setModelToPreview(previewAction.data);
    } else if (previewAction.type === 'clear-preview') {
      setModelToPreview(null);
    }
  }, [previewAction]);

  useEffect(() => {
    if (modelToPreview) {
      setData([]);
      fetchRowCountAndColumns(modelToPreview.schema, modelToPreview.input_name);
    }
  }, [modelToPreview]);

  const tableData = useMemo(() => {
    return {
      columns,
      data,
    };
  }, [data]);

  // Update useTable hook
  const { getHeaderGroups, getRowModel } = useReactTable({
    columns: columns,
    data: tableData.data,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return modelToPreview ? (
    rowCount !== 0 ? (
      data.length > 0 ? (
        <Box>
          <Box
            sx={{
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', padding: '6px 8px 6px 44px' }}>
              <Typography variant="body1" fontWeight="bold">
                {modelToPreview?.input_name}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  ml: '56px',
                  fontWeight: 600,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mr: 2,
                  }}
                >
                  <VisibilityIcon sx={{ mr: 1, color: '#00897b' }} /> {data.length} Columns{' '}
                </Box>
                {rowCount > 0 ? rowCount : 0} Rows
              </Box>

              <Box
                sx={{
                  ml: 'auto',
                  mr: 2,
                  color: '#00897b',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Button
                  variant="contained"
                  sx={{ mr: 2 }}
                  onClick={() => fetchColumns(modelToPreview.schema, modelToPreview.input_name)}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
          </Box>
          <Box>
            <Box sx={{ height: debouncedHeight - 100, overflow: 'auto' }}>
              <Table stickyHeader sx={{ width: '100%', borderSpacing: 0 }}>
                <TableHead>
                  {getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header, i) => (
                        <TableCell
                          key={header.id}
                          colSpan={header.colSpan}
                          sx={{
                            width: header.column.columnDef.size,
                            backgroundColor: '#F5FAFA',
                            border: '1px solid #dddddd',
                            padding: i == 0 ? '8px 8px 8px 40px' : '8px',

                            textAlign: 'left',
                            fontWeight: 700,
                            color: 'rgba(15, 36, 64, 0.57)',
                          }}
                        >
                          <Box display="flex" alignItems="center">
                            {header.column.columnDef.enableSorting ? (
                              <TableSortLabel
                                active={!!header.column.getIsSorted()}
                                direction={header.column.getIsSorted() === 'desc' ? 'desc' : 'asc'}
                                onClick={header.column.getToggleSortingHandler()}
                                sx={{ marginLeft: '4px' }}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </TableSortLabel>
                            ) : (
                              flexRender(header.column.columnDef.header, header.getContext())
                            )}
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableHead>
                <TableBody sx={{ borderColor: '#dddddd' }}>
                  {getRowModel().rows.map((row) => {
                    return (
                      <TableRow
                        key={row.id}
                        sx={{
                          boxShadow: 'unset',
                          height: '180px',
                        }}
                      >
                        {row.getVisibleCells().map((cell, i) => {
                          return (
                            <TableCell
                              key={cell.id}
                              sx={{
                                width: cell.column.columnDef.size,
                                fontWeight: 600,
                                textAlign: 'left',
                                borderBottom: '1px solid #ddd',
                                fontSize: '0.8rem',
                                padding: i == 0 ? '8px 8px 8px 46px' : '8px',
                              }}
                            >
                              {cell.getValue() !== undefined ? (
                                flexRender(cell.column.columnDef.cell, cell.getContext())
                              ) : (
                                <Skeleton variant="rectangular" height={118} />
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            height: debouncedHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress sx={{ mr: 2 }} />
          Generating insights
        </Box>
      )
    ) : (
      <Box
        sx={{
          display: 'flex',
          height: debouncedHeight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        No data (0 rows) available to generate insights
      </Box>
    )
  ) : (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: debouncedHeight,
      }}
    >
      Select a table from the left pane to view
    </Box>
  );
};
