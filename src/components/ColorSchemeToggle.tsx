import * as React from 'react';
import { useColorScheme as useJoyColorScheme } from '@mui/joy/styles';
import { useColorScheme as useMaterialColorScheme } from '@mui/material/styles';
import IconButton, { type IconButtonProps } from '@mui/joy/IconButton';

import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeIcon from '@mui/icons-material/LightMode';

export default function ColorSchemeToggle(props: IconButtonProps) {
    const { onClick, sx, ...other } = props;
    const { setMode: setJoyMode } = useJoyColorScheme();
    const { mode, setMode: setMaterialMode } = useMaterialColorScheme();
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted) {
        return (
            <IconButton
                size="sm"
                variant="outlined"
                color="neutral"
                {...other}
                sx={sx}
                disabled
            />
        );
    }
    return (
        <IconButton
            data-screenshot="toggle-mode"
            size="sm"
            variant="outlined"
            color="neutral"
            {...props}
            onClick={(event) => {
                setMaterialMode(mode === 'dark' ? 'light' : 'dark');
                setJoyMode(mode === 'dark' ? 'light' : 'dark');
                onClick?.(event);
            }}
            sx={[
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            {mode === 'dark' ? <DarkModeRoundedIcon /> : <LightModeIcon />}
        </IconButton>
    );
}