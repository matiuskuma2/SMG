import { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { SearchSortFilter } from './SearchSortFilter'
import { ListPagination } from '@/components/ui/ListPagination'
import { useRouter, useSearchParams } from 'next/navigation'
import { QuestionHistoryItem } from './types'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { QuestionTableItem } from './QuestionTableItem'
import { QuestionCardItem } from './QuestionCardItem'
import { createClient } from '@/lib/supabase'
import { stripHtmlTags, createTextSummary } from '@/lib/utils/html'

export const QuestionHistoryTab = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 状態を初期化
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState('date_desc')
  const [publicStatusFilter, setPublicStatusFilter] = useState('すべて')
  // ページネーション用の状態
  const itemsPerPage = 10 // 1ページあたりの表示件数

  // クエリパラメータからページを取得
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  // 質問履歴データを保持するための状態
  const [questionHistoryData, setQuestionHistoryData] = useState<QuestionHistoryItem[]>([])
  // 画面サイズに応じて表示を切り替えるための状態
  const [isMobileView, setIsMobileView] = useState(false)
  // 削除確認モーダル用の状態
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<{ id: string, title: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  // ローディング状態
  const [isLoading, setIsLoading] = useState(true)

  // 公開状態のリスト
  const publicStatusOptions = ['すべて', '公開', '非公開']

  // 画面サイズの検出
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    
    // 初期チェック
    checkScreenSize()
    
    // リサイズイベントのリスナーを設定
    window.addEventListener('resize', checkScreenSize)
    
    // クリーンアップ
    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

  // テキストを制限する関数（HTMLタグ対応版）
  const truncateText = (text: string, limit: number = 10) => {
    const plainText = stripHtmlTags(text);
    if (plainText.length <= limit) return plainText;
    return plainText.substring(0, limit) + '...';
  };

  // Supabaseからデータを取得
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()
        
        // ログイン中のユーザー情報を取得
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          console.error('ログインユーザーが見つかりません')
          setIsLoading(false)
          return
        }
        
        // ユーザーの質問を取得
        const { data: questions, error } = await supabase
          .from('trn_question')
          .select(`
            question_id,
            content,
            status,
            created_at,
            updated_at,
            instructor_id,
            is_anonymous
          `)
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('質問データの取得に失敗しました:', error)
          setIsLoading(false)
          return
        }
        
        // 関連する回答を取得
        const questionIds = questions.map(q => q.question_id)
        const { data: answers, error: answersError } = await supabase
          .from('trn_answer')
          .select('*')
          .in('question_id', questionIds)
          .is('deleted_at', null)
        
        if (answersError) {
          console.error('回答データの取得に失敗しました:', answersError)
        }
        
        // 講師データを取得
        const instructorIds = questions.map(q => q.instructor_id)
        const { data: instructors, error: instructorsError } = await supabase
          .from('mst_user')
          .select('user_id, username')
          .in('user_id', instructorIds)
          .is('deleted_at', null)

        if (instructorsError) {
          console.error('講師データの取得に失敗しました:', instructorsError)
        }
        
        // データをマッピング
        const mappedData = questions.map(question => {
          // この質問に対する回答を見つける
          const questionAnswers = answers?.filter(a => a.question_id === question.question_id) || []
          const answer = questionAnswers.length > 0 ? questionAnswers[0] : null
          
          // 回答を担当した講師
          const instructor = instructors?.find(i => i.user_id === question.instructor_id)
          
          // 日付をフォーマット
          const createdAt = new Date(question.created_at || new Date())
          const formattedCreatedAt = `${createdAt.getFullYear()}年${String(createdAt.getMonth() + 1).padStart(2, '0')}月${String(createdAt.getDate()).padStart(2, '0')}日`
          
          let formattedAnsweredAt = ''
          if (answer) {
            const answeredAt = new Date(answer.created_at || new Date())
            formattedAnsweredAt = `${answeredAt.getFullYear()}年${String(answeredAt.getMonth() + 1).padStart(2, '0')}月${String(answeredAt.getDate()).padStart(2, '0')}日`
          }
          
          return {
            id: question.question_id,
            question: question.content,
            answer: answer ? (answer.is_draft ? '回答待ち' : answer.content) : '回答待ち',
            askedAt: formattedCreatedAt,
            answeredAt: formattedAnsweredAt || formattedCreatedAt,
            status: question.status === 'answered' ? '回答済み' : '回答待ち',
            isPublic: !question.is_anonymous
          } as QuestionHistoryItem
        })
        
        setQuestionHistoryData(mappedData)
      } catch (err) {
        console.error('データ取得中にエラーが発生しました:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchQuestions()
  }, [])

  // 検索フィルター関数
  const filteredQuestionData = questionHistoryData.filter((item) => {
    const lowerCaseQuery = searchQuery.toLowerCase()
    
    // HTMLタグを除去してから検索
    const plainQuestion = stripHtmlTags(item.question).toLowerCase()
    const plainAnswer = stripHtmlTags(item.answer).toLowerCase()
    
    // 検索クエリによるフィルタリング
    const matchesSearch = 
      plainQuestion.includes(lowerCaseQuery) ||
      plainAnswer.includes(lowerCaseQuery)
    
    // 公開状態によるフィルタリング
    const matchesPublicStatus = 
      publicStatusFilter === 'すべて' || 
      (publicStatusFilter === '公開' && item.isPublic) || 
      (publicStatusFilter === '非公開' && !item.isPublic)
    
    return matchesSearch && matchesPublicStatus
  })

  // ソート関数
  const sortedQuestionData = [...filteredQuestionData].sort((a, b) => {
    // 日本語の日付形式 (例: 2024年06月03日) を Date オブジェクトに変換する関数
    const parseJapaneseDate = (dateStr: string) => {
      const matches = dateStr.match(/(\d{4})年(\d{2})月(\d{2})日/);
      if (matches) {
        const [_, year, month, day] = matches;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)); // 月は0から始まるので1を引く
      }
      return new Date(0); // パースに失敗した場合
    };

    const dateA = parseJapaneseDate(a.askedAt);
    const dateB = parseJapaneseDate(b.askedAt);

    switch (sortOption) {
      case 'date_asc':
        return dateA.getTime() - dateB.getTime();
      case 'date_desc':
      default:
        return dateB.getTime() - dateA.getTime();
    }
  })

  // ページネーション用のデータ計算
  const totalPages = Math.ceil(sortedQuestionData.length / itemsPerPage)
  const paginatedData = sortedQuestionData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // ページ変更ハンドラー
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/mypage?${params.toString()}`, { scroll: false })
  }

  // 詳細ページへの遷移
  const handleViewDetails = (questionId: string) => {
    router.push(`/questions/${questionId}`)
  }

  // 編集ページへの遷移
  const handleEditQuestion = (questionId: string) => {
    router.push(`/questions/edit/${questionId}`)
  }

  // 削除モーダルを開く
  const openDeleteModal = (questionId: string, questionTitle: string) => {
    setQuestionToDelete({ id: questionId, title: questionTitle });
    setIsDeleteModalOpen(true);
  };

  // 削除モーダルを閉じる
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setQuestionToDelete(null);
  };

  // 質問削除の処理
  const handleDeleteQuestion = async () => {
    if (!questionToDelete || isDeleting) return;

    setIsDeleting(true)
    try {
      const supabase = createClient()

      // 論理削除（deleted_atを設定）
      const { error } = await supabase
        .from('trn_question')
        .update({ deleted_at: new Date().toISOString() })
        .eq('question_id', questionToDelete.id)

      if (error) {
        console.error('質問の削除に失敗しました:', error)
        return
      }

      // 画面上のデータを更新
      const updatedData = questionHistoryData.filter(item => item.id !== questionToDelete.id);
      setQuestionHistoryData(updatedData);

      // 削除後にページが空になった場合、前のページに戻る
      const currentDataLength = paginatedData.length;
      if (currentDataLength === 1 && currentPage > 1) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', (currentPage - 1).toString())
        router.push(`/mypage?${params.toString()}`, { scroll: false })
      }
    } catch (err) {
      console.error('削除処理中にエラーが発生しました:', err)
    } finally {
      setIsDeleting(false)
      // モーダルを閉じる
      closeDeleteModal();
    }
  }

  // フィルタリングやソートが変更されたときに1ページ目に戻す
  const resetPage = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', '1')
    router.push(`/mypage?${params.toString()}`, { scroll: false })
  }

  // 検索条件変更時にページをリセット
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query)
    resetPage()
  }

  // ソートオプション変更時にページをリセット
  const handleSortOptionChange = (option: string) => {
    setSortOption(option)
    resetPage()
  }

  // 公開状態フィルター変更時にページをリセット
  const handlePublicStatusFilterChange = (status: string) => {
    setPublicStatusFilter(status)
    resetPage()
  }

  return (
    <div className={css({ w: 'full' })}>
      {/* 検索とソート機能 */}
      <SearchSortFilter 
        searchQuery={searchQuery}
        setSearchQuery={handleSearchQueryChange}
        sortOption={sortOption}
        setSortOption={handleSortOptionChange}
        searchPlaceholder="質問または回答を検索..."
        industryFilter={publicStatusFilter}
        setIndustryFilter={handlePublicStatusFilterChange}
        industries={publicStatusOptions}
        filterLabel="公開状態"
      />

      {/* ローディング表示 */}
      {isLoading ? (
        <p className={css({ textAlign: 'center', py: '8', color: 'gray.500' })}>
          データを読み込み中...
        </p>
      ) : sortedQuestionData.length > 0 ? (
        <>
          {/* PC表示用のテーブルレイアウト */}
          {!isMobileView ? (
            <div className={css({ overflowX: 'auto', w: 'full' })}>
              <table className={css({ w: 'full', borderCollapse: 'collapse' })}>
                <thead>
                  <tr className={css({
                    bg: 'gray.50',
                    borderBottomWidth: '2px',
                    borderColor: 'gray.200'
                  })}>
                    <th className={css({ py: '3', px: '2', textAlign: 'left', fontWeight: 'semibold' })}>質問</th>
                    <th className={css({ py: '3', px: '2', textAlign: 'left', fontWeight: 'semibold' })}>回答</th>
                    <th className={css({ py: '3', px: '2', textAlign: 'left', fontWeight: 'semibold' })}>公開状態</th>
                    <th className={css({ py: '3', px: '2', textAlign: 'left', fontWeight: 'semibold' })}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(item => (
                    <QuestionTableItem
                      key={item.id}
                      item={item}
                      truncateText={truncateText}
                      handleViewDetails={handleViewDetails}
                      handleEditQuestion={handleEditQuestion}
                      openDeleteModal={openDeleteModal}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* モバイル表示用のカードレイアウト */
            <div className={css({ w: 'full', px: '2' })}>
              {paginatedData.map(item => (
                <QuestionCardItem
                  key={item.id}
                  item={item}
                  truncateText={truncateText}
                  handleViewDetails={handleViewDetails}
                  handleEditQuestion={handleEditQuestion}
                  openDeleteModal={openDeleteModal}
                />
              ))}
            </div>
          )}
          
          {totalPages > 1 && (
            <ListPagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      ) : (
        <p className={css({ textAlign: 'center', py: '8', color: 'gray.500' })}>
          検索結果がありません
        </p>
      )}

      {/* 削除確認モーダル */}
      {questionToDelete && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteQuestion}
          questionTitle={questionToDelete.title}
          truncateText={truncateText}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
} 