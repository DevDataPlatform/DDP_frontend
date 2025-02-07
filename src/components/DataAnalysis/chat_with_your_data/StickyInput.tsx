import { Box, Button, TextField } from '@mui/material';
import { Controller } from 'react-hook-form';

export const StickyInputBox = ({ handleSubmit, onSubmit, control }: any) => {
  return (
    <Box
      sx={{
        position: 'sticky', // Makes it stick to the bottom
        bottom: 0, // Aligns it to the bottom of the page/container
        zIndex: 1000, // Ensures it stays on top of other elements
        // backgroundColor: '#f9f9f9', // Background color
        // borderTop: '1px solid #ddd', // Subtle top border for separation
        // padding: '1rem', // Padding for spacing
        // boxShadow: '0 -2px 5px rgba(0, 0, 0, 0.1)', // Shadow for better visibility
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: '1rem',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Controller
          name="userMessage"
          control={control}
          render={({ field }) => (
            <TextField
              placeholder="Enter your customized prompt here"
              multiline
              rows={1}
              fullWidth
              {...field}
              sx={{
                flexGrow: 1,
                borderRadius: '5px',
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
              }}
            />
          )}
        />
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          sx={{
            width: '6.75rem',
            padding: '10px 0',
            borderRadius: '5px',
            backgroundColor: '#007bff',
            color: '#fff',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#0056b3',
            },
          }}
        >
          Submit
        </Button>
      </Box>
    </Box>
  );
};
