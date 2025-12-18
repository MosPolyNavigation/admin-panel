export const theme = {
  fontFamily: {
    body: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
};

// Цветовая палитра (Token Colors)
export const tc = {
  text: {
    primary: '#1A2027',
    secondary: '#656F7D',
  },
  primary: {
    50: '#F0F7FF',
    100: '#C2E0FF',
    200: '#99CCF3',
    300: '#66B2FF',
    400: '#3399FF',
    500: '#007FFF',
    600: '#0072E5',
    700: '#0059B2',
    800: '#004C99',
    900: '#003A75',
  },
  neutral: {
    50: '#F8F9FA',
    100: '#F1F3F5',
    200: '#E1E6EB',
    300: '#CED4DA',
    400: '#ADB5BD',
    500: '#6C757D',
    600: '#495057',
    700: '#343A40',
    800: '#212529',
    900: '#1A2027',
  },
  common: {
    white: '#FFFFFF',
    black: '#1A2027',
  },
};

export type Theme = typeof theme;
export type TC = typeof tc;