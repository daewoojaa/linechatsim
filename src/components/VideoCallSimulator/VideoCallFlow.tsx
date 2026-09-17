"use client";

import { useState } from "react";
import IncomingCallAlert from "@/components/IncomingCallAlert/IncomingCallAlert";
import VideoCallSimulator from "./VideoCallSimulator";

type Props = {
  roomId: string;
};

/**
 * Room 4's full flow: an incoming-call "ringing" screen first, then the
 * actual video call once answered — always starts back at ringing on a
 * fresh mount, so re-opening the room for another take shows the alert
 * again rather than resuming mid-call.
 */
export default function VideoCallFlow({ roomId }: Props) {
  const [answered, setAnswered] = useState(false);

  if (answered) return <VideoCallSimulator roomId={roomId} />;
  return <IncomingCallAlert roomId={roomId} onAccept={() => setAnswered(true)} />;
}
