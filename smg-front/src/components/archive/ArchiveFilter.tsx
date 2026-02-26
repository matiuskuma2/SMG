import { css } from '@/styled-system/css'
import { getFilterYears } from '@/lib/utils/year'

type Theme = {
  theme_id: string
  theme_name: string
}

type ArchiveFilterProps = {
  yearFilter: string
  setYearFilter: (year: string) => void
  sortOrder: string
  setSortOrder: (order: string) => void
  themeFilter?: string
  setThemeFilter?: (theme: string) => void
  themes?: Theme[]
  showThemeFilter?: boolean
}

export default function ArchiveFilter({
  yearFilter,
  setYearFilter,
  sortOrder,
  setSortOrder,
  themeFilter,
  setThemeFilter,
  themes,
  showThemeFilter
}: ArchiveFilterProps) {
  return (
    <div className={css({ 
      display: 'flex',
      alignItems: 'center',
      gap: '2',
      width: { base: '100%', md: 'auto' }
    })}>
      {showThemeFilter && themes && (
        <select
          id="themeFilter"
          value={themeFilter || ''}
          onChange={(e) => setThemeFilter?.(e.target.value)}
          className={css({
            display: { base: 'block', md: 'none' },
            py: '2',
            px: '4',
            borderRadius: 'md',
            border: '1px solid',
            borderColor: 'gray.300',
            bg: 'white',
            cursor: 'pointer',
            outline: 'none',
            _focus: { borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' },
            fontSize: '16px',
            flex: '1'
          })}
        >
          <option value="">テーマ</option>
          {themes.map(theme => (
            <option key={theme.theme_id} value={theme.theme_id}>
              {theme.theme_name}
            </option>
          ))}
        </select>
      )}

      <select
        id="yearFilter"
        value={yearFilter}
        onChange={(e) => setYearFilter(e.target.value)}
        className={css({
          py: { base: '2', md: '1' },
          px: { base: '4', md: '3' },
          borderRadius: 'md',
          border: '1px solid',
          borderColor: 'gray.300',
          bg: 'white',
          cursor: 'pointer',
          outline: 'none',
          _focus: { borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' },
          fontSize: { base: '16px', md: 'inherit' },
          flex: { base: '1', md: 'auto' }
        })}
      >
        <option value="">年月</option>
        {getFilterYears().map((year) => (
          <option key={year} value={year}>
            {year}年
          </option>
        ))}
      </select>

      <select
        id="sortOrder"
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
        className={css({
          py: { base: '2', md: '1' },
          px: { base: '4', md: '3' },
          borderRadius: 'md',
          border: '1px solid',
          borderColor: 'gray.300',
          bg: 'white',
          cursor: 'pointer',
          outline: 'none',
          _focus: { borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' },
          fontSize: { base: '16px', md: 'inherit' },
          flex: { base: '1', md: 'auto' }
        })}
      >
        <option value="newest">新しい順</option>
        <option value="oldest">古い順</option>
      </select>
    </div>
  )
} 