export async function getShortLink(href: string) {
    const response = await fetch("https://link.mutraction.dev/link", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ href }),
    });
    const { id } = await response.json();

    return `https://mutraction.dev/link/${ id }`;
}

