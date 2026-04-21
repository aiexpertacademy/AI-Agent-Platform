import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const CreditContext = createContext(null)

const PLAN_CREDITS = { free: 100, pro: 2000, enterprise: 10000 }

const DEFAULT_STATE = {
  coins: 250,
  plan: 'pro',
  history: [
    { id: 1, type: 'credit', desc: 'Welcome bonus', amount: 100, date: '2026-04-01' },
    { id: 2, type: 'debit', desc: 'Image generation × 5', amount: -25, date: '2026-04-10' },
    { id: 3, type: 'debit', desc: 'Logo generation × 2', amount: -10, date: '2026-04-15' },
    { id: 4, type: 'credit', desc: 'Monthly top-up', amount: 200, date: '2026-04-20' },
  ],
}

export function CreditProvider({ children }) {
  const { currentUser } = useAuth()
  const [coins, setCoins] = useState(DEFAULT_STATE.coins)
  const [plan, setPlan] = useState(DEFAULT_STATE.plan)
  const [history, setHistory] = useState(DEFAULT_STATE.history)

  const storageKey = `credits_${currentUser?.uid || 'guest'}`

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        setCoins(data.coins ?? DEFAULT_STATE.coins)
        setPlan(data.plan ?? DEFAULT_STATE.plan)
        setHistory(data.history ?? DEFAULT_STATE.history)
      }
    } catch {}
  }, [storageKey])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ coins, plan, history }))
    } catch {}
  }, [coins, plan, history, storageKey])

  function spendCoins(amount, desc) {
    if (coins < amount) return false
    const entry = { id: Date.now(), type: 'debit', desc, amount: -amount, date: new Date().toISOString().split('T')[0] }
    setCoins(c => c - amount)
    setHistory(h => [entry, ...h])
    return true
  }

  function addCoins(amount, desc = 'Manual top-up') {
    const entry = { id: Date.now(), type: 'credit', desc, amount, date: new Date().toISOString().split('T')[0] }
    setCoins(c => c + amount)
    setHistory(h => [entry, ...h])
  }

  return (
    <CreditContext.Provider value={{ coins, plan, setPlan, history, spendCoins, addCoins, planLimit: PLAN_CREDITS[plan] }}>
      {children}
    </CreditContext.Provider>
  )
}

export function useCredits() {
  const ctx = useContext(CreditContext)
  if (!ctx) throw new Error('useCredits must be used inside CreditProvider')
  return ctx
}
