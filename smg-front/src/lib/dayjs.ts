import 'dayjs/locale/ja';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

dayjs.locale('ja');

export default dayjs;
