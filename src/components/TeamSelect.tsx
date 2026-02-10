import { Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { Team } from '@/domain';
import { useRepository } from '@/app/RepositoryProvider';

interface TeamSelectProps {
  value: string;
  onChange: (teamId: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  onlyActive?: boolean;
}

export const TeamSelect = ({
  value,
  onChange,
  label = 'Equipe',
  required = false,
  disabled = false,
  onlyActive = true,
}: TeamSelectProps) => {
  const repository = useRepository();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const allTeams = await repository.getTeams();
        setTeams(onlyActive ? allTeams.filter((t) => t.active) : allTeams);
      } catch (error) {
        console.error('Error loading teams:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTeams();
  }, [repository, onlyActive]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  if (loading) {
    return (
      <FormControl fullWidth>
        <CircularProgress size={24} />
      </FormControl>
    );
  }

  return (
    <FormControl fullWidth required={required} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} onChange={handleChange} label={label}>
        {teams.map((team) => (
          <MenuItem key={team.id} value={team.id}>
            {team.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
