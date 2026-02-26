import dayjs from '@/lib/dayjs';

export type EVENT_PUBLISH_STATUS = 'NotStarted' | 'Published' | 'Ended';

export const PUBLISH_STATUS: {
	[key in EVENT_PUBLISH_STATUS]: EVENT_PUBLISH_STATUS;
} = {
	NotStarted: 'NotStarted',
	Published: 'Published',
	Ended: 'Ended',
};

export const getPublishStatus = (
	startDate: string | null,
	endDate: string | null,
): EVENT_PUBLISH_STATUS => {
	const now = dayjs();
	const start = dayjs(startDate);
	const end = dayjs(endDate);

	if (now.isBefore(start)) return PUBLISH_STATUS.NotStarted;
	if (now.isAfter(end)) return PUBLISH_STATUS.Ended;
	return PUBLISH_STATUS.Published;
};

export const PUBLISH_LABEL: { [key in EVENT_PUBLISH_STATUS]: string } = {
	NotStarted: '募集開始前',
	Published: '募集中',
	Ended: '募集終了',
};
