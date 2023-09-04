export function notFound(badRoute: string) {
    return (
        <>
            <h1>
                Oopsie Woopsie!!  We made a little mistake!! We're working VERY HARD to fix this!!
            </h1>
            <p>
                Route received: <code>{badRoute}</code>
            </p>
        </>
    );
}
