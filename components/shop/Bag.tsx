'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type CartLine, validLines } from '@/lib/catalog'

type Bag = { items: CartLine[]; ready: boolean; update: (sku: string, quantity: number) => void; clear: () => void }
const Context = createContext<Bag | null>(null)
const key = 'prayer-space:bag:v1'
export function BagProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([])
  const [ready, setReady] = useState(false)
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(key) || '[]')
      if (validLines(stored)) setItems(stored)
    } catch { /* Allow an in-memory bag when storage is unavailable. */ }
    setReady(true)
  }, [])
  useEffect(() => {
    if (ready) {
      try { localStorage.setItem(key, JSON.stringify(items)) } catch { /* In-memory bag still works. */ }
    }
  }, [items, ready])
  const update = (sku: string, quantity: number) => setItems(current => {
    const index = current.findIndex(item => item.sku === sku)
    if (!quantity) return current.filter(item => item.sku !== sku)
    if (index < 0) return [...current, { sku, quantity }]
    return current.map(item => item.sku === sku ? { sku, quantity } : item)
  })
  return <Context.Provider value={{ items, ready, update, clear: () => setItems([]) }}>{children}</Context.Provider>
}
export function useBag() {
  const bag = useContext(Context)
  if (!bag) throw new Error('Bag provider is required')
  return bag
}
