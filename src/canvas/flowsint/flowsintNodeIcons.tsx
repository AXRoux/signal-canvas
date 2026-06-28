import { Globe, Hash, MessageCircle, Share2, User } from "lucide-react";

export function FlowsintTypeIcon({ type, size = 22 }: { type: string; size?: number }) {
  const props = { size, strokeWidth: 1.75, "aria-hidden": true as const };

  switch (type) {
    case "account":
      return <User {...props} />;
    case "platform":
      return <Globe {...props} />;
    case "keyword":
      return <Hash {...props} />;
    case "telegram":
      return <MessageCircle {...props} />;
    default:
      return <Share2 {...props} />;
  }
}

export function flowsintTypeIconName(type: string): string {
  switch (type) {
    case "account":
      return "user";
    case "platform":
      return "globe";
    case "keyword":
      return "hash";
    case "telegram":
      return "message";
    default:
      return "share";
  }
}
