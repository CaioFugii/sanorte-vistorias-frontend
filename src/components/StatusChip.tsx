import { Chip } from '@mui/material';
import { InspectionStatus } from '@/domain';

interface StatusChipProps {
  status: InspectionStatus;
  size?: 'small' | 'medium';
}

const statusConfig: Record<
  InspectionStatus,
  { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }
> = {
  [InspectionStatus.RASCUNHO]: { label: 'Rascunho', color: 'default' },
  [InspectionStatus.FINALIZADA]: { label: 'Finalizada', color: 'success' },
  [InspectionStatus.PENDENTE_AJUSTE]: { label: 'Pendente Ajuste', color: 'warning' },
  [InspectionStatus.RESOLVIDA]: { label: 'Resolvida', color: 'info' },
};

export const StatusChip = ({ status, size = 'small' }: StatusChipProps) => {
  const config = statusConfig[status];
  return <Chip label={config.label} color={config.color} size={size} />;
};
