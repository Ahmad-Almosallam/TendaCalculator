import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntApp, ConfigProvider, theme as antdTheme } from 'antd'
import './index.css'
import App from './App.tsx'

const BODY_FONT =
  "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

// "Padel Club" theme — deep court green, volt-lime accent, warm clay paper.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#0e5c4a',
          colorInfo: '#0e5c4a',
          colorLink: '#0e5c4a',
          colorSuccess: '#3f8f2e',
          colorWarning: '#c4761b',
          colorError: '#c0392b',
          colorTextBase: '#16201c',
          colorBgLayout: '#f1ece1',
          colorBgContainer: '#fcf9f2',
          colorBorder: '#ddd3c2',
          colorBorderSecondary: '#e7dfd1',
          borderRadius: 12,
          fontFamily: BODY_FONT,
          fontSize: 15,
          controlHeight: 38,
          wireframe: false,
        },
        components: {
          Steps: { fontFamily: BODY_FONT },
          Statistic: { fontFamily: "'Space Mono', ui-monospace, monospace" },
          Card: { colorBgContainer: '#fcf9f2' },
          Button: { fontWeight: 600, primaryShadow: '0 6px 16px rgba(14,92,74,0.22)' },
        },
      }}
    >
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
)
