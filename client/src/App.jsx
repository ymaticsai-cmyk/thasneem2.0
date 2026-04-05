import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Emergency from './pages/Emergency';

import PatientOverview from './pages/patient/Overview';
import PatientHistory from './pages/patient/History';
import PatientReminders from './pages/patient/Reminders';
import PatientAppointments from './pages/patient/Appointments';
import PatientAccess from './pages/patient/Access';
import PatientActivity from './pages/patient/Activity';
import PatientReports from './pages/patient/Reports';

import ReceptionOverview from './pages/reception/Overview';
import RegisterPatient from './pages/reception/RegisterPatient';
import ReceptionPatientList from './pages/reception/PatientList';
import ReceptionPatientDetail from './pages/reception/PatientDetail';
import QRManager from './pages/reception/QRManager';

import NurseOverview from './pages/nurse/Overview';
import NurseScan from './pages/nurse/Scan';
import NurseVitals from './pages/nurse/Vitals';
import NursePatientList from './pages/nurse/PatientList';

import DoctorOverview from './pages/doctor/Overview';
import DoctorScan from './pages/doctor/Scan';
import DoctorRecords from './pages/doctor/Records';
import DoctorDiagnosis from './pages/doctor/Diagnosis';
import DoctorPrescription from './pages/doctor/Prescription';
import DoctorUpload from './pages/doctor/Upload';
import DoctorBlockchain from './pages/doctor/Blockchain';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorAllPatients from './pages/doctor/AllPatients';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/emergency/:patientId" element={<Emergency />} />

          <Route
            path="/dashboard/patient"
            element={
              <ProtectedRoute roles={['patient']}>
                <DashboardLayout role="patient" />
              </ProtectedRoute>
            }
          >
            <Route index element={<PatientOverview />} />
            <Route path="history" element={<PatientHistory />} />
            <Route path="reminders" element={<PatientReminders />} />
            <Route path="appointments" element={<PatientAppointments />} />
            <Route path="access" element={<PatientAccess />} />
            <Route path="activity" element={<PatientActivity />} />
            <Route path="reports" element={<PatientReports />} />
          </Route>

          <Route
            path="/dashboard/receptionist"
            element={
              <ProtectedRoute roles={['receptionist']}>
                <DashboardLayout role="receptionist" />
              </ProtectedRoute>
            }
          >
            <Route index element={<ReceptionOverview />} />
            <Route path="register" element={<RegisterPatient />} />
            <Route path="patients" element={<ReceptionPatientList />} />
            <Route path="patients/:id" element={<ReceptionPatientDetail />} />
            <Route path="qr" element={<QRManager />} />
          </Route>

          <Route
            path="/dashboard/nurse"
            element={
              <ProtectedRoute roles={['nurse']}>
                <DashboardLayout role="nurse" />
              </ProtectedRoute>
            }
          >
            <Route index element={<NurseOverview />} />
            <Route path="scan" element={<NurseScan />} />
            <Route path="vitals" element={<NurseVitals />} />
            <Route path="patients" element={<NursePatientList />} />
          </Route>

          <Route
            path="/dashboard/doctor"
            element={
              <ProtectedRoute roles={['doctor']}>
                <DashboardLayout role="doctor" />
              </ProtectedRoute>
            }
          >
            <Route index element={<DoctorOverview />} />
            <Route path="scan" element={<DoctorScan />} />
            <Route path="records" element={<DoctorRecords />} />
            <Route path="diagnosis" element={<DoctorDiagnosis />} />
            <Route path="prescription" element={<DoctorPrescription />} />
            <Route path="upload" element={<DoctorUpload />} />
            <Route path="blockchain" element={<DoctorBlockchain />} />
            <Route path="appointments" element={<DoctorAppointments />} />
            <Route path="all-patients" element={<DoctorAllPatients />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
