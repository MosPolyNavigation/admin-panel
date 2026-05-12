import { Chip, Switch, Box, Tooltip } from '@mui/joy';
import { InfoOutlined as InfoIcon } from '@mui/icons-material';
import { RIGHT_NAMES } from '../constants';

export interface RoleRightItemProps {
  rightId: number;
  rightName?: string;
  isSelected: boolean;
  canGrant: boolean;
  isGrantable: boolean;
  isEditable: boolean;
  onToggleSelect?: (rightId: number, selected: boolean) => void;
  onToggleCanGrant?: (rightId: number, canGrant: boolean) => void;
}

export const RoleRightItem: React.FC<RoleRightItemProps> = ({
  rightId,
  rightName,
  isSelected,
  canGrant,
  isGrantable,
  isEditable,
  onToggleSelect,
  onToggleCanGrant,
}) => {
  const displayName = rightName || RIGHT_NAMES[rightId] || `Right #${rightId}`;

  const handleSelectToggle = () => {
    if (isEditable && onToggleSelect) {
      onToggleSelect(rightId, !isSelected);
    }
  };

  const handleCanGrantToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEditable && isGrantable && onToggleCanGrant) {
      onToggleCanGrant(rightId, e.target.checked);
    }
  };

  if (isEditable && isGrantable) {
    return (
      <Tooltip
        title={
          isGrantable
            ? isSelected
              ? 'Можно передавать это право другим ролям'
              : 'Сначала выберите право, чтобы настроить передачу'
            : 'Это право нельзя передавать'
        }
        variant="soft"
        arrow
        placement="top"
      >
        <Box
          component="div"
          onClick={handleSelectToggle}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1.5,
            py: 0.5,
            borderRadius: '9999px',
            cursor: 'pointer',
            transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease',

            bgcolor: isSelected ? 'primary.solidBg' : 'transparent',
            border: '1px solid',
            borderColor: isSelected ? 'transparent' : 'neutral.outlinedBorder',
            color: isSelected ? 'primary.solidColor' : 'neutral.outlinedColor',

            '&:hover': {
              bgcolor: isSelected ? 'primary.solidHoverBg' : 'neutral.hoverBg',
              borderColor: isSelected ? 'transparent' : 'neutral.outlinedHoverBorder',
            },

            '& .JoySwitch-root': {
              pointerEvents: isGrantable ? 'auto' : 'none',
              opacity: isGrantable ? 1 : 0.4,
            },
            '& .JoySwitch-track': {
              bgcolor: isSelected ? 'primary.700' : 'neutral.400',
            },
            '& .JoySwitch-thumb': {
              bgcolor: 'common.white',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            },
          }}
        >
          <Chip
            key={`right_${rightId}`}
            size="md"
            variant="plain"
            color="neutral"
            sx={{
              p: 0,
              m: 0,
              minHeight: 'auto',
              '& .JoyChip-content': { p: 0, m: 0 },
              background: 'transparent',
            }}
          >
            {displayName}
          </Chip>

          {isGrantable && (
            <Switch
              size="sm"
              variant="plain"
              checked={canGrant}
              onChange={handleCanGrantToggle}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              sx={{
                '& .JoySwitch-root': { width: 28, height: 18 },
              }}
            />
          )}
        </Box>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      title={
        isGrantable
          ? canGrant
            ? '✓ Можно передавать другим ролям'
            : '✗ Только для этой роли'
          : 'Это право нельзя передавать'
      }
      variant="soft"
      arrow
    >
      <Chip
        key={`right_${rightId}`}
        size="md"
        variant={isSelected ? 'solid' : 'outlined'}
        color={isSelected ? 'primary' : 'neutral'}
        sx={{ borderRadius: '9999px', cursor: 'default' }}
        endDecorator={
          isGrantable && (
            <InfoIcon
              sx={{
                fontSize: 14,
                ml: 0.5,
                color: isSelected ? 'primary.contrastText' : 'neutral.500',
              }}
            />
          )
        }
      >
        {displayName}
      </Chip>
    </Tooltip>
  );
};
