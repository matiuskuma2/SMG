import { css } from '@/styled-system/css'

type Theme = {
  theme_id: string
  theme_name: string
}

type ArchiveSidebarProps = {
  themes: Theme[]
  themeFilter: string
  setThemeFilter: (theme: string) => void
}

export default function ArchiveSidebar({
  themes,
  themeFilter,
  setThemeFilter
}: ArchiveSidebarProps) {
  return (
    <aside className={css({
      display: { base: 'none', md: 'block' },
      w: '200px',
      flexShrink: 0,
      pr: '6'
    })}>
      <div className={css({
        position: 'sticky',
        top: '4'
      })}>
        <h2 className={css({
          fontSize: 'lg',
          fontWeight: 'bold',
          mb: '4',
          pb: '2',
          borderBottom: '2px solid',
          borderColor: 'gray.300'
        })}>
          テーマ
        </h2>
        
        <ul className={css({
          display: 'flex',
          flexDirection: 'column',
          gap: '0'
        })}>
          <li>
            <button
              onClick={() => setThemeFilter('')}
              className={css({
                w: '100%',
                textAlign: 'left',
                py: '2',
                px: '3',
                borderRadius: 'md',
                fontSize: 'sm',
                fontWeight: themeFilter === '' ? 'bold' : 'normal',
                bg: themeFilter === '' ? 'gray.100' : 'transparent',
                color: themeFilter === '' ? 'black' : 'gray.700',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: {
                  bg: 'gray.50'
                }
              })}
            >
              すべて
            </button>
          </li>
          {themes.map(theme => (
            <li key={theme.theme_id}>
              <button
                onClick={() => setThemeFilter(theme.theme_id)}
                className={css({
                  w: '100%',
                  textAlign: 'left',
                  py: '2',
                  px: '3',
                  borderRadius: 'md',
                  fontSize: 'sm',
                  fontWeight: themeFilter === theme.theme_id ? 'bold' : 'normal',
                  bg: themeFilter === theme.theme_id ? 'gray.100' : 'transparent',
                  color: themeFilter === theme.theme_id ? 'black' : 'gray.700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  _hover: {
                    bg: 'gray.50'
                  }
                })}
              >
                {theme.theme_name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
