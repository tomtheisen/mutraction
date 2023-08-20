import { muLogo } from "./mulogo.js";
import { nav } from "./nav.js";
import { routes } from "./routes.js";

const app = (
    <>
        <header>
            <div style={{ position: "relative", top: "4px" }}>{ muLogo(50) }</div>
            <h1>traction</h1>
            <a href="https://github.com/tomtheisen/mutraction"><img src="assets/github-logo.svg" style={{height: "34px"}} /></a>
        </header>
        <div className="layout">
            { nav }
            <main>
                <div style={{ maxWidth: "960px",  margin: "0 auto" }}>
                    { routes }
                </div>
            </main>
        </div>
    </>
);

document.body.append(app);
