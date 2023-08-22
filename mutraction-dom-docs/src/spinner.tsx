import { track } from "mutraction-dom"
import { codeSample } from "./codesample.js";

function ex1() {
    const model = track({ isLoading: false, status: 0 });

    async function doRequest() {
        model.isLoading = true;
        const result = await fetch("https://httpstat.us/200?sleep=2000");
        
        model.status = result.status;
        model.isLoading = false;
    }

    const app = (
        <>
            <div mu:if={ model.isLoading} style={{ 
                    display: "inline-block", 
                    animation: "rotating 3s linear infinite" }}>
                Loading
            </div>
            <div mu:else>
                { model.status }
            </div>
            <br />
            <button onclick={ doRequest }>Fire request</button>
        </>
    );

    return app;
}

export function spinner() {
    return (
        <>
            <h1>Loading spinners</h1>
            <p>
                Using a boolean <code>isLoaded</code> property, can switch between a
                spinner and the loaded content.
            </p>
            { codeSample(`
                const model = track({ isLoading: false, status: 0 });

                async function doRequest() {
                    model.isLoading = true;
                    const result = await fetch("https://httpstat.us/200?sleep=2000");
                    
                    model.status = result.status;
                    model.isLoading = false;
                }

                const app = (
                    <>
                        <div mu:if={ model.isLoading} style={{ 
                                display: "inline-block", 
                                animation: "rotating 3s linear infinite" }}>
                            Loading
                        </div>
                        <div mu:else>
                            { model.status }
                        </div>
                        <br />
                        <button onclick={ doRequest }>Fire request</button>
                    </>
                );
                `, ex1()
            ) }
        </>
    );
}