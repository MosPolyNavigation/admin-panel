import { type SxProps } from "@mui/joy/styles/types";
import { tc,theme } from './theme'



export const DateIntervalType = {
  Today: 'Today',
  Yesterday: 'Yesterday',
  Week: 'Week',
  Month: 'Month',
  Quarter: 'Quarter',
  Year: 'Year',
  AllTime: 'AllTime',
  Custom: 'Custom',
} as const; 
export type DateIntervalType = typeof DateIntervalType[keyof typeof DateIntervalType];


export const months = [
  ['Январь', 'Янв'],
  ['Февраль', 'Фев'],
  ['Март', 'Мар'],
  ['Апрель', 'Апр'],
  ['Май', 'Мая'],
  ['Июнь', 'Июня'],
  ['Июль', 'Июля'],
  ['Август', 'Авг'],
  ['Сентябрь', 'Сен'],
  ['Октябрь', 'Окт'],
  ['Ноябрь', 'Ноя'],
  ['Декабрь', 'Дек'],
]

export const weekDays = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ']

export type DateInterval = {
  /** Тип диапазона */
  type: DateIntervalType; 
  /** Начальная дата */
  startDate: string;
  /** Конечная дата */
  endDate: string;
  /** Флаг, что значение установлено */
  isSetted?: boolean;
};


export const datePickerRangeStylesLocal: SxProps = {
  '*': {
    fontFamily: theme.fontFamily.body,
  },
  '.rmdp-day': {
    color: tc.text.primary,
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: 1.66,
    letterSpacing: '0.03333em',
  },
  '.rmdp-today span': {
    color: tc.text.primary,
    backgroundColor: 'transparent',
  },
  '.rmdp-range': {
    backgroundColor: tc.primary[300],
    color: tc.primary[50],
    boxShadow: 'none',
  },
  '.rmdp-range-hover': {
    backgroundColor: tc.primary[100],
    boxShadow: 'none',
  },
  '.start, .end': {
    backgroundColor: tc.primary[400],
    fontWeight: 500,
    color: tc.common.white,
    '& span': {
      backgroundColor: tc.primary[300],
    },
  },
  '.rmdp-today': {
    fontWeight: 500,
    // borderRadius: '50%',
    backgroundColor: tc.primary[600],
    '& span': {
      backgroundColor: tc.primary[300],
      color: tc.common.white,
    },
    '&:not(.rmdp-range)': {
      borderRadius: '50%',
      '& span': {
        backgroundColor: tc.primary[50],
        color: tc.primary[800],
      },
    },
  },
  // '.rmdp-range span': {
  //   color: (theme) => theme.palette.text.primary + ' !important',

  //   border: 'none !important'
  // },
  // '.rmdp-week-day': {
  //   fontSize: '0.75rem',
  //   fontWeight: 400,
  //   color: (theme) => theme.palette.text.secondary
  // },
  // '.rmdp-selected span': {
  //   backgroundColor: (theme) => theme.palette.primary.main + ' !important'
  // },
  // '.rmdp-arrow-container:hover': {
  //   backgroundColor: 'transparent',
  //   boxShadow: 'none'
  // },
  // '.rmdp-header-values': {
  //   color: (theme) => theme.palette.text.primary,
  //   fontWeight: 500
  // },
  // '.rmdp-arrow': {
  //   border: (theme) => 'solid ' + theme.palette.primary.dark + ' !important',
  //   borderWidth: '0 2px 2px 0 !important',
  //   width: '10px',
  //   height: '10px',
  //   ml: '5px'
  // },
  // '.rmdp-selected': {
  //   backgroundColor: (theme) => theme.palette.action.active,
  //   borderRadius: '50%',
  //   '& > span': {
  //     backgroundColor: 'transparent !important'
  //   }
  // },

  '.rmdp-disabled span': {
    color: tc.text.secondary,
    opacity: 0.5,
  },
  '.rmdp-deactive span': {
    color: tc.text.secondary,
  },
  // '& .MuiOutlinedInput-notchedOutline': {
  //   fontSize: '12px'
  // }
}
