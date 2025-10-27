import {Navigate, Outlet} from "react-router";
import { Box } from '@mui/joy';
import Sidebar from './Sidebar/Sidebar.tsx';
import Header from './Header';
import {useAuth} from "../contexts/AuthContext.tsx";

function Layout() {
    const {isAuthenticated} = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace></Navigate>
    return (
        <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
            <Sidebar />
            <Header />
            <Box
                component="main"
                className="MainContent"
                sx={{
                    pt: { xs: 'calc(12px + var(--Header-height))', md: 3 },
                    pb: { xs: 2, sm: 2, md: 3 },
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                    height: '100dvh',
                    gap: 1,
                    overflow: 'auto',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
}

export default Layout;