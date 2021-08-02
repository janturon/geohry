const Router = {
    onHashChange: function(e) { //default cb
        const page = e.newURL.split('#')[1];
        if (page) {
            setContent(page);
        }
    },
    listen: function(load = false, cb = null) {
        this.onHashChange = cb || this.onHashChange;
        window.addEventListener('hashchange', this.onHashChange);
        if(load) {
            window.addEventListener('load', (e) => {
                this.onHashChange({ newURL: window.location.href })
            });
        }
    },
    disconnect: function() {
        window.removeEventListener('hashchange', this.onHashChange);
    },
    wait: function(cb, ...params) {
        window.removeEventListener('hashchange', this.onHashChange);
        const val = cb(...params);
        window.addEventListener('hashchange', this.onHashChange);
        return val;
    },
    set: function(page) {
        this.wait(() => {
            window.location.href = `${window.location.href.split('#')[0]}#${ page }`;
        });
    }
};

/* ukazka pouziti */ 
Router.listen();

function setContent(page) {

    Router.set(page);

    console.log(page);

    /*
    ...setContent kód
    */
}
