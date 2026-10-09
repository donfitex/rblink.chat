import { createContext, useContext, useEffect, useState } from 'react';

export const MeCtx = createContext<{ me: any; needLogin: () => void; refresh: () => Promise<void> }>({
  me: null,
  needLogin: () => {},
  refresh: async () => {}
});
export const useMe = () => useContext(MeCtx);

const read = () => location.hash.replace(/^#\/?/, '') || 'feed';
export function useRoute(): string {
  const [route, setRoute] = useState(read());
  useEffect(() => {
    const f = () => setRoute(read());
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return route;
}
export const go = (path: string) => { location.hash = '/' + path; };
