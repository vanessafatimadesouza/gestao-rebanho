import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })))
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })))
const FarmSetup = lazy(() => import('./pages/FarmSetup').then(module => ({ default: module.FarmSetup })))
const FarmSelection = lazy(() => import('./pages/FarmSelection').then(module => ({ default: module.FarmSelection })))
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })))
const Calendar = lazy(() => import('./pages/Calendar').then(module => ({ default: module.Calendar })))
const Animals = lazy(() => import('./pages/Animals').then(module => ({ default: module.Animals })))
const AnimalForm = lazy(() => import('./pages/AnimalForm').then(module => ({ default: module.AnimalForm })))
const AnimalDetail = lazy(() => import('./pages/AnimalDetail').then(module => ({ default: module.AnimalDetail })))
const VaccinationsList = lazy(() => import('./pages/Vaccinations').then(module => ({ default: module.VaccinationsList })))
const VaccinationForm = lazy(() => import('./pages/Vaccinations').then(module => ({ default: module.VaccinationForm })))
const BirthsList = lazy(() => import('./pages/Births').then(module => ({ default: module.BirthsList })))
const BirthForm = lazy(() => import('./pages/Births').then(module => ({ default: module.BirthForm })))
const EventForm = lazy(() => import('./pages/EventForm').then(module => ({ default: module.EventForm })))
const ReproductionForm = lazy(() => import('./pages/ReproductionForm').then(module => ({ default: module.ReproductionForm })))

const loadingView = <div role="status" className="flex min-h-dvh items-center justify-center bg-brand-50 px-4 text-sm font-semibold text-brand-800">Carregando Manejo...</div>

function AppRoutes() {
  const { session, farm, loading } = useAuth()

  if (loading) return loadingView

  return (
    <Suspense fallback={loadingView}>
    <Routes>
      <Route path="/redefinir-senha" element={<ResetPassword />} />
      {session && !farm ? (
        <>
          <Route path="/fazendas" element={<FarmSelection />} />
          <Route path="/fazendas/nova" element={<FarmSetup />} />
          <Route path="*" element={<Navigate to="/fazendas" replace />} />
        </>
      ) : <>
      <Route path="/login" element={<Login />} />
      <Route path="/fazendas" element={<ProtectedRoute><FarmSelection /></ProtectedRoute>} />
      <Route path="/fazendas/nova" element={<ProtectedRoute><FarmSetup /></ProtectedRoute>} />
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
        path="/calendario"
        element={
          <ProtectedRoute>
            <Layout>
              <Calendar />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vacinas/:id/editar"
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
      </>}
    </Routes>
    </Suspense>
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
