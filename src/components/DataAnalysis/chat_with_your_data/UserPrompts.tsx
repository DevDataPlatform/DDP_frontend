import { Box } from '@mui/material';
import { ChatMessage } from './ChatInterface';

export const UserPrompts = ({ message }: { message: ChatMessage }) => {
  return (
    <>
      <Box
        key={message.id}
        sx={{ display: 'flex', justifyContent: 'flex-end', padding: '5px 30px 5px 0 ' }}
      >
        <Box
          sx={{ backgroundColor: '#0F2440AD', color: 'white', padding: '5px', borderRadius: '5px' }}
        >
          {message.content}
        </Box>
      </Box>
    </>
  );
};
