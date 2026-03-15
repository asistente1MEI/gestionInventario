import { useRef, useEffect, useCallback } from 'react';

export const useDebounce = (callback, delay = 300) => {
    const timerRef = useRef(null);

    const funcionDebounced = useCallback((...args) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => callback(...args), delay);
    }, [callback, delay]);

    useEffect(() => {
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    return funcionDebounced;
};
