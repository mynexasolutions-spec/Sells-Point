"use client";

import { MessageCircle, Heart, ShoppingCart, Tag, Shield, Megaphone } from "lucide-react";
import { useApp } from "@/context/AppContext";

function getNotificationIcon(notification) {
  switch (notification.type) {
    case "message":
      return <MessageCircle size={16} className="text-blue-500" />;
    case "favorite":
      return <Heart size={16} className="text-pink-500" />;
    case "listing_sold":
      return <ShoppingCart size={16} className="text-green-500" />;
    case "price_drop":
      return <Tag size={16} className="text-orange-500" />;
    case "admin":
      return notification.entityType === "announcement"
        ? <Megaphone size={16} className="text-amber-500" />
        : <Shield size={16} className="text-purple-500" />;
    case "featured_approved":
    case "featured_rejected":
    case "featured_quote_ready":
    case "featured_activated":
    case "user_banned":
      return <Shield size={16} className="text-purple-500" />;
    default:
      return <MessageCircle size={16} className="text-ink-400" />;
  }
}

function getAnnouncementById(announcements, id) {
  return announcements.find((announcement) => announcement.id === id) || null;
}

function getNotificationText(notification, getUserById, getListingById, publicAnnouncements) {
  const actor = notification.actorId ? getUserById(notification.actorId) : null;
  const listing = notification.entityType === "listing" ? getListingById(notification.entityId) : null;
  const announcement =
    notification.entityType === "announcement"
      ? getAnnouncementById(publicAnnouncements, notification.entityId)
      : null;

  switch (notification.type) {
    case "message":
      return actor ? `${actor.name} sent you a message` : "You have a new message";
    case "favorite":
      return actor ? `${actor.name} favorited your listing` : "Someone favorited your listing";
    case "listing_sold":
      return listing ? `"${listing.title}" has been sold` : "A listing you favorited has been sold";
    case "price_drop":
      return listing ? `Price drop on "${listing.title}"` : "Price drop on a favorited item";
    case "featured_approved":
      return listing
        ? `Your listing "${listing.title}" has been approved as featured`
        : "Your listing has been approved as featured";
    case "featured_rejected":
      return listing
        ? `Your listing "${listing.title}" was not approved as featured`
        : "Your listing was not approved as featured";
    case "featured_quote_ready":
      return listing ? `Your mock boost quote for "${listing.title}" is ready: ₹${Number(listing.promotionPrice || 0).toLocaleString("en-IN")}` : "Your mock boost quote is ready";
    case "featured_activated":
      return listing ? `Mock payment successful — "${listing.title}" is now featured` : "Mock payment successful — your listing is now featured";
    case "user_banned":
      return "Your account has been suspended by admin";
    case "admin":
      return notification.entityType === "announcement" && announcement
        ? announcement.title
        : "Admin notification";
    default:
      return "New notification";
  }
}

function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function NotificationPanel() {
  const {
    notifications,
    publicAnnouncements,
    getUserById,
    getListingById,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="w-80 max-h-96 overflow-hidden rounded-xl border border-ink-100 bg-white shadow-soft animate-fade-in">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-ink-900">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-ink-400">
            No notifications yet
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {notifications.map((notification) => {
              const announcement =
                notification.entityType === "announcement"
                  ? getAnnouncementById(publicAnnouncements, notification.entityId)
                  : null;

              return (
                <button
                  key={notification.id}
                  onClick={() => !notification.read && markNotificationRead(notification.id)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-50 ${
                    !notification.read ? "bg-brand-50/30" : ""
                  }`}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-100">
                    {getNotificationIcon(notification)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.read ? "font-semibold text-ink-900" : "text-ink-700"}`}>
                      {getNotificationText(notification, getUserById, getListingById, publicAnnouncements)}
                    </p>
                    {announcement?.body && (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-500">
                        {announcement.body}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-ink-500">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
