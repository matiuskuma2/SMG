"use client";

import { css } from "@/styled-system/css";
import { Divider } from "@/styled-system/jsx";
import Image from "next/image";
import { type PropsWithChildren, useEffect, useState } from "react";
import { FaBook, FaChevronDown, FaFlask, FaMessage, FaPaintRoller, FaUsers } from "react-icons/fa6";
import { LuEllipsisVertical, LuMenu, LuSquareArrowOutUpRight } from "react-icons/lu";
import { MdEdit, MdHelp, MdInsertChart, MdSettings } from "react-icons/md";

import { usePathname } from "next/navigation";
import * as Collapse from "./collapse";
import { type RouteDefsType, includeCurrent } from "./utils";

const Icon = ({ icon }: { icon: React.ReactNode }) => <i>{icon}</i>;

const NavItem = ({ children }: PropsWithChildren) => (
  <span className={css({ fontWeight: "bold", textWrap: "nowrap" })}>{children}</span>
);

export const SideBar = () => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <aside
      className={css({
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        bg: "#254860",
        color: "white",
        transition: "grid-template-columns 0.3s",
      })}
      style={{ gridTemplateColumns: isOpen ? "250px" : "56px" }}
      aria-expanded={isOpen}
    >
      {/* Header */}
      <div className={css({ p: "1rem" })}>
        <div
          className={css({
            display: "flex",
            justifyContent: { base: "center", _expanded: "space-between" },
            w: "full",
          })}
          aria-expanded={isOpen}
        >
          {isOpen && <div />}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={css({
              p: "0.5rem",
              rounded: "full",
              _hover: { bg: "rgba(0, 0, 0, .08)" },
            })}
          >
            <LuMenu size={24} />
          </button>
        </div>
      </div>

      {/* Content */}
      <nav className={css({ overflowY: "auto", scrollbar: "hidden" })}>
        <ul>
          <SideBarContentGroup isOpenSideBar={isOpen} itemKey="user">
            <Collapse.Trigger>
              <Icon icon={<FaUsers size={20} />} />
              <NavItem>ユーザー</NavItem>
              <Collapse.Indicator />
            </Collapse.Trigger>
            <Collapse.Content>
              <Collapse.Item>ユーザー一覧</Collapse.Item>
              <Collapse.Item>グループ一覧</Collapse.Item>
            </Collapse.Content>
          </SideBarContentGroup>

          <SideBarContentGroup isOpenSideBar={isOpen} itemKey="content">
            <Collapse.Trigger>
              <Icon icon={<MdEdit size={20} />} />
              <NavItem>コンテンツ</NavItem>
              <Collapse.Indicator />
            </Collapse.Trigger>
            <Collapse.Content>
              <Collapse.Item href="/admin">投稿</Collapse.Item>
              <Collapse.Item>投稿テンプレート</Collapse.Item>
              <Collapse.Item>アイスブレイク</Collapse.Item>
              <Collapse.Item>商品カタログ</Collapse.Item>
              <Collapse.Item>ナレッジベース</Collapse.Item>
              <Collapse.Item>イベント</Collapse.Item>
              <Collapse.Item>チャレンジ</Collapse.Item>
              <Collapse.Item>トレーニング</Collapse.Item>
            </Collapse.Content>
          </SideBarContentGroup>

          <SideBarContentGroup isOpenSideBar={isOpen} itemKey="message">
            <Collapse.Trigger>
              <Icon icon={<FaMessage size={20} />} />
              <NavItem>メッセージ</NavItem>
              <Collapse.Indicator />
            </Collapse.Trigger>
            <Collapse.Content>
              <Collapse.Item>ダイレクトメッセージ</Collapse.Item>
              <Collapse.Item>自動送信</Collapse.Item>
            </Collapse.Content>
          </SideBarContentGroup>

          <SideBarContentGroup isOpenSideBar={isOpen} itemKey="analysis">
            <Collapse.Trigger>
              <Icon icon={<MdInsertChart size={20} />} />
              <NavItem>分析</NavItem>
              <Collapse.Indicator>
                <FaChevronDown size={16} />
              </Collapse.Indicator>
            </Collapse.Trigger>
            <Collapse.Content>
              <Collapse.Item>データ分析</Collapse.Item>
            </Collapse.Content>
          </SideBarContentGroup>

          <SideBarContentGroup isOpenSideBar={isOpen} itemKey="portal">
            <Collapse.Trigger>
              <Icon icon={<FaPaintRoller size={20} />} />
              <NavItem>ポータル</NavItem>
              <Collapse.Indicator />
            </Collapse.Trigger>
            <Collapse.Content>
              <Collapse.Item>バッジ</Collapse.Item>
              <Collapse.Item>ポイント・ランク</Collapse.Item>
              <Collapse.Item>プロフィールのカスタマイズ</Collapse.Item>
              <Collapse.Item>カスタムリアクション</Collapse.Item>
              <Collapse.Item>サイトデザイン</Collapse.Item>
              <Collapse.Item>プッシュ通知</Collapse.Item>
            </Collapse.Content>
          </SideBarContentGroup>

          <SideBarContentGroup isOpenSideBar={isOpen} itemKey="settings">
            <Collapse.Trigger>
              <Icon icon={<MdSettings size={20} />} />
              <NavItem>設定</NavItem>
              <Collapse.Indicator />
            </Collapse.Trigger>
            <Collapse.Content>
              <Collapse.Item>コミュニティ設定</Collapse.Item>
              <Collapse.Item>オンボーディングのヒント</Collapse.Item>
              <Collapse.Item>ソーシャルログイン</Collapse.Item>
              <Collapse.Item>メール設定</Collapse.Item>
              <Collapse.Item>管理者情報</Collapse.Item>
              <Collapse.Item>環境設定</Collapse.Item>
            </Collapse.Content>
          </SideBarContentGroup>
        </ul>
      </nav>

      <Divider color={"rgba(255, 255, 255, 0.4)"} />

      {/* Footer */}
      <div>
        <ul>
          <button type="button" className={Collapse.itemStyle}>
            <Icon icon={<FaFlask size={20} />} />
            <NavItem>データラボ</NavItem>
          </button>
          <button type="button" className={Collapse.itemStyle}>
            <Icon icon={<FaBook size={20} />} />
            <NavItem>クイックガイド</NavItem>
          </button>
          <button type="button" className={Collapse.itemStyle}>
            <Icon icon={<MdHelp size={20} />} />
            <NavItem>ヘルプ（SHIP）</NavItem>
            <LuSquareArrowOutUpRight className={css({ ml: "auto" })} size={16} />
          </button>
          <li className={Collapse.itemStyle}>
            <Image alt="user" className={css({ borderRadius: "full" })} src={"/profile-icon.jpg"} width={24} height={24} quality={100} unoptimized={true} />
            <NavItem>mock-user</NavItem>
            <LuEllipsisVertical className={css({ ml: "auto" })} size={20} />
          </li>
        </ul>
      </div>
    </aside>
  );
};

export const SideBarContentGroup = ({
  itemKey,
  isOpenSideBar,
  children,
}: React.PropsWithChildren<{ itemKey: keyof RouteDefsType; isOpenSideBar: boolean }>) => {
  const pathname = usePathname();
  const defaultOpen = includeCurrent(pathname, itemKey);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!isOpenSideBar) setIsOpen(false);
    else setIsOpen(defaultOpen);
  }, [isOpenSideBar, defaultOpen]);

  return (
    <Collapse.Root disabled={!isOpenSideBar} open={isOpen} onOpenChange={setIsOpen}>
      {children}
    </Collapse.Root>
  );
};
