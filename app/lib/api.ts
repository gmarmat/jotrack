export async function postJSON(url: string, body: any) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  let json: any = null;
  try {
    json = await r.json();
  } catch {}
  return { ok: r.ok, status: r.status, json };
}

