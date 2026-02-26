import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Search, ChevronDown } from 'lucide-react'

type SearchSortFilterProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
  industryFilter?: string;
  setIndustryFilter?: (industry: string) => void;
  industries?: string[];
  filterLabel?: string;
  searchPlaceholder?: string;
}

export const SearchSortFilter = ({ 
  searchQuery, 
  setSearchQuery, 
  sortOption, 
  setSortOption, 
  industryFilter,
  setIndustryFilter,
  industries,
  filterLabel = '業種',
  searchPlaceholder = '名前や会社名で検索'
}: SearchSortFilterProps) => {
  const [showSortOptions, setShowSortOptions] = useState(false)
  const [showIndustryOptions, setShowIndustryOptions] = useState(false)

  // ソートオプションの表示名
  const sortOptionLabels: Record<string, string> = {
    date_desc: '日付（新しい順）',
    date_asc: '日付（古い順）',
  }

  return (
    <div className={css({ 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: '4',
      flexDirection: { base: 'column', lg: 'row' },
      gap: { base: '2', lg: '0' }
    })}>
      {/* 検索ボックス */}
      <div className={css({ 
        position: 'relative',
        w: { base: 'full', lg: '2/4' },
        mb: { base: '2', lg: '0' }
      })}>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={css({
            w: 'full',
            pl: '10',
            pr: '4',
            py: '2',
            rounded: 'md',
            border: '1px solid',
            borderColor: 'gray.300',
            _focus: { outline: 'none', borderColor: 'blue.500' }
          })}
        />
        <Search className={css({ 
          position: 'absolute',
          left: '3',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'gray.400',
          h: '4',
          w: '4'
        })} />
      </div>
      
      {/* フィルタとソートのコンテナ */}
      <div className={css({ 
        display: 'flex',
        gap: '2',
        w: { base: 'full', lg: 'auto' }
      })}>
        {/* 業種フィルター */}
        {industries && industries.length > 0 && industryFilter && setIndustryFilter && (
          <div className={css({ position: 'relative', w: { base: 'full', lg: 'auto' } })}>
            <button
              onClick={() => setShowIndustryOptions(!showIndustryOptions)}
              className={css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '2',
                border: '1px solid',
                borderColor: 'gray.300',
                rounded: 'md',
                px: '4',
                py: '2',
                bg: 'white',
                w: { base: 'full', lg: 'auto' },
                minW: { lg: '48' }
              })}
            >
              <span>{filterLabel}: {industryFilter}</span>
              <ChevronDown className={css({ h: '4', w: '4' })} />
            </button>

            {showIndustryOptions && (
              <div className={css({
                position: 'absolute',
                top: '100%',
                right: '0',
                mt: '1',
                bg: 'white',
                border: '1px solid',
                borderColor: 'gray.200',
                rounded: 'md',
                shadow: 'md',
                zIndex: '10',
                w: { base: 'full', lg: '48' },
                maxH: '60',
                overflowY: 'auto'
              })}>
                {industries.map((industry) => (
                  <button
                    key={industry}
                    onClick={() => {
                      setIndustryFilter(industry)
                      setShowIndustryOptions(false)
                    }}
                    className={css({
                      display: 'block',
                      w: 'full',
                      textAlign: 'left',
                      px: '4',
                      py: '2',
                      _hover: { bg: 'gray.50' },
                      bg: industryFilter === industry ? 'gray.100' : 'transparent'
                    })}
                  >
                    {industry}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ソートオプション */}
        <div className={css({ position: 'relative', w: { base: 'full', lg: 'auto' } })}>
          <button
            onClick={() => setShowSortOptions(!showSortOptions)}
            className={css({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '2',
              border: '1px solid',
              borderColor: 'gray.300',
              rounded: 'md',
              px: '4',
              py: '2',
              bg: 'white',
              w: { base: 'full', lg: 'auto' },
              minW: { lg: '48' }
            })}
          >
            <span>{sortOptionLabels[sortOption]}</span>
            <ChevronDown className={css({ h: '4', w: '4' })} />
          </button>

          {showSortOptions && (
            <div className={css({
              position: 'absolute',
              top: '100%',
              right: '0',
              mt: '1',
              bg: 'white',
              border: '1px solid',
              borderColor: 'gray.200',
              rounded: 'md',
              shadow: 'md',
              zIndex: '10',
              w: { base: 'full', lg: '48' }
            })}>
              {Object.entries(sortOptionLabels).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => {
                    setSortOption(value)
                    setShowSortOptions(false)
                  }}
                  className={css({
                    display: 'block',
                    w: 'full',
                    textAlign: 'left',
                    px: '4',
                    py: '2',
                    _hover: { bg: 'gray.50' },
                    bg: sortOption === value ? 'gray.100' : 'transparent'
                  })}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 