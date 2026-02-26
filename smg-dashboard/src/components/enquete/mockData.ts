import { type EnqueteFormData, QuestionType } from './types';

// 編集ページ用のダミーデータ
export const mockEnqueteData: EnqueteFormData = {
  title: 'イベント満足度アンケート',
  description:
    'このアンケートはイベントの満足度を測定し、今後のイベント改善のために使用されます。',
  questions: [
    {
      id: 'q1',
      type: QuestionType.MultipleChoice,
      title: '今回のイベントの全体的な満足度を教えてください。',
      options: ['非常に満足', '満足', '普通', '不満', '非常に不満'],
      required: true,
    },
    {
      id: 'q2',
      type: QuestionType.MultipleChoice,
      title: 'イベントの内容で最も良かったと思うものを選んでください。',
      options: [
        '基調講演',
        'ワークショップ',
        'ネットワーキングセッション',
        '展示ブース',
        'その他',
      ],
      required: false,
    },
    {
      id: 'q3',
      type: QuestionType.ShortAnswer,
      title: '今後のイベントで改善すべき点があれば教えてください。',
      required: false,
    },
    {
      id: 'q4',
      type: QuestionType.MultipleChoice,
      title: '次回のイベントに参加したいですか？',
      options: [
        'ぜひ参加したい',
        '内容次第で参加したい',
        'わからない',
        '参加しない',
      ],
      required: true,
    },
    {
      id: 'q5',
      type: QuestionType.ShortAnswer,
      title: 'その他ご意見・ご感想があればご記入ください。',
      required: false,
    },
  ],
};
