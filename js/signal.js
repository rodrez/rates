// keeps track of running reactions/derivations
const context = [];

function subscribe(running, subscriptions) {
    subscriptions.add(running);
    running.dependencies.add(subscriptions);
}

function createSignal(value) {
    // Holds the subscriptions for the signal created
    const subscriptions = new Set();

    // If it's not running then it returns the value
    const read = () => {
        //
        const running = context[context.length - 1];
        if (running) subscribe(running, subscriptions);
        return value;
    };

    // Updates the value
    const write = (nextValue) => {
        value = nextValue;

        for (const sub of [...subscriptions]) {
            sub.execute();
        }
    };

    // returns the read value as a callable, and the write/set
    return [read, write];
}

// Handling the reactions and derivations
function cleanup(running) {
    for (const dep of running.dependencies) {
        dep.delete(running);
    }
    running.dependencies.clear();
}

function createEffect(fn) {
    const execute = () => {
        cleanup(running);
        context.push(running);
        try {
            fn();
        } finally {
            context.pop();
        }
    };

    const running = {
        execute,
        dependencies: new Set(),
    };

    execute();
}

function createMemo(fn) {
    const [s, set] = createSignal();
    createEffect(() => set(fn()));
    return s;
}

export { createSignal, createEffect, createMemo  }