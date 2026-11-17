import { useCallback, useState } from 'react'
import { loadNytApiKey, saveNytApiKey } from '../storage'

export function useNytApiKey() {
  const [apiKey, setApiKeyState] = useState(() => loadNytApiKey())

  const setApiKey = useCallback((value: string) => {
    saveNytApiKey(value)
    setApiKeyState(value.trim())
  }, [])

  const clearApiKey = useCallback(() => {
    saveNytApiKey('')
    setApiKeyState('')
  }, [])

  return { apiKey, setApiKey, clearApiKey, hasKey: apiKey.length > 0 }
}
