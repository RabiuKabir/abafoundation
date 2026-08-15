import { Badge } from "@/components/ui/badge";

/**
 * One mapping from workflow status to badge intent, used everywhere a status
 * appears. Defined once so the colours can't drift between screens.
 */
const MAP = {
  draft: { variant: "neutral", label: "draft" },
  in_review: { variant: "warning", label: "in review" },
  published: { variant: "success", label: "published" },
  archived: { variant: "danger", label: "archived" },
} as const;

export type ActivityStatus = keyof typeof MAP;

export function StatusBadge({ status }: { status: ActivityStatus }) {
  const { variant, label } = MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
