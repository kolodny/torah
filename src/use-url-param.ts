import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

export const useUrlParam = (key: string, defaultValue: string) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback(
    (newValue: string) => {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set(key, newValue);
      setSearchParams(newSearchParams);
    },
    [key, searchParams, setSearchParams]
  );

  return [value, setValue] as const;
};
