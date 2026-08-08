"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "../../../lib/supabaseClient";

export default function Conversation({ params }) {
  const supabase = createClient();
  const friendId = params.friendId;
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [allowed, setAllowed] = useState(true);
  const bottomRef = useRef(null);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user.id);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    setMessages(data || []);
    setAllowed(!error);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`messages-${friendId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [friendId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: friendId,
      content: text,
    });
    if (!error) {
      setText("");
      load();
    } else {
      setAllowed(false);
    }
  }

  if (!allowed) {
    return <p className="mt-6 text-red-600">Vous devez être amis pour vous envoyer des messages.</p>;
  }

  return (
    <div className="card mt-6 flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
            m.sender_id === userId ? "bg-indigo-600 text-white ml-auto" : "bg-gray-100"
          }`}>
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input className="input" placeholder="Votre message..." value={text}
          onChange={(e) => setText(e.target.value)} />
        <button className="btn">Envoyer</button>
      </form>
    </div>
  );
}
