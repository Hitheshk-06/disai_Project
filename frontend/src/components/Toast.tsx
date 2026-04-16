import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  onClose: () => void
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const styles = {
    success: 'bg-secondary/20 border-secondary text-secondary',
    error: 'bg-danger/20 border-danger text-danger',
    info: 'bg-primary/20 border-primary text-primary',
  }
  const icons = { success: 'check_circle', error: 'error', info: 'info' }

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl animate-slide-in ${styles[type]}`}>
      <span className="material-symbols-outlined text-lg">{icons[type]}</span>
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  )
}

// Simple hook to manage toasts
import { useCallback } from 'react'

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const show = useCallback((message: string, type: ToastType = 'success') => setToast({ message, type }), [])
  const hide = useCallback(() => setToast(null), [])
  return { toast, show, hide }
}
