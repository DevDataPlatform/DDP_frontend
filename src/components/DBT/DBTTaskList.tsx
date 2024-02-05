import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import SyncIcon from '@/assets/icons/sync.svg';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { httpDelete, httpGet, httpPost } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import styles from '@/styles/Common.module.css';
import { useSession } from 'next-auth/react';
import { TransformTask } from './DBTTarget';
import { List } from '../List/List';
import { delay, lastRunTime, trimEmail } from '@/utils/common';
import Image from 'next/image';
import { TASK_DBTRUN, TASK_DBTTEST } from '@/config/constant';
import { ActionsMenu } from '../UI/Menu/Menu';
import ConfirmationDialog from '../Dialog/ConfirmationDialog';

type params = {
  tasks: TransformTask[];
  setDbtRunLogs: (...args: any) => any;
  setExpandLogs: (...args: any) => any;
  anyTaskLocked: boolean;
  fetchDbtTasks: (...args: any) => any;
};

type PrefectFlowRun = {
  id: string;
  name: string;
  deployment_id: string;
  flow_id: string;
  state_type: string;
  state_name: string;
};

type PrefectFlowRunLog = {
  level: number;
  timestamp: string;
  message: string;
};

export const DBTTaskList = ({
  tasks,
  setDbtRunLogs,
  setExpandLogs,
  anyTaskLocked,
  fetchDbtTasks,
}: params) => {
  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);
  const [rows, setRows] = useState<Array<any>>([]);
  const [taskId, setTaskId] = useState<string>('');
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] =
    useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(anyTaskLocked);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    if (anyTaskLocked != null) {
      setRunning(anyTaskLocked);
    }
    fetchDbtTasks();
  }, [anyTaskLocked, running]);

  console.log('any task locked', anyTaskLocked);
  const handleClick = (taskId: string, event: HTMLElement | null) => {
    setTaskId(taskId);
    setAnchorEl(event);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const Actions = ({ task }: { task: TransformTask }) => (
    <Box
      sx={{ justifyContent: 'end', display: 'flex' }}
      key={'task-' + task.id}
    >
      <Button
        variant="contained"
        onClick={() => {
          if (task) {
            if (task.slug === TASK_DBTRUN) dbtRunWithDeployment(task);
            else executeDbtJob(task);
          } else {
            errorToast(
              'Please select a dbt function to execute',
              [],
              toastContext
            );
          }
        }}
        data-testid={'task-' + task.id}
        disabled={running}
        key={'task-' + task.id}
        sx={{ marginRight: '10px' }}
      >
        {running ? (
          <Image src={SyncIcon} className={styles.SyncIcon} alt="sync icon" />
        ) : (
          'Execute'
        )}
      </Button>

      <Button
        id={task.slug}
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={(event) => handleClick(String(task.id), event.currentTarget)}
        variant="contained"
        key={'menu-' + task.id}
        color="info"
        sx={{ p: 0, minWidth: 32 }}
      >
        <MoreHorizIcon />
      </Button>
    </Box>
  );

  const executeDbtJob = async function (task: TransformTask) {
    setRunning(true);
    setExpandLogs(true);
    setDbtRunLogs([]);

    try {
      let message = null;
      message = await httpPost(session, `prefect/tasks/${task.id}/run/`, {});
      if (message?.status === 'success') {
        successToast('Job ran successfully', [], toastContext);
      } else {
        errorToast('Job failed', [], toastContext);
      }

      // For dbt test command, we wont get the logs in message?.result if the operation fails
      if (task.slug === TASK_DBTTEST) {
        // Custom state has been returned
        // need another api call to fetch the logs
        if (message?.result[0]?.id) {
          await fetchAndSetFlowRunLogs(
            message.result[0]?.state_details?.flow_run_id
          );
        } else {
          setDbtRunLogs(message?.result);
        }
      } else {
        setDbtRunLogs(message?.result);
      }
    } catch (err: any) {
      console.error(err.cause);
      errorToast(err.message, [], toastContext);
    }

    setRunning(false);
  };

  const fetchFlowRunStatus = async (flow_run_id: string) => {
    try {
      const flowRun: PrefectFlowRun = await httpGet(
        session,
        `prefect/flow_runs/${flow_run_id}`
      );

      if (!flowRun.state_type) return 'FAILED';

      return flowRun.state_type;
    } catch (err: any) {
      console.error(err);
      return 'FAILED';
    }
  };

  const fetchAndSetFlowRunLogs = async (flow_run_id: string) => {
    try {
      const response = await httpGet(
        session,
        `prefect/flow_runs/${flow_run_id}/logs`
      );
      if (response?.logs?.logs && response.logs.logs.length > 0) {
        const logsArray = response.logs.logs.map(
          // eslint-disable-next-line
          (logObject: PrefectFlowRunLog, idx: number) =>
            `- ${logObject.message} '\n'`
        );

        setDbtRunLogs(logsArray);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const dbtRunWithDeployment = async (task: any) => {
    if (task.deploymentId) {
      setExpandLogs(true);
      setDbtRunLogs([]);
      setRunning(true);
      try {
        const response = await httpPost(
          session,
          `prefect/v1/flows/${task.deploymentId}/flow_run/`,
          {}
        );

        // if flow run id is not present, something went wrong
        if (!response.flow_run_id)
          errorToast('Something went wrong', [], toastContext);

        // Poll and show logs till flow run is either completed or failed
        let flowRunStatus: string = await fetchFlowRunStatus(
          response.flow_run_id
        );

        while (!['COMPLETED', 'FAILED'].includes(flowRunStatus)) {
          await delay(5000);
          await fetchAndSetFlowRunLogs(response.flow_run_id);
          flowRunStatus = await fetchFlowRunStatus(response.flow_run_id);
        }
        setRunning(false);
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      } finally {
        setRunning(false);
      }
    } else {
      errorToast('No deployment found for this DBT task', [], toastContext);
    }
  };

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      const tempRows = tasks.map((task: TransformTask) => [
        <Box
          key={`name-${task.id}`}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Typography variant="body1" fontWeight={400}>
            {task.label}
          </Typography>
        </Box>,
        <Box
          key={`name-${task.id}`}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Typography variant="body2" fontWeight={400}>
            {task.command}
          </Typography>
        </Box>,
        <Box
          key={`name-${task.id}`}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Typography variant="body2" fontWeight={400}>
            {task.generated_by}
          </Typography>
        </Box>,

        task.lock ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'end',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-around',
                alignItems: 'start',
              }}
            >
              <Typography variant="body2" fontWeight={400}>
                Triggered by: {trimEmail(task.lock.lockedBy)}
              </Typography>
              <Typography variant="body2" fontWeight={400}>
                {lastRunTime(task.lock.lockedAt)}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Actions key={`actions-${task.id}`} task={task} />
        ),
      ]);

      setRows(tempRows);
    }
  }, [tasks]);

  const deleteTask = (taskId: string) => {
    (async () => {
      try {
        const message = await httpDelete(session, `prefect/tasks/${taskId}/`);
        if (message.success) {
          successToast('Task deleted', [], toastContext);
          // mutate();
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      }
    })();
    handleCancelDeleteTask();
  };

  const handleCancelDeleteTask = () => {
    setShowConfirmDeleteDialog(false);
  };

  const openDeleteTaskModal = () => {
    handleClose();
    setShowConfirmDeleteDialog(true);
  };

  return (
    <>
      <ActionsMenu
        eleType="transformtask"
        anchorEl={anchorEl}
        open={open}
        handleClose={handleClose}
        handleDelete={openDeleteTaskModal}
      />
      <List
        openDialog={() => {}}
        title="Task"
        headers={['Task', 'Command', 'Generated By']}
        rows={rows}
      />
      <ConfirmationDialog
        show={showConfirmDeleteDialog}
        handleClose={() => setShowConfirmDeleteDialog(false)}
        handleConfirm={() => deleteTask(taskId)}
        message="This will delete the task permanently."
      />
    </>
  );
};
