export default {
  async fetch(request, env) {
    const origin = env.ORIGIN_URL || "https://driplab-4jnmo2x4wa-an.a.run.app";
    const incoming = new URL(request.url);
    const target = new URL(incoming.pathname + incoming.search, origin);

    const headers = new Headers(request.headers);
    headers.set("Host", new URL(origin).host);
    headers.delete("cf-connecting-ip");

    return fetch(
      new Request(target.toString(), {
        method: request.method,
        headers,
        body: request.body,
        redirect: "manual",
      }),
    );
  },
};
