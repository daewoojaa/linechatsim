import { ViewTransition } from "react";
import ChatList from "@/components/ChatList/ChatList";

// The second chat-list page: opened from row 2 of the first one ("/"). Opening
// room 2 from here slides this page out to the left (see globals.css).
export default function SecondChatListPage() {
  return (
    <ViewTransition exit={{ "nav-forward": "slide-out-left", default: "none" }} default="none">
      <ChatList variant="second" />
    </ViewTransition>
  );
}
