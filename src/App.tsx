import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { FarmSetup } from './pages/FarmSetup'
import { Dashboard } from './pages/Dashboard'
import { Animals } from './pages/Animals'
import { AnimalForm } from './pages/AnimalForm'
import { AnimalDetail } from './pages/AnimalDetail'
import { VaccinationsList, VaccinationForm } from './pages/Vaccinations'
import { BirthsList, BirthForm } from './pages/Births'
import { EventForm } from './pages/EventForm'
import { ReproductionForm } from './pages/ReproductionForm'

function AppRoutes() {
  const { session, farm, loading } = useAuth()

  if (loading) return null

  // Authenticated but no farm yet
  if (session && !farm) {
    return (
      <Routes>
        <Route path="*" element={<FarmSetup />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/animais"
        element={
          <ProtectedRoute>
            <Layout>
              <Animals />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/animais/novo"
        element={
          <ProtectedRoute>
            <Layout>
              <AnimalForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/animais/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <AnimalDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/animais/:id/editar"
        element={
          <ProtectedRoute>
            <Layout>
              <AnimalForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vacinas"
        element={
          <ProtectedRoute>
            <Layout>
              <VaccinationsList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vacinas/nova"
        element={
          <ProtectedRoute>
            <Layout>
              <VaccinationForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/partos"
        element={
          <ProtectedRoute>
            <Layout>
              <BirthsList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/partos/novo"
        element={
          <ProtectedRoute>
            <Layout>
              <BirthForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/eventos/novo"
        element={
          <ProtectedRoute>
            <Layout>
              <EventForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reproducao/nova"
        element={
          <ProtectedRoute>
            <Layout>
              <ReproductionForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
