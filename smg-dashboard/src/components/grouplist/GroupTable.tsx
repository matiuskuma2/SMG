import { css, cx } from '@/styled-system/css';
import type React from 'react';
import { FaUserPlus } from 'react-icons/fa6';
import { ActionButtons, iconButtonStyle } from '../ui/ActionIconButton';
import { Button } from '../ui/button';
import type { Group } from './types';

interface GroupTableProps {
  currentGroups: Group[];
  handleEdit: (groupId: string) => void;
  handleDelete: (groupId: string) => void;
  handleAddUsers: (groupId: string) => void;
  undeletableGroupNames?: readonly string[];
}

export const GroupTable: React.FC<GroupTableProps> = ({
  currentGroups,
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
        display: { base: 'none', xl: 'block' },
        overflowX: 'auto',
      })}
    >
      <table
        className={css({
          w: 'full',
          borderCollapse: 'collapse',
          textAlign: 'left',
          tableLayout: 'fixed',
        })}
      >
        <colgroup>
          <col style={{ width: '200px' }} />
          <col />
          <col style={{ width: '120px' }} />
          <col style={{ width: '180px' }} />
        </colgroup>
        <thead>
          <tr
            className={css({
              bg: 'gray.50',
              borderBottom: '2px solid',
              borderColor: 'gray.200',
            })}
          >
            <th className={headerStyle}>グループ名</th>
            <th className={headerStyle}>説明文</th>
            <th className={headerStyle}>ユーザー数</th>
            <th className={actionHeaderStyle}>アクション</th>
          </tr>
        </thead>
        <tbody>
          {currentGroups.map((group) => (
            <tr
              key={group.group_id}
              className={css({
                borderBottom: '1px solid',
                borderColor: 'gray.200',
                _hover: { bg: 'gray.50' },
              })}
            >
              <td className={ellipsisText}>{group.title}</td>
              <td className={ellipsisText}>{group.description}</td>
              <td className={cellStyle}>{group.users?.length ?? 0}人</td>
              <td className={cellStyle}>
                <ActionButtons
                  targetId={group.group_id}
                  handleEdit={handleEdit}
                  handleDelete={
                    canDelete(group.title) ? handleDelete : undefined
                  }
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
                    <FaUserPlus size={14} />
                  </Button>
                </ActionButtons>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ellipsisText = css({
  py: '3',
  px: '4',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxW: '400px',
});

const headerStyle = css({
  py: '3',
  px: '4',
  fontWeight: 'semibold',
  color: 'gray.700',
  minW: '100px',
});

const actionHeaderStyle = css({
  py: '3',
  px: '4',
  fontWeight: 'semibold',
  color: 'gray.700',
  width: '180px',
});

const cellStyle = css({ py: '3', px: '4' });
