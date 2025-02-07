import { Box, Button, IconButton, Typography } from '@mui/material';
import Image from 'next/image';
import { useEffect, useContext } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import InfoTooltip from '../UI/Tooltip/Tooltip';
import DalgoIcon from '@/assets/icons/dalgoIcon.svg';
import { copyToClipboard } from '@/utils/common';
import { successToast, errorToast } from '../ToastMessage/ToastHelper';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ContentCopy, ThumbDownAltOutlined } from '@mui/icons-material';
import { MODALS } from '@/pages/analysis/data-analysis_old';
import { useTracking } from '@/contexts/TrackingContext';

export const LLMSummary = ({
  resetState,
  llmSummary,
  downloadCSV,
  setIsBoxOpen,
  setModalName,
  newSessionId,
  oldSessionMetaInfo,
}: {
  resetState: boolean;
  llmSummary: string;
  downloadCSV: () => void;
  setIsBoxOpen: (x: boolean) => void;
  setModalName: (x: string) => void;
  newSessionId: string;
  oldSessionMetaInfo: any;
  handleNewSession: (x: any) => void;
}) => {
  const globalContext = useContext(GlobalContext);
  const trackAmplitudeEvent: any = useTracking();

  // Function to handle copying text ->
  const handleCopyClick = async () => {
    const copyRes: boolean = await copyToClipboard(llmSummary);
    trackAmplitudeEvent(`[Copy-LLMSummary] Button Clicked`);
    if (copyRes) {
      successToast('Successfully copied to clipboard', [], globalContext);
    } else {
      errorToast('Some problem with copying. Please try again', [], globalContext);
    }
  };

  // checks for the route change->
  //cover both cases, while editing, and the first time too wehn the user creats a analysis.

  useEffect(() => {
    if (resetState && newSessionId) {
      setModalName(MODALS.RESET_WARNING);
      setIsBoxOpen(true);
    }
  }, [resetState]);
  // Function to handle CSV download

  return (
    <Box sx={{ ...customCss, width: '58%' }}>
      <Box sx={{ width: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: '#0F2440',
            fontWeight: 600,
            fontSize: '20px',
            gap: '.2rem',
          }}
        >
          AI Analysis
          <InfoTooltip
            title={
              <Typography variant="body2">
                The AI response based on the parameters you have provided for analytics. Edit the
                parameters to fine-tune the response
              </Typography>
            }
          />
        </Box>

        {/* Summary UI */}
        <Box
          sx={{
            height: '32rem',
            border: '2px solid #F5F5F5',
            borderRadius: '6px',
            marginTop: '2rem',
            position: 'relative',
            backgroundColor: '#F4F9F9',
          }}
        >
          <Image
            style={{
              width: '2.5rem',
              height: '2.5rem',
              position: 'relative',
              top: '2rem',
              left: '2rem',
            }}
            src={DalgoIcon}
            alt="dalgo icon"
          />
          <Typography
            sx={{
              margin: '1.75rem 2rem',
              height: '72%',
              overflowY: 'scroll', // Enable horizontal scrolling
              padding: '0 .5rem',
            }}
          >
            <Markdown remarkPlugins={[remarkGfm]}>{llmSummary}</Markdown>

            {/* {llmSummary} */}
          </Typography>

          {/* Icons */}
          <Box
            sx={{
              display: 'flex',
              gap: '0.3rem',
              position: 'absolute',
              bottom: '22px',
              right: '1.25rem',
            }}
          >
            <IconButton disabled={!llmSummary} onClick={handleCopyClick}>
              <ContentCopy sx={{ color: llmSummary && '#0F2440AD' }} />
            </IconButton>
            <IconButton
              onClick={() => {
                trackAmplitudeEvent(`[Dislike-LLMSummary] Button Clicked`);
                setModalName(MODALS.FEEDBACK_FORM);
                setIsBoxOpen(true);
              }}
              disabled={!llmSummary}
            >
              <ThumbDownAltOutlined sx={{ color: llmSummary && '#0F2440AD' }} />
            </IconButton>
          </Box>
        </Box>

        {/* Buttons */}
        <Box sx={{ display: 'flex', gap: '12px', marginTop: '2rem' }}>
          <Button
            variant="outlined"
            disabled={!newSessionId}
            onClick={() => {
              trackAmplitudeEvent(`[Save-as-LLMSummary] Button Clicked`);
              setModalName(oldSessionMetaInfo.oldSessionId ? MODALS.OVERWRITE : MODALS.SAVE);
              setIsBoxOpen(true);
            }}
            sx={{
              width: '6.75rem',
              padding: '8px 0',
              borderRadius: '6px',
              boxShadow: '0px 2px 4px 0px #09254029',
            }}
          >
            Save as
          </Button>
          <Button
            variant="contained"
            sx={{ width: '6.75rem', padding: '8px 0', borderRadius: '6px' }}
            disabled={!llmSummary}
            onClick={() => {
              downloadCSV();
              trackAmplitudeEvent(`[Download-aisummary-LLMSummary] Button Clicked`);
            }}
          >
            Download
          </Button>
        </Box>

        {/* Modal */}
      </Box>
    </Box>
  );
};

// CSS for the container box
const customCss = {
  display: 'flex',
  boxShadow: '0 4px 8px rgba(9, 37, 64, 0.08)',
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '2rem',
};

LLMSummary.displayName = 'LLM-summary';
