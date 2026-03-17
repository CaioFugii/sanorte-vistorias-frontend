import { Chip } from '@mui/material';
import { InspectionStatus } from '@/domain';

interface StatusChipProps {
  status: InspectionStatus;
  size?: 'small' | 'medium';
}

const statusConfig: Record<
  InspectionStatus,
  {
    label: string;
    color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    variant: 'filled' | 'outlined';
  }
> = {
  [InspectionStatus.RASCUNHO]: { label: 'Rascunho', color: 'default', variant: 'outlined' },
  [InspectionStatus.FINALIZADA]: { label: 'Finalizada', color: 'success', variant: 'filled' },
  [InspectionStatus.PENDENTE_AJUSTE]: { label: 'Pendente Ajuste', color: 'warning', variant: 'filled' },
  [InspectionStatus.RESOLVIDA]: { label: 'Resolvida', color: 'info', variant: 'filled' },
};

export const StatusChip = ({ status, size = 'small' }: StatusChipProps) => {
  const config = statusConfig[status];
  return <Chip label={config.label} color={config.color} size={size} variant={config.variant} />;
};
