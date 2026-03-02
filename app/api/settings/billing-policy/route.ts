// Billing start policy is now per-client (set at client creation time), not a global setting.
export async function PATCH() {
  return Response.json(
    { error: 'Billing start policy is now set per-client at creation time.' },
    { status: 410 }
  );
}
