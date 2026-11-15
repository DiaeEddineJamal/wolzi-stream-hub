import './lib/install'; // capture the install prompt before React mounts
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import LaunchSplash from './components/layout/LaunchSplash'
import './index.css'
import { initAnalytics } from './utils/analytics'

initAnalytics()

createRoot(document.getElementById("root")!).render(<LaunchSplash><App /></LaunchSplash>);
