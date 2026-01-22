/**
 * useWebSocket Composable
 *
 * Manages the WebSocket connection to the server.
 * Provides reactive connection status information and message handling.
 */

import type { Ref } from 'vue'
import type { ClientMessage, ServerMessage, ServerMessageType } from '~/types/websocket'

/**
 * WebSocket connection status
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

/**
 * Event handler type
 */
type MessageHandler<T = unknown> = (payload: T) => void

/**
 * WebSocket composable options
 */
interface UseWebSocketOptions {
  /** Automatically connect on mount */
  autoConnect?: boolean
  /** Automatically reconnect on connection loss */
  autoReconnect?: boolean
  /** Maximum number of reconnect attempts */
  maxReconnectAttempts?: number
  /** Delay between reconnects in ms */
  reconnectDelay?: number
}

/**
 * WebSocket composable return type
 */
interface UseWebSocketReturn {
  /** Current connection status */
  status: Ref<ConnectionStatus>
  /** Establish connection */
  connect: () => void
  /** Disconnect */
  disconnect: () => void
  /** Send message */
  send: <T>(type: ClientMessage['type'], payload: T) => void
  /** Register event handler */
  on: <T>(type: ServerMessageType, handler: MessageHandler<T>) => () => void
  /** One-time event handler */
  once: <T>(type: ServerMessageType, handler: MessageHandler<T>) => void
}

/**
 * useWebSocket Composable
 *
 * @param options - Configuration options
 * @returns WebSocket management functions
 *
 * @example
 * ```ts
 * const { status, connect, send, on } = useWebSocket()
 *
 * on('session:updated', (payload) => {
 *   console.log('Session updated:', payload)
 * })
 *
 * send('session:create', { sessionName: 'Sprint 1', participantName: 'Max' })
 * ```
 */

// Global singleton state for WebSocket - persists across page navigations
let globalWs: WebSocket | null = null
let globalReconnectAttempts = 0
let globalReconnectTimer: ReturnType<typeof setTimeout> | null = null
let globalPingInterval: ReturnType<typeof setInterval> | null = null
const globalHandlers = new Map<ServerMessageType, Set<MessageHandler>>()
const globalStatus = ref<ConnectionStatus>('disconnected')
let isInitialized = false

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    autoConnect = true,
    autoReconnect = true,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000,
  } = options

  /** Use global status */
  const status = globalStatus

  /** Use global handlers */
  const handlers = globalHandlers

  /**
   * Generate WebSocket URL
   */
  function getWebSocketUrl(): string {
    if (!import.meta.client) return ''

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/_ws`
  }

  /**
   * Call event handlers
   */
  function emitEvent(type: ServerMessageType, payload: unknown): void {
    const typeHandlers = handlers.get(type)
    if (typeHandlers) {
      typeHandlers.forEach(handler => handler(payload))
    }
  }

  /**
   * Establish connection
   */
  function connect(): void {
    if (!import.meta.client) return
    if (globalWs?.readyState === WebSocket.OPEN) return

    status.value = 'connecting'

    try {
      globalWs = new WebSocket(getWebSocketUrl())

      globalWs.onopen = () => {
        status.value = 'connected'
        globalReconnectAttempts = 0
        console.log('[WebSocket] Connected')

        // Start ping interval
        globalPingInterval = setInterval(() => {
          if (globalWs?.readyState === WebSocket.OPEN) {
            send('ping', {})
          }
        }, 30000)
      }

      globalWs.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ServerMessage
          emitEvent(message.type, message.payload)
        }
        catch (error) {
          console.error('[WebSocket] Error parsing message:', error)
        }
      }

      globalWs.onclose = () => {
        status.value = 'disconnected'
        cleanup()
        console.log('[WebSocket] Disconnected')

        // Auto-Reconnect
        if (autoReconnect && globalReconnectAttempts < maxReconnectAttempts) {
          globalReconnectAttempts++
          const delay = reconnectDelay * Math.pow(2, globalReconnectAttempts - 1)
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${globalReconnectAttempts}/${maxReconnectAttempts})`)

          globalReconnectTimer = setTimeout(() => {
            connect()
          }, delay)
        }
      }

      globalWs.onerror = (error) => {
        status.value = 'error'
        console.error('[WebSocket] Error:', error)
      }
    }
    catch (error) {
      status.value = 'error'
      console.error('[WebSocket] Failed to connect:', error)
    }
  }

  /**
   * Cleanup
   */
  function cleanup(): void {
    if (globalPingInterval) {
      clearInterval(globalPingInterval)
      globalPingInterval = null
    }
  }

  /**
   * Disconnect
   */
  function disconnect(): void {
    if (globalReconnectTimer) {
      clearTimeout(globalReconnectTimer)
      globalReconnectTimer = null
    }

    cleanup()
    globalReconnectAttempts = maxReconnectAttempts // Prevents auto-reconnect

    if (globalWs) {
      globalWs.close()
      globalWs = null
    }

    status.value = 'disconnected'
  }

  /**
   * Send message
   */
  function send<T>(type: ClientMessage['type'], payload: T): void {
    if (globalWs?.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send message: not connected')
      return
    }

    const message: ClientMessage = {
      type,
      payload,
      timestamp: Date.now(),
    }

    globalWs.send(JSON.stringify(message))
  }

  /**
   * Register event handler
   */
  function on<T>(type: ServerMessageType, handler: MessageHandler<T>): () => void {
    if (!handlers.has(type)) {
      handlers.set(type, new Set())
    }

    handlers.get(type)!.add(handler as MessageHandler)

    // Return unsubscribe function
    return () => {
      handlers.get(type)?.delete(handler as MessageHandler)
    }
  }

  /**
   * One-time event handler
   */
  function once<T>(type: ServerMessageType, handler: MessageHandler<T>): void {
    const wrappedHandler: MessageHandler<T> = (payload) => {
      handler(payload)
      handlers.get(type)?.delete(wrappedHandler as MessageHandler)
    }

    on(type, wrappedHandler)
  }

  // Auto-connect on mount (only once globally)
  if (import.meta.client && autoConnect && !isInitialized) {
    isInitialized = true
    onMounted(() => {
      connect()
    })

    // Note: We do NOT disconnect on unmount to preserve connection across page navigations
    // The connection is managed globally and persists until the browser tab is closed
  }

  return {
    status,
    connect,
    disconnect,
    send,
    on,
    once,
  }
}
