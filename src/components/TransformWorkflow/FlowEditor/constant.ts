import renameIcon from '@/assets/icons/UI4T/rename.svg';
import flattenJsonIcon from '@/assets/icons/UI4T/flatten.svg';
import castDataTypesIcon from '@/assets/icons/UI4T/cast.svg';
import coalesceColumnsIcon from '@/assets/icons/UI4T/coalesce.svg';
import insightsIcon from '@/assets/icons/UI4T/aiassistant.svg';
import arithmeticIcon from '@/assets/icons/UI4T/arithmetic.svg';
import concatIcon from '@/assets/icons/UI4T/concat.svg';
import dropColumnsIcon from '@/assets/icons/UI4T/drop.svg';
import replaceIcon from '@/assets/icons/UI4T/replace.svg';
import joinIcon from '@/assets/icons/UI4T/join.svg';
import whereIcon from '@/assets/icons/UI4T/filter.svg';
import groupByIcon from '@/assets/icons/UI4T/groupby.svg';
import aggregateIcon from '@/assets/icons/UI4T/aggregate.svg';
import caseWhenIcon from '@/assets/icons/UI4T/case.svg';
import unionAllIcon from '@/assets/icons/UI4T/union.svg';
import pivotIcon from '@/assets/icons/UI4T/pivot.svg';
import unpivotIcon from '@/assets/icons/UI4T/unpivot.svg';
import genericIcon from '@/assets/icons/UI4T/generic.svg';

export const RENAME_COLUMNS_OP = 'renamecolumns';
export const FLATTEN_OP = 'flatten';
export const FLATTEN_JSON_OP = 'flattenjson';
export const CAST_DATA_TYPES_OP = 'castdatatypes';
export const AI_ASSISTANT = 'aiassistant';
export const COALESCE_COLUMNS_OP = 'coalescecolumns';
export const ARITHMETIC_OP = 'arithmetic';
export const CONCAT_COLUMNS_OP = 'concat';
export const DROP_COLUMNS_OP = 'dropcolumns';
export const REGEX_EXTRACTION_OP = 'regexextraction';
export const REPLACE_COLUMN_VALUE_OP = 'replace';
export const JOIN_OP = 'join';
export const WHERE_OP = 'where';
export const GROUPBY_OP = 'groupby';
export const AGGREGATE_OP = 'aggregate';
export const CASEWHEN_OP = 'casewhen';
export const UNION_OP = 'unionall';
export const PIVOT_OP = 'pivot';
export const UNPIVOT_OP = 'unpivot';
export const GENERIC_COL_OP = 'generic';
export const GENERIC_SQL_OP = 'rawsql';

export const operationIconMapping = {
  [RENAME_COLUMNS_OP]: renameIcon,
  [FLATTEN_OP]: flattenJsonIcon,
  [FLATTEN_JSON_OP]: flattenJsonIcon,
  [CAST_DATA_TYPES_OP]: castDataTypesIcon,
  [COALESCE_COLUMNS_OP]: coalesceColumnsIcon,
  [ARITHMETIC_OP]: arithmeticIcon,
  [CONCAT_COLUMNS_OP]: concatIcon,
  [DROP_COLUMNS_OP]: dropColumnsIcon,
  // REGEX_EXTRACTION_OP]: regexExtractionIcon,
  [REPLACE_COLUMN_VALUE_OP]: replaceIcon,
  [JOIN_OP]: joinIcon,
  [WHERE_OP]: whereIcon,
  [GROUPBY_OP]: groupByIcon,
  [AGGREGATE_OP]: aggregateIcon,
  [CASEWHEN_OP]: caseWhenIcon,
  [UNION_OP]: unionAllIcon,
  [PIVOT_OP]: pivotIcon,
  [UNPIVOT_OP]: unpivotIcon,
  [GENERIC_COL_OP]: genericIcon,
  [GENERIC_SQL_OP]: genericIcon,
  [AI_ASSISTANT]: insightsIcon,
};

export const operations = [
  {
    label: 'AI assistant',
    slug: AI_ASSISTANT,
    infoToolTip: 'Query in natural language to generate flow nodes',
  },
  {
    label: 'Flatten JSON',
    slug: FLATTEN_JSON_OP,
    infoToolTip: 'Transforms JSON formatted data into Tablular formatted data',
  },
  {
    label: 'Cast',
    slug: CAST_DATA_TYPES_OP,
    infoToolTip: "Convert a column's values (of any type) into a specified datatype",
  },
  {
    label: 'Coalesce',
    slug: COALESCE_COLUMNS_OP,
    infoToolTip:
      'Reads columns in the order selected and returns the first non-NULL value from a series of columns',
  },
  {
    label: 'Arithmetic',
    slug: ARITHMETIC_OP,
    infoToolTip: 'Perform arithmetic operations on or between one or more columns',
  },
  {
    label: 'Drop',
    slug: DROP_COLUMNS_OP,
    infoToolTip: 'Select the columns that you would like to remove from the table',
  },
  {
    label: 'Rename',
    slug: RENAME_COLUMNS_OP,
    infoToolTip: 'Select columns and rename them',
  },
  // { label: 'Regex extraction', slug: REGEX_EXTRACTION_OP, infoToolTip: '' },
  {
    label: 'Join',
    slug: JOIN_OP,
    infoToolTip:
      'Combine rows from two or more tables, based on a related (key) column between them',
  },
  {
    label: 'Filter',
    slug: WHERE_OP,
    infoToolTip: 'Filters all the row values in the selected column based on the defined condition',
  },
  {
    label: 'Group By',
    slug: GROUPBY_OP,
    infoToolTip: 'Group your data by one or more dimensions and analyse it',
  },
  {
    label: 'Replace',
    slug: REPLACE_COLUMN_VALUE_OP,
    infoToolTip:
      'Replace all the row values in a column having a specified string with a new value',
  },
  {
    label: 'Aggregate',
    slug: AGGREGATE_OP,
    infoToolTip:
      'Performs a calculation on multiple values in a column and returns a new column with that value in every row',
  },
  {
    label: 'Case',
    slug: CASEWHEN_OP,
    infoToolTip: 'Select the relevant column, operation, and comparison column or value',
  },
  {
    label: 'Table union',
    slug: UNION_OP,
    infoToolTip: 'Combine data for matching columns across two datasets',
  },
  {
    label: 'Pivot',
    slug: PIVOT_OP,
    infoToolTip: 'Pivot table data based on values of selected column',
  },
  {
    label: 'Unpivot',
    slug: UNPIVOT_OP,
    infoToolTip: 'Unpivot columns & values of a table into rows',
  },
  {
    label: 'Generic Column',
    slug: GENERIC_COL_OP,
    infoToolTip: 'Add a generic column operation',
  },
  {
    label: 'Generic SQL',
    slug: GENERIC_SQL_OP,
    infoToolTip: 'Add a generic sql operation',
  },
].sort((a, b) => a.label.localeCompare(b.label));

// Node types
export const SRC_MODEL_NODE = 'src_model_node';
export const OPERATION_NODE = 'operation_node';
