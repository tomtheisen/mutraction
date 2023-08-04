import { track } from "mutraction";

type Character = {
    name: string,
    allergies: string[],
    aptitudes?: {
        flying?: number,
        swimming?: number,
        fencing?: number,
    },
    wildcard?: any,
}

const [character, tracker] =  track(
    { name: "donkey", allergies: ["shellfish"] } as Character);

/*
 * basic undo and redo
 */
character.name = "burro";
console.log(character.name); // burro

tracker.undo();
console.log(character.name); // donkey

tracker.redo();
console.log(character.name); // burro

/*
 * transactions
 */
tracker.startTransaction();
function setAptitudes() {
    character.aptitudes = {};
    character.aptitudes.flying = 1.8;
    character.aptitudes.swimming = 5.5;
    character.aptitudes.fencing = 3.4;
}
setAptitudes();
tracker.rollback();
console.log(character.aptitudes); // undefined

// transactions can also be undone
tracker.startTransaction();
setAptitudes();
tracker.commit();
console.log(character.aptitudes); // { flying: 1.8, swimming: 5.5, fencing: 3.4 }

tracker.undo();
console.log(character.aptitudes); // undefined

tracker.redo();
console.log(character.aptitudes); // { flying: 1.8, swimming: 5.5, fencing: 3.4 }

/*
 * dependency tracking
 */
const dep = tracker.startDependencyTrack();
(character.name, character.aptitudes?.flying, character.aptitudes?.swimming); 
dep.endDependencyTrack();

// (these are `character` and `character.aptitudes`)
console.log(dep.trackedObjects.size); // 2 

// dependency versioning
const gen1 = dep.getLatestChangeGeneration();
character.allergies.push("pollen");
const gen2 = dep.getLatestChangeGeneration();
// there were no assignments to any properties of tracked objects
console.log(gen1 == gen2); // true

character.aptitudes!.fencing = 99;
const gen3 = dep.getLatestChangeGeneration();
// a property assignment to a tracked object increased the generation number
console.log(gen2 < gen3); // true

/*
 * change notifications
 */
// get notified when changes happen
const sub = tracker.subscribe(mutation => console.log("Change observed", mutation))
character.aptitudes!.fencing = 0.7; // produces output:
/*
Change observed {
  type: 'change',
  target: { flying: 1.8, swimming: 5.5, fencing: 99 },
  name: 'fencing',
  oldValue: 99,
  newValue: 0.7
}
*/

// stop getting notified
sub.dispose();
character.aptitudes!.fencing = 1.3; // no output

/*
 * arrays
 */
const hist1 = tracker.history.length;
character.allergies.push("fun", "sunlight");
const hist2 = tracker.history.length;

// many seemingly atomic array operations consist of multiple mutations
// wrap them in transactions if you want clean undo
console.log(hist2 - hist1); // 3

/*
 * limitations
 */
function beWeird() {
    try {
        character.wildcard = arguments;
    }
    catch (ex) {
        console.log(ex); // Error: Tracking of exotic arguments objects not supported
    }
}
beWeird();

// also named module exports and integer-indexed exotic objects 
// like UInt8Array aren't supported
