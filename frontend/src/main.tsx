import React from 'react'
import ReactDOM from 'react-dom/client'
import WebApp from '@twa-dev/sdk'
import { AppRoot } from '@telegram-apps/telegram-ui'
import '@telegram-apps/telegram-ui/dist/styles.css'
import './styles/global.css'
import App from './App'

// Initialize Telegram WebApp
WebApp.ready()
WebApp.expand()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoot>
      <App />
    </AppRoot>
  </React.StrictMode>,
)
