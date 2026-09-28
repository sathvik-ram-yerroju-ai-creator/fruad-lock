/**
 * Ambient type definitions for Supabase Edge Functions (Deno Runtime)
 * Resolves IDE TypeScript language server diagnostics in VS Code / Antigravity IDE.
 */

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    has(key: string): boolean;
  }
  export const env: Env;

  export function serve(
    handler: (req: Request) => Promise<Response> | Response,
    options?: { port?: number; hostname?: string }
  ): void;
}

declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(
    handler: (req: Request) => Promise<Response> | Response,
    options?: { port?: number; hostname?: string }
  ): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2.39.0' {
  export * from '@supabase/supabase-js';
}

declare module 'https://esm.sh/@supabase/supabase-js*' {
  export * from '@supabase/supabase-js';
}
