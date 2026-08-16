import { useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";

const PAGINATION_KEYS = new Set(["page", "limit"]);

export function parseListPage(raw: string | undefined, fallback = 1): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

export function parseListLimit(raw: string | undefined, fallback = 10, max = 100): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function readListQuery<T extends Record<string, string>>(
  searchParams: URLSearchParams,
  defaults: T
): T {
  const next = { ...defaults };
  for (const key of Object.keys(defaults) as Array<keyof T & string>) {
    if (searchParams.has(key)) {
      next[key] = (searchParams.get(key) ?? defaults[key]) as T[keyof T & string];
    }
  }
  return next;
}

function writeListQuery<T extends Record<string, string>>(
  current: URLSearchParams,
  values: T,
  defaults: T
): URLSearchParams {
  const params = new URLSearchParams(current);
  for (const key of Object.keys(defaults) as Array<keyof T & string>) {
    const value = values[key];
    if (value === defaults[key]) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }
  return params;
}

export function useListQueryState<T extends Record<string, string>>(defaults: T): {
  values: T;
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  setValues: (patch: Partial<T>) => void;
  reset: () => void;
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
} {
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(
    () => readListQuery(searchParams, defaultsRef.current),
    [searchParams]
  );

  const applyPatch = useCallback(
    (patch: Record<string, string>) => {
      setSearchParams(
        (current) => {
          const merged = {
            ...readListQuery(current, defaultsRef.current),
            ...patch,
          };
          return writeListQuery(current, merged, defaultsRef.current);
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setValues = useCallback(
    (patch: Partial<T>) => {
      applyPatch(patch as Record<string, string>);
    },
    [applyPatch]
  );

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      const patch: Record<string, string> = { [String(key)]: String(value) };
      if (!PAGINATION_KEYS.has(String(key)) && "page" in defaultsRef.current) {
        patch.page = String(defaultsRef.current.page ?? "1");
      }
      applyPatch(patch);
    },
    [applyPatch]
  );

  const reset = useCallback(() => {
    applyPatch(defaultsRef.current);
  }, [applyPatch]);

  const defaultPage = parseListPage(defaults.page, 1);
  const defaultLimit = parseListLimit(defaults.limit, 10);
  const page = parseListPage(values.page, defaultPage);
  const limit = parseListLimit(values.limit, defaultLimit);

  const setPage = useCallback(
    (nextPage: number) => {
      if (!("page" in defaultsRef.current)) return;
      applyPatch({ page: String(Math.max(1, nextPage)) });
    },
    [applyPatch]
  );

  const setLimit = useCallback(
    (nextLimit: number) => {
      if (!("limit" in defaultsRef.current)) return;
      const patch: Record<string, string> = {
        limit: String(Math.max(1, nextLimit)),
      };
      if ("page" in defaultsRef.current) {
        patch.page = String(defaultsRef.current.page ?? "1");
      }
      applyPatch(patch);
    },
    [applyPatch]
  );

  return { values, setFilter, setValues, reset, page, limit, setPage, setLimit };
}
