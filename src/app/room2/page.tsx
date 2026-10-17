import { ViewTransition } from "react";
import GroupChatSimulator from "@/components/GroupChatSimulator/GroupChatSimulator";

// Coming from the second chat list the page slides in from the right (see the
// "slide-in-right" rules in globals.css); every other way in has no animation.
export default function Room2Page() {
  return (
    <ViewTransition enter={{ "nav-forward": "slide-in-right", default: "none" }} default="none">
      <GroupChatSimulator />
    </ViewTransition>
  );
}
