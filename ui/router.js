const Router = {
    pages: [],
    pageIndex: -1, //start with negative index!
    events: {},
    ignoreStatus: false,
    listen: function(cb, load = false) {
        Router.onHashChange = cb;
        Router.connect();
        if(load) {
            window.addEventListener('load', (e) => {
                Router.eventCallback({ newURL: window.location.href });
            });
        }
    },
    connect: function() {
        window.addEventListener('popstate', Router.eventCallback);
    },
    set: function(page, message) {
        if(Router.ignoreStatus === true) return;

        history.pushState({
            page
        }, null);
        Router.pageIndex++;
        Router.pages.push({ page, message });
    },
    eventCallback: function(e) {
        if(Router.ignoreStatus === true) return;

        const currPage = Router.pages[Router.pageIndex];
        if(Router.events[currPage] && typeof Router.events[currPage] === 'function') {
            Router.events[currPage](e);
        }
        if(Router.prevPage) {
            Router.onHashChange({
                currentPage: Router.curentPage,
                prevPage: Router.prevPage,
            });
            Router.pages.pop();
            Router.pageIndex--;
        } else {
            window.history.back();
        }
    },
    back: function() {
        window.history.back();
    },
    on: function(page, callback) {
        Router.events[page] = callback;
    },
    get curentPage() {
        return Router.pages[Router.pageIndex];
    },
    get prevPage() {
        return Router.pages[Router.pageIndex - 1];
    },
    root: function() { //async cause setContent should load
        const rootPage = Router.pages[0];
        setContent(rootPage.page, rootPage.message);
        Router.pages = [rootPage];
    },
    ignore: function(callback) {
        Router.ignoreStatus = true;
        callback();
        Router.ignoreStatus = false;
    }
};
