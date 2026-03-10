import { apiRequest } from "@/services/apiClient";

export async function sendSupportTicketEmail(ticket) {
  const payload = await apiRequest("/email/send", {
    method: "POST",
    body: JSON.stringify(ticket),
  });

  if (!payload || Number(payload.code) !== 200) {
    throw new Error(payload?.msg || "Unable to send support ticket email.");
  }

  return payload;
}
