import { todoApp } from "./todo/todo.js";

export function todoWrapper() {
    return(
        <>
            <h1>Todo example app</h1>
            <p>
                This shows how to use many mutraction's features together in a simple todo list.
                The <a href="https://github.com/tomtheisen/mutraction/tree/master/mutraction-dom-docs/src/examples/todo">source code</a> is
                available on github.
            </p>
            <p><a href="sandbox/#lVXNjts2EL7rKQY6SYDX6l69soJts0EDNGmR+BbkQEkjizVFChTltbHwsbcCOfWW9jn6PHmBvEKHlKxIthZIdbE5M/zm75shr2qlDTyB0SzbLeCV0g8sK39D3fDGwAkKrSrwq9bqDVfyJleVf+d55lgjbFSuXhusYA3v0LRabkgaW5UqoGI7tMrkzita6S4PssBwI3AFjdFcbkN48oA+7TBsMFa7gFxJsimYaOiAOTdk25/hdOedvExJCrJSOQoKwaUQdFASH62fTefG9xdOyknUrOCDO9hviMf/sT3CVqsMNcfGDxczJq8QczAlQsbMvMWb1jCD0KgKQaW/Y2YGqI/AmqFeHz4uvFM4qovGSu0xsPGtBqtzWboseX6gHF2uS5fHksscD78W7haBuQQLCKxhsoYfwolxUwueoVUu4Da0xRucW4N3SGD6mQCiCHaINVUfhMqYoLbZNDXflhSXdDXhsm4NPHJTKvplfVP2THOWChzlYfuoNKUSd1f2TLS4fnJRLF3jiXVRYsv18+bNL6+t0YPACqUh2o1oEidDB2LBoWpXvDjj9GSB0zcb+z2dvZ8m4jhtjaFCKJlRkXYEEoSwTiAYxbTury5dvIupm3VHypD8ffn8Rxx1eMl3OZkDsjh//3mNE0eCX2WNdOH7XI1YFj7n4n+EanTrIv386eu/n55BEixFMZU5edd7uynWflZitkvVwQf3D/NzF+38Exkox+Yos4c9UcBaM7lFnyhyjdrUTBI5j4IIRVsED+YlZkozS/PVCPMF+IJLvDGlVu229IFWhCSFD6dTMqViHFnQi6yii7S+9SWOksls5eo+zwPcr+B9m1bcuCTOczWez7ptymDYJJ1mvMTCfsKvNdQJ3++UuF/WGq2Ll1iwVphgOukN7fpgzrtTBGwBqWv027ZKaRswV60Qbs6CtBNMQTNV1QIN3gsxi110T4qj3cAi14aOQg4ND+4d6laEof1zX9ekD7qijipd3navA3FkphSnZKPohYqj8nZ054rONl2yfW9/0iO0suCSNyXmMyN3dXmUL2H81J+ACTFzuxWXG2j6wgajSnVL5Vyi0UYOw9HCiqMxZkzVrSi4xrGLonOEu9x7/bjVgmVYKkG4a/8tPjo//rCB5+p5MXwO52r2+holX/75a25n2RCH6fCo3V6ustYu9GWq8uOS1TXlGvRdD+/+Aw==">Try it in the sandbox ⤴️</a></p>
            <hr />
            { todoApp }
        </>
    );
}
