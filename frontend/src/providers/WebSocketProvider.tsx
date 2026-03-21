import {
  createContext, useContext, useEffect, useRef,
  useState, ReactNode, useCallback
} from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppStore } from '@/store/useAppStore'
import { AnalysisCompleteEvent, RiskAlertEvent, KPIUpdateEvent } from '@/types/websocket'
import toast from 'react-hot-toast'

interface WebSocketContextValue {
  socket: Socket | null
  isConnected: boolean
  simulateEvent: <T>(eventName: string, data: T) => void
}

const WebSocketContext = createContext<WebSocketContextValue>({
  socket: null,
  isConnected: false,
  simulateEvent: () => {},
})

interface WebSocketProviderProps {
  children: ReactNode
  serverUrl?: string
}

export function WebSocketProvider({
  children,
  serverUrl = 'http://localhost:8000',
}: WebSocketProviderProps) {

  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const { setConnectionStatus, addNotification } = useAppStore()

  // ── The core handler logic, extracted so both real events AND
  // simulated events run through exactly the same code path.
  // This is the key architectural fix — previously simulateEvent
  // tried to re-emit through the socket (which goes to the server,
  // not back to our listeners). Now it directly invokes the handler.
  const handleAnalysisComplete = useCallback((data: AnalysisCompleteEvent) => {
  console.log('[WebSocket] Analysis complete:', data)

  // Read the current notification preferences directly from the store.
  // We use getState() here instead of the hook because this callback
  // runs outside of React's render cycle — hooks can only be called
  // inside component functions or other hooks, never inside callbacks.
  // getState() gives us synchronous access to the current store values.
  const { notificationPrefs, addLiveActivityEntry } = useAppStore.getState()

  // Check whether this risk level is enabled before doing anything.
  // This is the wire that connects the settings toggle to actual behavior.
  const isEnabled =
    data.risk_level === 'high'   ? notificationPrefs.highRisk   :
    data.risk_level === 'medium' ? notificationPrefs.mediumRisk :
                                   notificationPrefs.lowRisk

  // Always add to the activity feed regardless of notification prefs —
  // the feed is a record of what happened, not an interruption.
  // Only the toast and banner alerts respect the user's preferences.
  addLiveActivityEntry({
    id:         crypto.randomUUID(),
    filename:   data.filename,
    riskType:   data.risk_type,
    confidence: data.confidence,
    riskLevel:  data.risk_level,
    timestamp:  new Date(),
    isLive:     true,
  })

  // Only add to the notification store (which drives the bell badge
  // and the LiveUpdateBanner) if the user has this level enabled
  if (isEnabled) {
    addNotification({
      message:  `Analysis complete: ${data.filename}`,
      type:     data.risk_level === 'high'   ? 'danger'
              : data.risk_level === 'medium' ? 'warning'
              : 'success',
      region:   data.region,
      riskType: data.risk_type,
    })

    // Only show toast if enabled AND it's medium or high risk
    // (low risk toasts would be too noisy even when low risk is enabled)
    if (data.risk_level !== 'low') {
      toast(`${data.risk_type} detected — ${data.risk_level} risk`, {
        icon: data.risk_level === 'high' ? '🔴' : '🟡',
        duration: 5000,
      })
    }
  }
}, [addNotification])
  const handleRiskAlert = useCallback((data: RiskAlertEvent) => {
    console.log('[WebSocket] Risk alert:', data)
    addNotification({
      message: data.message,
      type: 'danger',
      region: data.region,
    })
  }, [addNotification])

  const handleKPIUpdate = useCallback((_data: KPIUpdateEvent) => {
    console.log('[WebSocket] KPI update received')
  }, [])

  // ── simulateEvent: directly invokes the correct handler function
  // based on the event name. No socket involved — this is purely local.
  // Think of it like calling a function directly instead of sending
  // a message to a server and waiting for it to echo back.
  const simulateEvent = useCallback(<T,>(eventName: string, data: T) => {
    console.log('[WebSocket] Simulating event:', eventName, data)

    if (eventName === 'analysis_complete') {
      handleAnalysisComplete(data as unknown as AnalysisCompleteEvent)
    } else if (eventName === 'risk_alert') {
      handleRiskAlert(data as unknown as RiskAlertEvent)
    } else if (eventName === 'kpi_update') {
      handleKPIUpdate(data as unknown as KPIUpdateEvent)
    }
  }, [handleAnalysisComplete, handleRiskAlert, handleKPIUpdate])

  useEffect(() => {
    const socket = io(serverUrl, {
      path: '/socket.io', 
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 5000,
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[WebSocket] Connected:', socket.id)
      setIsConnected(true)
      setConnectionStatus('connected')
    })

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason)
      setIsConnected(false)
      setConnectionStatus('disconnected')
    })

    socket.on('connect_error', () => {
      setConnectionStatus('reconnecting')
    })

    // Wire the real socket events to the same handler functions
    // that simulateEvent uses — guaranteeing identical behavior
    // whether the event comes from the server or from the simulate button.
    socket.on('analysis_complete', handleAnalysisComplete)
    socket.on('risk_alert', handleRiskAlert)
    socket.on('kpi_update', handleKPIUpdate)

    return () => {
      console.log('[WebSocket] Cleaning up connection')
      socket.disconnect()
      socketRef.current = null
    }
  }, [serverUrl, setConnectionStatus, handleAnalysisComplete, handleRiskAlert, handleKPIUpdate])

  return (
    <WebSocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      simulateEvent
    }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(WebSocketContext)
}