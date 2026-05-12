import { Card, CardContent, Typography, Box, Stack, Chip, Divider } from '@mui/joy';
import { Security as SecurityIcon } from '@mui/icons-material';
import { RoleRightItem } from './RoleRightItem';

export interface RoleRightData {
  rightId: number;
  rightName?: string;
  isSelected: boolean;
  canGrant: boolean;
  isGrantable: boolean;
}

export interface RoleGoalSectionProps {
  goalId: number;
  goalName: string;
  rights: RoleRightData[];
  isEditable: boolean;
  onToggleRight?: (goalId: number, rightId: number, selected: boolean) => void;
  onToggleCanGrant?: (goalId: number, rightId: number, canGrant: boolean) => void;
}

export const RoleGoalSection: React.FC<RoleGoalSectionProps> = ({
  goalId,
  goalName,
  rights,
  isEditable,
  onToggleRight,
  onToggleCanGrant,
}) => {
  const selectedCount = rights.filter((r) => r.isSelected).length;

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: selectedCount > 0 ? 'primary.500' : 'neutral.500',
        bgcolor: selectedCount > 0 ? 'primary.softBg' : 'transparent',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography level="title-md">
            <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {goalName}
          </Typography>
          <Chip size="sm" variant="soft" color="neutral">
            {selectedCount} из {rights.length}
          </Chip>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {rights.map((right) => (
            <RoleRightItem
              key={right.rightId}
              rightId={right.rightId}
              rightName={right.rightName}
              isSelected={right.isSelected}
              canGrant={right.canGrant}
              isEditable={isEditable}
              isGrantable={right.isGrantable}
              onToggleSelect={(rightId, selected) => onToggleRight?.(goalId, rightId, selected)}
              onToggleCanGrant={(rightId, canGrant) =>
                onToggleCanGrant?.(goalId, rightId, canGrant)
              }
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};
