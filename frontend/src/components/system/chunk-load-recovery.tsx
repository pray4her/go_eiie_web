'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'chunk_load_recovery_attempted';

function isChunkLoadError(error: unknown): boolean {
  const message = typeof error === 'string'
    ? error
    : error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message)
      : '';
  return message.includes('ChunkLoadError') || message.includes('Loading chunk') || message.includes('chunk');
}

function isStaticChunkUrl(url: string): boolean {
  return url.includes('/_next/static/chunks/') || url.includes('/_next/static/');
}

function tryReloadOnce(reason: string) {
  try {
    const attempted = sessionStorage.getItem(STORAGE_KEY);
    if (!attempted) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      const current = new URL(window.location.href);
      current.searchParams.set('__reload', String(Date.now()));
      window.location.replace(current.toString());
      return;
    }
  } catch {}

  toast.error('资源加载失败', {
    description: `检测到静态资源加载异常（${reason}）。请强制刷新（Ctrl+F5）或清理浏览器缓存后重试。`,
  });
}

export function ChunkLoadRecovery() {
  useEffect(() => {
    function onUnhandledRejection(event: PromiseRejectionEvent) {
      if (!isChunkLoadError(event.reason)) return;
      tryReloadOnce('ChunkLoadError');
    }

    function onError(event: Event) {
      const target = event.target as (HTMLScriptElement | HTMLLinkElement | null);
      const url = target && 'src' in target ? String(target.src || '') : target && 'href' in target ? String(target.href || '') : '';
      if (!url) return;
      if (!isStaticChunkUrl(url)) return;
      tryReloadOnce('静态 chunk 失败');
    }

    window.addEventListener('unhandledrejection', onUnhandledRejection);
    window.addEventListener('error', onError, true);
    return () => {
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
      window.removeEventListener('error', onError, true);
    };
  }, []);

  return null;
}

