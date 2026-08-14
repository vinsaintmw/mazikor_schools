export type ActionSuccess<T = void> = { ok: true; data: T };
export type ActionError = { ok: false; error: string; fieldErrors?: Record<string, string> };
export type ActionResult<T = void> = ActionSuccess<T> | ActionError;

export function success<T = void>(data?: T): ActionSuccess<T> {
  return { ok: true, data: data as T };
}

export function error(message: string, fieldErrors?: Record<string, string>): ActionError {
  return { ok: false, error: message, fieldErrors };
}

export function unwrapAction(result: unknown): { ok: boolean; error?: string; fieldErrors?: Record<string, string> } {
  if (result && typeof result === "object" && "ok" in result) {
    const r = result as ActionError;
    if (r.ok === false) return { ok: false, error: r.error, fieldErrors: r.fieldErrors };
  }
  return { ok: true };
}
