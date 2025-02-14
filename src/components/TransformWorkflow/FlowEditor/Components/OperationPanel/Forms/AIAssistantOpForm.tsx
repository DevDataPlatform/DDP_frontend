import React, { useEffect, useRef, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  CircularProgress,
  circularProgressClasses,
  ClickAwayListener,
  FormLabel,
  List,
  ListItem,
  Paper,
} from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { Controller, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { OperationFormProps } from '../../OperationConfigLayout';
import InfoTooltip from '@/components/UI/Tooltip/Tooltip';
import { useOpForm } from '@/customHooks/useOpForm';
import { delay } from '@/utils/common';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';

function GradientCircularProgress() {
  return (
    <React.Fragment>
      <svg width={0} height={0}>
        <defs>
          <linearGradient id="my_gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e01cd5" />
            <stop offset="100%" stopColor="#1CB5E0" />
          </linearGradient>
        </defs>
      </svg>
      <CircularProgress
        sx={{
          'svg circle': { stroke: 'url(#my_gradient)' },
          height: '20px !important',
          width: '20px !important',
          ml: 1,
        }}
      />
    </React.Fragment>
  );
}

interface GenericDataConfig {
  columns: string[];
  source_columns: string[];
  prompt: string;
  other_inputs: any[];
}

const AIAssistantOpForm = ({
  node,
  operation,
  sx,
  continueOperationChain,
  clearAndClosePanel,
  dummyNodeId,
  action,
  setLoading,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [generating, setGenerating] = useState(false);
  const [srcColumns, setSrcColumns] = useState<string[]>([]);
  const { parentNode, nodeData } = useOpForm({
    props: {
      node,
      operation,
      sx,
      continueOperationChain,
      action,
      setLoading,
    },
  });
  const { control, handleSubmit, reset, setValue, getValues } = useForm({
    defaultValues: {
      prompt: '',
    },
  });

  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textFieldRef = useRef(null); // For dropdown positioning

  const handleInputChange = (event) => {
    const value = event.target.value;
    setInputValue(value);
    setCursorPosition(event.target.selectionStart); // Track where the user is typing

    // Show options if the user types "@" followed by any text
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1 && atIndex < cursorPosition) {
      const query = value.substring(atIndex + 1, cursorPosition);
      const matches = srcColumns.filter((option) =>
        option.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredOptions(matches);
      setOpen(matches.length > 0);
    } else {
      setOpen(false);
    }
  };

  const handleOptionSelect = (option) => {
    // const { prompt } = getValues();
    // setInputValue(option); // Set the selected option as input value

    const atIndex = inputValue.lastIndexOf('@'); // Get the position of the last "@"
    const newValue = inputValue.substring(0, atIndex) + option + ' '; // Replace @ with the selected option
    setValue('prompt', newValue); // Update the input value
    setOpen(false); // Close the dropdown

    // setOpen(false); // Close the dropdown
  };

  let inputName = '';
  if (node?.type === SRC_MODEL_NODE) {
    inputName = nodeData.input_name;
  } else if (node?.type === OPERATION_NODE && nodeData.config.input_models.length > 0) {
    inputName = nodeData.config.input_models[0].name;
  } else {
    inputName = 'undefined';
  }

  const handleSave = async (data: any) => {
    setGenerating(true);
    const finalNode = node?.data.isDummy ? parentNode : node; //change  //this checks for edit case too.
    const finalAction = node?.data.isDummy ? 'create' : action; //change

    try {
      const postData = {
        op_type: '',
        source_columns: srcColumns,
        other_inputs: [],
        config: { query: data.prompt },
        input_uuid: finalNode?.type === SRC_MODEL_NODE ? finalNode?.id : '',
        target_model_uuid: finalNode?.data.target_model_id || '',
      };

      await delay(1000);

      // api call
      setLoading(true);
      let operationNode: any;
      if (finalAction === 'create') {
        operationNode = await httpPost(session, `transform/agent/chat/`, postData);
      }

      continueOperationChain(operationNode);
      reset();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };
  const fetchAndSetSourceColumns = async () => {
    if (node?.type === SRC_MODEL_NODE) {
      try {
        const data: ColumnData[] = await httpGet(
          session,
          `warehouse/table_columns/${nodeData.schema}/${nodeData.input_name}`
        );
        setSrcColumns(data.map((col: ColumnData) => col.name));
      } catch (error) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    fetchAndSetSourceColumns();
  }, [session, node]);

  const handleClickAway = () => {
    setOpen(false); // Close the dropdown if clicked outside
  };

  return (
    <Box sx={{ ...sx }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <ClickAwayListener onClickAway={handleClickAway}>
          <Box sx={{ padding: '32px 16px 0px 16px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormLabel sx={{ mr: 1, color: 'black' }}>Prompt</FormLabel>
              <Box sx={{ display: 'inline-block' }}>
                <InfoTooltip title={'Write your query in natural language'} />
              </Box>
            </Box>
            <Controller
              control={control}
              rules={{ required: 'Prompt is required' }}
              name="prompt"
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  onChange={(event) => {
                    field.onChange(event.target.value);
                    handleInputChange(event);
                  }}
                  multiline
                  rows={4}
                  ref={textFieldRef}
                  helperText={fieldState.error?.message}
                  error={!!fieldState.error}
                  disabled={action === 'view' || generating}
                  fieldStyle="transformation"
                  label=""
                  sx={{ padding: '0' }}
                />
              )}
            />
            {open && (
              <Paper
                style={{
                  position: 'absolute',
                  top: textFieldRef.current?.offsetHeight || 0,
                  width: '100%',
                  zIndex: 1,
                }}
              >
                <List>
                  {filteredOptions.map((option, index) => (
                    <ListItem button key={index} onClick={() => handleOptionSelect(option)}>
                      {option}
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            <Box sx={{ m: 2 }} />
            <Box sx={{ position: 'sticky', bottom: 0, background: '#fff', pb: 2 }}>
              <Button
                disabled={action === 'view' || generating}
                variant="contained"
                type="submit"
                data-testid="savebutton"
                fullWidth
                sx={{ marginTop: '17px' }}
              >
                {generating ? (
                  <>
                    Generating <GradientCircularProgress />
                  </>
                ) : (
                  <>Generate nodes</>
                )}
              </Button>
            </Box>
          </Box>
        </ClickAwayListener>
      </form>
    </Box>
  );
};

export default AIAssistantOpForm;
