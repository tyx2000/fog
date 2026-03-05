import { useCallback, useEffect, useRef, useState } from "react";

type RequestService<TData, TParams extends unknown[]> = (
  ...params: TParams
) => Promise<TData>;

interface RequestState<TData, TParams extends unknown[]> {
  data: TData | undefined;
  error: unknown;
  loading: boolean;
  params: TParams | undefined;
}

export interface UseRequestOptions<TData, TParams extends unknown[]> {
  manual?: boolean;
  defaultParams?: TParams;
  initialData?: TData;
  onSuccess?: (data: TData, params: TParams) => void;
  onError?: (error: unknown, params: TParams) => void;
  onFinally?: (
    params: TParams,
    data?: TData,
    error?: unknown
  ) => void;
}

export interface UseRequestResult<TData, TParams extends unknown[]> {
  data: TData | undefined;
  error: unknown;
  loading: boolean;
  params: TParams | undefined;
  run: (...params: TParams) => Promise<TData>;
  refresh: () => Promise<TData>;
  cancel: () => void;
  mutate: (
    data: TData | ((previousData: TData | undefined) => TData)
  ) => void;
}

export default function useRequest<TData, TParams extends unknown[] = []>(
  service: RequestService<TData, TParams>,
  options: UseRequestOptions<TData, TParams> = {}
): UseRequestResult<TData, TParams> {
  const {
    manual = false,
    defaultParams,
    initialData,
    onSuccess,
    onError,
    onFinally
  } = options;

  const [state, setState] = useState<RequestState<TData, TParams>>({
    data: initialData,
    error: undefined,
    loading: false,
    params: defaultParams
  });

  const isMountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const lastParamsRef = useRef<TParams | undefined>(defaultParams);

  const serviceRef = useRef(service);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onFinallyRef = useRef(onFinally);
  const defaultParamsRef = useRef(defaultParams);

  useEffect(() => {
    serviceRef.current = service;
  }, [service]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onFinallyRef.current = onFinally;
  }, [onFinally]);

  useEffect(() => {
    defaultParamsRef.current = defaultParams;
  }, [defaultParams]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!manual) {
      const params = (
        defaultParamsRef.current ?? ([] as unknown as TParams)
      );
      void run(...params);
    }

    return () => {
      isMountedRef.current = false;
      requestIdRef.current += 1;
    };
    // `run` is stable by design and safe to ignore in this mount-only effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = useCallback(async (...params: TParams) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    lastParamsRef.current = params;

    setState((previousState) => ({
      ...previousState,
      loading: true,
      error: undefined,
      params
    }));

    try {
      const data = await serviceRef.current(...params);
      const isLatest = requestId === requestIdRef.current;

      if (isMountedRef.current && isLatest) {
        setState((previousState) => ({
          ...previousState,
          data,
          error: undefined,
          loading: false,
          params
        }));

        onSuccessRef.current?.(data, params);
        onFinallyRef.current?.(params, data);
      }

      return data;
    } catch (error) {
      const isLatest = requestId === requestIdRef.current;

      if (isMountedRef.current && isLatest) {
        setState((previousState) => ({
          ...previousState,
          error,
          loading: false,
          params
        }));

        onErrorRef.current?.(error, params);
        onFinallyRef.current?.(params, undefined, error);
      }

      throw error;
    }
  }, []);

  const refresh = useCallback(() => {
    const params = lastParamsRef.current ?? defaultParamsRef.current;
    return run(...((params ?? []) as TParams));
  }, [run]);

  const cancel = useCallback(() => {
    requestIdRef.current += 1;

    setState((previousState) => ({
      ...previousState,
      loading: false
    }));
  }, []);

  const mutate = useCallback((
    data: TData | ((previousData: TData | undefined) => TData)
  ) => {
    setState((previousState) => ({
      ...previousState,
      data: typeof data === "function"
        ? (data as (previousData: TData | undefined) => TData)(
            previousState.data
          )
        : data
    }));
  }, []);

  return {
    ...state,
    run,
    refresh,
    cancel,
    mutate
  };
}
