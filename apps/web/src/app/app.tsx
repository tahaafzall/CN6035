import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { LayoutShell } from '../components/layout-shell';
import { BatchDetailPage } from '../routes/batch-detail-page';
import { CreateBatchPage } from '../routes/create-batch-page';
import { DashboardPage } from '../routes/dashboard-page';
import { HomePage } from '../routes/home-page';
import { VerifyPage } from '../routes/verify-page';

export function App() {
  return (
    <BrowserRouter>
      <LayoutShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/batches/new" element={<CreateBatchPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/batches/:identifier" element={<BatchDetailPage />} />
        </Routes>
      </LayoutShell>
    </BrowserRouter>
  );
}
