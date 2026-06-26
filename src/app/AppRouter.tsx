import type { ReactElement } from 'react';
import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSurveyData } from '../data/survey/SurveyDataContext';

const DataView = lazy(() => import('../pages/DataView'));
const ArchetypesView = lazy(() => import('../pages/ArchetypesView'));
const DepartmentsView = lazy(() => import('../pages/DepartmentsView'));
const GoalsView = lazy(() => import('../pages/GoalsView'));
const OrganizationView = lazy(() => import('../pages/OrganizationView'));
const PeopleOverviewView = lazy(() => import('../pages/PeopleOverviewView'));
const PeopleView = lazy(() => import('../pages/PeopleView'));
const ProjectsView = lazy(() => import('../pages/ProjectsView'));
const SeniorityView = lazy(() => import('../pages/SeniorityView'));
const SurveysView = lazy(() => import('../pages/SurveysView'));
const TeamView = lazy(() => import('../pages/TeamView'));

function RouteFallback() {
  return <div className="rounded-3xl border border-[#eaeaea] bg-white p-8 text-sm text-[#667085]">Loading page…</div>;
}

function RequireResponseData({ children }: { children: ReactElement }) {
  const { hasResponseData } = useSurveyData();
  return hasResponseData ? children : <Navigate to="/surveys" replace />;
}

export function AppRouter() {
  const { hasResponseData } = useSurveyData();

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to={hasResponseData ? '/people' : '/surveys'} replace />} />
        <Route path="/surveys" element={<SurveysView />} />
        <Route path="/archetypes" element={<ArchetypesView />} />
        <Route path="/data" element={<DataView />} />
        <Route
          path="/organization"
          element={
            <RequireResponseData>
              <OrganizationView />
            </RequireResponseData>
          }
        />
        <Route
          path="/teams"
          element={
            <RequireResponseData>
              <TeamView />
            </RequireResponseData>
          }
        />
        <Route
          path="/people"
          element={
            <RequireResponseData>
              <PeopleView />
            </RequireResponseData>
          }
        />
        <Route
          path="/projects"
          element={
            <RequireResponseData>
              <ProjectsView />
            </RequireResponseData>
          }
        />
        <Route
          path="/departments"
          element={
            <RequireResponseData>
              <DepartmentsView />
            </RequireResponseData>
          }
        />
        <Route
          path="/seniority"
          element={
            <RequireResponseData>
              <SeniorityView />
            </RequireResponseData>
          }
        />
        <Route
          path="/overview/people"
          element={
            <RequireResponseData>
              <PeopleOverviewView />
            </RequireResponseData>
          }
        />
        <Route path="/goals" element={<GoalsView />} />
      </Routes>
    </Suspense>
  );
}
