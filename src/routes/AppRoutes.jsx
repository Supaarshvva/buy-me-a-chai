import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import CreateProfile from '../pages/CreateProfile.jsx'
import Landing from '../pages/Landing.jsx'
import Login from '../pages/Login.jsx'
import Signup from '../pages/Signup.jsx'
import Account from '../pages/dashboard/Account.jsx'
import DashboardHome from '../pages/dashboard/DashboardHome.jsx'
import Explore from '../pages/dashboard/Explore.jsx'
import Posts from '../pages/dashboard/Posts.jsx'
import Supporters from '../pages/dashboard/Supporters.jsx'
import CreatorPublicPage from '../pages/public/CreatorPublicPage.jsx'
import PostDetailPage from '../pages/public/PostDetailPage.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/create-profile"
        element={
          <ProtectedRoute requireNoProfile>
            <CreateProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="supporters" element={<Supporters />} />
        <Route path="posts" element={<Posts />} />
        <Route path="explore" element={<Explore />} />
        <Route path="account" element={<Account />} />
      </Route>
      {/* /account -> alias for /dashboard/account */}
      <Route path="/account" element={<Navigate to="/dashboard/account" replace />} />
      <Route path="/:username/post/:postId" element={<PostDetailPage />} />
      <Route path="/:username/posts" element={<CreatorPublicPage showAllPosts />} />
      <Route path="/:username" element={<CreatorPublicPage />} />
    </Routes>
  )
}

export default AppRoutes
