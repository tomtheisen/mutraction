export async function getShortLink(href: string) {
    const url = new URL(href);
    url.protocol = "https:";
    url.host = "mutraction.dev";
    url.port = "443";
    href = url.href;

    const response = await fetch("https://link.mutraction.dev/link", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ href }),
    });
    if (response.ok) {
        const { id } = await response.json();
        return `https://mutraction.dev/link/${ id }`;
    }
    else {
        throw Error((await response.text()) ?? "Failed to get short link");
    }
}

