
async function DisplayLoader(func, time = null, err = () => {},  color = "blue", width = 6) {
    const loader = ElemFromText(`<section class="loader"><div class="lds-ring" style="--color: ${color}; --width: ${width}px;"><div></div><div></div><div></div><div></div></div></section>`);
    document.body.prepend(loader);

    let timeout;
    if(time) {
        timeout = window.setTimeout(() => {
            err(loader);
        }, time);
    }
    
    const value = await func();
    loader.remove();

    if(timeout !== undefined) {
        window.clearTimeout(timeout);
    }
    return value;
}

function toggleHidePage() {
    Array.from(document.body.children).forEach((child, i) => {
        if(i !== 0) {
            child.classList.toggle("hidden");
        }
    });
}