"use client";
import { useEffect, useState, useRef } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ChatClient() {
  const [message, setMessage] = useState<string>("");
  const [user, setUser] = useState<string>("Jane");
  const [messages, setMessages] = useState<
    {
      user: string;
      message: string;
    }[]
  >([]);

  const channel = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!channel.current) {
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_KEY!
      );
      channel.current = client.channel("chat-room", {
        config: {
          broadcast: {
            self: true,
          },
        },
      });
      channel.current
        .on("broadcast", { event: "message" }, ({ payload }) => {
          setMessages((prev) => [...prev, payload.message]);
        })
        .subscribe();
    }
    return () => {
      channel.current?.unsubscribe();
      channel.current = null;
    };
  }, []);

  function onSend() {
    if (!channel.current || message.trim().length === 0) return;
    channel.current.send({
      type: "broadcast",
      event: "message",
      payload: { message: { message, user } },
    });
    setMessage("");
  }

  return (
    <>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="User"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="flex-[0.2] text-2xl"
        />
        <Input
          type="text"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              onSend();
            }
          }}
          className="flex-[0.7] text-2xl"
        />
        <Button onClick={onSend} className="text-2xl">
          Send
        </Button>
      </div>
      <div className="mt-5 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg w-2/3 text-2xl bg-${
              user === msg.user ? "blue-800" : "gray-600"
            } ${user === msg.user ? "self-end" : "self-start"}`}
          >
            {msg.message}
          </div>
        ))}
      </div>
    </>
  );
}
