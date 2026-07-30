import { AgentChat } from "@/app/_components/agent-chat";
import { SetupChecklist } from "@/app/_components/setup-checklist";

// The checklist reads env at request time to show what's actually left to set up.
export const dynamic = "force-dynamic";

export default function Page() {
  return <AgentChat setup={<SetupChecklist />} />;
}
