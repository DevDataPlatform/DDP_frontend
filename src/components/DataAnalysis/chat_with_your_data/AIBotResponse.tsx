import { Box } from '@mui/material';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from './ChatInterface';

export const AIBotResponse = ({ message }: { message: ChatMessage }) => {
  return (
    <>
      <Box
        key={message.id}
        sx={{ display: 'flex', justifyContent: 'flex-start', padding: '5px 0 5px 30px' }}
      >
        <Box
          sx={{
            backgroundColor: '#0A6B4A',
            color: 'white',
            padding: '5px',
            borderRadius: '5px',
            maxWidth: '90%',
          }}
        >
          <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
        </Box>
      </Box>
    </>
  );
};
