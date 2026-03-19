import { CssVarsProvider as JoyCssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import { BrowserRouter, Routes, Route } from 'react-router';

import SignIn from './pages/SignIn.tsx';
import Layout from './components/Layout.tsx';
import Home from './pages/Home.tsx';
import Profile from './pages/Profile.tsx';
import Users from './pages/Users.tsx';
import UserEditPage from './pages/UserEditPage.tsx';
import UserViewPage from './pages/UserViewPage.tsx';
import UserCreatePage from './pages/UserCreatePage.tsx';
import Role from './pages/Role.tsx';
import RoleCreatePage from './pages/RoleCreatePage.tsx';
import RoleViewPage from './pages/RoleViewPage.tsx';
import RoleEditPage from './pages/RoleEditPage.tsx';
import ReviewsPage from './pages/ReviewsPage.tsx';
import ReviewPage from './pages/ReviewPage.tsx';
import { AuthProvider } from './contexts/AuthProvider.tsx';
import Dashboard from './pages/Dashboard.tsx';
import BannedUsersPage from './pages/BannedUsersPage.tsx';
import BannedUserDetails from './pages/BannedUserDetails.tsx';
import { BASE_PATH } from './config.ts';

export default function App() {
  return (
    <JoyCssVarsProvider disableTransitionOnChange defaultMode={'dark'}>
      <CssBaseline />
      <BrowserRouter basename={BASE_PATH}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<SignIn />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="dashboards" element={<Dashboard />} />
              <Route path="users">
                <Route index element={<Users />} />
                <Route path="create" element={<UserCreatePage />} />
                <Route path=":id" element={<UserViewPage />} />
                <Route path=":id/edit" element={<UserEditPage />} />
              </Route>
              <Route path="profile" element={<Profile />} />
              <Route path="roles">
                <Route index element={<Role />} />
                <Route path="create" element={<RoleCreatePage />} />
                <Route path=":id" element={<RoleViewPage />} />
                <Route path=":id/edit" element={<RoleEditPage />} />
              </Route>
              <Route path="reviews">
                <Route index element={<ReviewsPage />} />
                <Route path=":id" element={<ReviewPage />} />
              </Route>
              <Route path="bans">
                <Route index element={<BannedUsersPage />} />
                <Route path=":user_id" element={<BannedUserDetails />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </JoyCssVarsProvider>
  );
}
