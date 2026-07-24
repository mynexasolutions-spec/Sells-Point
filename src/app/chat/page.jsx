"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, MessageCircle, RefreshCw } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useSiteChrome } from "@/context/SiteChromeContext";
import ChatWindow from "@/components/ChatWindow";

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ChatPage() {
  const {
    currentUser,
    userResolved,
    userChats,
    chatLoading,
    chatError,
    retryUserChats,
    getUserById,
    getListingById,
    markChatAsRead,
  } = useApp();
  const { openAuth } = useSiteChrome();
  const [activeChatId, setActiveChatId] = useState(null);
  const [mobileConversationOpen, setMobileConversationOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, []);

  useEffect(() => {
    if (userChats.length === 0) {
      setActiveChatId(null);
      setMobileConversationOpen(false);
    } else if (!userChats.some((chat) => chat.id === activeChatId)) {
      setActiveChatId(userChats[0].id);
    }
  }, [userChats, activeChatId, currentUser?.id]);

  useEffect(() => {
    if (activeChatId) {
      markChatAsRead(activeChatId);
    }
  }, [activeChatId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!userResolved) {
    return <div className="page-container grid min-h-[50vh] place-items-center"><Loader2 className="animate-spin text-brand-600" aria-label="Loading account" /></div>;
  }

  if (!currentUser) {
    return (
      <div className="page-container grid min-h-[55vh] place-items-center py-12">
        <section className="card max-w-md p-7 text-center" aria-labelledby="chat-login-title">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700"><MessageCircle /></span>
          <h1 id="chat-login-title" className="mt-4 font-display text-2xl font-bold text-ink-900">Sign in to see your messages</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">Your conversations stay here. After signing in, you’ll return to Chat automatically.</p>
          <button type="button" onClick={() => openAuth()} className="btn-primary mt-6 w-full">Sign in to Chat</button>
        </section>
      </div>
    );
  }

  return (
    <div className="page-container flex h-[calc(100dvh-10.625rem-env(safe-area-inset-bottom))] min-h-0 flex-col py-3 md:block md:h-auto md:py-8">
      <h1
        className={`mb-3 font-display text-2xl font-bold text-ink-900 md:mb-6 ${
          mobileConversationOpen ? "hidden md:block" : "block"
        }`}
      >
        Messages
      </h1>
      <div className="grid min-h-0 flex-1 rounded-2xl border border-ink-100 shadow-soft md:h-[70vh] md:min-h-[32rem] md:grid-cols-3">
        <div className={`${mobileConversationOpen ? "hidden" : "flex"} flex-col overflow-hidden md:col-span-1 md:flex md:border-r`}>
          {chatLoading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-sm text-ink-500">
              <Loader2 className="animate-spin text-brand-600" />
              Loading conversations…
            </div>
          ) : chatError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-ink-500" role="alert">
              <MessageCircle className="text-red-400" />
              <p>{chatError}</p>
              <button type="button" onClick={retryUserChats} className="btn-secondary"><RefreshCw size={15} /> Try again</button>
            </div>
          ) : userChats.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-ink-400">
              <MessageCircle size={28} />
              No conversations yet. Chat with a seller from any listing page.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {userChats.map((chat) => {
                const otherId = chat.participantIds.find((id) => id !== currentUser.id);
                const other = getUserById(otherId);
                const listing = getListingById(chat.listingId);
                const last = chat.messages[chat.messages.length - 1];
                return (
                  <button
                    key={chat.id}
                    onClick={() => { setActiveChatId(chat.id); setMobileConversationOpen(true); }}
                    className={`flex min-h-16 w-full items-center gap-3 border-b border-ink-100 p-4 text-left transition-colors hover:bg-ink-50 ${
                      activeChatId === chat.id ? "bg-brand-50" : ""
                    }`}
                  >
                    {other?.avatar ? <img src={other.avatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" /> : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 font-bold text-brand-700">{other?.name?.[0] || "?"}</span>}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-semibold text-ink-900">{other?.name || "SellsPoint user"}</p>
                        {last && <span className="shrink-0 text-[11px] text-ink-400">{timeAgo(last.createdAt)}</span>}
                      </div>
                      <p className="truncate text-xs text-ink-500">{listing?.title}</p>
                      <p className="truncate text-xs text-ink-400">
                        {last ? (last.text || "📷 Photo") : "No messages yet"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className={`${mobileConversationOpen ? "flex" : "hidden"} min-h-0 flex-col overflow-hidden md:col-span-2 md:flex`}>
          <button type="button" onClick={() => setMobileConversationOpen(false)} className="flex h-11 shrink-0 items-center gap-1 border-b border-ink-100 px-3 text-sm font-semibold text-ink-600 hover:bg-ink-50 md:hidden">
            <ChevronLeft size={18} /> Conversations
          </button>
          <div className="min-h-0 flex-1">
            <ChatWindow chatId={activeChatId} />
          </div>
        </div>
      </div>
    </div>
  );
}
