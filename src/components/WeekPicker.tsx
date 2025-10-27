import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import isBetweenPlugin from 'dayjs/plugin/isBetween';
import { styled } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import {DatePicker} from "@mui/x-date-pickers/DatePicker";

dayjs.extend(isBetweenPlugin);

interface CustomPickerDayProps extends PickersDayProps {
    isSelected: boolean;
    isHovered: boolean;
}

const CustomPickersDay = styled(PickersDay, {
    shouldForwardProp: (prop) => prop !== 'isSelected' && prop !== 'isHovered',
})<CustomPickerDayProps>(({ theme, isSelected, isHovered, day }) => ({
    borderRadius: 0,
    ...(isSelected && {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        '&:hover, &:focus': {
            backgroundColor: theme.palette.primary.main,
        },
    }),
    ...(isHovered && {
        backgroundColor: theme.palette.primary.light,
        '&:hover, &:focus': {
            backgroundColor: theme.palette.primary.light,
        },
        ...theme.applyStyles('dark', {
            backgroundColor: theme.palette.primary.dark,
            '&:hover, &:focus': {
                backgroundColor: theme.palette.primary.dark,
            },
        }),
    }),
    ...(day.day() === 0 && {
        borderTopLeftRadius: '50%',
        borderBottomLeftRadius: '50%',
    }),
    ...(day.day() === 6 && {
        borderTopRightRadius: '50%',
        borderBottomRightRadius: '50%',
    }),
})) as React.ComponentType<CustomPickerDayProps>;

const isInSameWeek = (dayA: Dayjs, dayB: Dayjs | null | undefined) => {
    if (dayB == null) {
        return false;
    }

    return dayA.isSame(dayB, 'week');
};

function Day(
    props: PickersDayProps & {
        selectedDay?: Dayjs | null;
        hoveredDay?: Dayjs | null;
    },
) {
    const { day, selectedDay, hoveredDay, ...other } = props;

    return (
        <CustomPickersDay
            {...other}
            day={day}
            sx={{ px: 2.5 }}
            disableMargin
            selected={false}
            isSelected={isInSameWeek(day, selectedDay)}
            isHovered={isInSameWeek(day, hoveredDay)}
        />
    );
}

interface WeekPickerProps {
    onWeekChange?: (start: Dayjs, end: Dayjs) => void;
    initialDate?: Dayjs;
}

const WeekPicker = ({onWeekChange, initialDate}: WeekPickerProps) => {
    const [hoveredDay, setHoveredDay] = React.useState<Dayjs | null>(null);
    const [value, setValue] = React.useState<Dayjs | null>(initialDate || dayjs());

    // Вызываем колбэк при изменении даты
    const handleChange = (newValue: Dayjs | null) => {
        setValue(newValue);
        if (newValue && onWeekChange) {
            // Вычисляем начало и конец недели для новой даты
            const start = newValue.locale('ru').startOf('week');
            let end = newValue.locale('ru').endOf('week');
            const today = dayjs().locale('ru').endOf('day');
            if (end.isAfter(today)) {
                end = today;
            }
            onWeekChange(start, end);
        }
    };

    // handleChange(value);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
                value={value}
                onChange={handleChange}
                showDaysOutsideCurrentMonth
                displayWeekNumber
                slots={{ day: Day }}
                slotProps={{
                    day: (ownerState) =>
                        ({
                            selectedDay: value,
                            hoveredDay,
                            onPointerEnter: () => setHoveredDay(ownerState.day),
                            onPointerLeave: () => setHoveredDay(null),
                        }) as any,
                }}
            />
        </LocalizationProvider>
    );
}

export default WeekPicker;