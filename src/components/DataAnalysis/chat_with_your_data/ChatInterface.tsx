import { Box, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useContext, useEffect, useState } from 'react';
import { UserPrompts } from './UserPrompts';
import { AIBotResponse } from './AIBotResponse';
import { StickyInputBox } from './StickyInput';

import { useSession } from 'next-auth/react';
import useWebSocket from 'react-use-websocket';
import { generateWebsocketUrl } from '@/helpers/websocket';
import { Thread, ThreadStatus } from './Threads';

export enum ChatMessageType {
  HUMAN = 'human',
  BOT = 'ai',
}

export interface ChatMessage {
  content: string;
  created_at: string;
  type: string;
  id: number;
}

// this can be the parent component and we can fetch the chat here and then send them as props to the children.
// if its a old chat that also we can fetch and show
// if new chat that too we can fetch from here and send.
// Good this is the same parnet compmpoennt then.

export const ChatInterface = ({
  currentThread,
  chatMessages,
  setChatMessages,
  aiGeneratedSql,
}: {
  currentThread: Thread | null;
  chatMessages: ChatMessage[];
  aiGeneratedSql: string;
  setChatMessages: (...args: any) => any;
}) => {
  const globalContext = useContext(GlobalContext);
  const { data: session }: any = useSession();
  const { control, setValue, watch, handleSubmit, reset } = useForm({
    defaultValues: {
      userMessage: '',
    },
  });
  const userMessage = watch('userMessage');

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
    if (lastJsonMessage && lastJsonMessage.data && lastJsonMessage.status === 'success') {
      if (lastJsonMessage.data.response) {
        sendJsonMessage({ action: 'get_messages', params: { thread_uuid: currentThread?.uuid } });
      } else if (lastJsonMessage.data.messages) {
        setChatMessages(lastJsonMessage.data.messages);
      }
    }
  }, [lastJsonMessage]);

  const onSubmit = async (data: any) => {
    if (currentThread && currentThread.status === ThreadStatus.OPEN) {
      sendJsonMessage({
        action: 'ask_bot',
        params: { thread_uuid: currentThread.uuid, message: userMessage },
      });
    }
    // push the user chat message
    setChatMessages([
      ...chatMessages,
      {
        content: userMessage,
        created_at: new Date().toISOString(),
        type: ChatMessageType.HUMAN,
        id: 0,
      },
    ]);
    setValue('userMessage', '');
  };

  useEffect(() => {
    if (currentThread) {
      sendJsonMessage({ action: 'get_messages', params: { thread_uuid: currentThread.uuid } });
    } else {
      setChatMessages([]);
    }
  }, [currentThread]);

  return (
    <>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h4">Chat With Your Data</Typography>
        </Box>
        <Box
          sx={{
            height: '50vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'scroll',
          }}
        >
          {/* Top box will have chats  */}
          <Box sx={{}}>
            {chatMessages?.length > 0 &&
              chatMessages.map((message: ChatMessage, index: any) => {
                if (message.type === ChatMessageType.HUMAN) {
                  return <UserPrompts key={index} message={message} />;
                } else {
                  return <AIBotResponse key={index} message={message} />;
                }
              })}
          </Box>
          {/* Bottom box will have user input fixed */}
          <Box></Box>
        </Box>

        {aiGeneratedSql && (
          <StickyInputBox handleSubmit={handleSubmit} onSubmit={onSubmit} control={control} />
        )}
      </Box>
    </>
  );
};
