// mutationOptions() factories for a2aq's side-effecting sendMessage. Optimistic
// updates are NOT reimplemented here on the TanStack side — see the package
// README for why (same reasoning as mcpq-tanstack).

import { mutationOptions } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { Message } from "@a2a-js/sdk";
import type { A2AQuery, SendOptions, TaskHandle } from "@johnhenry/a2aq";
import { taskQueryKey } from "./keys.js";

/** `sendMessage` returns Message | TaskHandle — Message ALSO carries a (possibly
 *  empty) `taskId` field, so a TaskHandle is identified by its methods, not by
 *  key presence alone. */
function isTaskHandle(result: Message | TaskHandle): result is TaskHandle {
  return typeof (result as TaskHandle).result === "function";
}

export function a2aqSendMessageMutationOptions(client: A2AQuery, queryClient: QueryClient, agent: string, opts: SendOptions = {}) {
  return mutationOptions({
    mutationFn: (message: Message) => client.sendMessage(agent, message, opts),
    onSuccess: (result) => {
      if (isTaskHandle(result)) void queryClient.invalidateQueries({ queryKey: taskQueryKey(agent, result.taskId) as unknown[] });
    },
  });
}
