import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { css, cx } from '@/styled-system/css';
import type React from 'react';
import { FaPen, FaTrash, FaUserPlus } from 'react-icons/fa6';
import { ActionButtons, iconButtonStyle } from '../ui/ActionIconButton';
import type { Group } from './types';

interface GroupCardProps {
  currentGroups: Group[];
  selectedGroups: string[];
  handleSelectGroup: (groupId: string) => void;
  handleEdit: (groupId: string) => void;
  handleDelete: (groupId: string) => void;
  handleAddUsers: (groupId: string) => void;
  undeletableGroupNames?: readonly string[];
}

export const GroupCard: React.FC<GroupCardProps> = ({
  currentGroups,
  selectedGroups,
  handleSelectGroup,
  handleEdit,
  handleDelete,
  handleAddUsers,
  undeletableGroupNames = [],
}) => {
  const canDelete = (groupTitle: string) =>
    !undeletableGroupNames.includes(groupTitle);
  return (
    <div
      className={css({
        display: { base: 'block', xl: 'none' },
      })}
    >
      {currentGroups.map((group) => (
        <div
          key={group.group_id}
          className={css({
            borderBottom: '1px solid',
            borderColor: 'gray.200',
            p: '4',
          })}
        >
          <div
            className={css({
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: '3',
            })}
          >
            <div
              className={css({
                display: 'flex',
                alignItems: 'center',
                gap: '3',
              })}
            >
              <div>
                <div className={css({ fontWeight: 'bold', fontSize: 'md' })}>
                  {group.title}
                </div>
                <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                  {group.description}
                </div>
              </div>
            </div>
          </div>

          <div className={css({ mb: '2', fontSize: 'sm' })}>
            ユーザー数: {group.users?.length ?? 0}
          </div>

          <div
            className={css({
              mt: '3',
              display: 'flex',
              justifyContent: 'flex-end',
            })}
          >
            <ActionButtons
              targetId={group.group_id}
              handleEdit={handleEdit}
              handleDelete={canDelete(group.title) ? handleDelete : undefined}
            >
              <Button
                size="sm"
                variant="outline"
                className={cx(
                  iconButtonStyle,
                  css({
                    bg: 'green.400',
                    borderColor: 'green.600',
                    _hover: { bg: 'green.700' },
                  }),
                )}
                onClick={() => handleAddUsers(group.group_id)}
              >
                <FaUserPlus />
              </Button>
            </ActionButtons>
          </div>
        </div>
      ))}
    </div>
  );
};
