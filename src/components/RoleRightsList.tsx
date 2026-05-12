import { Stack, Alert } from '@mui/joy';
import { RoleGoalSection, type RoleRightData } from './RoleGoalSection';
import type { RoleRightGoal } from '../api';

export interface PermissionGrantInfo {
  right: string;
  can_grant: boolean;
}

export interface RoleRightsListProps {
  roleRightGoals: RoleRightGoal[];
  allowedPermissions: Record<string, number[]>;
  rightsByGoals?: Record<string, PermissionGrantInfo[]>;
  rightNames?: Record<number, string>;
  goals?: Record<number, string>;
  isEditable: boolean;
  pendingChanges?: Array<{
    rightId: number;
    goalId: number;
    selected: boolean;
    canGrant: boolean;
  }>;
  onRightsChange?: (
    changes: Array<{
      rightId: number;
      goalId: number;
      selected: boolean;
      canGrant: boolean;
    }>
  ) => void;
}

export const RoleRightsList: React.FC<RoleRightsListProps> = ({
  roleRightGoals,
  allowedPermissions,
  rightsByGoals = {},
  rightNames = {},
  goals = {},
  isEditable,
  pendingChanges = [],
  onRightsChange,
}) => {
  const changesMap = new Map<string, { selected: boolean; canGrant: boolean }>();
  pendingChanges.forEach((c) => {
    changesMap.set(`${c.goalId}_${c.rightId}`, {
      selected: c.selected,
      canGrant: c.canGrant,
    });
  });

  const goalsMap = new Map<
    number,
    { name: string; rights: RoleRightData[]; originalRights: RoleRightGoal[] }
  >();

  roleRightGoals.forEach((rrg) => {
    const goalId = rrg.goalId;
    const goalName = rrg.goal?.name || goals[goalId] || `Goal #${goalId}`;

    if (!goalsMap.has(goalId)) {
      goalsMap.set(goalId, { name: goalName, rights: [], originalRights: [] });
    }
    goalsMap.get(goalId)!.originalRights.push(rrg);
  });

  if (roleRightGoals.length === 0) {
    Object.keys(allowedPermissions).forEach((goalIdStr) => {
      const goalId = parseInt(goalIdStr);
      if (!goalsMap.has(goalId) && allowedPermissions[goalIdStr]?.length) {
        goalsMap.set(goalId, {
          name: goals[goalId] || `Goal #${goalId}`,
          rights: [],
          originalRights: [],
        });
      }
    });
  }

  goalsMap.forEach((goalData, goalId) => {
    const availableRights = allowedPermissions[String(goalId)] || [];
    const goalPermissions = rightsByGoals[String(goalId)] || [];

    availableRights.forEach((rightId) => {
      const key = `${goalId}_${rightId}`;
      const change = changesMap.get(key);
      const original = goalData.originalRights.find(
        (r) => r.rightId === rightId && r.goalId === goalId
      );

      const isSelected = change !== undefined ? change.selected : !!original;
      const canGrant = change !== undefined ? change.canGrant : (original?.canGrant ?? false);

      const isGrantable = goalPermissions.some(
        (p) => p.right === String(rightId) && p.can_grant === true
      );

      goalData.rights.push({
        rightId,
        rightName: rightNames[rightId],
        isSelected,
        canGrant,
        isGrantable,
      });
    });
  });

  if (goalsMap.size === 0) {
    return (
      <Alert color="neutral" variant="soft">
        Нет доступных прав для назначения
      </Alert>
    );
  }

  const handleToggleRight = (goalId: number, rightId: number, selected: boolean) => {
    if (onRightsChange) {
      const currentCanGrant =
        changesMap.get(`${goalId}_${rightId}`)?.canGrant ??
        roleRightGoals.find((r) => r.rightId === rightId && r.goalId === goalId)?.canGrant ??
        false;

      onRightsChange([{ rightId, goalId, selected, canGrant: currentCanGrant }]);
    }
  };

  const handleToggleCanGrant = (goalId: number, rightId: number, canGrant: boolean) => {
    if (onRightsChange) {
      const currentSelected =
        changesMap.get(`${goalId}_${rightId}`)?.selected ??
        roleRightGoals.some((r) => r.rightId === rightId && r.goalId === goalId);

      onRightsChange([{ rightId, goalId, selected: currentSelected, canGrant }]);
    }
  };

  return (
    <Stack spacing={2}>
      {Array.from(goalsMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([goalId, { name, rights }]) => (
          <RoleGoalSection
            key={`goal_${goalId}`}
            goalId={goalId}
            goalName={name}
            rights={rights}
            isEditable={isEditable}
            onToggleRight={handleToggleRight}
            onToggleCanGrant={handleToggleCanGrant}
          />
        ))}
    </Stack>
  );
};
