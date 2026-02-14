interface SendAuthEmailParams {
  to: string;
  subject: string;
  text: string;
}

export async function sendAuthEmail(params: SendAuthEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.AUTH_FROM_EMAIL || process.env.FEEDBACK_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.warn("Auth email skipped: missing RESEND_API_KEY or AUTH_FROM_EMAIL/FEEDBACK_FROM_EMAIL");
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [params.to],
      subject: params.subject,
      text: params.text,
    }),
  });
}
