import { css } from "@/styled-system/css";
import { Label } from "@/components/ui/label";
import { type SelectedDatesProps } from "./types";

export function SelectedDates({ selectedDates, schedules }: SelectedDatesProps) {
  const formGroupStyles = css({
    mb: "6",
  });

  const labelStyles = css({
    display: "block",
    mb: "2",
    fontWeight: "medium",
  });

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityLabel = (index: number) => {
    return `第${index + 1}希望`;
  };

  return (
    <div className={formGroupStyles}>
      <Label className={labelStyles}>
        選択された日程
      </Label>
      <div className={css({ bg: "gray.50", p: "3", borderRadius: "md" })}>
        {selectedDates.map((dateId, index) => {
          const schedule = schedules.find(s => s.schedule_id === dateId);
          const priorityLabel = getPriorityLabel(index);
          return schedule ? (
            <p key={dateId} className={css({ fontSize: "sm", mb: "1" })}>
              • <span className={css({ fontWeight: "bold", color: "blue.600" })}>{priorityLabel}：</span>
              {formatDateTime(schedule.schedule_datetime)}
            </p>
          ) : null;
        })}
      </div>
    </div>
  );
} 