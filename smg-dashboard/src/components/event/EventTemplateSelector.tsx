import { Pagination } from '@/components/ui/Pagination';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { Calendar, Copy, MapPin, Search, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

type EventTemplate = {
  event_id: string;
  event_name: string;
  event_type: string;
  event_start_datetime: string;
  event_end_datetime: string;
  event_location: string;
  event_city: string;
  image_url: string | null;
  mst_event_type: {
    event_type_name: string;
  };
};

type EventType = {
  event_type_id: string;
  event_type_name: string;
};

type EventTemplateSelectorProps = {
  onSelect: (eventId: string) => void;
  onClose: () => void;
};

export const EventTemplateSelector = ({
  onSelect,
  onClose,
}: EventTemplateSelectorProps) => {
  const [events, setEvents] = useState<EventTemplate[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const supabase = createClient();

  // イベントタイプ取得
  useEffect(() => {
    const fetchEventTypes = async () => {
      const { data, error } = await supabase
        .from('mst_event_type')
        .select('event_type_id, event_type_name')
        .is('deleted_at', null)
        .order('event_type_id');

      if (!error && data) {
        setEventTypes(data);
      }
    };

    fetchEventTypes();
  }, [supabase]);

  // イベント検索
  const fetchEvents = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedType) params.append('event_type', selectedType);
        params.append('limit', '10');
        params.append('page', page.toString());

        const response = await fetch(`/api/event-templates?${params}`);
        if (!response.ok) throw new Error('イベントの取得に失敗しました');

        const data = await response.json();
        setEvents(data.events || []);
        setTotalPages(data.pagination?.totalPages || 0);
        setTotal(data.pagination?.total || 0);
        setCurrentPage(page);
      } catch (error) {
        console.error('イベント検索エラー:', error);
      } finally {
        setLoading(false);
      }
    },
    [search, selectedType],
  );

  // 初回読み込み
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // 検索実行
  const handleSearch = () => {
    setCurrentPage(1);
    fetchEvents(1);
  };

  // ページ変更
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    fetchEvents(page);
  };

  // Enterキーで検索
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={overlayStyle}>
      <div className={modalStyle}>
        {/* ヘッダー */}
        <div className={headerStyle}>
          <h2 className={titleStyle}>過去のイベントから作成</h2>
          <button
            type="button"
            onClick={onClose}
            className={closeButtonStyle}
            aria-label="閉じる"
          >
            <X size={24} />
          </button>
        </div>

        {/* 検索フィルター */}
        <div className={filterContainerStyle}>
          <div className={searchBoxStyle}>
            <Search size={20} className={searchIconStyle} />
            <input
              type="text"
              placeholder="イベント名で検索"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              className={searchInputStyle}
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={selectStyle}
          >
            <option value="">すべての開催区分</option>
            {eventTypes.map((type) => (
              <option key={type.event_type_id} value={type.event_type_id}>
                {type.event_type_name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleSearch}
            className={searchButtonStyle}
            disabled={loading}
          >
            検索
          </button>
        </div>

        {/* イベント一覧 */}
        <div className={eventsListStyle}>
          {loading ? (
            <div className={loadingStyle}>読み込み中...</div>
          ) : events.length === 0 ? (
            <div className={emptyStyle}>イベントが見つかりませんでした</div>
          ) : (
            events.map((event) => (
              <div key={event.event_id} className={eventCardStyle}>
                {/* サムネイル */}
                <div className={thumbnailStyle}>
                  {event.image_url ? (
                    <Image
                      src={event.image_url}
                      alt={event.event_name}
                      fill
                      sizes="160px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className={noImageStyle}>No Image</div>
                  )}
                </div>

                {/* イベント情報 */}
                <div className={eventInfoStyle}>
                  <h3 className={eventNameStyle}>{event.event_name}</h3>
                  <div className={eventMetaStyle}>
                    <div className={metaItemStyle}>
                      <Calendar size={14} />
                      <span>
                        {new Date(
                          event.event_start_datetime,
                        ).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    <div className={metaItemStyle}>
                      <MapPin size={14} />
                      <span>
                        {event.event_city} - {event.event_location}
                      </span>
                    </div>
                  </div>
                  <div className={eventTypeBadgeStyle}>
                    {event.mst_event_type.event_type_name}
                  </div>
                </div>

                {/* 選択ボタン */}
                <button
                  type="button"
                  onClick={() => onSelect(event.event_id)}
                  className={selectButtonStyle}
                  title="このイベントをテンプレートとして使用"
                >
                  <Copy size={18} />
                  <span>使用</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* ページネーション */}
        {!loading && events.length > 0 && totalPages > 1 && (
          <div className={paginationWrapperStyle}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// スタイル定義
const overlayStyle = css({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px',
});

const modalStyle = css({
  backgroundColor: 'white',
  borderRadius: '12px',
  maxWidth: '900px',
  width: '100%',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
});

const headerStyle = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 24px',
  borderBottom: '1px solid #e2e8f0',
});

const titleStyle = css({
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1a202c',
});

const closeButtonStyle = css({
  padding: '4px',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  color: '#718096',
  transition: 'all 0.2s',
  _hover: {
    backgroundColor: '#f7fafc',
    color: '#1a202c',
  },
});

const filterContainerStyle = css({
  padding: '16px 24px',
  borderBottom: '1px solid #e2e8f0',
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
});

const searchBoxStyle = css({
  position: 'relative',
  flex: '1',
  minWidth: '200px',
});

const searchIconStyle = css({
  position: 'absolute',
  left: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#a0aec0',
  pointerEvents: 'none',
});

const searchInputStyle = css({
  width: '100%',
  padding: '10px 12px 10px 40px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
  _focus: {
    borderColor: '#3182ce',
  },
});

const selectStyle = css({
  padding: '10px 12px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '14px',
  backgroundColor: 'white',
  cursor: 'pointer',
  outline: 'none',
  _focus: {
    borderColor: '#3182ce',
  },
});

const searchButtonStyle = css({
  padding: '10px 24px',
  backgroundColor: '#3182ce',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 'medium',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  _hover: {
    backgroundColor: '#2c5aa0',
  },
  _disabled: {
    backgroundColor: '#a0aec0',
    cursor: 'not-allowed',
  },
});

const eventsListStyle = css({
  flex: 1,
  overflowY: 'auto',
  padding: '16px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

const loadingStyle = css({
  textAlign: 'center',
  padding: '40px',
  color: '#718096',
});

const emptyStyle = css({
  textAlign: 'center',
  padding: '40px',
  color: '#718096',
});

const eventCardStyle = css({
  display: 'flex',
  gap: '16px',
  padding: '16px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  backgroundColor: 'white',
  transition: 'all 0.2s',
  _hover: {
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    borderColor: '#cbd5e0',
  },
});

const thumbnailStyle = css({
  position: 'relative',
  width: '160px',
  height: '120px',
  flexShrink: 0,
  borderRadius: '6px',
  overflow: 'hidden',
  backgroundColor: '#f7fafc',
});

const noImageStyle = css({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  color: '#a0aec0',
});

const eventInfoStyle = css({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  minWidth: 0,
});

const eventNameStyle = css({
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1a202c',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const eventMetaStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const metaItemStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '13px',
  color: '#718096',
});

const eventTypeBadgeStyle = css({
  display: 'inline-block',
  width: 'fit-content',
  padding: '4px 12px',
  backgroundColor: '#edf2f7',
  color: '#4a5568',
  fontSize: '12px',
  fontWeight: 'medium',
  borderRadius: '4px',
});

const selectButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '10px 16px',
  backgroundColor: '#3182ce',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 'medium',
  cursor: 'pointer',
  height: 'fit-content',
  alignSelf: 'center',
  transition: 'background-color 0.2s',
  _hover: {
    backgroundColor: '#2c5aa0',
  },
});

const paginationWrapperStyle = css({
  borderTop: '1px solid #e2e8f0',
  padding: '16px 24px',
});
