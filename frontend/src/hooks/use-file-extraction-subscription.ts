"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileExtractionSSEPayload } from "@/types";
import { createSSEConnection } from "@/lib/sse";
import { useAuthStore } from "@/contexts/auth-store";

type ConnectionStatus = "idle" | "connecting" | "connected" | "error" | "closed";

interface UseFileExtractionSubscriptionOptions {
  onProgress?: (payload: { parentFileId: number; childFileId: number }) => void;
  onCompleted?: (payload: { parentFileId: number }) => void;
  onCancelled?: (payload: { parentFileId: number }) => void;
  /** 预检 JSON 超时时间（毫秒） */
  preflightTimeoutMs?: number;
}

export function useFileExtractionSubscription(
  parentId: number | null,
  options: UseFileExtractionSubscriptionOptions = {}
) {
  const { onProgress, onCompleted, onCancelled } = options;
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const connectionRef = useRef<{ close: () => void } | null>(null);
  useAuthStore();

  // 使用 ref 持有回调，避免因为回调标识变化导致副作用重复执行
  const onProgressRef = useRef<typeof onProgress>(onProgress);
  const onCompletedRef = useRef<typeof onCompleted>(onCompleted);
  const onCancelledRef = useRef<typeof onCancelled>(onCancelled);
  onProgressRef.current = onProgress;
  onCompletedRef.current = onCompleted;
  onCancelledRef.current = onCancelled;

  const stop = useCallback(() => {
    if (connectionRef.current) {
      try {
        connectionRef.current.close();
      } catch {}
      connectionRef.current = null;
    }
    setConnectionStatus("closed");
  }, []);

  const startSSE = useCallback(
    (pid: number) => {
      const sseUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/files/subscribe/${pid}`;
      setConnectionStatus("connecting");

      const conn = createSSEConnection<FileExtractionSSEPayload>(sseUrl, {
        onOpen: () => setConnectionStatus("connected"),
        onMessage: (data) => {
          if (data.status === "progress") {
            onProgressRef.current?.({ parentFileId: data.parent_file_id, childFileId: data.child_file_id });
          } else if (data.status === "completed") {
            onCompletedRef.current?.({ parentFileId: data.parent_file_id });
            stop();
          } else if (data.status === "cancelled") {
            onCancelledRef.current?.({ parentFileId: data.parent_file_id });
            stop();
          }
        },
        onError: () => {
          // suppress repeated error flips; keep first signal only
          setConnectionStatus((prev) => (prev === "error" ? prev : "error"));
        },
        onClose: () => setConnectionStatus("closed"),
      });

      connectionRef.current = conn;
    },
    [stop]
  );

  useEffect(() => {
    if (!parentId) {
      stop();
      return;
    }

    // 关闭旧连接并直接开始 SSE 订阅（去除预检以避免意外分支导致不更新）
    stop();
    setConnectionStatus("connecting");
    startSSE(parentId);

    return () => {
      stop();
    };
  }, [parentId, startSSE, stop]);

  return { connectionStatus, stop } as const;
}


