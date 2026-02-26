import { css } from "@/styled-system/css";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { type ConsultationDatesProps } from "./types";

export function ConsultationDates({
  schedules,
  selectedDates,
  onDateChange,
  disabled = false
}: ConsultationDatesProps) {
  const formGroupStyles = css({
    mb: "6",
    mt: "10",
  });

  const sectionTitleStyles = css({
    fontSize: "lg",
    fontWeight: "semibold",
    mb: "4",
    pb: "2",
    borderBottom: "1px solid",
    borderColor: "gray.200",
  });

  const listSpaceStyles = css({
    display: "flex",
    flexDirection: "column",
    gap: "4",
  });

  const dateCheckboxStyles = css({
    display: "flex",
    alignItems: "center",
    gap: "2",
    mb: "2",
  });

  const checkboxWrapperStyles = css({
    display: "flex",
    alignItems: "center",
    gap: "2",
  });

  const labelStyles = css({
    fontWeight: "normal",
    fontSize: "sm",
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

  const handleDateChange = (scheduleId: string, checked: boolean) => {
    onDateChange(scheduleId, checked);
  };

  return (
    <div className={formGroupStyles}>
      <h3 className={sectionTitleStyles}>相談可能日程</h3>
      <p className={css({ fontWeight: "medium", mb: "2" })}>
        下記からご希望の日程を選択してください：
      </p>
      
      <div className={listSpaceStyles}>
        {[...schedules]
          .sort((a, b) => new Date(a.schedule_datetime).getTime() - new Date(b.schedule_datetime).getTime())
          .map(schedule => (
          <div key={schedule.schedule_id} className={dateCheckboxStyles}>
            <div className={checkboxWrapperStyles}>
              <Checkbox 
                id={schedule.schedule_id} 
                checked={selectedDates.includes(schedule.schedule_id)}
                onChange={(e) => handleDateChange(schedule.schedule_id, e.target.checked)}
                disabled={disabled}
                className={css({ 
                  _checked: {
                    bg: "blue.500",
                    borderColor: "blue.500",
                    color: "white"
                  },
                  ...(disabled && {
                    cursor: "not-allowed"
                  })
                })}
              />
              <Label htmlFor={schedule.schedule_id} className={labelStyles}>
                {formatDateTime(schedule.schedule_datetime)}
              </Label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 