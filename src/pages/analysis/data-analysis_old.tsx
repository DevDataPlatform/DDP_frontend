import { Backdrop, Box, CircularProgress, Typography } from '@mui/material';
import { LLMSummary } from '@/components/DataAnalysis/LLMSummary';
import { SqlWrite } from '@/components/DataAnalysis/SqlWrite';
import { httpGet, httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { delay } from '@/utils/common';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import { useContext, useEffect, useState } from 'react';
import { SavedSession } from '@/components/DataAnalysis/SavedSession';
import { TopBar } from '@/components/DataAnalysis/TopBar';
import { jsonToCSV } from 'react-papaparse';
import { PageHead } from '@/components/PageHead';
import { Disclaimer } from '@/components/DataAnalysis/Disclaimer';
import { OverWriteDialog } from '@/components/DataAnalysis/OverwriteBox';
import { useRouter } from 'next/router';
import { DeactivatedMsg } from '@/components/DataAnalysis/DeactivatedMsg';
import { ChatInterface } from '@/components/DataAnalysis/chat_with_your_data/ChatInterface';
interface ProgressResult {
  response?: Array<any>;
  session_id?: string;
}

interface ProgressEntry {
  message: string;
  status: 'running' | 'completed' | 'failed';
  result?: ProgressResult;
}

interface UserPreferences {
  enable_email_notifications: boolean;
  disclaimer_shown: boolean;
  is_llm_active: boolean;
  enable_llm_requested: boolean;
}
export const MODALS = {
  SAVE: 'SAVE',
  OVERWRITE: 'OVERWRITE',
  CONFIRM_SAVEAS: 'CONFIRM_SAVEAS',
  FEEDBACK_FORM: 'FEEDBACK_FORM',
  UNSAVED_CHANGES: 'UNSAVED_CHANGES',
  RESET_WARNING: 'RESET_WARNING',
  EDIT_SESSION_WARNING: 'EDIT_SESSION_WARNING',
};

interface ProgressResponse {
  progress: ProgressEntry[];
}
export default function DataAnalysis() {
  const { data: session } = useSession();
  const router = useRouter();
  const [attemptedRoute, setAttemptedRoute] = useState(null);
  const globalContext = useContext(GlobalContext);
  const { dispatch, state } = globalContext?.UnsavedChanges ?? {};
  const [loading, setLoading] = useState(false);
  const [openSavedSessionDialog, setOpenSavedSessionDialog] = useState(false);
  const [resetState, setResetState] = useState(true);
  const [openDisclaimer, setOpenDisclaimer] = useState(false);
  const [openDeactivateMsg, setOpenDeactivateMsg] = useState(false);
  const [selectedSession, setSelectedSession] = useState();
  const [isBoxOpen, setIsBoxOpen] = useState(false);
  const [modalName, setModalName] = useState(MODALS.SAVE);
  const [userpreferences, setUserPreferences] = useState<UserPreferences | any>(null);
  //for the discalimer page.
  useEffect(() => {
    const orgSlug = localStorage.getItem('org-slug');
    try {
      if (orgSlug && session?.user?.email) {
        (async () => {
          const { success, res } = await httpGet(session, `userpreferences/`);
          if (success) {
            setUserPreferences(res);
            if (!res.is_llm_active) {
              setOpenDeactivateMsg(true);
              return;
            }
            if (!res.disclaimer_shown) {
              setOpenDisclaimer(true);
              return;
            }
          }
        })();
      }
    } catch (error: any) {
      errorToast(error.message, [], globalContext);
      console.error(error, 'error');
    }
  }, [session]);

  const [{ prompt, summary, newSessionId, ...oldSessionMetaInfo }, setSessionMetaInfo] = useState({
    prompt: '',
    summary: '',
    newSessionId: '',
    session_status: '',
    sqlText: '',
    taskId: '',
    session_name: '',
    oldSessionId: '',
  });
  const handleCloseSavedSession = () => {
    setOpenSavedSessionDialog(false);
  };
  const handleOpenSavedSession = () => {
    setOpenSavedSessionDialog(true);
  };
  const handleNewSession = (shouldRefreshState: boolean | undefined) => {
    //should refreshstate is when the save or overwrite api works.
    // !newSessionId is for the case when a old session is opened so it has only oldsessionId.
    if (shouldRefreshState || !newSessionId) {
      setSessionMetaInfo({
        prompt: '',
        summary: '',
        newSessionId: '',
        session_status: '',
        sqlText: '',
        taskId: '',
        session_name: '',
        oldSessionId: '',
      });
    }
    setResetState(true);
  };
  const handleEditSession = (info: any, openEdit: boolean) => {
    setSelectedSession(info);
    //shows me a modal asking to save the generated summary.
    if (newSessionId && !openEdit) {
      setIsBoxOpen(true);
      setModalName(MODALS.EDIT_SESSION_WARNING);
      return;
    }
    setSessionMetaInfo({
      newSessionId: '',
      ...oldSessionMetaInfo,
      ...info,
    });
  };
  const downloadCSV = () => {
    const csv = jsonToCSV([
      {
        session_name: oldSessionMetaInfo.session_name || null,
        sqlText: oldSessionMetaInfo.sqlText || null,
        prompt,
        summary,
        session_status: oldSessionMetaInfo.session_status || null,
        taskId: oldSessionMetaInfo.taskId || null,
        newSessionId: newSessionId || null,
        oldSessionId: oldSessionMetaInfo.oldSessionId || null,
      },
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'summary.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  //polling
  const pollForTaskRun = async (taskId: string) => {
    try {
      const response: ProgressResponse = await httpGet(session, 'tasks/stp/' + taskId);
      const lastMessage: any =
        response['progress'] && response['progress'].length > 0
          ? response['progress'][response['progress'].length - 1]
          : null;

      if (!['completed', 'failed'].includes(lastMessage?.status)) {
        await delay(3000);
        await pollForTaskRun(taskId);
      } else if (lastMessage?.status === 'failed') {
        errorToast(lastMessage?.message, [], globalContext);
        return;
      } else if (lastMessage?.status === 'completed') {
        successToast(lastMessage?.message, [], globalContext);

        setSessionMetaInfo((prev) => {
          return {
            ...prev,
            summary: lastMessage?.result?.response?.[0]?.response || 'No summary available',
            newSessionId: lastMessage?.result?.session_id || prev.newSessionId,
          };
        });
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    } finally {
      setLoading(false);
    }
  };

  // get llm summary
  const getLLMSummary = async ({
    sqlText,
    user_prompt,
  }: {
    sqlText: string;
    user_prompt: string;
  }) => {
    setLoading(true);
    try {
      const response: { request_uuid: string } = await httpPost(session, `warehouse/ask/`, {
        sql: sqlText,
        user_prompt,
      });
      if (!response?.request_uuid) {
        errorToast('Something went wrong', [], globalContext);
        return { error: 'ERROR' };
      }
      setSessionMetaInfo((prev) => {
        return {
          ...prev,
          sqlText,
          prompt: user_prompt,
          taskId: response.request_uuid,
        };
      });
      successToast(`Data analysis initiated successfully`, [], globalContext);
      await delay(3000);
      pollForTaskRun(response.request_uuid);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      errorToast(err.message, [], globalContext);
    }
  };
  //handling save session->
  const handleSaveSession = async (
    overwrite: boolean,
    old_session_id: string | null,
    session_name: string
  ) => {
    try {
      const response: { success: number } = await httpPost(
        session,
        `warehouse/ask/${newSessionId}/save`,
        {
          session_name,
          overwrite,
          old_session_id,
        }
      );
      if (response.success) {
        successToast(`${session_name} saved successfully`, [], globalContext);
        handleNewSession(true);
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    } finally {
      setIsBoxOpen(false);
    }
  };

  const handleFeedback = async (session_id: string, feedback: string) => {
    try {
      const response: { success: number } = await httpPost(
        session,
        `warehouse/ask/${session_id}/feedback`,
        {
          feedback,
        }
      );
      if (response.success) {
        successToast(`Feedback sent successfully`, [], globalContext);
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    } finally {
      setIsBoxOpen(false);
    }
  };

  // Submitting the session name -> Caan be overwrite or new session.
  const onSubmit = (sessionName: string, overwrite: boolean) => {
    const oldSessionIdToSend = overwrite ? oldSessionMetaInfo?.oldSessionId : null;
    handleSaveSession(overwrite, oldSessionIdToSend, sessionName);
  };

  //Submitting Feedback
  const submitFeedback = (feedback: string) => {
    let sessionIdToSend: any;
    if (newSessionId) {
      // if we have a newsession or if we have oldsession but again create a new summary (both oldsessionid and newsessionid).
      sessionIdToSend = newSessionId;
    } else if (oldSessionMetaInfo.oldSessionId) {
      //during edit when we have a oldsession id.
      sessionIdToSend = oldSessionMetaInfo.oldSessionId;
    }
    handleFeedback(sessionIdToSend, feedback);
  };

  //Warns user to save the session before moving to some other tab.
  useEffect(() => {
    const handleRouteChange = (url: any) => {
      if (
        (oldSessionMetaInfo.oldSessionId && newSessionId && state === false) ||
        (newSessionId && !oldSessionMetaInfo.oldSessionId && state === false)
      ) {
        router.events.emit('routeChangeError');
        setModalName(MODALS.UNSAVED_CHANGES);
        setIsBoxOpen(true);
        dispatch({ type: 'SET_UNSAVED_CHANGES' });
        setAttemptedRoute(url);
        throw 'Unsaved changes, route change aborted';
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      dispatch({ type: 'CLEAR_UNSAVED_CHANGES' });
    };
  }, [router, oldSessionMetaInfo.oldSessionId, state, newSessionId]);

  //the unsaved modal function->
  const onConfirmNavigation = () => {
    if (attemptedRoute) {
      dispatch({ type: 'SET_UNSAVED_CHANGES' });
      router.push(attemptedRoute);
    }
  };

  return (
    <>
      <PageHead title="Dalgo | LLM Analysis" />
      <Box
        sx={{
          p: '3rem 3rem',
          width: '100%',
          display: 'flex',
          gap: '1rem',
          margin: '0 auto',
          height: '95vh',
        }}
      >
        <Box
          sx={{
            ...customCss,
            width: '100%',
            flexDirection: 'column',
          }}
        >
          {/* Top saved Session Option */}
          {/* <TopBar
            handleOpenSavedSession={handleOpenSavedSession}
            handleNewSession={handleNewSession}
          /> */}

          {/* SQL write Area */}
          <ChatInterface />
        </Box>

        {/* Final Summary */}
        {/* <LLMSummary
          resetState={resetState}
          setModalName={setModalName}
          setIsBoxOpen={setIsBoxOpen}
          llmSummary={summary}
          downloadCSV={downloadCSV}
          newSessionId={newSessionId}
          oldSessionMetaInfo={oldSessionMetaInfo}
          handleNewSession={handleNewSession}
        /> */}

        {/* Loader full screen */}
        {loading && (
          <>
            {/* <FullPageBackground> */}
            <Backdrop
              open={!!loading}
              sx={{
                zIndex: 1300,
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <>
                <CircularProgress sx={{ color: '#FFFFFF' }} />
                <Typography sx={{ fontWeight: '600', fontSize: '20px', color: '#FFFFFF' }}>
                  Prepping your data output...
                </Typography>
              </>
            </Backdrop>
          </>
        )}

        {/* Saved Session Dailog */}
        {openSavedSessionDialog && (
          <SavedSession
            open={openSavedSessionDialog}
            onClose={handleCloseSavedSession}
            handleEditSession={handleEditSession}
          />
        )}
        {openDisclaimer && (
          <Disclaimer open={openDisclaimer} setIsOpen={setOpenDisclaimer} isOrgPrefernce={false} />
        )}

        {openDeactivateMsg && (
          <DeactivatedMsg
            open={openDeactivateMsg}
            setIsOpen={setOpenDeactivateMsg}
            enable_llm_requested={userpreferences?.enable_llm_requested}
          />
        )}
        {isBoxOpen && (
          <OverWriteDialog
            open={isBoxOpen}
            setIsBoxOpen={setIsBoxOpen}
            modalName={modalName}
            onSubmit={onSubmit}
            submitFeedback={submitFeedback}
            onConfirmNavigation={onConfirmNavigation}
            handleNewSession={handleNewSession}
            setModalName={setModalName}
            oldSessionMetaInfo={oldSessionMetaInfo}
            handleEditSession={handleEditSession}
            selectedSession={selectedSession}
          />
        )}
      </Box>
    </>
  );
}

const customCss = {
  // display: 'flex',
  // boxShadow: '0 4px 8px rgba(9, 37, 64, 0.08)',
  // backgroundColor: '#FFFFFF',
  // borderRadius: '12px',
  // padding: '2rem',
  //   borderColor: '#FFFFFF',
};
