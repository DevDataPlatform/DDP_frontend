import { PageHead } from '@/components/PageHead';

import { Box, Dialog, Divider, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useContext, useEffect, useRef, useState } from 'react';
import { TopNavBar, Transition } from '@/components/DBT/DBTTransformType';
import { ResizableBox } from 'react-resizable';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { GenerateSql } from '@/components/DataAnalysis/chat_with_your_data/GenerateSql';
import { useForm } from 'react-hook-form';
import {
  ChatInterface,
  ChatMessage,
} from '@/components/DataAnalysis/chat_with_your_data/ChatInterface';

import useWebSocket from 'react-use-websocket';
import { generateWebsocketUrl } from '@/helpers/websocket';
import { Thread, Threads } from '@/components/DataAnalysis/chat_with_your_data/Threads';
import { PreviewPaneSql } from '@/components/DataAnalysis/chat_with_your_data/PreviewTable';

export default function Explore() {
  const { data: session } = useSession();
  const router = useRouter();
  const globalContext = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const refreshThreads = useRef<boolean>(false); // just a toggle to refetch threads list

  const [dialogueOpen, setDialogueOpen] = useState(true);
  const [width, setWidth] = useState(400);
  const [width_R, setWidth_R] = useState(400);

  const [height, setheight] = useState(500);
  const [height_R, setheight_R] = useState(500);

  // const onResize = (event: any, { size }: any) => {
  //   setWidth(size.width);
  // };
  // const onResize_R = (event: any, { size }: any) => {
  //   setWidth_R(size.width);
  // };

  const setRefreshThreads = (value: boolean) => {
    refreshThreads.current = !refreshThreads.current;
  };

  const { setValue, watch } = useForm({
    defaultValues: {
      aiGeneratedSql: '',
      userPrompt: '',
      tableData: [],
    },
  });

  const aiGeneratedSql = watch('aiGeneratedSql');
  const tableData = watch('tableData');
  const userPrompt = watch('userPrompt');

  const [socketUrl, setSocketUrl] = useState<string | null>(null);
  const {
    sendJsonMessage,
    lastJsonMessage,
  }: {
    sendJsonMessage: (...args: any) => any;
    lastJsonMessage: { data: any; status: string; message: string } | null;
  } = useWebSocket(socketUrl, {
    share: true,
    onError(event) {
      console.error('Socket error:', event);
    },
  });

  useEffect(() => {
    if (session) {
      setSocketUrl(generateWebsocketUrl('chat/bot', session));
    }
  }, [session]);

  useEffect(() => {
    const dialogBox = document.querySelector('.MuiDialog-container');

    if (dialogBox) {
      const fullHeight = dialogBox?.clientHeight - 100;
      setheight(fullHeight);
    }
  }, []);

  useEffect(() => {
    if (currentThread) {
      console.log(currentThread, 'currentThread');
      setValue('aiGeneratedSql', currentThread.meta.sql);
      setValue('userPrompt', currentThread.meta.user_prompt);
    } else {
      setValue('aiGeneratedSql', '');
      setValue('userPrompt', '');
    }
  }, [currentThread]);

  const triggerRefreshThreads = async () => {
    // refersh the threads list
    // sendJsonMessage({ action: 'get_threads' });
    console.log('In main refreshing threads function');
    setRefreshThreads(!refreshThreads);
  };

  return (
    <>
      <PageHead title="Dalgo | Data Analysis" />
      <Dialog fullScreen open={dialogueOpen} TransitionComponent={Transition}>
        <TopNavBar
          handleClose={() => {
            setDialogueOpen(false);
            router.push('/pipeline/ingest');
          }}
        />
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            overflow: 'inherit',
            position: 'relative',
            height: '80vh',
          }}
        >
          {/* LEFT SIDE TO VIEW THE THREADS */}
          {/* <ResizableBox
            axis="x"
            width={width_R}
            onResize={onResize_R}
            minConstraints={[280, Infinity]}
            maxConstraints={[550, Infinity]}
            resizeHandles={['e']}
          > */}
          <Box style={{ width: '30vw' }}>
            {' '}
            {/* Ensure scrollable content */}
            <Threads
              threads={threads}
              setThreads={setThreads}
              setChatMessages={setChatMessages}
              setCurrentThread={setCurrentThread}
              currentThread={currentThread}
            />
          </Box>
          {/* </ResizableBox> */}

          <Divider orientation="vertical" sx={{ color: 'black' }} />
          {/* Chat with your data. */}

          <Box sx={{ width: `calc(100% - ${width}px)` }}>
            <Box>
              <Box sx={{ height: 'unset' }}>
                <ChatInterface
                  chatMessages={chatMessages}
                  currentThread={currentThread}
                  aiGeneratedSql={aiGeneratedSql}
                  setChatMessages={setChatMessages}
                />
              </Box>
            </Box>
          </Box>
          {/* Chat with your data. */}
          <Divider orientation="vertical" sx={{ color: 'black' }} />
          {/* <ResizableBox axis="x"
            width={width}
            onResize={onResize}
            minConstraints={[280, Infinity]}
            maxConstraints={[550, Infinity]}
            resizeHandles={['w']}> */}

          {/* <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
              </AccordionSummary>
              <AccordionDetails>
              </AccordionDetails>
            </Accordion> */}
          <Box sx={{ width: '30vw' }}>
            <GenerateSql
              aiGeneratedSql={aiGeneratedSql}
              userPrompt={userPrompt}
              triggerRefreshThreads={triggerRefreshThreads}
              setThreads={setThreads}
              setCurrentThread={setCurrentThread}
            />
          </Box>
          {/* </ResizableBox> */}
        </Box>

        {/* 
        <ResizableBox
          axis="y"
          width={width_R}
          onResize={onResize_R}
          minConstraints={[280, Infinity]}
          maxConstraints={[550, Infinity]}
          resizeHandles={['n']}
        >
          <PreviewPaneSql height={height} initialSqlString={aiGeneratedSql} />

        </ResizableBox> */}
        {/* <ResizableBox
          axis="y"
          resizeHandles={['n']}
          width={Infinity}
          height={300}
          onResize={onResize}
          minConstraints={[Infinity, 100]}
        > */}
        <PreviewPaneSql height={100} initialSqlString={aiGeneratedSql} />
        {/* <PreviewPaneSql height={300} initialSqlString={aiGeneratedSql} /> */}
        {/* </ResizableBox> */}
      </Dialog>
    </>
  );
}
