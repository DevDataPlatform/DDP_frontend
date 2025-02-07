import AnalysisIcon from '@/assets/icons/analysis';
import UsageIcon from '@/assets/icons/UsageIcon';
import AiAnalysisIcon from '@/assets/icons/aianalysis';
import IngestIcon from '@/assets/icons/ingest';
import TransformIcon from '@/assets/icons/transform';
import PipelineIcon from '@/assets/icons/pipeline';
import OrchestrateIcon from '@/assets/icons/orchestrate';
import DataQualityIcon from '@/assets/icons/dataQuality';
import ExploreIcon from '@/assets/icons/explore';
import { primaryColor } from './theme';
import Settings from '@/assets/icons/settings';
import User from '@/assets/icons/manage_accounts';
import AiSettings from '@/assets/icons/aisettings';
import {
  showDataAnalysisTab,
  showElementaryMenu,
  showSupersetAnalysisTab,
  showSupersetUsageTab,
} from './constant';
export const drawerWidth = 250;

const getColor = (selected: boolean) => (selected ? primaryColor : '');

export const getSideMenu = () => {
  return [
    // This will be added at a later stage
    {
      index: 0,
      title: 'Analysis',
      path: '/analysis',
      icon: (selected: boolean) => <AnalysisIcon fill={getColor(selected)} />,
      className: 'analysis_walkthrough',
      minimize: false,
      // hide: !showSupersetAnalysisTab,
    },
    {
      index: 0.1,
      title: 'Usage',
      path: '/analysis/usage',
      icon: (selected: boolean) => <UsageIcon fill={getColor(selected)} />,
      parent: 0,
      className: 'usage_walkthrough',
      minimize: false,
      // hide: !showSupersetUsageTab,
    },
    {
      index: 0.2,
      title: 'Data Analysis',
      path: '/analysis/data-analysis',
      icon: (selected: boolean) => <AiAnalysisIcon fill={getColor(selected)} />,
      parent: 0,
      className: 'data_analysis',
      minimize: false,
      // hide: !showDataAnalysisTab,
    },
    {
      index: 1,
      title: 'Pipeline overview',
      path: '/pipeline',
      icon: (selected: boolean) => <PipelineIcon fill={getColor(selected)} />,
      className: 'pipeline_walkthrough',
      permission: 'can_view_dashboard',
    },

    {
      index: 1.1,
      title: 'Ingest',
      icon: (selected: boolean) => <IngestIcon fill={getColor(selected)} />,
      path: '/pipeline/ingest',
      parent: 1,
      className: 'ingest_walkthrough',
    },
    {
      index: 1.2,
      title: 'Transform',
      icon: (selected: boolean) => <TransformIcon fill={getColor(selected)} />,
      parent: 1,
      path: '/pipeline/transform',
      className: 'transform_walkthrough',
    },
    {
      index: 1.3,
      title: 'Orchestrate',
      icon: (selected: boolean) => <OrchestrateIcon fill={getColor(selected)} />,
      path: '/pipeline/orchestrate',
      parent: 1,
      className: 'orchestrate_walkthrough',
    },
    {
      index: 2,
      title: 'Explore',
      path: '/explore',
      icon: (selected: boolean) => <ExploreIcon fill={getColor(selected)} />,
    },
    {
      index: 3,
      title: 'Data Quality',
      path: '/data-quality',
      icon: (selected: boolean) => <DataQualityIcon fill={getColor(selected)} />,
      className: 'data_quality_walkthrough',
      hide: !showElementaryMenu,
      minimize: false,
    },
    {
      index: 4,
      title: 'Settings',
      path: '/settings',
      icon: (selected: boolean) => <Settings fill={getColor(selected)} />,
      className: 'settings_walkthrough',
    },
    {
      index: 4.1,
      title: 'User',
      path: '/settings/user-management',
      parent: 4,
      icon: (selected: boolean) => <User fill={getColor(selected)} />,
      className: 'usermanagement_walkthrough',
    },
    {
      index: 4.2,
      title: 'AI settings',
      icon: (selected: boolean) => <AiSettings fill={getColor(selected)} />,
      parent: 4,
      path: '/settings/ai-settings',
      className: 'aisettings_walkthrough',
    },
  ];
};
