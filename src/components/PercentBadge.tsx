import { Box, Typography, Chip } from '@mui/material';

interface PercentBadgeProps {
  percent: number;
  size?: 'small' | 'medium' | 'large';
}

const getColor = (percent: number): 'success' | 'warning' | 'error' => {
  if (percent >= 80) return 'success';
  if (percent >= 60) return 'warning';
  return 'error';
};

export const PercentBadge = ({ percent, size = 'medium' }: PercentBadgeProps) => {
  const color = getColor(percent);
  const variant = size === 'small' ? 'body2' : size === 'large' ? 'h6' : 'body1';

  if (size === 'small') {
    return (
      <Chip
        label={`${percent}%`}
        color={color}
        size="small"
      />
    );
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: size === 'large' ? 80 : 60,
        height: size === 'large' ? 80 : 60,
        borderRadius: '50%',
        bgcolor: `${color}.light`,
        color: `${color}.contrastText`,
      }}
    >
      <Typography variant={variant} fontWeight="bold">
        {percent}%
      </Typography>
    </Box>
  );
};
