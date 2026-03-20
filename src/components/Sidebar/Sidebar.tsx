import {
  GlobalStyles,
  Avatar,
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  listItemButtonClasses,
  Typography,
  Sheet,
} from '@mui/joy';
import {
  HomeRounded,
  DashboardRounded,
  TableView,
  GroupRounded,
  LogoutRounded,
  AssignmentIndRounded,
  RateReviewRounded,
  ShieldRounded,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router';
import ColorSchemeToggle from '../ColorSchemeToggle.tsx';
import { closeSidebar } from '../../utils.ts';
import { useAuth } from '../../hooks/useAuth.ts';
import SidebarListItem from './SidebarListItem.tsx';
import SidebarListItemsNested from './SidebarListItemsNested.tsx';
import { RequirePermission } from '../RequirePermission.tsx';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleNavigate = (to: string) => {
    navigate(to);
    closeSidebar();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  const isPartOf = (path: string) => location.pathname.startsWith(path);

  return (
    <Sheet
      className="Sidebar"
      sx={{
        position: { xs: 'fixed', md: 'sticky' },
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
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Typography level="title-lg">PolyNa</Typography>
        <ColorSchemeToggle sx={{ ml: 'auto' }} />
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
          <SidebarListItem
            icon={<HomeRounded />}
            selected={isActive('/')}
            onClick={() => handleNavigate('/')}
          >
            <Typography level="title-sm">Главная</Typography>
          </SidebarListItem>

          <RequirePermission goal="dashboards" right="view">
            <SidebarListItem
              icon={<DashboardRounded />}
              selected={isActive('/dashboards')}
              onClick={() => handleNavigate('/dashboards')}
            >
              <Typography level="title-sm">Дашборды</Typography>
            </SidebarListItem>
          </RequirePermission>

          <RequirePermission goal="reviews" right="view">
            <SidebarListItem
              icon={<RateReviewRounded />}
              selected={isPartOf('/reviews')}
              onClick={() => handleNavigate('/reviews')}
            >
              <Typography level="title-sm">Отзывы</Typography>
            </SidebarListItem>
          </RequirePermission>

          <RequirePermission goal="tables" right="view">
            <SidebarListItemsNested
              defaultExpanded={isPartOf('/tables')}
              icon={<TableView />}
              name={'Таблицы'}
            >
              <ListItem sx={{ mt: 0.5 }}>
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
          </RequirePermission>

          <RequirePermission goal="users" right="view">
            <SidebarListItem
              icon={<GroupRounded />}
              selected={isActive('/users')}
              onClick={() => handleNavigate('/users')}
            >
              <Typography level="title-sm">Пользователи</Typography>
            </SidebarListItem>
          </RequirePermission>

          <RequirePermission goal="roles" right="view">
            <SidebarListItem
              icon={<AssignmentIndRounded />}
              selected={isActive('/roles')}
              onClick={() => handleNavigate('/roles')}
            >
              <Typography level="title-sm">Роли</Typography>
            </SidebarListItem>
          </RequirePermission>

          <RequirePermission goal="admin" right="view">
            <SidebarListItemsNested
              defaultExpanded={isPartOf('/admin')}
              icon={<ShieldRounded />}
              name={'Администрирование'}
            >
              <ListItem>
                <ListItemButton
                  selected={isActive('/bans')}
                  onClick={() => handleNavigate('/bans')}
                >
                  Забаненные пользователи
                </ListItemButton>
              </ListItem>
            </SidebarListItemsNested>
          </RequirePermission>
        </List>
      </Box>
      <Divider />
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Avatar variant="outlined" size="sm" />
        <Box
          sx={{ minWidth: 0, flex: 1, '&:hover': { cursor: 'pointer' } }}
          onClick={() => handleNavigate('/profile')}
        >
          <Typography level="title-sm">{user?.login}</Typography>
        </Box>
        <IconButton size="sm" variant="plain" color="neutral" onClick={handleLogout}>
          <LogoutRounded />
        </IconButton>
      </Box>
    </Sheet>
  );
}
