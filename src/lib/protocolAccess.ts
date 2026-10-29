const STORAGE_KEY = 'tms_protocol_unlocked';
const UNLOCK_EVENT = 'tms-protocol-unlocked';

export function isProtocolUnlocked(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

export function unlockProtocol(): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
        // Private mode can block storage. The in-page reveal still works.
    }
    window.dispatchEvent(new Event(UNLOCK_EVENT));
}

export function subscribeProtocolUnlock(onStoreChange: () => void): () => void {
    window.addEventListener(UNLOCK_EVENT, onStoreChange);
    window.addEventListener('storage', onStoreChange);
    return () => {
        window.removeEventListener(UNLOCK_EVENT, onStoreChange);
        window.removeEventListener('storage', onStoreChange);
    };
}
