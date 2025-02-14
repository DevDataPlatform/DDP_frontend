import {
  Backdrop,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  SxProps,
  Typography,
} from '@mui/material';
import React, { memo, useContext, useEffect, useMemo, useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { OperationNodeData, OperationNodeType, SrcModelNodeType, UIOperationType } from './Canvas';
import {
  OPERATION_NODE,
  RENAME_COLUMNS_OP,
  SRC_MODEL_NODE,
  JOIN_OP,
  REPLACE_COLUMN_VALUE_OP,
  DROP_COLUMNS_OP,
  COALESCE_COLUMNS_OP,
  ARITHMETIC_OP,
  GROUPBY_OP,
  WHERE_OP,
  CAST_DATA_TYPES_OP,
  AGGREGATE_OP,
  CASEWHEN_OP,
  UNION_OP,
  FLATTEN_JSON_OP,
  PIVOT_OP,
  UNPIVOT_OP,
  GENERIC_COL_OP,
  GENERIC_SQL_OP,
  AI_ASSISTANT,
} from '../constant';
import AIAssistantOpForm from './OperationPanel/Forms/AIAssistantOpForm';
import RenameColumnOpForm from './OperationPanel/Forms/RenameColumnOpForm';
import CastColumnOpForm from './OperationPanel/Forms/CastColumnOpForm';
import DropColumnOpForm from './OperationPanel/Forms/DropColumnOpForm';
import { operations } from '../constant';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CreateTableOrAddFunction from './OperationPanel/CreateTableOrAddFunction';
import { useCanvasAction, useCanvasNode } from '@/contexts/FlowEditorCanvasContext';
import CreateTableForm from './OperationPanel/Forms/CreateTableForm';
import { Edge, useReactFlow } from 'reactflow';
import JoinOpForm from './OperationPanel/Forms/JoinOpForm';
import ReplaceValueOpForm from './OperationPanel/Forms/ReplaceValueOpForm';
import CoalesceOpForm from './OperationPanel/Forms/CoalesceOpForm';
import ArithmeticOpForm from './OperationPanel/Forms/ArithmeticOpForm';
import AggregationOpForm from './OperationPanel/Forms/AggregationOpForm';
import GroupByOpForm from './OperationPanel/Forms/GroupByOpForm';
import WhereFilterOpForm from './OperationPanel/Forms/WhereFilterOpForm';
import CaseWhenOpForm from './OperationPanel/Forms/CaseWhenOpForm';
import UnionTablesOpForm from './OperationPanel/Forms/UnionTablesOpForm';
import FlattenJsonOpForm from './OperationPanel/Forms/FlattenJsonOpForm';
import { generateDummyOperationlNode } from './dummynodes';
import InfoTooltip from '@/components/UI/Tooltip/Tooltip';
import PivotOpForm from './OperationPanel/Forms/PivotOpForm';
import UnpivotOpForm from './OperationPanel/Forms/UnpivotOpForm';
import GenericColumnOpForm from './OperationPanel/Forms/GenericColumnOpForm';
import { getNextNodePosition } from '@/utils/editor';
import GenericSqlOpForm from './OperationPanel/Forms/GenericSqlOpForm';
import { GlobalContext } from '@/contexts/ContextProvider';

interface OperationConfigProps {
  sx: SxProps;
  openPanel: boolean;
  setOpenPanel: (...args: any) => void;
}

export interface OperationFormProps {
  node: SrcModelNodeType | OperationNodeType | null | undefined;
  operation: UIOperationType;
  sx: SxProps;
  continueOperationChain: (...args: any) => void;
  clearAndClosePanel?: (...args: any) => void;
  dummyNodeId?: string;
  action: 'create' | 'view' | 'edit';
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const operationComponentMapping: any = {
  [RENAME_COLUMNS_OP]: RenameColumnOpForm,
  [JOIN_OP]: JoinOpForm,
  [REPLACE_COLUMN_VALUE_OP]: ReplaceValueOpForm,
  [COALESCE_COLUMNS_OP]: CoalesceOpForm,
  [ARITHMETIC_OP]: ArithmeticOpForm,
  [DROP_COLUMNS_OP]: DropColumnOpForm,
  [CAST_DATA_TYPES_OP]: CastColumnOpForm,
  [AGGREGATE_OP]: AggregationOpForm,
  [GROUPBY_OP]: GroupByOpForm,
  [WHERE_OP]: WhereFilterOpForm,
  [CASEWHEN_OP]: CaseWhenOpForm,
  [UNION_OP]: UnionTablesOpForm,
  [FLATTEN_JSON_OP]: FlattenJsonOpForm,
  [PIVOT_OP]: PivotOpForm,
  [UNPIVOT_OP]: UnpivotOpForm,
  [GENERIC_COL_OP]: GenericColumnOpForm,
  [GENERIC_SQL_OP]: GenericSqlOpForm,
  [AI_ASSISTANT]: AIAssistantOpForm,
};

const OperationForm = memo(
  ({
    operation,
    node,
    sx,
    continueOperationChain,
    clearAndClosePanel,
    dummyNodeId,
    action,
    setLoading,
  }: OperationFormProps) => {
    if (operation === null || operation === undefined) {
      return null;
    }

    if (operation.slug === 'create-table') {
      return (
        <CreateTableForm
          node={node}
          operation={operation}
          sx={sx}
          continueOperationChain={continueOperationChain}
          clearAndClosePanel={clearAndClosePanel}
          dummyNodeId={dummyNodeId}
          action={action}
          setLoading={setLoading}
        />
      );
    }

    if (!Object.keys(operationComponentMapping).includes(operation.slug)) {
      return <>Operation not yet supported</>;
    }

    const Form = operationComponentMapping[operation.slug];
    const FormProps = {
      operation,
      node,
      sx,
      continueOperationChain,
      clearAndClosePanel,
      dummyNodeId,
      action,
      setLoading,
    };
    return <Form {...FormProps} />;
  }
);
OperationForm.displayName = 'OperationForm';

const OperationConfigLayout = ({ openPanel, setOpenPanel, sx }: OperationConfigProps) => {
  const { canvasAction, setCanvasAction } = useCanvasAction();
  const { canvasNode, setCanvasNode } = useCanvasNode();
  const [selectedOp, setSelectedOp] = useState<UIOperationType | null>();
  const [showFunctionsList, setShowFunctionsList] = useState<boolean>(false);
  const [isPanelLoading, setIsPanelLoading] = useState<boolean>(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState<boolean>(false);
  const [showAddFunction, setShowAddFunction] = useState<boolean>(true);
  const dummyNodeIdRef: any = useRef(null);
  const contentRef: any = useRef(null);
  const panelOpFormState = useRef<'create' | 'view' | 'edit'>('view');
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];

  const { addEdges, addNodes, deleteElements, getNodes, setNodes, getEdges } = useReactFlow();

  const handleClosePanel = () => {
    const dummyNodesArr: { id: string }[] = getNodes()
      .filter((node) => node.data.isDummy)
      .map((node) => ({ id: node.id }));
    dummyNodesArr.push({ id: dummyNodeIdRef.current });
    deleteElements({ nodes: dummyNodesArr });
    setOpenPanel(false);
    setShowFunctionsList(false);
    setSelectedOp(null);
    setCanvasNode(null);
  };

  const handleSelectOp = (op: UIOperationType) => {
    // Create the dummy node on canvas
    // For multi input operation we might have to do it inside the operation once they select the other inputs
    const dummyTargetNodeData: any = generateDummyOperationlNode(canvasNode, op);
    const newEdge: any = {
      id: `${canvasNode ? canvasNode.id : ''}_${dummyTargetNodeData.id}`,
      source: canvasNode ? canvasNode.id : '',
      target: dummyTargetNodeData.id,
      sourceHandle: null,
      targetHandle: null,
    };

    dummyNodeIdRef.current = dummyTargetNodeData.id;

    // unselect all nodes
    setNodes(
      getNodes().map((node) => {
        if (node.selected) {
          node.selected = false;
        }
        return node;
      })
    );
    addNodes([dummyTargetNodeData]);
    addEdges([newEdge]);

    setSelectedOp(op);
  };

  useEffect(() => {
    if (canvasAction.type === 'open-opconfig-panel') {
      setOpenPanel(true); // when a table or node is clicked , this opens the sql ops form.
      setSelectedOp(null);
      panelOpFormState.current = canvasAction.data || 'view';
      if (['view', 'edit'].includes(panelOpFormState.current)) {
        const nodeData = canvasNode?.data as OperationNodeData;
        if (permissions.includes('can_view_dbt_operation')) {
          setSelectedOp(operations.find((op) => op.slug === nodeData?.config?.type));
        }
      }
    }

    const nodes = getNodes();
    const areDummyNodes = nodes.some((node) => node.data?.isDummy === true);

    // if there are dummy nodes and user selects any other node (operational or source), then it deletes the node. So this prevents creation of multiple dummy nodes on the canvas.
    if (areDummyNodes && !canvasNode?.data.isDummy) {
      const dummyNodesArr: { id: string }[] = nodes
        .filter((node) => node.data.isDummy)
        .map((node) => ({ id: node.id }));
      dummyNodesArr.push({ id: dummyNodeIdRef.current });
      deleteElements({ nodes: dummyNodesArr });
    }

    if (canvasAction.type === 'close-reset-opconfig-panel') {
      handleClosePanel();
    }
  }, [canvasAction]);
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [selectedOp]);

  if (!openPanel) return null;

  const DiscardDialog = ({ handleBackbuttonAction }: any) => {
    return (
      <Dialog open={showDiscardDialog} onClose={() => setShowDiscardDialog(false)}>
        <DialogTitle>Discard Changes?</DialogTitle>
        <DialogContent>
          <Typography>
            All your changes will be discarded. Are you sure you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => setShowDiscardDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleBackbuttonAction} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const PanelHeader = () => {
    const handleBackbuttonAction = () => {
      //dummy nodes are generate only while creating & not updating
      if (panelOpFormState.current === 'create') {
        const dummyNodeIds: string[] = [dummyNodeIdRef.current];
        getNodes().forEach((node) => {
          if (node.data.isDummy) {
            dummyNodeIds.push(node.id);
          }
        });
        deleteElements({
          nodes: dummyNodeIds.map((nodeId: any) => ({
            id: nodeId,
          })),
        });
        setSelectedOp(null);
      }
      setShowDiscardDialog(false);
    };

    const handleBackButtonOnCreateTableAddFunction = () => {
      // show the form
      const { config } = canvasNode?.data as OperationNodeData;
      if (config && config.type) {
        const editingOperation = operations.find((op) => op.slug === config.type);
        setSelectedOp({
          slug: editingOperation?.slug || '',
          label: editingOperation?.label || '',
        });
      }
      // set the state to edit
      panelOpFormState.current = 'edit';
    };

    return (
      <Box>
        <Box
          sx={{
            padding: '6px 16px 6px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            border: '0px 0px 1px 0px',
            alignItems: 'center',
          }}
        >
          {((selectedOp && panelOpFormState.current === 'create') ||
            panelState === 'create-table-or-add-function') && (
            <IconButton
              onClick={
                panelState === 'create-table-or-add-function'
                  ? handleBackButtonOnCreateTableAddFunction
                  : () => setShowDiscardDialog(true)
              }
              data-testid="openoperationlist"
            >
              <ChevronLeftIcon fontSize="small" width="16px" height="16px" />
            </IconButton>
          )}
          <DiscardDialog handleBackbuttonAction={handleBackbuttonAction} />
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: '5px' }}>
            <Typography fontWeight={600} fontSize="15px" color="#0F2440" lineHeight={'21px'}>
              {selectedOp ? selectedOp.label : panelState === 'op-list' ? 'Functions' : ''}
            </Typography>
            <Box sx={{ width: '1px', height: '12px' }}>
              {panelState === 'op-form' && selectedOp ? (
                <InfoTooltip
                  title={
                    operations.find((op: UIOperationType) => op.slug === selectedOp.slug)
                      ?.infoToolTip ||
                    (selectedOp.slug === 'create-table'
                      ? 'Generate a table which will be saved with a new name in your desired warehouse schema'
                      : '')
                  }
                />
              ) : panelState === 'op-list' ? (
                <InfoTooltip title="Select a function to learn how you can use it to transform your data" />
              ) : (
                ''
              )}
            </Box>
          </Box>
          <IconButton onClick={handleClosePanel} data-testid="closeoperationpanel">
            <CloseIcon fontSize="small" width="16px" height="16px" />
          </IconButton>
        </Box>
        <Divider orientation="horizontal" />
      </Box>
    );
  };

  const OperationList = ({ sx }: { sx: SxProps }) => {
    // These are the operations that can't be chained in middle using ctes
    const cantChainOperationsInMiddle: string[] = [
      UNION_OP,
      CAST_DATA_TYPES_OP,
      FLATTEN_JSON_OP,
      UNPIVOT_OP,
    ];

    return (
      <Box sx={{ borderSpacing: '0px', ...sx }}>
        <List>
          {operations.map((op, index) => {
            const canSelectOperation = !(
              cantChainOperationsInMiddle.includes(op.slug) && canvasNode?.type === OPERATION_NODE
            );
            return (
              <ListItemButton
                key={op.slug}
                sx={{
                  padding: '10px 20px',
                  color: '#0F2440',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#F5FAFA',
                    '& .infoIcon': {
                      visibility: 'visible',
                    },
                  },
                  '& .infoIcon': {
                    visibility: 'hidden',
                  },
                }}
                onClick={
                  canSelectOperation
                    ? () => {
                        handleSelectOp(op);
                      }
                    : undefined
                }
              >
                {op.label}
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                  <InfoTooltip
                    placement="top"
                    title={
                      canSelectOperation
                        ? op.infoToolTip
                        : 'Please create a table to use this function'
                    }
                  />
                </Box>
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    );
  };

  const handleCreateTable = async () => {
    setSelectedOp({ slug: 'create-table', label: 'Create Output Table' });
  };

  const handleAddFunction = () => {
    setShowFunctionsList(true);
    panelOpFormState.current = 'create';
  };

  const prepareForNextOperation = async (opNodeData: OperationNodeData) => {
    // opNodeData - the node that just got saved
    if (opNodeData.id !== canvasNode?.id) {
      const dummyNodeId: string = dummyNodeIdRef.current;
      // get all edges of this dummy node and save
      const dummyNodeEdges = getEdges().filter(
        (edge: Edge) => edge.source === dummyNodeId || edge.target === dummyNodeId
      );

      // convert this dummy node to a real node from backend. basically create a new one
      const { x: xnew, y: ynew } = getNextNodePosition([
        {
          position: { x: canvasNode?.xPos, y: canvasNode?.yPos },
          height: 200,
        },
      ]);
      const dummyToRealNode = {
        id: opNodeData.id,
        type: OPERATION_NODE,
        data: opNodeData,
        position: { x: xnew, y: ynew },
      };

      // recreate the saved edges but this time to the real node
      const edgesToCreate: Edge[] = dummyNodeEdges.map((edge: Edge) => {
        const source = edge.source === dummyNodeId ? dummyToRealNode.id : edge.source;

        const target = edge.target === dummyNodeId ? dummyToRealNode.id : edge.target;

        return {
          id: `${source}_${target}`,
          source: source,
          target: target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        };
      });

      addNodes([dummyToRealNode]);
      addEdges(edgesToCreate);
    }
    deleteElements({
      nodes: [{ id: dummyNodeIdRef.current }],
    });
    if (selectedOp) {
      setShowAddFunction(selectedOp.slug !== GENERIC_SQL_OP);
    }
    setSelectedOp(null);
    setCanvasAction({
      type: 'update-canvas-node',
      data: { id: opNodeData.id, type: OPERATION_NODE },
    });
    // if its end of the chain continue to chain more or just close the operation panel
    if (opNodeData?.is_last_in_chain) {
      setShowFunctionsList(false);
      panelOpFormState.current = 'edit';
    } else {
      handleClosePanel();
    }

    // refresh canvas
    // setCanvasAction({ type: 'refresh-canvas', data: null });
  };

  const panelState = selectedOp
    ? 'op-form'
    : showFunctionsList || canvasNode?.type === SRC_MODEL_NODE
      ? 'op-list'
      : 'create-table-or-add-function';

  return (
    <Box
      sx={{
        ...sx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          // gap: '5px',
        }}
      >
        <Box>
          <PanelHeader />
          {isPanelLoading && (
            <LinearProgress
              sx={{
                position: 'sticky',
                top: '0%',
                width: '100%',
                color: '#33A195',
                overflow: 'none',
              }}
            />
          )}
        </Box>
        <Box
          ref={contentRef}
          sx={{
            flex: '1 1 auto',
            overflowY: 'auto',
          }}
        >
          {panelState === 'op-form' ? (
            <Box
              sx={{
                position: 'relative', // Add this line
              }}
            >
              <Backdrop
                sx={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  position: 'absolute', // Position the Backdrop over the Box
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0, // Cover the entire Box
                  zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
                open={isPanelLoading}
                onClick={() => {}}
              ></Backdrop>
              <OperationForm
                sx={{ marginBottom: '10px' }}
                operation={selectedOp ? selectedOp : { slug: '', label: '' }}
                node={canvasNode}
                continueOperationChain={prepareForNextOperation}
                clearAndClosePanel={handleClosePanel}
                dummyNodeId={dummyNodeIdRef.current || ''}
                action={panelOpFormState.current}
                setLoading={setIsPanelLoading}
              />
            </Box>
          ) : panelState === 'op-list' ? (
            <OperationList
              sx={{
                marginTop: '5px',
              }}
            />
          ) : (
            <>
              <CreateTableOrAddFunction
                clickCreateTable={handleCreateTable}
                clickAddFunction={handleAddFunction}
                showAddFunction={showAddFunction}
              />
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default OperationConfigLayout;
