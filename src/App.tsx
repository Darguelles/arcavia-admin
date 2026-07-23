import { Routes, Route, Navigate } from 'react-router-dom'
import { RequireAdmin } from './auth/RequireAdmin'
import { Layout } from './components/Layout'
import { LoginPage } from './features/auth/LoginPage'
import { ForcedResetPage } from './features/auth/ForcedResetPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { CitiesPage } from './features/cities/CitiesPage'
import { CityForm } from './features/cities/CityForm'
import { CampaignsPage } from './features/campaigns/CampaignsPage'
import { CampaignForm } from './features/campaigns/CampaignForm'
import { MissionsPage } from './features/missions/MissionsPage'
import { MissionEditor } from './features/missions/MissionEditor'
import { WaypointEditor } from './features/missions/WaypointEditor'
import { ReviewQueuePage } from './features/reviewQueue/ReviewQueuePage'
import { UsersPage } from './features/users/UsersPage'
import { UserDetail } from './features/users/UserDetail'
import { SettingsPage } from './features/settings/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin/reset-password" element={<ForcedResetPage />} />

      <Route element={<RequireAdmin />}>
        <Route
          path="/admin/*"
          element={
            <Layout>
              <Routes>
                <Route index element={<DashboardPage />} />
                <Route path="cities" element={<CitiesPage />} />
                <Route path="cities/new" element={<CityForm />} />
                <Route path="cities/:id/edit" element={<CityForm />} />
                <Route path="campaigns" element={<CampaignsPage />} />
                <Route path="campaigns/new" element={<CampaignForm />} />
                <Route path="campaigns/:id/edit" element={<CampaignForm />} />
                <Route path="missions" element={<MissionsPage />} />
                <Route path="missions/new" element={<MissionEditor />} />
                <Route path="missions/:missionId/waypoints/new" element={<WaypointEditor />} />
                <Route
                  path="missions/:missionId/waypoints/:waypointId"
                  element={<WaypointEditor />}
                />
                <Route path="missions/:id" element={<MissionEditor />} />
                <Route path="review-queue" element={<ReviewQueuePage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="users/:id" element={<UserDetail />} />
                <Route path="settings" element={<SettingsPage />} />
              </Routes>
            </Layout>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
