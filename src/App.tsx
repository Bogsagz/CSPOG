import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./pages/AppLayout";
import Auth from "./pages/Auth";
import ChangePassword from "./pages/ChangePassword";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import NewProject from "./pages/NewProject";
import ManageAbsences from "./pages/ManageAbsences";
import MyTasks from "./pages/MyTasks";
import MyDetails from "./pages/MyDetails";
import ManageProjects from "./pages/ManageProjects";
import ManageTeam from "./pages/ManageTeam";
import ManageWorkstream from "./pages/ManageWorkstream";
import ManageWorkstreamProjects from "./pages/ManageWorkstreamProjects";
import ManageWorkstreams from "./pages/ManageWorkstreams";
import WorkstreamOverview from "./pages/WorkstreamOverview";
import CreateUser from "./pages/CreateUser";
import AppSettings from "./pages/AppSettings";
import BulkUploads from "./pages/BulkUploads";
import BulkAbsences from "./pages/BulkAbsences";
import BackupRestore from "./pages/BackupRestore";
import CrossCharging from "./pages/CrossCharging";
import Deliverables from "./pages/Deliverables";
import ProjectsPeople from "./pages/ProjectsPeople";
import DayRates from "./pages/DayRates";
import SystemRoles from "./pages/SystemRoles";
import ThemeSettings from "./pages/ThemeSettings";
import ProjectLayout from "./pages/project/Layout";
import ProjectHome from "./pages/project/ProjectHome";
import ThreatTooling from "./pages/project/ThreatTooling";
import TeamManagement from "./pages/project/TeamManagement";
import RiskAppetite from "./pages/project/RiskAppetite";
import GovAssure from "./pages/project/GovAssure";
import SecurityObligations from "./pages/project/SecurityObligations";
import ThirdPartyAssessments from "./pages/project/ThirdPartyAssessments";
import IPAssessment from "./pages/project/IPAssessment";
import ThreatModel from "./pages/project/ThreatModel";
import DPIA from "./pages/project/DPIA";
import RiskRegister from "./pages/project/RiskRegister";
import DataSharingAgreements from "./pages/project/DataSharingAgreements";
import SecurityRequirements from "./pages/project/SecurityRequirements";
import SecurityGovernance from "./pages/project/SecurityGovernance";
import ContinualAssurance from "./pages/project/ContinualAssurance";
import RiskBuilder from "./pages/project/RiskBuilder";
import SecurityControls from "./pages/project/SecurityControls";
import MonitoringRequirements from "./pages/project/MonitoringRequirements";
import TestingEvaluation from "./pages/project/TestingEvaluation";
import ComplianceGSD from "./pages/project/ComplianceGSD";
import IssueRegister from "./pages/project/IssueRegister";
import AssetTools from "./pages/project/AssetTools";
import IssueTools from "./pages/project/IssueTools";
import ControlTools from "./pages/project/ControlTools";
import RequirementsTools from "./pages/project/RequirementsTools";
import ObligationsTools from "./pages/project/ObligationsTools";
import RiskTuner from "./pages/project/RiskTuner";
import RiskRemediator from "./pages/project/RiskRemediator";
import RiskTooling from "./pages/project/RiskTooling";
import ProjectFoundations from "./pages/project/ProjectFoundations";
import CAFEvidenceAssessment from "./pages/project/CAFEvidenceAssessment";
import SecurityOwnership from "./pages/project/SecurityOwnership";
import BusinessImpactAssessment from "./pages/project/BusinessImpactAssessment";
import DeeperThreatModel from "./pages/project/DeeperThreatModel";
import MonitoringTools from "./pages/project/MonitoringTools";
import RiskProfileAcceptance from "./pages/project/RiskProfileAcceptance";
import Updates from "./pages/Updates";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/my-tasks" element={<MyTasks />} />
            <Route path="/my-details" element={<MyDetails />} />
            <Route path="/theme-settings" element={<ThemeSettings />} />
            <Route path="/new-project" element={<NewProject />} />
            <Route path="/manage-absences" element={<ManageAbsences />} />
            <Route path="/manage-projects" element={<ManageProjects />} />
            <Route path="/manage-team" element={<ManageTeam />} />
            <Route path="/create-user" element={<CreateUser />} />
            <Route path="/app-settings" element={<AppSettings />} />
            <Route path="/bulk-uploads" element={<BulkUploads />} />
            <Route path="/bulk-absences" element={<BulkAbsences />} />
            <Route path="/backup-restore" element={<BackupRestore />} />
            <Route path="/cross-charging" element={<CrossCharging />} />
            <Route path="/deliverables" element={<Deliverables />} />
            <Route path="/projects-people" element={<ProjectsPeople />} />
            <Route path="/day-rates" element={<DayRates />} />
            <Route path="/system-roles" element={<SystemRoles />} />
            <Route path="/manage-workstreams" element={<ManageWorkstreams />} />
            {/* Dynamic workstream routes */}
            <Route path="/manage/:workstream/overview" element={<WorkstreamOverview />} />
            <Route path="/manage/:workstream" element={<ManageWorkstream />} />
            <Route path="/manage/:workstream/projects" element={<ManageWorkstreamProjects />} />
          </Route>
          <Route path="/project/:projectId" element={<ProjectLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<ProjectHome />} />
            <Route path="risk-appetite" element={<RiskAppetite />} />
            <Route path="gov-assure" element={<GovAssure />} />
            <Route path="security-obligations" element={<SecurityObligations />} />
            <Route path="third-party-assessments" element={<ThirdPartyAssessments />} />
            <Route path="ip-assessment" element={<IPAssessment />} />
            <Route path="threat-model" element={<ThreatModel />} />
            <Route path="dpia" element={<DPIA />} />
            <Route path="risk-register" element={<RiskRegister />} />
            <Route path="data-sharing-agreements" element={<DataSharingAgreements />} />
            <Route path="security-requirements" element={<SecurityRequirements />} />
            <Route path="security-governance" element={<SecurityGovernance />} />
            <Route path="continual-assurance" element={<ContinualAssurance />} />
            <Route path="threat-tooling" element={<ThreatTooling />} />
            <Route path="risk-builder" element={<RiskBuilder />} />
            <Route path="team" element={<TeamManagement />} />
            <Route path="security-controls" element={<SecurityControls />} />
            <Route path="monitoring-requirements" element={<MonitoringRequirements />} />
            <Route path="testing-evaluation" element={<TestingEvaluation />} />
            <Route path="compliance-gsd" element={<ComplianceGSD />} />
            <Route path="issue-register" element={<IssueRegister />} />
            <Route path="asset-tools" element={<AssetTools />} />
            <Route path="control-tools" element={<ControlTools />} />
            <Route path="issue-tools" element={<IssueTools />} />
          <Route path="requirements-tools" element={<RequirementsTools />} />
          <Route path="obligations-tools" element={<ObligationsTools />} />
            <Route path="risk-tooling" element={<RiskTooling />} />
            <Route path="project-foundations" element={<ProjectFoundations />} />
            <Route path="caf-evidence-assessment" element={<CAFEvidenceAssessment />} />
            <Route path="security-ownership" element={<SecurityOwnership />} />
            <Route path="business-impact-assessment" element={<BusinessImpactAssessment />} />
            <Route path="deeper-threat-model" element={<DeeperThreatModel />} />
            <Route path="monitoring-tools" element={<MonitoringTools />} />
            <Route path="risk-profile-acceptance" element={<RiskProfileAcceptance />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
