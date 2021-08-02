
function onHashChange (e, page, params) { //default cb
    if (page) {
        setContent(page, params);
    }
}

const Router = {
    listen: function(cb, load = false) {
        this.onHashChange = cb;
        window.addEventListener('hashchange', this.__proto.evtCb);
        if(load) {
            window.addEventListener('load', (e) => {
                this.__proto.evtCb({ newURL: window.location.href });
            });
        }
    },
    disconnect: function() {
        window.removeEventListener('hashchange', this.__proto.evtCb);
    },
    wait: function(cb, ...params) {
        window.removeEventListener('hashchange', this.__proto.evtCb);
        const val = cb(...params);
        window.addEventListener('hashchange', this.__proto.evtCb);
        return val;
    },
    set: function(page, params = null) {
        this.wait(() => {
            window.location.href = `${window.location.href.split('#')[0]}#${page}${ params ? `=${JSON.stringify(params)}` : ''}`;
        });
    },
    __proto: {
        evtCb: function(e) {
            const page = e.newURL.split('#')[1];
            const splited = page.split('=');
            Router.onHashChange(
                e,
                splited[0],
                JSON.parse(window.decodeURI(splited[1]))
            );
        }
    }
};

/* ukazka pouziti */ 
Router.listen(onHashChange);

function setContent(page, params) {

    Router.set(page, params);

    console.log(page, params);

    /*
    ...setContent kód
    */
}

/* url např.: geohry4.skolazdola.cz#homeUser={"user":"Ludva"}
nereloadne stránku a přesměruje na homeUser s message user: Ludva
*/
