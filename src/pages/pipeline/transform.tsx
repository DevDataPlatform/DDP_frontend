import { DBTSetup } from '@/components/DBT/DBTSetup';
import { PageHead } from '@/components/PageHead';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet, httpPost } from '@/helpers/http';
import styles from '@/styles/Home.module.css';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Collapse,
  IconButton,
  Link,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import React, { useContext, useEffect, useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Dbt from '@/assets/images/dbt.png';
import Image from 'next/image';
import { ActionsMenu } from '../../components/UI/Menu/Menu';
import { DBTTarget } from '@/components/DBT/DBTTarget';
import { DBTDocs } from '@/components/DBT/DBTDocs';
import { delay } from '@/utils/common';
import { LogCard } from '@/components/Logs/LogCard';

type DbtBlock = {
  blockName: string;
  blockId: string;
  blockType: string;
  target: string;
  action: string;
  deploymentId: string;
  lock: object | null;
};
type TargetBlocks = {
  [id: string]: DbtBlock[];
};
type ExpandTarget = {
  [id: string]: boolean;
};

const Transform = () => {
  const [workspace, setWorkspace] = useState({
    status: '',
    gitrepo_url: '',
    default_schema: '',
  });
  const [dbtBlocks, setDbtBlocks] = useState<TargetBlocks>({});
  const [dbtSetupStage, setDbtSetupStage] = useState<string>(''); // create-workspace, complete
  const [expandLogs, setExpandLogs] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(false);
  const [showConnectRepoDialog, setShowConnectRepoDialog] =
    useState<boolean>(false);
  const [rerender, setRerender] = useState<boolean>(false);
  const [dbtSetupLogs, setDbtSetupLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('setup');
  const handleChangeTab = (event: React.SyntheticEvent, newTab: string) => {
    setActiveTab(newTab);
  };
  const [anyBlockLocked, setAnyBlockLocked] = useState<boolean>(false);

  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleClick = (event: HTMLElement | null) => {
    setAnchorEl(event);
  };
  const handleEdit = () => {
    setShowConnectRepoDialog(true);
    handleClose();
  };

  const fetchDbtWorkspace = async () => {
    if (!session) return;

    try {
      const response = await httpGet(session, 'dbt/dbt_workspace');
      setDbtSetupStage('create-workspace');
      if (response.error === 'no dbt workspace has been configured') {
        setWorkspace({ ...workspace, status: 'fetched' });
        // do nothing
      } else if (response.error) {
        errorToast(response.error, [], globalContext);
      } else {
        response.status = 'fetched';
        setWorkspace(response);
        fetchDbtBlocks();
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };

  const pollDbtBlocksLock = async () => {
    try {
      let isLocked = true;
      while (isLocked) {
        const response = await httpGet(session, 'prefect/blocks/dbt');

        isLocked = response?.some((block: DbtBlock) =>
          block.lock ? true : false
        );
        await delay(3000);
      }
      setAnyBlockLocked(false);
    } catch (error) {
      setAnyBlockLocked(false);
    }
  };

  const fetchDbtBlocks = async () => {
    if (!session) return;
    try {
      const response = await httpGet(session, 'prefect/blocks/dbt');

      const blocksByTarget: TargetBlocks = {};
      const expandByTargets: ExpandTarget = {};

      let isAnyLocked = false;
      response?.forEach((block: DbtBlock) => {
        // const components: string[] = block.blockName.split('-');
        // block.target = block?.dbtTargetSchem;
        // block.action = components[3];

        if (!blocksByTarget.hasOwnProperty(block.target)) {
          blocksByTarget[block.target] = [];
          expandByTargets[block.target] = false;
        }
        blocksByTarget[block.target].push(block);
        if (block.lock) {
          isAnyLocked = true;
        }
      });

      if (response && response.length) {
        blocksByTarget[response[0].target].push({
          blockName: 'Git Pull',
          blockId: '',
          blockType: 'Shell Operation',
          target: response[0].target,
          action: 'git-pull',
          deploymentId: '',
          lock: null,
        });
      }
      setDbtBlocks(blocksByTarget);

      if (response && response?.length > 0) {
        setDbtSetupStage('complete');
      }

      if (isAnyLocked) {
        setAnyBlockLocked(true);
        pollDbtBlocksLock();
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };

  const createProfile = async () => {
    try {
      await httpPost(session, `prefect/blocks/dbt/`, {});
      setDbtSetupStage('complete');
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };

  useEffect(() => {
    fetchDbtWorkspace();
  }, [session, rerender]);

  return (
    <>
      <ActionsMenu
        eleType="dbtworkspace"
        anchorEl={anchorEl}
        open={open}
        handleClose={handleClose}
        handleEdit={handleEdit}
      />
      <PageHead title="DDP: Transform" />
      <main className={styles.main}>
        <Typography
          sx={{ fontWeight: 700 }}
          variant="h4"
          gutterBottom
          color="#000"
        >
          Transformation
        </Typography>
        {globalContext?.CurrentOrg.state.wtype === 'snowflake' ? (
          <Typography variant="h4" sx={{ alignContent: 'center' }}>
            dbt not available for snowflake warehouses at this time
          </Typography>
        ) : (
          <>
            <Tabs value={activeTab} onChange={handleChangeTab} sx={{ mb: 3 }}>
              <Tab value="setup" label="Setup"></Tab>
            </Tabs>
            {activeTab === 'setup' && (
              <>
                <Card
                  sx={{
                    background: 'white',
                    display: 'flex',
                    borderRadius: '8px',
                    padding: '16px',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: '10px',
                      alignItems: 'center',
                    }}
                  >
                    <Image
                      src={Dbt}
                      alt="Banner"
                      style={{ width: '46px', height: '46px' }}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                      }}
                    >
                      <Typography
                        sx={{ fontWeight: 700 }}
                        variant="h4"
                        color="#000"
                      >
                        DBT REPOSITORY
                      </Typography>
                      {workspace && workspace.gitrepo_url ? (
                        <>
                          <Link
                            sx={{
                              backgroundColor: '#F2F2EB',
                              borderRadius: '6px',
                              padding: '3px 6px 3px 6px',
                              width: 'min-content',
                              display: 'inline-flex',
                              textDecoration: 'none',
                              ':hover': { cursor: 'pointer' },
                            }}
                            target="_blank"
                            rel="noopener"
                            href={workspace.gitrepo_url}
                          >
                            <Typography
                              sx={{ fontWeight: 600, color: '#0F2440' }}
                            >
                              {workspace.gitrepo_url}
                            </Typography>
                          </Link>
                          <Box
                            sx={{
                              backgroundColor: '#F2F2EB',
                              borderRadius: '6px',
                              padding: '3px 6px 3px 6px',
                              width: 'min-content',
                              display: 'inline-flex',
                            }}
                          >
                            <Typography
                              sx={{ fontWeight: 600, color: '#0F2440' }}
                            >
                              {workspace?.default_schema}
                            </Typography>
                          </Box>
                        </>
                      ) : (
                        ''
                      )}
                    </Box>
                  </Box>
                  <Box>
                    {dbtSetupStage === 'create-workspace' ? (
                      <Button
                        variant="contained"
                        onClick={() => setShowConnectRepoDialog(true)}
                      >
                        Connect & Setup Repo{' '}
                      </Button>
                    ) : dbtSetupStage === 'complete' ? (
                      <>
                        {anyBlockLocked ? (
                          <CircularProgress />
                        ) : (
                          <>
                            {Object.keys(dbtBlocks).map((target) => (
                              <DBTTarget
                                key={target}
                                setExpandLogs={setExpandLogs}
                                setRunning={setRunning}
                                running={running}
                                setDbtRunLogs={(logs: string[]) => {
                                  setDbtSetupLogs(logs);
                                }}
                                blocks={dbtBlocks[target].filter(
                                  (block) =>
                                    block.action.indexOf('docs-generate') < 0
                                )}
                              />
                            ))}
                            <Button
                              aria-controls={open ? 'basic-menu' : undefined}
                              aria-haspopup="true"
                              aria-expanded={open ? 'true' : undefined}
                              onClick={(event) =>
                                handleClick(event.currentTarget)
                              }
                              variant="contained"
                              color="info"
                              sx={{ p: 0, minWidth: 32, ml: 2 }}
                            >
                              <MoreHorizIcon />
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      ''
                    )}
                  </Box>
                </Card>
                <Box>
                  {dbtSetupStage === 'create-workspace' ? (
                    <DBTSetup
                      setLogs={setDbtSetupLogs}
                      setExpandLogs={setExpandLogs}
                      onCreateWorkspace={() => {
                        createProfile();
                        setRerender(!rerender);
                      }}
                      showDialog={showConnectRepoDialog}
                      setShowDialog={setShowConnectRepoDialog}
                      gitrepoUrl=""
                      schema=""
                      mode="create"
                      setWorkspace={setWorkspace}
                    />
                  ) : dbtSetupStage === 'complete' && workspace ? (
                    <DBTSetup
                      setLogs={setDbtSetupLogs}
                      setExpandLogs={setExpandLogs}
                      onCreateWorkspace={async () => {
                        await fetchDbtWorkspace();
                      }}
                      showDialog={showConnectRepoDialog}
                      setShowDialog={setShowConnectRepoDialog}
                      gitrepoUrl={workspace?.gitrepo_url}
                      schema={workspace?.default_schema}
                      mode="edit"
                      setWorkspace={setWorkspace}
                    />
                  ) : (
                    ''
                  )}
                  <LogCard
                    logs={dbtSetupLogs}
                    expand={expandLogs}
                    setExpand={setExpandLogs}
                  />
                </Box>
              </>
            )}
            {activeTab === 'docs' &&
              dbtSetupStage === 'complete' &&
              workspace && <DBTDocs />}
          </>
        )}
      </main>
    </>
  );
};

export default Transform;
