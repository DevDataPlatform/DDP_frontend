import { generateWebsocketUrl } from '@/helpers/websocket';
import { Box, Divider, IconButton, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useContext, useEffect, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import Image from 'next/image';
import DeleteIcon from '@/assets/icons/delete.svg';
import { error } from 'console';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { Mutable } from 'next/dist/client/components/router-reducer/router-reducer-types';

export enum ThreadStatus {
  OPEN = 'open',
  CLOSED = 'close',
}

export interface ThreadMeta {
  user_prompt: string;
  sql: string;
}

export interface Thread {
  session_id: string;
  uuid: string;
  status: string;
  meta: ThreadMeta;
  created_at: string;
  updated_at: string;
}

export enum WebSocketResponseStatus {
  SUCCESS = 'success',
  ERROR = 'error',
}

export const Threads = ({
  threads,
  setChatMessages,
  setCurrentThread,
  currentThread,
  setThreads,
}: {
  threads: Thread[];
  currentThread: Thread | null;
  setChatMessages: (...args: any) => any;
  setCurrentThread: (...args: any) => any;
  setThreads: (...args: any) => any;
}) => {
  const globalContext = useContext(GlobalContext);
  const { data: session }: any = useSession();
  const [socketUrl, setSocketUrl] = useState<string | null>(null);

  const {
    sendJsonMessage,
  }: {
    sendJsonMessage: (...args: any) => any;
    lastJsonMessage: { data: any; status: string; message: string } | null;
  } = useWebSocket(socketUrl, {
    share: true,
    onOpen: () => {
      sendJsonMessage({ action: 'get_threads' });
    },
    onMessage: (event) => {
      let lastMessage = JSON.parse(event.data);
      onMessageReceived(lastMessage);
    },
    onError(event) {
      console.error('Socket error:', event);
    },
  });

  const onMessageReceived = (jsonMessage: any) => {
    if (jsonMessage && jsonMessage.data && jsonMessage.status === WebSocketResponseStatus.SUCCESS) {
      if (jsonMessage.data.messages) {
        setChatMessages(jsonMessage.data.messages);
      } else if (jsonMessage.data.threads && jsonMessage.data.threads.length > 0) {
        setThreads(jsonMessage.data.threads);
        setCurrentThread(
          jsonMessage.data.threads.filter((th: Thread) => th.status === ThreadStatus.OPEN)[0]
        );
      }
    } else if (jsonMessage && jsonMessage.status === WebSocketResponseStatus.ERROR) {
      errorToast(jsonMessage.message, [], globalContext);
    } else {
      console.log('Something went wrong; probably a refresh & lastMessage is null', jsonMessage);
    }
  };

  useEffect(() => {
    if (session) {
      setSocketUrl(generateWebsocketUrl('chat/bot', session));
    }
  }, [session]);

  useEffect(() => {
    if (socketUrl) sendJsonMessage({ action: 'get_threads' });
  }, [socketUrl]);

  const onSelectThread = (thread: Thread) => {
    setCurrentThread(thread);
    sendJsonMessage({ action: 'get_messages', params: { thread_uuid: thread.uuid } });
  };

  const onCloseThread = (thread: Thread) => {
    sendJsonMessage({ action: 'close_thread', params: { thread_uuid: thread.uuid } });
    sendJsonMessage({ action: 'get_threads' });
  };

  return (
    <>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h4">Conversations</Typography>
        </Box>
        <Divider />

        <Box sx={{ overflowY: 'scroll', height: '55vh', padding: '10px 10px' }}>
          {/* {true ? ( */}
          <Box>
            {threads
              .filter((thread) => thread.status === ThreadStatus.OPEN)
              .map((thread: Thread, index: number) => (
                <>
                  {' '}
                  <Tab
                    dir="bottom"
                    sx={{
                      backgroundColor: currentThread?.uuid === thread.uuid ? '#D0E2E2' : 'none',
                      color: currentThread?.uuid === thread.uuid ? '#0F2440' : 'black',
                      textTransform: 'lowercase',
                    }}
                    key={thread.uuid}
                    label={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                        }}
                      >
                        <span>{thread.meta.user_prompt}</span>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCloseThread(thread);
                          }}
                        >
                          <Image src={DeleteIcon} alt="delete icon" />
                        </IconButton>
                      </Box>
                    }
                    onClick={() => {
                      onSelectThread(thread);
                    }}
                  />
                </>
              ))}

            {/* <Divider sx={{ my: 2 }} /> */}
            {/* 
            {threads
              .filter((thread) => thread.status === ThreadStatus.CLOSED)
              .map((thread: Thread, index: number) => (
                <Tab
                  dir="bottom"
                  key={index}
                  label={
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                      }}
                    >
                      <span>{thread.meta.user_prompt}</span>
                    </Box>
                  }
                  sx={{
                    border: currentThread?.uuid === thread.uuid ? '1px solid #2196F3' : 'none',
                  }}
                  onClick={() => {
                    onSelectThread(thread);
                  }}
                />
              ))} */}
          </Box>
          {/* ) : (
            <Box>
              <Typography variant="body1">No threads available</Typography>
            </Box>
          )} */}
        </Box>
      </Box>
    </>
  );
};
