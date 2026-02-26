import { Pagination } from '@/components/ui/Pagination';
import { css } from '@/styled-system/css';
import { Calendar, Copy, Search, User, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

type ConsultationTemplate = {
  consultation_id: string;
  title: string;
  description: string;
  application_start_datetime: string;
  application_end_datetime: string;
  image_url: string | null;
  instructor_id: string;
  created_at: string;
  mst_user: {
    username: string;
  };
};

type Instructor = {
  id: string;
  name: string;
};

type ConsultationTemplateSelectorProps = {
  onSelect: (consultationId: string) => void;
  onClose: () => void;
};

export const ConsultationTemplateSelector = ({
  onSelect,
  onClose,
}: ConsultationTemplateSelectorProps) => {
  const [consultations, setConsultations] = useState<ConsultationTemplate[]>(
    [],
  );
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // 講師一覧取得
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const response = await fetch('/api/instructors');
        if (!response.ok) throw new Error('講師の取得に失敗しました');
        const data = await response.json();
        setInstructors(data);
      } catch (error) {
        console.error('講師取得エラー:', error);
      }
    };

    fetchInstructors();
  }, []);

  // 個別相談検索
  const fetchConsultations = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedInstructor)
          params.append('instructor_id', selectedInstructor);
        params.append('limit', '10');
        params.append('page', page.toString());

        const response = await fetch(`/api/consultation-templates?${params}`);
        if (!response.ok) throw new Error('個別相談会の取得に失敗しました');

        const data = await response.json();
        setConsultations(data.consultations || []);
        setTotalPages(data.pagination?.totalPages || 0);
        setTotal(data.pagination?.total || 0);
        setCurrentPage(page);
      } catch (error) {
        console.error('個別相談会検索エラー:', error);
      } finally {
        setLoading(false);
      }
    },
    [search, selectedInstructor],
  );

  // 初回読み込み
  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  // 検索実行
  const handleSearch = () => {
    setCurrentPage(1);
    fetchConsultations(1);
  };

  // ページ変更
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    fetchConsultations(page);
  };

  // Enterキーで検索
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // HTMLタグを除去
  const stripHtmlTags = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  return (
    <div className={overlayStyle}>
      <div className={modalStyle}>
        {/* ヘッダー */}
        <div className={headerStyle}>
          <h2 className={titleStyle}>過去の個別相談会から作成</h2>
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
              placeholder="タイトルで検索"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              className={searchInputStyle}
            />
          </div>

          <select
            value={selectedInstructor}
            onChange={(e) => setSelectedInstructor(e.target.value)}
            className={selectStyle}
          >
            <option value="">すべての講師</option>
            {instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name}
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

        {/* 個別相談会一覧 */}
        <div className={consultationsListStyle}>
          {loading ? (
            <div className={loadingStyle}>読み込み中...</div>
          ) : consultations.length === 0 ? (
            <div className={emptyStyle}>個別相談会が見つかりませんでした</div>
          ) : (
            consultations.map((consultation) => (
              <div
                key={consultation.consultation_id}
                className={consultationCardStyle}
              >
                {/* サムネイル */}
                <div className={thumbnailStyle}>
                  {consultation.image_url ? (
                    <Image
                      src={consultation.image_url}
                      alt={consultation.title}
                      fill
                      sizes="160px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className={noImageStyle}>No Image</div>
                  )}
                </div>

                {/* 個別相談会情報 */}
                <div className={consultationInfoStyle}>
                  <h3 className={consultationNameStyle}>
                    {consultation.title}
                  </h3>
                  <p className={consultationDescriptionStyle}>
                    {stripHtmlTags(consultation.description).substring(0, 100)}
                    {stripHtmlTags(consultation.description).length > 100
                      ? '...'
                      : ''}
                  </p>
                  <div className={consultationMetaStyle}>
                    <div className={metaItemStyle}>
                      <Calendar size={14} />
                      <span>
                        {new Date(
                          consultation.application_start_datetime,
                        ).toLocaleDateString('ja-JP')}{' '}
                        -{' '}
                        {new Date(
                          consultation.application_end_datetime,
                        ).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    <div className={metaItemStyle}>
                      <User size={14} />
                      <span>{consultation.mst_user.username}</span>
                    </div>
                  </div>
                </div>

                {/* 選択ボタン */}
                <button
                  type="button"
                  onClick={() => onSelect(consultation.consultation_id)}
                  className={selectButtonStyle}
                  title="この個別相談会をテンプレートとして使用"
                >
                  <Copy size={18} />
                  <span>使用</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* ページネーション */}
        {!loading && consultations.length > 0 && totalPages > 1 && (
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

const consultationsListStyle = css({
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

const consultationCardStyle = css({
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

const consultationInfoStyle = css({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  minWidth: 0,
});

const consultationNameStyle = css({
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1a202c',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const consultationDescriptionStyle = css({
  fontSize: '14px',
  color: '#4a5568',
  lineHeight: '1.5',
});

const consultationMetaStyle = css({
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
