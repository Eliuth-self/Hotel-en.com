import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = window.localStorage.getItem(key);
      return saved ? JSON.parse(saved) as T : initialValue;
    } catch (error) {
      console.error(`No se pudo leer ${key} desde el almacenamiento local.`, error);
      return initialValue;
    }
  });

  const updateValue = (nextValue: T | ((currentValue: T) => T)) => {
    setValue((currentValue) => {
      const resolved = typeof nextValue === 'function'
        ? (nextValue as (currentValue: T) => T)(currentValue)
        : nextValue;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch (error) {
        console.error(`No se pudo guardar ${key} en el almacenamiento local.`, error);
      }
      return resolved;
    });
  };

  return [value, updateValue] as const;
}
