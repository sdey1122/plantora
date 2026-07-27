document.addEventListener("DOMContentLoaded", () => {
  const socket = io();

  const badge = document.querySelector(".header-badge");

  if (!badge) return;

  socket.on("new-notification", (notification) => {
    const count = Number(badge.textContent || 0) + 1;

    window.PlantoraHeader.refreshNotificationBadge(count);

    console.log(notification);
  });
});
