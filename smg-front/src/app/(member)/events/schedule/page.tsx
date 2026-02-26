import { EventSchedulePage } from '@/features/event-schedule/components/page';
import dayjs from '@/lib/dayjs';

const Page = ({
	searchParams,
}: {
	searchParams: { month?: string; week?: string; zoom?: string };
}) => {
	// weekパラメータがある場合はそれを使用、なければmonthを使用
	const date = searchParams.week
		? dayjs(searchParams.week)
		: dayjs(searchParams.month);
	const zoom = searchParams.zoom ? Number(searchParams.zoom) : 100;
	const initialViewMode = searchParams.week ? 'week' : 'month';

	return (
		<EventSchedulePage
			selected={date}
			initialZoom={zoom}
			initialViewMode={initialViewMode}
		/>
	);
};

export default Page;
