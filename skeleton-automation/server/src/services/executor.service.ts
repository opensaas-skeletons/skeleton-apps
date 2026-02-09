import type { Workflow, Condition } from "@skeleton-automation/shared";
import { createRun, completeRun } from "./workflow.service";
import { executeAction } from "./action.service";
import { notify } from "./notification.service";

/**
 * Execute a workflow: evaluate conditions, run each action in sequence,
 * and record the run result.
 */
export async function executeWorkflow(
  workflow: Workflow,
  triggerData: Record<string, unknown>
): Promise<void> {
  console.log(`[Executor] Running workflow "${workflow.title}" (${workflow.id})`);

  const run = await createRun(workflow.id, triggerData);
  const actionResults: any[] = [];
  let currentInput = { ...triggerData };

  try {
    // Evaluate conditions
    if (workflow.conditions.length > 0) {
      const conditionsPassed = evaluateConditions(
        workflow.conditions,
        triggerData
      );
      if (!conditionsPassed) {
        console.log(
          `[Executor] Conditions not met for workflow "${workflow.title}", skipping actions.`
        );
        await completeRun(run.id, [
          {
            action_index: -1,
            action_type: "condition",
            status: "skipped",
            output: "Conditions not met",
            duration_ms: 0,
          },
        ]);
        return;
      }
    }

    // Execute each action in sequence
    for (let i = 0; i < workflow.actions.length; i++) {
      const action = workflow.actions[i];
      const result = await executeAction(action, i, currentInput);
      actionResults.push(result);

      if (result.status === "failed") {
        throw new Error(
          `Action ${i} (${action.type}) failed: ${result.error}`
        );
      }

      // If this was a transform action, merge its output into the input for the next action
      if (action.type === "transform" && result.output) {
        currentInput = {
          ...currentInput,
          ...(typeof result.output === "object" ? result.output : {}),
        } as Record<string, unknown>;
      }
    }

    await completeRun(run.id, actionResults);
    const notifRecipient = process.env.NOTIFICATION_DEFAULT_RECIPIENT || "demo@skeleton.dev";
    notify({
      recipient: notifRecipient,
      event_type: "workflow:run_completed",
      title: `Workflow completed: ${workflow.title}`,
      body: `Workflow "${workflow.title}" completed successfully.`,
      entity_type: "workflow",
      entity_id: workflow.id,
      channels: ["in_app"],
    }).catch((err) => console.error("[Notification] workflow:run_completed failed:", err));
    console.log(
      `[Executor] Workflow "${workflow.title}" completed successfully.`
    );
  } catch (err: any) {
    await completeRun(run.id, actionResults, err.message);
    const notifRecipient = process.env.NOTIFICATION_DEFAULT_RECIPIENT || "demo@skeleton.dev";
    notify({
      recipient: notifRecipient,
      event_type: "workflow:run_failed",
      title: `Workflow failed: ${workflow.title}`,
      body: `Workflow "${workflow.title}" failed: ${err.message}`,
      entity_type: "workflow",
      entity_id: workflow.id,
      channels: ["in_app"],
    }).catch((notifErr) => console.error("[Notification] workflow:run_failed failed:", notifErr));
    console.error(
      `[Executor] Workflow "${workflow.title}" failed: ${err.message}`
    );
  }
}

/**
 * Evaluate all conditions against the trigger data.
 * All conditions must pass (AND logic).
 */
function evaluateConditions(
  conditions: Condition[],
  data: Record<string, unknown>
): boolean {
  // Filter out empty/invalid conditions (e.g. empty field name)
  const validConditions = conditions.filter((c) => c.field && c.field.trim() !== "");
  if (validConditions.length === 0) return true;
  return validConditions.every((condition) => evaluateCondition(condition, data));
}

function evaluateCondition(
  condition: Condition,
  data: Record<string, unknown>
): boolean {
  const fieldValue = getNestedValue(data, condition.field);

  switch (condition.operator) {
    case "equals":
      return fieldValue === condition.value;
    case "not_equals":
      return fieldValue !== condition.value;
    case "contains":
      if (typeof fieldValue === "string" && typeof condition.value === "string") {
        return fieldValue.includes(condition.value);
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(condition.value);
      }
      return false;
    case "gt":
      return (
        typeof fieldValue === "number" &&
        typeof condition.value === "number" &&
        fieldValue > condition.value
      );
    case "lt":
      return (
        typeof fieldValue === "number" &&
        typeof condition.value === "number" &&
        fieldValue < condition.value
      );
    case "exists":
      return fieldValue !== undefined && fieldValue !== null;
    default:
      return false;
  }
}

function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  return path.split(".").reduce((current: any, key) => {
    return current?.[key];
  }, obj);
}
