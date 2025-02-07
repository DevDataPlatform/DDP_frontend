import { generateWebsocketUrl } from '@/helpers/websocket';
import { ArrowCircleUp } from '@mui/icons-material';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { Thread, ThreadStatus } from './Threads';

export const GenerateSql = ({
  aiGeneratedSql,
  userPrompt,
  triggerRefreshThreads,
  setThreads,
  setCurrentThread,
}: {
  aiGeneratedSql: string;
  userPrompt: string;
  triggerRefreshThreads: (...args: any) => void;
  setThreads: (...args: any) => void;
  setCurrentThread: (...args: any) => void;
}) => {
  const { data: session }: any = useSession();
  const [socketUrl, setSocketUrl] = useState<string | null>(null);
  const [sqlFilterDataPrompt, setSqlFilterDataPrompt] = useState<string>('');

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

  const onSubmitSqlFilterDataPrompt = () => {
    // start the thread
    sendJsonMessage({
      action: 'generate_sql_and_start_thread',
      params: {
        user_prompt: sqlFilterDataPrompt,
      },
    });
  };

  useEffect(() => {
    if (userPrompt) {
      setSqlFilterDataPrompt(userPrompt);
    } else {
      setSqlFilterDataPrompt('');
    }
  }, [userPrompt]);

  useEffect(() => {
    if (lastJsonMessage) {
      if (lastJsonMessage.status === 'success') {
        if (
          lastJsonMessage.data &&
          lastJsonMessage.data.threads &&
          lastJsonMessage.data.threads.length > 0
        ) {
          setThreads(lastJsonMessage.data.threads);
          setCurrentThread(
            lastJsonMessage.data.threads.filter((th: Thread) => th.status === ThreadStatus.OPEN)[0]
          );
        }
      } else {
        console.error('Error:', lastJsonMessage.message);
      }
    }
  }, [lastJsonMessage]);

  return (
    <>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h4">Ask Away</Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '4px 4px',
          }}
        >
          <TextField
            placeholder="Enter your customized prompt here"
            multiline
            rows={4}
            fullWidth
            value={sqlFilterDataPrompt}
            onChange={(e) => setSqlFilterDataPrompt(e.target.value)}
            sx={{
              flexGrow: 1,
              borderRadius: '5px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
            }}
          />
          <ArrowCircleUp
            onClick={onSubmitSqlFilterDataPrompt}
            sx={{ cursor: 'pointer', width: '50px', height: '50px', color: 'green' }}
          />
        </Box>

        {aiGeneratedSql && (
          <Box sx={{ marginTop: '1rem' }}>
            <TextField
              id="outlined-multiline-static"
              label="Generated SQL"
              multiline
              rows={4}
              fullWidth
              value={aiGeneratedSql}
              variant="outlined"
            />
          </Box>
        )}
      </Box>
    </>
  );
};
