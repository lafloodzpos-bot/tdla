export async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID;
  if (!token || !chatId) {
    console.log("[telegram] Skipped - env vars not configured");
    return { sent: false, reason: "missing_env_vars" };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: false }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[telegram] API error:", err);
      return { sent: false, reason: "api_error", detail: err };
    }
    return { sent: true };
  } catch (err) {
    console.error("[telegram] Network error:", err);
    return { sent: false, reason: "network_error", detail: String(err) };
  }
}