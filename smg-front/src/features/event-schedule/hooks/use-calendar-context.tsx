import { createContext } from '@/features/admin/lib/create-context';
import type { CalendarAria } from '@react-aria/calendar';
import type { CalendarState } from '@react-stately/calendar';

type CalendarContextState = Pick<
	CalendarAria,
	'prevButtonProps' | 'nextButtonProps' | 'title'
> & { state: CalendarState };

export const [CalendarContext, useCalendarContext] =
	createContext<CalendarContextState>({
		prevButtonProps: {},
		nextButtonProps: {},
		title: '',
		state: {} as CalendarState,
	});
