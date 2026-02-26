import type {
	ConsultationApplicationDetail,
	ConsultationDetail,
} from '@/lib/api/consultation';
import { css } from '@/styled-system/css';
import { ConsultationQuestions } from './ConsultationQuestions';

interface ApplicationStatusProps {
	applicationDetail: ConsultationApplicationDetail;
	consultation: ConsultationDetail;
	existingAnswers?: { [key: string]: string | boolean };
}

export function ApplicationStatus({
	applicationDetail,
	consultation,
	existingAnswers = {}
}: ApplicationStatusProps) {
	const formatDateTime = (dateString: string | null) => {
		if (!dateString) return '未設定';
		if (dateString === '削除されたスケジュール') return dateString;
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return '削除されたスケジュール';
		return date.toLocaleString('ja-JP', {
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const sectionStyles = css({
		marginBottom: '1.5rem',
		padding: '1rem',
		backgroundColor: 'gray.50',
		borderRadius: '0.5rem',
		border: '1px solid',
		borderColor: 'gray.200',
	});

	const titleStyles = css({
		fontSize: '1rem',
		fontWeight: 'semibold',
		marginBottom: '0.75rem',
		color: 'gray.800',
	});

	const itemStyles = css({
		marginBottom: '0.5rem',
		fontSize: '0.875rem',
		color: 'gray.700',
	});

	const labelStyles = css({
		fontWeight: 'medium',
		color: 'gray.800',
		marginRight: '0.5rem',
	});

	const valueStyles = css({
		color: 'gray.600',
	});

	const scheduleListStyles = css({
		paddingLeft: '1rem',
		marginTop: '0.5rem',
	});

	const scheduleItemStyles = css({
		marginBottom: '0.25rem',
		fontSize: '0.875rem',
		color: 'gray.600',
	});

	const priorityStyles = css({
		display: 'inline-block',
		backgroundColor: 'blue.100',
		color: 'blue.800',
		padding: '0.125rem 0.375rem',
		borderRadius: '0.25rem',
		fontSize: '0.75rem',
		fontWeight: 'medium',
		marginRight: '0.5rem',
	});

	return (
		<div>
			{/* 希望日程 */}
			{applicationDetail.schedules.length > 0 && (
				<div className={sectionStyles}>
					<h3 className={titleStyles}>希望日程（優先度順）</h3>
					<div className={scheduleListStyles}>
						{applicationDetail.schedules.map((schedule, index) => (
							<div key={schedule.schedule_id} className={scheduleItemStyles}>
								<span className={priorityStyles}>
									第{schedule.priority}希望
								</span>
								{formatDateTime(schedule.schedule_datetime)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* 申し込み基本情報 */}
			<div className={sectionStyles}>
				<h3 className={titleStyles}>申し込み情報</h3>
				<div className={itemStyles}>
					<span className={labelStyles}>申し込み日時:</span>
					<span className={valueStyles}>
						{formatDateTime(applicationDetail.created_at)}
					</span>
				</div>
				<div className={itemStyles}>
					<span className={labelStyles}>緊急相談:</span>
					<span className={valueStyles}>
						{applicationDetail.is_urgent ? 'はい' : 'いいえ'}
					</span>
				</div>
				<div className={itemStyles}>
					<span className={labelStyles}>初回相談:</span>
					<span className={valueStyles}>
						{applicationDetail.is_first_consultation ? 'はい' : 'いいえ'}
					</span>
				</div>
				<div className={itemStyles}>
					<span className={labelStyles}>状況:</span>
					{applicationDetail.selectedSchedule ? (
						<div>
							<div className={css({ color: 'green.700', fontWeight: 'semibold', fontSize: 'sm', mb: '1' })}>
								承認済み - 確定日程
							</div>
							<span className={scheduleItemStyles}>
								<span className={priorityStyles}>
									第{applicationDetail.selectedSchedule.priority}希望
								</span>
								{formatDateTime(
									applicationDetail.selectedSchedule.schedule_datetime,
								)}
							</span>
						</div>
					) : applicationDetail.selection_status === 'approved' ? (
						<div>
							<div className={css({ color: 'green.700', fontWeight: 'semibold', fontSize: 'sm', mb: '1' })}>
								承認済み
							</div>
							<div className={css({ fontSize: 'sm', color: 'gray.600' })}>
								日程調整中または日程が削除されました
							</div>
						</div>
					) : (
						<span className={valueStyles}>
							{applicationDetail.selection_status === 'pending'
								? '選考中'
								: applicationDetail.selection_status === 'rejected'
									? '不承認'
									: applicationDetail.selection_status}
						</span>
					)}
				</div>
				{applicationDetail.notes && (
					<div className={itemStyles}>
						<span className={labelStyles}>備考:</span>
						<div
							className={css({ marginTop: '0.25rem', whiteSpace: 'pre-wrap' })}
						>
							{applicationDetail.notes}
						</div>
					</div>
				)}
			</div>
			{/* 質問回答 */}
			<ConsultationQuestions
				consultationId={consultation.consultation_id}
				answers={existingAnswers}
				onAnswerChange={() => {}} // 読み取り専用なので空の関数
				isReadOnly={true}
			/>
		</div>
	);
}
