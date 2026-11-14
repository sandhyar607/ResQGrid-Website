import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './ResQGridAdminReports.jsx';
import { GovernmentAuthGate } from './auth.jsx';
createRoot(document.getElementById('root')).render(<GovernmentAuthGate><App /></GovernmentAuthGate>);
