import * as React from 'react';
import { Stack, Box, Typography } from '@mui/joy';
import AutoBreadcrumbs from "./AutoBreadcrumbs.tsx";

export default function Page({children, headerText}: {children: React.ReactNode, headerText: string}) {
    return (
        <Box sx={{ flex: 1, width: '100%' }}>
            <Box
                sx={{
                    position: 'sticky',
                    top: { sm: -100, md: -110 },
                    bgcolor: 'background.body',
                    zIndex: 9995,
                }}
            >
                <Box sx={{ px: { xs: 2, md: 6 } }}>
                    <AutoBreadcrumbs />
                    <Typography level="h2" component="h1" sx={{ mt: 1, mb: 2 }}>
                        {headerText}
                    </Typography>
                </Box>
            </Box>
            <Stack
                spacing={4}
                sx={{
                    display: 'flex',
                    maxWidth: '1200px',
                    mx: 'auto',
                    px: { xs: 2, md: 6 },
                    py: { xs: 2, md: 3 },
                }}
            >
                {children}
            </Stack>
        </Box>
    )
}