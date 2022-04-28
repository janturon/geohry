
class CircleLoader {
    constructor(func, time = null, options) {
        this.waitFor = func;
        this.timeout = null;
        this.deadline = time;

        this.options = Object.assign({
            text: "",
            color: "blue",
            width: 6
        }, options);

        this.event = {
            error: () => { },
            success: () => { }
        };

        const loader = ElemFromText(`
        <section class="loader">
            <div class="lds-ring" style="--color: ${this.options.color}; --width: ${this.options.width}px;">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            ${this.options.text}
        </section>`);
        document.body.prepend(loader);

        if (this.deadline) {
            this.timeout = window.setTimeout(() => {
                this.event.error(loader);
            }, this.deadline);
        }

        (async () => {
            await func();
            this.event.success(loader);
        })();

        return this;
    }

    onError(callback) {
        this.event.error = callback.bind(this);
        return this;
    }

    onSuccess(callback) {
        this.event.success = callback.bind(this);
        return this;
    }
}

function toggleHidePage() {
    Array.from(document.body.children).forEach((child, i) => {
        if (i !== 0) {
            child.classList.toggle("hidden");
        }
    });
}
