        class Fetch {
            constructor(server, params = new FormData(), {
                method = 'GET',
                header = ['Content-type', 'application/x-www-form-urlencoded'],
                mimeType = null,
                json = true
            } = {
                method: 'GET',
                header: ['Content-type', 'application/x-www-form-urlencoded'],
                mimeType: null,
                json: true
            }) {
                this.server = server;
                this.callbacks = {
                    result: () => {},
                    progress: () => {},
                    percentProgress: () => {},
                    error: () => {},
                    complete: () => {},
                    abort: () => {}
                };

                if(typeof params === 'object' && params !== null) {
                    const fd = new FormData();
                    for(const key in params) {
                        fd.set(key, params[key]);
                    }
                    params = fd;
                }

                const http = new XMLHttpRequest();
                http.open(method, this.server, true);
                http.setRequestHeader(...header);

                http.addEventListener('readystatechange', (e) => {
                    if (http.readyState == 4 && http.status == 200) {
                        const result = http.responseText;
                        let parsed = result;
                        let type = 'text';
                        
                        if(json === true) {
                            try {
                                parsed = JSON.parse(result);
                                type = 'json';
                            } catch(e) {}
                        }

                        this.callbacks.result({
                            parsed,
                            raw: result,
                            type
                        });
                    }
                });

                http.addEventListener("progress", (e) => {
                    this.callbacks.progress(e);

                    if (e.lengthComputable) {
                        const percentComplete = e.loaded / e.total * 100;
                        this.callbacks.percentProgress(percentComplete, e);
                    } else {
                        this.callbacks.percentProgress(null, e);
                    }
                });

                http.addEventListener("error", this.callbacks.error);
                http.addEventListener("load", this.callbacks.complete);
                http.addEventListener("abort", this.callbacks.abort);

                if (mimeType !== null) {
                    http.overrideMimeType(mimeType);
                }

                http.send(params);

                return this;
            }

            then(callback) {
                this.callbacks.result = callback;
                return this;
            }

            on(event, callback) {
                this.callbacks[event] = callback;
                return this;
            }

        }

        Fetch.currentServer = window.location.origin;
