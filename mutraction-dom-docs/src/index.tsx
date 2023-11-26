import { version } from "mutraction-dom";
import { muLogo } from "./mulogo.js";
import { nav } from "./nav.js";
import { routes } from "./routes.js";

const app = (
    <>
        <header>
            <div style={{ position: "relative", top: "4px" }}>{ muLogo(50) }</div>
            <h1>traction</h1>
            <span style={{ padding: "1em", fontWeight: "bold"}}><a href="./sandbox">Sandbox</a></span>            
            <span style={{ padding: "1em", color: "#fff6" }}>v{ version }</span>
            <a href="https://github.com/tomtheisen/mutraction">
                <img src="assets/github-logo.svg" alt="Github" style={{ height: "34px", width: "34px" }} />
            </a>
        </header>
        <div className="layout">
            { nav }
            <main>
                <div style={{ maxWidth: "960px",  margin: "0 auto" }}>
                    { routes }
                </div>

                { document.createComment("https://www.netlify.com/legal/open-source-policy/") }
                <div style={{ textAlign: "center", marginTop: "3em", opacity: "80%" }}>
                    <a href="https://www.netlify.com"> <img src="assets/netlify-logo.svg" alt="Deploys by Netlify" /> </a>
                </div>
            </main>
        </div>
    </>
);
document.body.append(app);
