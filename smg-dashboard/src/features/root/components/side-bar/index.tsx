'use client';

import { css, cx } from '@/styled-system/css';
import { Divider } from '@/styled-system/jsx';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  FaBullhorn,
  FaCircleQuestion,
  FaFileInvoice,
  FaFolderOpen,
  FaHeadset,
  FaMessage,
  FaNewspaper,
  FaQuora,
  FaRadio,
  FaRightFromBracket,
  FaUser,
  FaUsers,
  FaBuilding,
  FaGraduationCap,
  FaTableColumns,
} from 'react-icons/fa6';
import { LuEllipsisVertical, LuMenu } from 'react-icons/lu';
import { MdEdit, MdFiberNew, MdSettings } from 'react-icons/md';

import { createClient } from '@/lib/supabase/client';
import { usePathname, useRouter } from 'next/navigation';
import * as Collapse from './collapse';

const Icon = ({ icon }: { icon: React.ReactNode }) => <i>{icon}</i>;

const NavItem = ({ children }: { children: React.ReactNode }) => (
  <span
    className={css({
      textWrap: 'nowrap',
    })}
  >
    {children}
  </span>
);

const footerItemStyle = cx(
  Collapse.itemStyle,
  css({
    _hover: {
      bg: {
        base: 'blue.100',
        _currentPage: 'blue.100',
      },
    },
  }),
);

const navItemStyle = cx(
  Collapse.itemStyle,
  css({
    cursor: 'pointer',
    _hover: {
      bg: {
        base: 'blue.100',
        _currentPage: 'blue.100',
      },
    },
  }),
);

const activeNavItemStyle = cx(
  navItemStyle,
  css({
    bg: 'blue.200',
    fontWeight: 'bold',
    _hover: {
      bg: 'blue.200',
    },
  }),
);

export const SideBar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dmAccordionOpen, setDmAccordionOpen] = useState(false);
  const [archiveAccordionOpen, setArchiveAccordionOpen] = useState(false);
  const [questionAccordionOpen, setQuestionAccordionOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    username: string | null;
    icon: string | null;
  } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // パスが現在のページかどうかを判定する関数
  const isCurrentPage = (path: string) => {
    return pathname.startsWith(path);
  };

  // ダイレクトメッセージ関連ページでアコーディオンを開く
  useEffect(() => {
    const isDmPage =
      pathname.startsWith('/direct-message') ||
      pathname.startsWith('/broadcast-history');
    setDmAccordionOpen(isDmPage);
  }, [pathname]);

  // アーカイブ関連ページでアコーディオンを開く
  useEffect(() => {
    const isArchivePage =
      pathname.startsWith('/archive') || pathname.startsWith('/theme');
    setArchiveAccordionOpen(isArchivePage);
  }, [pathname]);

  // 質問関連ページでアコーディオンを開く
  useEffect(() => {
    const isQuestionPage =
      pathname.startsWith('/questionlist') ||
      pathname.startsWith('/question-howto');
    setQuestionAccordionOpen(isQuestionPage);
  }, [pathname]);

  // 現在のユーザー情報を取得
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error('認証エラー:', authError);
          return;
        }

        // ユーザー情報をmst_userテーブルから取得
        const { data: userData, error: userError } = await supabase
          .from('mst_user')
          .select('username, icon')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .single();

        if (userError) {
          console.error('ユーザー情報取得エラー:', userError);
          return;
        }

        setCurrentUser(userData);
      } catch (error) {
        console.error('ユーザー情報の取得に失敗しました:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('ログアウトエラー:', error);
        // エラーが発生してもログアウト処理を続行
      }

      // ページを完全にリロードしてからログイン画面にリダイレクト
      window.location.href = '/login';
    } catch (err) {
      console.error('ログアウト処理中にエラーが発生しました:', err);
      // エラーが発生してもログイン画面にリダイレクト
      window.location.href = '/login';
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside
      className={css({
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        maxH: '100vh',
        color: 'gray.700',
        transition: 'grid-template-columns 0.3s',
        boxSizing: 'border-box',
        borderRight: '1px solid token(colors.gray.200)',
      })}
      style={{ gridTemplateColumns: isOpen ? '250px' : '56px' }}
      aria-expanded={isOpen}
    >
      {/* Header */}
      <div className={css({ p: '1rem' })}>
        <div
          className={css({
            display: 'flex',
            justifyContent: { base: 'center', _expanded: 'space-between' },
            w: 'full',
          })}
          aria-expanded={isOpen}
        >
          {isOpen && <div />}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={css({
              p: '0.5rem',
              rounded: 'full',
              _hover: { bg: '#E9F2FF' },
            })}
          >
            <LuMenu size={24} />
          </button>
        </div>
      </div>

      {/* Content */}
      <nav className={css({ overflowY: 'auto', scrollbar: 'hidden' })}>
        <ul>
          {/* ダイレクトメッセージアコーディオン */}
          <Collapse.Root
            open={dmAccordionOpen}
            onOpenChange={setDmAccordionOpen}
          >
            <li>
              <Collapse.Trigger
                style={{
                  backgroundColor:
                    isCurrentPage('/direct-message') ||
                    isCurrentPage('/broadcast-history')
                      ? 'rgba(219, 234, 254, 1)'
                      : 'transparent',
                  fontWeight:
                    isCurrentPage('/direct-message') ||
                    isCurrentPage('/broadcast-history')
                      ? 'bold'
                      : 'normal',
                }}
              >
                <Icon icon={<FaMessage size={20} />} />
                <NavItem>メッセージ</NavItem>
                <Collapse.Indicator />
              </Collapse.Trigger>
            </li>
            <Collapse.Content>
              <Collapse.Item href="/direct-message">1:1チャット</Collapse.Item>
              <Collapse.Item href="/broadcast-history">一斉配信</Collapse.Item>
            </Collapse.Content>
          </Collapse.Root>

          <li>
            <button
              type="button"
              className={
                isCurrentPage('/userlist') || isCurrentPage('/user/')
                  ? activeNavItemStyle
                  : navItemStyle
              }
              onClick={() => router.push('/userlist')}
            >
              <Icon icon={<FaUser size={20} />} />
              <NavItem>ユーザー</NavItem>
            </button>
          </li>

          <li>
            <button
              type="button"
              className={
                isCurrentPage('/grouplist') || isCurrentPage('/group/')
                  ? activeNavItemStyle
                  : navItemStyle
              }
              onClick={() => router.push('/grouplist')}
            >
              <Icon icon={<FaUsers size={20} />} />
              <NavItem>グループ</NavItem>
            </button>
          </li>

          <li>
            <button
              type="button"
              className={
                isCurrentPage('/eventlist') ? activeNavItemStyle : navItemStyle
              }
              onClick={() => router.push('/eventlist')}
            >
              <Icon icon={<MdEdit size={20} />} />
              <NavItem>イベント</NavItem>
            </button>
          </li>

          <li>
            <button
              type="button"
              className={
                isCurrentPage('/radiolist') ? activeNavItemStyle : navItemStyle
              }
              onClick={() => router.push('/radiolist')}
            >
              <Icon icon={<FaRadio size={20} />} />
              <NavItem>ラジオ</NavItem>
            </button>
          </li>

          {/* アーカイブアコーディオン */}
          <Collapse.Root
            open={archiveAccordionOpen}
            onOpenChange={setArchiveAccordionOpen}
          >
            <li>
              <Collapse.Trigger
                style={{
                  backgroundColor:
                    isCurrentPage('/archive') || isCurrentPage('/theme')
                      ? 'rgba(219, 234, 254, 1)'
                      : 'transparent',
                  fontWeight:
                    isCurrentPage('/archive') || isCurrentPage('/theme')
                      ? 'bold'
                      : 'normal',
                }}
              >
                <Icon icon={<FaFolderOpen size={20} />} />
                <NavItem>アーカイブ</NavItem>
                <Collapse.Indicator />
              </Collapse.Trigger>
            </li>
            <Collapse.Content>
              <Collapse.Item href="/archive">アーカイブ一覧</Collapse.Item>
              <Collapse.Item href="/theme">テーマ</Collapse.Item>
            </Collapse.Content>
          </Collapse.Root>

          <li>
            <button
              type="button"
              className={
                isCurrentPage('/individualConsultationlist') ||
                isCurrentPage('/individualConsultation/')
                  ? activeNavItemStyle
                  : navItemStyle
              }
              onClick={() => router.push('/individualConsultationlist')}
            >
              <Icon icon={<FaHeadset size={20} />} />
              <NavItem>個別相談</NavItem>
            </button>
          </li>

          {/* 質問アコーディオン */}
          <Collapse.Root
            open={questionAccordionOpen}
            onOpenChange={setQuestionAccordionOpen}
          >
            <li>
              <Collapse.Trigger
                style={{
                  backgroundColor:
                    isCurrentPage('/questionlist') ||
                    isCurrentPage('/question-howto')
                      ? 'rgba(219, 234, 254, 1)'
                      : 'transparent',
                  fontWeight:
                    isCurrentPage('/questionlist') ||
                    isCurrentPage('/question-howto')
                      ? 'bold'
                      : 'normal',
                }}
              >
                <Icon icon={<FaQuora size={20} />} />
                <NavItem>質問</NavItem>
                <Collapse.Indicator />
              </Collapse.Trigger>
            </li>
            <Collapse.Content>
              <Collapse.Item href="/questionlist">質問一覧</Collapse.Item>
              <Collapse.Item href="/question-howto">使い方</Collapse.Item>
            </Collapse.Content>
          </Collapse.Root>

          <li>
            <button
              type="button"
              className={
                isCurrentPage('/faqlist') ? activeNavItemStyle : navItemStyle
              }
              onClick={() => router.push('/faqlist')}
            >
              <Icon icon={<FaCircleQuestion size={20} />} />
              <NavItem>よくある質問</NavItem>
            </button>
          </li>

          <li>
            <button
              type="button"
              className={
                isCurrentPage('/noticelist') || isCurrentPage('/notice/')
                  ? activeNavItemStyle
                  : navItemStyle
              }
              onClick={() => router.push('/noticelist')}
            >
              <Icon icon={<FaNewspaper size={20} />} />
              <NavItem>お知らせ</NavItem>
            </button>
          </li>

          <li>
            <button
              type="button"
              className={
                isCurrentPage('/shibulist') || isCurrentPage('/shibu/')
                  ? activeNavItemStyle
                  : navItemStyle
              }
              onClick={() => router.push('/shibulist')}
            >
              <Icon icon={<FaBuilding size={20} />} />
              <NavItem>支部</NavItem>
            </button>
          </li>

          <li>
            <button
              type="button"
              className={
                isCurrentPage('/mastercourselist') || isCurrentPage('/mastercourse/')
                  ? activeNavItemStyle
                  : navItemStyle
              }
              onClick={() => router.push('/mastercourselist')}
            >
              <Icon icon={<FaGraduationCap size={20} />} />
              <NavItem>マスター講座</NavItem>
            </button>
          </li>

          <li>
            <button
              type="button"
              className={
                isCurrentPage('/tablist') || isCurrentPage('/tab/')
                  ? activeNavItemStyle
                  : navItemStyle
              }
              onClick={() => router.push('/tablist')}
            >
              <Icon icon={<FaTableColumns size={20} />} />
              <NavItem>タブ管理</NavItem>
            </button>
          </li>

          <li>
            <button
              type="button"
              className={
                isCurrentPage('/forBeginnerslist') ||
                isCurrentPage('/forBeginners/')
                  ? activeNavItemStyle
                  : navItemStyle
              }
              onClick={() => router.push('/forBeginnerslist')}
            >
              <Icon icon={<MdFiberNew size={20} />} />
              <NavItem>初めての方へ</NavItem>
            </button>
          </li>

          <li>
            <button
              type="button"
              className={
                isCurrentPage('/receipt-issue')
                  ? activeNavItemStyle
                  : navItemStyle
              }
              onClick={() => router.push('/receipt-issue')}
            >
              <Icon icon={<FaFileInvoice size={20} />} />
              <NavItem>領収書</NavItem>
            </button>
          </li>

          <li>
            <button
              type="button"
              className={
                isCurrentPage('/zoom-setting')
                  ? activeNavItemStyle
                  : navItemStyle
              }
              onClick={() => router.push('/zoom-setting')}
            >
              <Icon icon={<MdSettings size={20} />} />
              <NavItem>Zoomリンク</NavItem>
            </button>
          </li>
        </ul>
      </nav>

      <Divider color={'gray.300'} />

      {/* Footer */}
      <div>
        <ul>
          <li className={footerItemStyle}>
            <Image
              alt="user"
              className={css({ borderRadius: 'full' })}
              src={currentUser?.icon || '/profile-icon.jpg'}
              width={24}
              height={24}
            />
            <NavItem>{currentUser?.username || '読み込み中...'}</NavItem>
            <LuEllipsisVertical className={css({ ml: 'auto' })} size={20} />
          </li>
          <button
            type="button"
            className={footerItemStyle}
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <Icon icon={<FaRightFromBracket size={20} />} />
            <NavItem>{isLoggingOut ? 'ログアウト中...' : 'ログアウト'}</NavItem>
          </button>
        </ul>
      </div>
    </aside>
  );
};
