import type {
  ActionConfig,
  ActionResult,
  ActionType,
} from "@skeleton-automation/shared";

/**
 * Execute a single action and return the result.
 * The input parameter carries data from the trigger (and previous transforms).
 */
export async function executeAction(
  action: ActionConfig,
  actionIndex: number,
  input: Record<string, unknown>
): Promise<ActionResult> {
  const start = Date.now();

  try {
    let output: unknown;

    switch (action.type) {
      case "http":
        output = await executeHttpAction(action.config, input);
        break;
      case "email":
        output = await executeEmailAction(action.config, input);
        break;
      case "webhook":
        output = await executeWebhookAction(action.config, input);
        break;
      case "transform":
        output = await executeTransformAction(action.config, input);
        break;
      case "delay":
        output = await executeDelayAction(action.config);
        break;
      default:
        throw new Error(`Unknown action type: ${(action as any).type}`);
    }

    return {
      action_index: actionIndex,
      action_type: action.type as ActionType,
      status: "success",
      output,
      duration_ms: Date.now() - start,
    };
  } catch (err: any) {
    return {
      action_index: actionIndex,
      action_type: action.type as ActionType,
      status: "failed",
      error: err.message || "Action execution failed",
      duration_ms: Date.now() - start,
    };
  }
}

// ---- HTTP Request ----

async function executeHttpAction(
  config: { method: string; url: string; headers?: Record<string, string>; body?: unknown },
  input: Record<string, unknown>
): Promise<unknown> {
  const url = interpolate(config.url, input);
  const body = config.body
    ? JSON.stringify(interpolateDeep(config.body, input))
    : undefined;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...config.headers,
  };

  const res = await fetch(url, {
    method: config.method,
    headers,
    body: config.method !== "GET" ? body : undefined,
  });

  const responseBody = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseBody);
  } catch {
    parsed = responseBody;
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${responseBody.slice(0, 500)}`);
  }

  return { status: res.status, body: parsed };
}

// ---- Email ----

async function executeEmailAction(
  config: { to: string; subject: string; body: string },
  input: Record<string, unknown>
): Promise<unknown> {
  const { sendEmail } = await import("./email.service");

  // Interpolate template variables
  const to = interpolate(config.to, input);
  const subject = interpolate(config.subject, input);
  const body = interpolate(config.body, input);

  return sendEmail(to, subject, body);
}

// ---- Webhook ----

async function executeWebhookAction(
  config: { url: string; payload?: unknown },
  input: Record<string, unknown>
): Promise<unknown> {
  const url = interpolate(config.url, input);
  const payload = config.payload
    ? interpolateDeep(config.payload, input)
    : input;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const responseBody = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseBody);
  } catch {
    parsed = responseBody;
  }

  if (!res.ok) {
    throw new Error(`Webhook failed ${res.status}: ${responseBody.slice(0, 500)}`);
  }

  return { status: res.status, body: parsed };
}

// ---- Transform ----

/**
 * Blocked global identifiers that transform expressions must not reference.
 * Prevents access to process, file system, network, and other dangerous APIs.
 */
const BLOCKED_IDENTIFIERS = [
  "process", "require", "import", "eval",
  "Function", "globalThis", "global",
  "child_process", "fs", "net", "http", "https",
  "fetch", "XMLHttpRequest",
  "__dirname", "__filename",
];

async function executeTransformAction(
  config: { expression: string },
  input: Record<string, unknown>
): Promise<unknown> {
  // Validate the expression length to prevent abuse
  if (config.expression.length > 10000) {
    throw new Error("Transform expression exceeds maximum length of 10,000 characters");
  }

  // Check for blocked identifiers that could allow sandbox escape
  for (const blocked of BLOCKED_IDENTIFIERS) {
    // Use word boundary regex to avoid false positives on substrings
    const pattern = new RegExp(`\\b${blocked}\\b`);
    if (pattern.test(config.expression)) {
      throw new Error(
        `Transform expression contains blocked identifier: "${blocked}". ` +
        `Expressions can only transform data using the "input" object.`
      );
    }
  }

  // Execute the expression with a timeout to prevent infinite loops.
  // The expression receives `input` (read-only copy) and should return transformed data.
  // Example: "return { ...input, processed: true }"
  try {
    // Create a shallow frozen copy of input to prevent mutation
    const safeInput = Object.freeze({ ...input });

    const fn = new Function(
      "input",
      `"use strict";\n${config.expression}`
    );

    // Run with a timeout using Promise.race
    const result = await Promise.race([
      Promise.resolve().then(() => fn(safeInput)),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Transform expression timed out after 5 seconds")), 5000)
      ),
    ]);

    return result;
  } catch (err: any) {
    throw new Error(`Transform expression error: ${err.message}`);
  }
}

// ---- Delay ----

async function executeDelayAction(
  config: { seconds: number }
): Promise<unknown> {
  const ms = Math.min(config.seconds * 1000, 300000); // Max 5 minutes
  await new Promise((resolve) => setTimeout(resolve, ms));
  return { delayed_seconds: config.seconds };
}

// ---- Template Interpolation ----

/**
 * Replace {{variable}} placeholders in a string with values from the input object.
 */
function interpolate(
  template: string,
  data: Record<string, unknown>
): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, path: string) => {
    const value = getNestedValue(data, path);
    return value !== undefined ? String(value) : "";
  });
}

/**
 * Recursively interpolate template strings in an object/array.
 */
function interpolateDeep(obj: unknown, data: Record<string, unknown>): unknown {
  if (typeof obj === "string") return interpolate(obj, data);
  if (Array.isArray(obj)) return obj.map((item) => interpolateDeep(item, data));
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolateDeep(value, data);
    }
    return result;
  }
  return obj;
}

function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  return path.split(".").reduce((current: any, key) => {
    return current?.[key];
  }, obj);
}
