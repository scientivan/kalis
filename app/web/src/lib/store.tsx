'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { initialState, transition, type State, type Command } from './domain';

const KEY = 'kalis-mock-v3';
type Store = {
  state: State;
  ready: boolean;
  error: string;
  command: (command: Command) => boolean;
  reset: () => void;
  clearError: () => void;
  execute: (id: string) => Promise<void>;
};
const Context = createContext<Store | null>(null);
// Replace this boundary with the real repository and execution adapter at integration.
// Components never call NEAR, an API, a wallet, or the filesystem directly.
export function MockProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState),
    [ready, setReady] = useState(false),
    [error, setError] = useState('');
  const ref = useRef(state);
  useEffect(() => {
    try {
      ['kalis-mock-v1', 'kalis-mock-v2'].forEach((k) => localStorage.removeItem(k)); // Older schemas are not migrated.
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        if (
          parsed.schema !== 3 ||
          !Array.isArray(parsed.outbound) ||
          !Array.isArray(parsed.methods) ||
          !Array.isArray(parsed.runs) ||
          !Array.isArray(parsed.bounties) ||
          !Array.isArray(parsed.grants) ||
          !Array.isArray(parsed.transactions) ||
          !Number.isSafeInteger(parsed.balance)
        )
          throw new Error('Unknown mock storage format');
        ref.current = parsed;
        setState(parsed);
      }
    } catch {
      setError('Saved mock data could not be loaded. A fresh demo is available.');
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch {
        setError('Mock changes are available in memory, but browser storage could not save them.');
      }
  }, [state, ready]);
  function command(c: Command) {
    try {
      const next = transition(ref.current, c);
      ref.current = next;
      setState(next);
      setError('');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The mock operation could not complete.');
      return false;
    }
  }
  async function execute(id: string) {
    if (!command({ type: 'START_RUN', id })) return;
    await new Promise((r) => setTimeout(r, 600));
    const run = ref.current.runs.find((r) => r.id === id);
    if (run?.status === 'running' && run.scenario !== 'timeout') command({ type: 'FINISH_RUN', id });
  }
  function reset() {
    const next = initialState();
    ref.current = next;
    setState(next);
    setError('');
  }
  return (
    <Context.Provider
      value={{ state, ready, error, command, execute, reset, clearError: () => setError('') }}
    >
      {children}
    </Context.Provider>
  );
}
export function useMock() {
  const value = useContext(Context);
  if (!value) throw new Error('MockProvider missing');
  return value;
}
export const newId = (prefix: string) => prefix + '-' + crypto.randomUUID().slice(0, 8);
