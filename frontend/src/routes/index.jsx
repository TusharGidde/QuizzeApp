import Home from '../pages/Home'
import Login from '../componants/Auth/login'
import Register from '../componants/Auth/register'
import { Dashboard } from '../componants/common/Dashboard'
import QuizzesPage from '../pages/QuizzesPage'
import LeaderBoard from '../pages/LeaderBoard'
import ProtectedRoute from './ProtectedRoute'
import DashboardLayout from '../componants/common/DashboardLayout'
import CreateQuiz from '../componants/Admin/CreateQuiz'
import QuizPlay from '../componants/common/quizze/QuizPlay'
import QuizResult from '../componants/common/quizze/QuizResult' // new
import NotFound from '../pages/NotFound' // optional 404 page
import AllQuizzes from '../componants/Admin/AllQuizzes'
import Profile from '../pages/Profile'
import QuizHistory from '../pages/QuizHistory'
import QuizLeaderboard from '../componants/Admin/QuizLeaderboard'

export const routes = [
  {
    path: '/',
    element: <Home />,
    public: true,
  },
  {
    path: '/login',
    element: <Login />,
    public: true,
  },
  {
    path: '/register',
    element: <Register />,
    public: true,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['user', 'admin']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'create',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <CreateQuiz />
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/AllQuizzes',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AllQuizzes />
          </ProtectedRoute>
        ),
      },
      {
        path: "/dashboard/profile",
        element: (
          <ProtectedRoute allowedRoles={['user', 'admin']}>
            <Profile />
          </ProtectedRoute>
        )
      },
      {
        path: "/dashboard/history",
        element: (
          <ProtectedRoute allowedRoles={['user', 'admin']}>
            <QuizHistory />
          </ProtectedRoute>
        )
      },
      {
        path: "/dashboard/quizzes",
        element: (
          <ProtectedRoute allowedRoles={['user', 'admin']}>
            <QuizzesPage />
          </ProtectedRoute>
        )
      },
      {
        path: "/dashboard/performance",
        element: (
          <ProtectedRoute allowedRoles={['user', 'admin']}>
            <QuizzesPage />
          </ProtectedRoute>
        )
      },
      {
        path: "/dashboard/performance/:quizId/leaderboard",
        element: (
          <ProtectedRoute allowedRoles={['user', 'admin']}>
            <QuizLeaderboard />
          </ProtectedRoute>
        )
      },
      
    ],
  },
  {
    path: '/quizzes',
    element: <QuizzesPage />,
    public: true,
  },
  {
    path: '/quiz/:quizId/start',
    element: (
      <ProtectedRoute allowedRoles={['user', 'admin']}>
        <QuizPlay />
      </ProtectedRoute>
    ),
  },
  {
    path: '/quiz/:quizId/result',
    element: (
      <ProtectedRoute allowedRoles={['user', 'admin']}>
        <QuizResult />
      </ProtectedRoute>
    ),
  },
  {
    path: '/leaderboard',
    element: <LeaderBoard />,
    public: true,
  },
  {
    path: '*',
    element: <NotFound />,
    public: true,
  },
]
