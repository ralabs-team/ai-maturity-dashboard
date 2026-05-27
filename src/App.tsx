import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import AppFooter from './components/layout/AppFooter';
import { NavigationPendingProvider } from './components/layout/NavigationPendingContext';
import { SensitiveDataProvider } from './components/privacy/SensitiveDataContext';
import MobileHeader from './components/layout/MobileHeader';
import WorkspaceIdentityModal from './components/layout/WorkspaceIdentityModal';
import { SidebarInset, SidebarProvider } from './components/ui/sidebar';
import IndividualView from './pages/IndividualView';
import DataView from './pages/DataView';
import DepartmentsView from './pages/DepartmentsView';
import OverviewPeopleView from './pages/OverviewPeopleView';
import ProjectsView from './pages/ProjectsView';
import SeniorityView from './pages/SeniorityView';
import SurveysView from './pages/SurveysView';
import OrganizationView from './pages/OrganizationView';
import TeamView from './pages/TeamView';
import { SurveyDataProvider, useSurveyData } from './data/survey/SurveyDataContext';
import { WorkspaceIdentityProvider } from './data/workspace/WorkspaceIdentityContext';
import { TooltipProvider } from './components/ui/tooltip';

function AppRoutes() {
  const { hasResponseData } = useSurveyData();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={hasResponseData ? '/people' : '/surveys'} replace />} />
      <Route path="/surveys" element={<SurveysView />} />
      <Route path="/data" element={<DataView />} />
      <Route
        path="/organization"
        element={hasResponseData ? <OrganizationView /> : <Navigate to="/surveys" replace />}
      />
      <Route
        path="/teams"
        element={hasResponseData ? <TeamView /> : <Navigate to="/surveys" replace />}
      />
      <Route
        path="/people"
        element={hasResponseData ? <IndividualView /> : <Navigate to="/surveys" replace />}
      />
      <Route
        path="/projects"
        element={hasResponseData ? <ProjectsView /> : <Navigate to="/surveys" replace />}
      />
      <Route
        path="/departments"
        element={hasResponseData ? <DepartmentsView /> : <Navigate to="/surveys" replace />}
      />
      <Route
        path="/seniority"
        element={hasResponseData ? <SeniorityView /> : <Navigate to="/surveys" replace />}
      />
      <Route
        path="/overview/people"
        element={hasResponseData ? <OverviewPeopleView /> : <Navigate to="/surveys" replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider delayDuration={0}>
        <SurveyDataProvider>
          <WorkspaceIdentityProvider>
            <SensitiveDataProvider>
              <SidebarProvider>
                <NavigationPendingProvider>
                  <Sidebar />
                  <SidebarInset>
                    <MobileHeader />
                    <div data-app-scroll-container className="flex-1 overflow-auto">
                      <div className="mx-auto max-w-[2000px] px-4 py-4 md:px-6 md:py-5">
                        <AppRoutes />
                      </div>
                    </div>
                    <AppFooter />
                  </SidebarInset>
                  <WorkspaceIdentityModal />
                </NavigationPendingProvider>
              </SidebarProvider>
            </SensitiveDataProvider>
          </WorkspaceIdentityProvider>
        </SurveyDataProvider>
      </TooltipProvider>
    </BrowserRouter>
  );
}
