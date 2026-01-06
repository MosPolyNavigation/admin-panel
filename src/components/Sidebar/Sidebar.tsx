import GlobalStyles from '@mui/joy/GlobalStyles';
import Avatar from '@mui/joy/Avatar';
import Box from '@mui/joy/Box';
import Divider from '@mui/joy/Divider';
import IconButton from '@mui/joy/IconButton';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton, {listItemButtonClasses} from '@mui/joy/ListItemButton';
import Typography from '@mui/joy/Typography';
import Sheet from '@mui/joy/Sheet';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import TableViewIcon from '@mui/icons-material/TableView';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import {useLocation, useNavigate} from "react-router";

import ColorSchemeToggle from '../ColorSchemeToggle.tsx';
import {closeSidebar} from '../../utils.ts';
import {useAuth} from "../../contexts/AuthContext.tsx";
import SidebarListItem from "./SidebarListItem.tsx";
import SidebarListItemsNested from "./SidebarListItemsNested.tsx";

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const {logout, user} = useAuth();

    const handleNavigate = (to: string) => {
        navigate(to);
        closeSidebar(); // Закрываем sidebar на мобильных
    };

    const handleLogout = () => {
        logout(); // Выходим
        navigate('/login'); // Перенаправляем на логин
    };

    const isActive = (path: string) => location.pathname === path;
    const isPartOf = (path: string) => location.pathname.startsWith(path);

    return (
        <Sheet
            className="Sidebar"
            sx={{
                position: {xs: 'fixed', md: 'sticky'},
                transform: {
                    xs: 'translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1)))',
                    md: 'none',
                },
                transition: 'transform 0.4s, width 0.4s',
                zIndex: 10000,
                height: '100dvh',
                width: 'var(--Sidebar-width)',
                top: 0,
                p: 2,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                borderRight: '1px solid',
                borderColor: 'divider',
            }}
        >
            <GlobalStyles
                styles={(theme) => ({
                    ':root': {
                        '--Sidebar-width': '220px',
                        [theme.breakpoints.up('lg')]: {
                            '--Sidebar-width': '240px',
                        },
                    },
                })}
            />
            <Box
                className="Sidebar-overlay"
                sx={{
                    position: 'fixed',
                    zIndex: 9998,
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    opacity: 'var(--SideNavigation-slideIn)',
                    backgroundColor: 'var(--joy-palette-background-backdrop)',
                    transition: 'opacity 0.4s',
                    transform: {
                        xs: 'translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1) + var(--SideNavigation-slideIn, 0) * var(--Sidebar-width, 0px)))',
                        lg: 'translateX(-100%)',
                    },
                }}
                onClick={() => closeSidebar()}
            />
            <Box sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
                <Typography level="title-lg">PolyNa</Typography>
                <ColorSchemeToggle sx={{ml: 'auto'}}/>
            </Box>
            <Box
                sx={{
                    minHeight: 0,
                    overflow: 'hidden auto',
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    [`& .${listItemButtonClasses.root}`]: {
                        gap: 1.5,
                    },
                }}
            >
                <List
                    size="sm"
                    sx={{
                        gap: 1,
                        '--List-nestedInsetStart': '30px',
                        '--ListItem-radius': (theme) => theme.vars.radius.sm,
                    }}
                >
                    <SidebarListItem icon={<HomeRoundedIcon/>} selected={isActive('/')}
                                     onClick={() => handleNavigate("/")}>
                        <Typography level="title-sm">Главная</Typography>
                    </SidebarListItem>

                    <SidebarListItem icon={<DashboardRoundedIcon/>} selected={isActive('/dashboards')}
                                     onClick={() => handleNavigate("/dashboards")}>
                        <Typography level="title-sm">Дашборды</Typography>
                    </SidebarListItem>

                    <SidebarListItemsNested defaultExpanded={isPartOf('/tables')} icon={<TableViewIcon/>}
                                            name={"Таблицы"}>
                        <ListItem sx={{mt: 0.5}}>
                            <ListItemButton>ChangePlan</ListItemButton>
                        </ListItem>
                        <ListItem>
                            <ListItemButton>Review</ListItemButton>
                        </ListItem>
                        <ListItem>
                            <ListItemButton>SelectAuditory</ListItemButton>
                        </ListItem>
                        <ListItem>
                            <ListItemButton>SiteStat</ListItemButton>
                        </ListItem>
                        <ListItem>
                            <ListItemButton>StartWay</ListItemButton>
                        </ListItem>
                        <ListItem>
                            <ListItemButton>UserId</ListItemButton>
                        </ListItem>
                    </SidebarListItemsNested>

                    <SidebarListItemsNested defaultExpanded={isPartOf('/users')} icon={<GroupRoundedIcon/>}
                                            name={"Пользователи"}>
                        <ListItem>
                            <ListItemButton selected={isActive('/users')}
                                            onClick={() => handleNavigate("/users")}>Все
                                пользователи</ListItemButton>
                        </ListItem>
                        <ListItem>
                            <ListItemButton selected={isActive('/roles')}>Права и разрешения</ListItemButton>
                        </ListItem>
                    </SidebarListItemsNested>
                    
                    <SidebarListItem 
                        icon={<AssignmentIndRoundedIcon/>} 
                        selected={isActive('/roles')}
                        onClick={() => handleNavigate("/roles")}
                    >
                        <Typography level="title-sm">Роли</Typography>
                    </SidebarListItem>
                </List>
            </Box>
            <Divider/>
            <Box sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
                <Avatar
                    variant="outlined"
                    size="sm"
                />
                <Box sx={{minWidth: 0, flex: 1, '&:hover': {cursor: 'pointer'}}}
                     onClick={() => handleNavigate('/profile')}>
                    <Typography level="title-sm">{user?.login}</Typography>
                </Box>
                <IconButton size="sm" variant="plain" color="neutral" onClick={handleLogout}>
                    <LogoutRoundedIcon/>
                </IconButton>
            </Box>
        </Sheet>
    );
}