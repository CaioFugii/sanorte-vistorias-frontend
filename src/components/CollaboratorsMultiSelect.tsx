import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  SelectChangeEvent,
  CircularProgress,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Collaborator } from '@/domain';
import { useRepository } from '@/app/RepositoryProvider';

interface CollaboratorsMultiSelectProps {
  value: string[];
  onChange: (collaboratorIds: string[]) => void;
  label?: string;
  disabled?: boolean;
  onlyActive?: boolean;
}

export const CollaboratorsMultiSelect = ({
  value,
  onChange,
  label = 'Colaboradores Presentes',
  disabled = false,
  onlyActive = true,
}: CollaboratorsMultiSelectProps) => {
  const repository = useRepository();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCollaborators = async () => {
      try {
        const all = await repository.getCollaborators();
        setCollaborators(
          onlyActive ? all.data.filter((c) => c.active) : all.data
        );
      } catch (error) {
        console.error('Error loading collaborators:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCollaborators();
  }, [repository, onlyActive]);

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const selected = event.target.value;
    onChange(typeof selected === 'string' ? [selected] : selected);
  };

  if (loading) {
    return (
      <FormControl fullWidth>
        <CircularProgress size={24} />
      </FormControl>
    );
  }

  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={value}
        onChange={handleChange}
        label={label}
        renderValue={(selected) =>
          selected
            .map(
              (id) => collaborators.find((c) => c.id === id)?.name || id
            )
            .join(', ')
        }
      >
        {collaborators.map((collaborator) => (
          <MenuItem key={collaborator.id} value={collaborator.id}>
            <Checkbox checked={value.includes(collaborator.id)} />
            <ListItemText primary={collaborator.name} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
