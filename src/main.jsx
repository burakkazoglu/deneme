import React from 'react';
import { createRoot } from 'react-dom/client';
import PerformancePage from './pages/PerformancePage.jsx';
import { BarChartPanel, DoneLine, StatusPie } from './pages/ReportsDashboardCharts.jsx';
import InfluencersPlatformSelect from './pages/InfluencersPlatformSelect.jsx';
import LoginPage from './pages/LoginPage.jsx';

const mountRoot = (id, element) => {
  const node = document.getElementById(id);
  if (!node) return;
  createRoot(node).render(element);
};

const performanceData = window.__PERFORMANCE_DATA__;
if (performanceData) {
  mountRoot('performanceApp', <PerformancePage {...performanceData} />);
}

const reportsData = window.__REPORTS_DASHBOARD_DATA__;
if (reportsData) {
  const {
    statusDistribution = [],
    last14Days = [],
    platformWorkload = [],
    influencerCounts = []
  } = reportsData;
  mountRoot('statusPie', <StatusPie data={statusDistribution} />);
  mountRoot('doneLine', <DoneLine data={last14Days} />);
  mountRoot(
    'platformBar',
    <BarChartPanel data={platformWorkload} dataKey="platform" color="#22c55e" />
  );
  mountRoot(
    'influencerBar',
    <BarChartPanel data={influencerCounts} dataKey="influencer" color="#f59e0b" />
  );
}

const platformSelectNode = document.getElementById('platformSelect');
if (platformSelectNode) {
  createRoot(platformSelectNode).render(<InfluencersPlatformSelect />);
}

const loginData = window.__LOGIN_DATA__;
if (loginData) {
  mountRoot('loginApp', <LoginPage {...loginData} />);
}
