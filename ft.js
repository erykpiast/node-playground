(function(D, undefined) {
    'use strict';

    // cross script communication
    if (window['-=UTC-NO-REC']) {
        return;
    }

    // var host = 'http://it-13.cpu2.cogision.pl';
    var host = 'https://usabilitytools.com';
    var scriptVersion = '1.0.0';

    var Settings = {
        experiment: window['UT-FT-PROJECT-ID'],
        sessionAddr: host + '/form-tester/rest/config',
        ripperAddr: host + '/app/form-tester/ripper.js',
        addr: host + '/form-tester/',
        addrWs: host.replace(/^https?/, 'wss') + '/form-tester/'
    };


    var M, Rec, Comm, Dom, insertionQ, requireRipper;


    function overwriteDefaults(def, spec) {
        if (('object' === typeof def) && ('object' === typeof spec)) {
            Object.keys(def).forEach(function(key) {
                def[key] = overwriteDefaults(def[key], spec[key]);
            });

            return def;
        } else {
            return spec;
        }
    }

    function mergeArrays(arr1, arr2) {
        return arr1.concat(arr2);
    }

    function negateResult(fn, thisArg) {
        return function() {
            return !fn.apply(thisArg, arguments);
        };
    }

    function isDuplicated(value, index, arr) {
        return (arr.indexOf(value) !== index);
    }

    function isNullOrUndefined(value) {
        return (('undefined' === typeof value) || (value === null));
    }


    var apiSettings = overwriteDefaults({
        // legacy
        basicFormIdentification: false,
        basicFieldIdentification: {
            id: true,
            name: true,
            className: true
        },
        // new format
        formId: {
            id: true,
            name: true,
            class: true,
            action: true,
            data: true
        },
        fieldId: {
            id: true,
            name: true,
            class: true,
            data: true,
            tag: true,
            type: true,
            submit: ''
        },
        submit: '',
        blurText: ''
    }, window['UT-FT-API-STATIC']) || {};

    if (apiSettings.submit) {
        if (!apiSettings.fieldId) {
            apiSettings.fieldId = {
                id: true,
                name: true,
                class: true,
                data: true,
                tag: true,
                type: true,
                submit: apiSettings.submit
            };
        } else {
            apiSettings.fieldId.submit = apiSettings.submit;
        }
    }

    var submitSelector = '';
    if (apiSettings.fieldId && apiSettings.fieldId.submit) {
        submitSelector = apiSettings.fieldId.submit;
    }



    // XHR ---------------------------------------------- >>
    /* jshint ignore:start */
    var xhr = function(e) {
        return e()
    }(function() {
        return function e(t, n, r) {
            function o(s, u) {
                if (!n[s]) {
                    if (!t[s]) {
                        var a = "function" == typeof require && require;
                        if (!u && a) return a(s, !0);
                        if (i) return i(s, !0);
                        var c = Error("Cannot find module '" + s + "'");
                        throw c.code = "MODULE_NOT_FOUND", c
                    }
                    var f = n[s] = {
                        exports: {}
                    };
                    t[s][0].call(f.exports, function(e) {
                        var n = t[s][1][e];
                        return o(n ? n : e)
                    }, f, f.exports, e, t, n, r)
                }
                return n[s].exports
            }
            for (var i = "function" == typeof require && require, s = 0; s < r.length; s++) o(r[s]);
            return o
        }({
            1: [function(e, t) {
                "use strict";

                function n(e, t) {
                    function n() {
                        4 === p.readyState && c()
                    }

                    function r() {
                        var e = void 0;
                        if (p.response ? e = p.response : "text" !== p.responseType && p.responseType || (e = p.responseText || p.responseXML), g) try {
                            e = JSON.parse(e)
                        } catch (t) {}
                        return e
                    }

                    function o(e) {
                        clearTimeout(d), e instanceof Error || (e = Error("" + (e || "unknown"))), e.statusCode = 0, t(e, f)
                    }

                    function c() {
                        clearTimeout(d);
                        var e = 1223 === p.status ? 204 : p.status,
                            n = f,
                            o = null;
                        0 !== e ? (n = {
                            body: r(),
                            statusCode: e,
                            method: y,
                            headers: {},
                            url: w,
                            rawRequest: p
                        }, p.getAllResponseHeaders && (n.headers = s(p.getAllResponseHeaders()))) : o = Error("Internal XMLHttpRequest Error"), t(o, n, n.body)
                    }
                    var f = {
                        body: void 0,
                        headers: {},
                        statusCode: 0,
                        method: y,
                        url: w,
                        rawRequest: p
                    };
                    if ("string" == typeof e && (e = {
                            uri: e
                        }), e = e || {}, void 0 === t) throw Error("callback argument missing");
                    t = i(t);
                    var p = e.xhr || null;
                    p || (p = e.cors || e.useXDR ? new a : new u);
                    var l, d, w = p.url = e.uri || e.url,
                        y = p.method = e.method || "GET",
                        h = e.body || e.data,
                        v = p.headers = e.headers || {},
                        b = !!e.sync,
                        g = !1;
                    if ("json" in e && (g = !0, v.Accept || (v.Accept = "application/json"), "GET" !== y && "HEAD" !== y && (v["Content-Type"] = "application/json", h = JSON.stringify(e.json))), p.onreadystatechange = n, p.onload = c, p.onerror = o, p.onprogress = function() {}, p.ontimeout = o, p.open(y, w, !b), p.withCredentials = !!e.withCredentials, !b && e.timeout > 0 && (d = setTimeout(function() {
                            p.abort("timeout")
                        }, e.timeout + 2)), p.setRequestHeader)
                        for (l in v) v.hasOwnProperty(l) && p.setRequestHeader(l, v[l]);
                    else if (e.headers) throw Error("Headers cannot be set on an XDomainRequest object");
                    return "responseType" in e && (p.responseType = e.responseType), "beforeSend" in e && "function" == typeof e.beforeSend && e.beforeSend(p), p.send(h), p
                }

                function r() {}
                var o = e("global/window"),
                    i = e("once"),
                    s = e("parse-headers"),
                    u = o.XMLHttpRequest || r,
                    a = "withCredentials" in new u ? u : o.XDomainRequest;
                t.exports = n
            }, {
                "global/window": 2,
                once: 3,
                "parse-headers": 7
            }],
            2: [function(e, t) {
                (function(e) {
                    t.exports = "undefined" != typeof window ? window : void 0 !== e ? e : "undefined" != typeof self ? self : {}
                }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
            }, {}],
            3: [function(e, t) {
                function n(e) {
                    var t = !1;
                    return function() {
                        return t ? void 0 : (t = !0, e.apply(this, arguments))
                    }
                }
                t.exports = n, n.proto = n(function() {
                    Object.defineProperty(Function.prototype, "once", {
                        value: function() {
                            return n(this)
                        },
                        configurable: !0
                    })
                })
            }, {}],
            4: [function(e, t) {
                function n(e, t, n) {
                    if (!s(t)) throw new TypeError("iterator must be a function");
                    arguments.length < 3 && (n = this), "[object Array]" === u.call(e) ? r(e, t, n) : "string" == typeof e ? o(e, t, n) : i(e, t, n)
                }

                function r(e, t, n) {
                    for (var r = 0, o = e.length; o > r; r++) a.call(e, r) && t.call(n, e[r], r, e)
                }

                function o(e, t, n) {
                    for (var r = 0, o = e.length; o > r; r++) t.call(n, e.charAt(r), r, e)
                }

                function i(e, t, n) {
                    for (var r in e) a.call(e, r) && t.call(n, e[r], r, e)
                }
                var s = e("is-function");
                t.exports = n;
                var u = Object.prototype.toString,
                    a = Object.prototype.hasOwnProperty
            }, {
                "is-function": 5
            }],
            5: [function(e, t) {
                function n(e) {
                    var t = r.call(e);
                    return "[object Function]" === t || "function" == typeof e && "[object RegExp]" !== t || "undefined" != typeof window && (e === window.setTimeout || e === window.alert || e === window.confirm || e === window.prompt)
                }
                t.exports = n;
                var r = Object.prototype.toString
            }, {}],
            6: [function(e, t, n) {
                function r(e) {
                    return e.replace(/^\s*|\s*$/g, "")
                }
                n = t.exports = r, n.left = function(e) {
                    return e.replace(/^\s*/, "")
                }, n.right = function(e) {
                    return e.replace(/\s*$/, "")
                }
            }, {}],
            7: [function(e, t) {
                var n = e("trim"),
                    r = e("for-each"),
                    o = function(e) {
                        return "[object Array]" === Object.prototype.toString.call(e)
                    };
                t.exports = function(e) {
                    if (!e) return {};
                    var t = {};
                    return r(n(e).split("\n"), function(e) {
                        var r = e.indexOf(":"),
                            i = n(e.slice(0, r)).toLowerCase(),
                            s = n(e.slice(r + 1));
                        void 0 === t[i] ? t[i] = s : o(t[i]) ? t[i].push(s) : t[i] = [t[i], s]
                    }), t
                }
            }, {
                "for-each": 4,
                trim: 6
            }]
        }, {}, [1])(1)
    });
    /* jshint ignore:end */
    // << ---------------------------------------------- XHR


    // SimpleSocket ---------------------------------------------- >>
    /* jshint ignore:start */
    var SimpleSocket = (function() {
        return function a(b, c, d) {
            function e(g, h) {
                if (!c[g]) {
                    if (!b[g]) {
                        var i = "function" == typeof require && require;
                        if (!h && i) return i(g, !0);
                        if (f) return f(g, !0);
                        var j = new Error("Cannot find module '" + g + "'");
                        throw j.code = "MODULE_NOT_FOUND", j
                    }
                    var k = c[g] = {
                        exports: {}
                    };
                    b[g][0].call(k.exports, function(a) {
                        var c = b[g][1][a];
                        return e(c ? c : a)
                    }, k, k.exports, a, b, c, d)
                }
                return c[g].exports
            }
            for (var f = "function" == typeof require && require, g = 0; g < d.length; g++) e(d[g]);
            return e
        }({
            1: [function(a, b) {
                (function(c) {
                    b.exports = function() {
                        function b(a) {
                            e.prototype.constructor.call(this), this._queue = f({
                                timeout: 100,
                                concurrency: 1
                            }), this.engine = null, this._connecting = !1, this._disconnected = !0, this._options = g({
                                autoConnect: !1,
                                autoReconnect: !0
                            }, a), this.url = this._options.url, this._options.autoConnect && this.connect(this.url)
                        }
                        var d = a("util"),
                            e = a("events").EventEmitter,
                            f = a("queue"),
                            g = a("extend"),
                            h = a("./lib/web-socket");
                        return b.supported = !!h, d.inherits(b, e), g(b.prototype, {
                            connect: function(a) {
                                return this._disconnected ? (this.engine && (this._queue.end(), this.engine.close(), this.engine = null), this._disconnected = !1, this._closedManually = !1, this._connected = !0, this.url = this.url || a, this._createSocket()) : this.emit("error", "socket connection is already estabilished"), this
                            },
                            disconnect: function() {
                                return this._disconnected || this._closedManually ? this.emit("error", "socket connection is already closed or closing") : (this._closedManually = !0, this.engine.close()), this
                            },
                            isConnected: function() {
                                return this.engine && this.engine.readyState === this.engine.OPEN
                            },
                            send: function(a) {
                                var b;
                                try {
                                    b = JSON.stringify(a)
                                } catch (c) {
                                    return this.emit("error", "cannot parse message to JSON"), !1
                                }
                                if (this.isConnected()) this.engine.send(b);
                                else if (this._queue.push(this.send.bind(this, a)), this._connected) {
                                    if (!this._options.autoReconnect || this._closedManually || this._connecting) return this.emit("error", "try to send a message but socket was closed manually or is disconnected and autoReconnect option is not enabled"), !1;
                                    this._reconnect()
                                } else this.emit("error", "try to send a message but socket has never been connected");
                                return this
                            },
                            receive: function(a, b) {
                                var c = a.split(" ").map(function(a) {
                                    return a.toLowerCase()
                                });
                                return c.forEach(function() {
                                        this.addListener("message_" + c, b)
                                    }, this),
                                    function() {
                                        c.forEach(function() {
                                            this.removeListener("message_" + c, b)
                                        }, this)
                                    }
                            },
                            _reconnect: function() {
                                this._reconnecting = !0, this._createSocket()
                            },
                            _createSocket: function() {
                                try {
                                    this.engine = new h(this.url)
                                } catch (a) {
                                    return this.emit("error", a)
                                }
                                this._connecting = !0, this.engine.addEventListener("open", this._engineHandlers.open.bind(this)), this.engine.addEventListener("message", this._engineHandlers.message.bind(this)), this.engine.addEventListener("error", this._engineHandlers.error.bind(this)), this.engine.addEventListener("close", this._engineHandlers.close.bind(this))
                            },
                            _engineHandlers: {
                                open: function() {
                                    this.engine.readyState === this.engine.OPEN && (this._reconnecting ? (this.emit("reconnect"), this._reconnecting = !1) : this.emit("connect"), this._connecting = !1, c.nextTick(function() {
                                        this._queue.start()
                                    }.bind(this)))
                                },
                                message: function(a) {
                                    var b;
                                    try {
                                        b = JSON.parse(a.data), b.type = b.type.toLowerCase()
                                    } catch (c) {
                                        return this.emit("error", "cannot parse message to JSON", b), !1
                                    }
                                    return "undefined" != typeof b.type && null !== b.type && "" !== b.type ? (this.emit("message", b), this.emit("message_" + b.type, b.data), !0) : (this.emit("error", "message has not a valid type", b), !1)
                                },
                                close: function(a) {
                                    (this._closedManually || !this._options.autoReconnect) && (this._disconnected = !0, this.engine = null, this.emit("disconnect", a))
                                },
                                error: function(a) {
                                    this.emit("error", a)
                                }
                            }
                        }), b
                    }()
                }).call(this, a("_process"))
            }, {
                "./lib/web-socket": 2,
                _process: 6,
                events: 4,
                extend: 3,
                queue: 9,
                util: 8
            }],
            2: [function(a, b) {
                b.exports = window.WebSocket || window.mozWebSocket || window.webkitWebSocket
            }, {}],
            3: [function(a, b) {
                var c, d = Object.prototype.hasOwnProperty,
                    e = Object.prototype.toString,
                    f = function(a) {
                        "use strict";
                        if (!a || "[object Object]" !== e.call(a) || a.nodeType || a.setInterval) return !1;
                        var b = d.call(a, "constructor"),
                            f = a.constructor && a.constructor.prototype && d.call(a.constructor.prototype, "isPrototypeOf");
                        if (a.constructor && !b && !f) return !1;
                        var g;
                        for (g in a);
                        return g === c || d.call(a, g)
                    };
                b.exports = function g() {
                    "use strict";
                    var a, b, d, e, h, i, j = arguments[0],
                        k = 1,
                        l = arguments.length,
                        m = !1;
                    for ("boolean" == typeof j ? (m = j, j = arguments[1] || {}, k = 2) : ("object" != typeof j && "function" != typeof j || j == c) && (j = {}); l > k; ++k)
                        if (null != (a = arguments[k]))
                            for (b in a) d = j[b], e = a[b], j !== e && (m && e && (f(e) || (h = Array.isArray(e))) ? (h ? (h = !1, i = d && Array.isArray(d) ? d : []) : i = d && f(d) ? d : {}, j[b] = g(m, i, e)) : e !== c && (j[b] = e));
                    return j
                }
            }, {}],
            4: [function(a, b) {
                function c() {
                    this._events = this._events || {}, this._maxListeners = this._maxListeners || void 0
                }

                function d(a) {
                    return "function" == typeof a
                }

                function e(a) {
                    return "number" == typeof a
                }

                function f(a) {
                    return "object" == typeof a && null !== a
                }

                function g(a) {
                    return void 0 === a
                }
                b.exports = c, c.EventEmitter = c, c.prototype._events = void 0, c.prototype._maxListeners = void 0, c.defaultMaxListeners = 10, c.prototype.setMaxListeners = function(a) {
                    if (!e(a) || 0 > a || isNaN(a)) throw TypeError("n must be a positive number");
                    return this._maxListeners = a, this
                }, c.prototype.emit = function(a) {
                    var b, c, e, h, i, j;
                    if (this._events || (this._events = {}), "error" === a && (!this._events.error || f(this._events.error) && !this._events.error.length)) {
                        if (b = arguments[1], b instanceof Error) throw b;
                        throw TypeError('Uncaught, unspecified "error" event.')
                    }
                    if (c = this._events[a], g(c)) return !1;
                    if (d(c)) switch (arguments.length) {
                        case 1:
                            c.call(this);
                            break;
                        case 2:
                            c.call(this, arguments[1]);
                            break;
                        case 3:
                            c.call(this, arguments[1], arguments[2]);
                            break;
                        default:
                            for (e = arguments.length, h = new Array(e - 1), i = 1; e > i; i++) h[i - 1] = arguments[i];
                            c.apply(this, h)
                    } else if (f(c)) {
                        for (e = arguments.length, h = new Array(e - 1), i = 1; e > i; i++) h[i - 1] = arguments[i];
                        for (j = c.slice(), e = j.length, i = 0; e > i; i++) j[i].apply(this, h)
                    }
                    return !0
                }, c.prototype.addListener = function(a, b) {
                    var e;
                    if (!d(b)) throw TypeError("listener must be a function");
                    if (this._events || (this._events = {}), this._events.newListener && this.emit("newListener", a, d(b.listener) ? b.listener : b), this._events[a] ? f(this._events[a]) ? this._events[a].push(b) : this._events[a] = [this._events[a], b] : this._events[a] = b, f(this._events[a]) && !this._events[a].warned) {
                        var e;
                        e = g(this._maxListeners) ? c.defaultMaxListeners : this._maxListeners, e && e > 0 && this._events[a].length > e && (this._events[a].warned = !0, console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.", this._events[a].length), "function" == typeof console.trace && console.trace())
                    }
                    return this
                }, c.prototype.on = c.prototype.addListener, c.prototype.once = function(a, b) {
                    function c() {
                        this.removeListener(a, c), e || (e = !0, b.apply(this, arguments))
                    }
                    if (!d(b)) throw TypeError("listener must be a function");
                    var e = !1;
                    return c.listener = b, this.on(a, c), this
                }, c.prototype.removeListener = function(a, b) {
                    var c, e, g, h;
                    if (!d(b)) throw TypeError("listener must be a function");
                    if (!this._events || !this._events[a]) return this;
                    if (c = this._events[a], g = c.length, e = -1, c === b || d(c.listener) && c.listener === b) delete this._events[a], this._events.removeListener && this.emit("removeListener", a, b);
                    else if (f(c)) {
                        for (h = g; h-- > 0;)
                            if (c[h] === b || c[h].listener && c[h].listener === b) {
                                e = h;
                                break
                            }
                        if (0 > e) return this;
                        1 === c.length ? (c.length = 0, delete this._events[a]) : c.splice(e, 1), this._events.removeListener && this.emit("removeListener", a, b)
                    }
                    return this
                }, c.prototype.removeAllListeners = function(a) {
                    var b, c;
                    if (!this._events) return this;
                    if (!this._events.removeListener) return 0 === arguments.length ? this._events = {} : this._events[a] && delete this._events[a], this;
                    if (0 === arguments.length) {
                        for (b in this._events) "removeListener" !== b && this.removeAllListeners(b);
                        return this.removeAllListeners("removeListener"), this._events = {}, this
                    }
                    if (c = this._events[a], d(c)) this.removeListener(a, c);
                    else
                        for (; c.length;) this.removeListener(a, c[c.length - 1]);
                    return delete this._events[a], this
                }, c.prototype.listeners = function(a) {
                    var b;
                    return b = this._events && this._events[a] ? d(this._events[a]) ? [this._events[a]] : this._events[a].slice() : []
                }, c.listenerCount = function(a, b) {
                    var c;
                    return c = a._events && a._events[b] ? d(a._events[b]) ? 1 : a._events[b].length : 0
                }
            }, {}],
            5: [function(a, b) {
                b.exports = "function" == typeof Object.create ? function(a, b) {
                    a.super_ = b, a.prototype = Object.create(b.prototype, {
                        constructor: {
                            value: a,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    })
                } : function(a, b) {
                    a.super_ = b;
                    var c = function() {};
                    c.prototype = b.prototype, a.prototype = new c, a.prototype.constructor = a
                }
            }, {}],
            6: [function(a, b) {
                function c() {}
                var d = b.exports = {};
                d.nextTick = function() {
                    var a = "undefined" != typeof window && window.setImmediate,
                        b = "undefined" != typeof window && window.postMessage && window.addEventListener;
                    if (a) return function(a) {
                        return window.setImmediate(a)
                    };
                    if (b) {
                        var c = [];
                        return window.addEventListener("message", function(a) {
                                var b = a.source;
                                if ((b === window || null === b) && "process-tick" === a.data && (a.stopPropagation(), c.length > 0)) {
                                    var d = c.shift();
                                    d()
                                }
                            }, !0),
                            function(a) {
                                c.push(a), window.postMessage("process-tick", "*")
                            }
                    }
                    return function(a) {
                        setTimeout(a, 0)
                    }
                }(), d.title = "browser", d.browser = !0, d.env = {}, d.argv = [], d.on = c, d.addListener = c, d.once = c, d.off = c, d.removeListener = c, d.removeAllListeners = c, d.emit = c, d.binding = function() {
                    throw new Error("process.binding is not supported")
                }, d.cwd = function() {
                    return "/"
                }, d.chdir = function() {
                    throw new Error("process.chdir is not supported")
                }
            }, {}],
            7: [function(a, b) {
                b.exports = function(a) {
                    return a && "object" == typeof a && "function" == typeof a.copy && "function" == typeof a.fill && "function" == typeof a.readUInt8
                }
            }, {}],
            8: [function(a, b, c) {
                (function(b, d) {
                    function e(a, b) {
                        var d = {
                            seen: [],
                            stylize: g
                        };
                        return arguments.length >= 3 && (d.depth = arguments[2]), arguments.length >= 4 && (d.colors = arguments[3]), p(b) ? d.showHidden = b : b && c._extend(d, b), v(d.showHidden) && (d.showHidden = !1), v(d.depth) && (d.depth = 2), v(d.colors) && (d.colors = !1), v(d.customInspect) && (d.customInspect = !0), d.colors && (d.stylize = f), i(d, a, d.depth)
                    }

                    function f(a, b) {
                        var c = e.styles[b];
                        return c ? "[" + e.colors[c][0] + "m" + a + "[" + e.colors[c][1] + "m" : a
                    }

                    function g(a) {
                        return a
                    }

                    function h(a) {
                        var b = {};
                        return a.forEach(function(a) {
                            b[a] = !0
                        }), b
                    }

                    function i(a, b, d) {
                        if (a.customInspect && b && A(b.inspect) && b.inspect !== c.inspect && (!b.constructor || b.constructor.prototype !== b)) {
                            var e = b.inspect(d, a);
                            return t(e) || (e = i(a, e, d)), e
                        }
                        var f = j(a, b);
                        if (f) return f;
                        var g = Object.keys(b),
                            p = h(g);
                        if (a.showHidden && (g = Object.getOwnPropertyNames(b)), z(b) && (g.indexOf("message") >= 0 || g.indexOf("description") >= 0)) return k(b);
                        if (0 === g.length) {
                            if (A(b)) {
                                var q = b.name ? ": " + b.name : "";
                                return a.stylize("[Function" + q + "]", "special")
                            }
                            if (w(b)) return a.stylize(RegExp.prototype.toString.call(b), "regexp");
                            if (y(b)) return a.stylize(Date.prototype.toString.call(b), "date");
                            if (z(b)) return k(b)
                        }
                        var r = "",
                            s = !1,
                            u = ["{", "}"];
                        if (o(b) && (s = !0, u = ["[", "]"]), A(b)) {
                            var v = b.name ? ": " + b.name : "";
                            r = " [Function" + v + "]"
                        }
                        if (w(b) && (r = " " + RegExp.prototype.toString.call(b)), y(b) && (r = " " + Date.prototype.toUTCString.call(b)), z(b) && (r = " " + k(b)), 0 === g.length && (!s || 0 == b.length)) return u[0] + r + u[1];
                        if (0 > d) return w(b) ? a.stylize(RegExp.prototype.toString.call(b), "regexp") : a.stylize("[Object]", "special");
                        a.seen.push(b);
                        var x;
                        return x = s ? l(a, b, d, p, g) : g.map(function(c) {
                            return m(a, b, d, p, c, s)
                        }), a.seen.pop(), n(x, r, u)
                    }

                    function j(a, b) {
                        if (v(b)) return a.stylize("undefined", "undefined");
                        if (t(b)) {
                            var c = "'" + JSON.stringify(b).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
                            return a.stylize(c, "string")
                        }
                        return s(b) ? a.stylize("" + b, "number") : p(b) ? a.stylize("" + b, "boolean") : q(b) ? a.stylize("null", "null") : void 0
                    }

                    function k(a) {
                        return "[" + Error.prototype.toString.call(a) + "]"
                    }

                    function l(a, b, c, d, e) {
                        for (var f = [], g = 0, h = b.length; h > g; ++g) f.push(F(b, String(g)) ? m(a, b, c, d, String(g), !0) : "");
                        return e.forEach(function(e) {
                            e.match(/^\d+$/) || f.push(m(a, b, c, d, e, !0))
                        }), f
                    }

                    function m(a, b, c, d, e, f) {
                        var g, h, j;
                        if (j = Object.getOwnPropertyDescriptor(b, e) || {
                                value: b[e]
                            }, j.get ? h = j.set ? a.stylize("[Getter/Setter]", "special") : a.stylize("[Getter]", "special") : j.set && (h = a.stylize("[Setter]", "special")), F(d, e) || (g = "[" + e + "]"), h || (a.seen.indexOf(j.value) < 0 ? (h = q(c) ? i(a, j.value, null) : i(a, j.value, c - 1), h.indexOf("\n") > -1 && (h = f ? h.split("\n").map(function(a) {
                                return "  " + a
                            }).join("\n").substr(2) : "\n" + h.split("\n").map(function(a) {
                                return "   " + a
                            }).join("\n"))) : h = a.stylize("[Circular]", "special")), v(g)) {
                            if (f && e.match(/^\d+$/)) return h;
                            g = JSON.stringify("" + e), g.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/) ? (g = g.substr(1, g.length - 2), g = a.stylize(g, "name")) : (g = g.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'"), g = a.stylize(g, "string"))
                        }
                        return g + ": " + h
                    }

                    function n(a, b, c) {
                        var d = 0,
                            e = a.reduce(function(a, b) {
                                return d++, b.indexOf("\n") >= 0 && d++, a + b.replace(/\u001b\[\d\d?m/g, "").length + 1
                            }, 0);
                        return e > 60 ? c[0] + ("" === b ? "" : b + "\n ") + " " + a.join(",\n  ") + " " + c[1] : c[0] + b + " " + a.join(", ") + " " + c[1]
                    }

                    function o(a) {
                        return Array.isArray(a)
                    }

                    function p(a) {
                        return "boolean" == typeof a
                    }

                    function q(a) {
                        return null === a
                    }

                    function r(a) {
                        return null == a
                    }

                    function s(a) {
                        return "number" == typeof a
                    }

                    function t(a) {
                        return "string" == typeof a
                    }

                    function u(a) {
                        return "symbol" == typeof a
                    }

                    function v(a) {
                        return void 0 === a
                    }

                    function w(a) {
                        return x(a) && "[object RegExp]" === C(a)
                    }

                    function x(a) {
                        return "object" == typeof a && null !== a
                    }

                    function y(a) {
                        return x(a) && "[object Date]" === C(a)
                    }

                    function z(a) {
                        return x(a) && ("[object Error]" === C(a) || a instanceof Error)
                    }

                    function A(a) {
                        return "function" == typeof a
                    }

                    function B(a) {
                        return null === a || "boolean" == typeof a || "number" == typeof a || "string" == typeof a || "symbol" == typeof a || "undefined" == typeof a
                    }

                    function C(a) {
                        return Object.prototype.toString.call(a)
                    }

                    function D(a) {
                        return 10 > a ? "0" + a.toString(10) : a.toString(10)
                    }

                    function E() {
                        var a = new Date,
                            b = [D(a.getHours()), D(a.getMinutes()), D(a.getSeconds())].join(":");
                        return [a.getDate(), J[a.getMonth()], b].join(" ")
                    }

                    function F(a, b) {
                        return Object.prototype.hasOwnProperty.call(a, b)
                    }
                    var G = /%[sdj%]/g;
                    c.format = function(a) {
                        if (!t(a)) {
                            for (var b = [], c = 0; c < arguments.length; c++) b.push(e(arguments[c]));
                            return b.join(" ")
                        }
                        for (var c = 1, d = arguments, f = d.length, g = String(a).replace(G, function(a) {
                                if ("%%" === a) return "%";
                                if (c >= f) return a;
                                switch (a) {
                                    case "%s":
                                        return String(d[c++]);
                                    case "%d":
                                        return Number(d[c++]);
                                    case "%j":
                                        try {
                                            return JSON.stringify(d[c++])
                                        } catch (b) {
                                            return "[Circular]"
                                        }
                                    default:
                                        return a
                                }
                            }), h = d[c]; f > c; h = d[++c]) g += q(h) || !x(h) ? " " + h : " " + e(h);
                        return g
                    }, c.deprecate = function(a, e) {
                        function f() {
                            if (!g) {
                                if (b.throwDeprecation) throw new Error(e);
                                b.traceDeprecation ? console.trace(e) : console.error(e), g = !0
                            }
                            return a.apply(this, arguments)
                        }
                        if (v(d.process)) return function() {
                            return c.deprecate(a, e).apply(this, arguments)
                        };
                        if (b.noDeprecation === !0) return a;
                        var g = !1;
                        return f
                    };
                    var H, I = {};
                    c.debuglog = function(a) {
                        if (v(H) && (H = b.env.NODE_DEBUG || ""), a = a.toUpperCase(), !I[a])
                            if (new RegExp("\\b" + a + "\\b", "i").test(H)) {
                                var d = b.pid;
                                I[a] = function() {
                                    var b = c.format.apply(c, arguments);
                                    console.error("%s %d: %s", a, d, b)
                                }
                            } else I[a] = function() {};
                        return I[a]
                    }, c.inspect = e, e.colors = {
                        bold: [1, 22],
                        italic: [3, 23],
                        underline: [4, 24],
                        inverse: [7, 27],
                        white: [37, 39],
                        grey: [90, 39],
                        black: [30, 39],
                        blue: [34, 39],
                        cyan: [36, 39],
                        green: [32, 39],
                        magenta: [35, 39],
                        red: [31, 39],
                        yellow: [33, 39]
                    }, e.styles = {
                        special: "cyan",
                        number: "yellow",
                        "boolean": "yellow",
                        undefined: "grey",
                        "null": "bold",
                        string: "green",
                        date: "magenta",
                        regexp: "red"
                    }, c.isArray = o, c.isBoolean = p, c.isNull = q, c.isNullOrUndefined = r, c.isNumber = s, c.isString = t, c.isSymbol = u, c.isUndefined = v, c.isRegExp = w, c.isObject = x, c.isDate = y, c.isError = z, c.isFunction = A, c.isPrimitive = B, c.isBuffer = a("./support/isBuffer");
                    var J = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    c.log = function() {
                        console.log("%s - %s", E(), c.format.apply(c, arguments))
                    }, c.inherits = a("inherits"), c._extend = function(a, b) {
                        if (!b || !x(b)) return a;
                        for (var c = Object.keys(b), d = c.length; d--;) a[c[d]] = b[c[d]];
                        return a
                    }
                }).call(this, a("_process"), "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
            }, {
                "./support/isBuffer": 7,
                _process: 6,
                inherits: 5
            }],
            9: [function(a, b) {
                function c(a) {
                    return this instanceof c ? (g.call(this), a = a || {}, this.concurrency = a.concurrency || 1 / 0, this.timeout = a.timeout || 0, this.pending = 0, this.session = 0, this.running = !1, void(this.jobs = [])) : new c(a)
                }

                function d(a) {
                    function b(a) {
                        d.end(a)
                    }

                    function c(e) {
                        d.removeListener("error", b), d.removeListener("end", c), a(e)
                    }
                    var d = this;
                    this.on("error", b), this.on("end", c)
                }

                function e(a) {
                    this.session++, this.running = !1, this.emit("end", a)
                }
                var f = a("inherits"),
                    g = a("events").EventEmitter;
                b.exports = c, f(c, g);
                var h = ["push", "unshift", "splice", "pop", "shift", "slice", "reverse", "indexOf", "lastIndexOf"];
                for (var i in h)(function(a) {
                    c.prototype[a] = function() {
                        return Array.prototype[a].apply(this.jobs, arguments)
                    }
                })(h[i]);
                Object.defineProperty(c.prototype, "length", {
                    get: function() {
                        return this.pending + this.jobs.length
                    }
                }), c.prototype.start = function(a) {
                    function b(a, b) {
                        g && c.session === h && (g = !1, c.pending--, null !== i && clearTimeout(i), a ? c.emit("error", a, f) : j === !1 && c.emit("success", b, f), c.session === h && (0 === c.pending && 0 === c.jobs.length ? e.call(c) : c.running && c.start()))
                    }
                    if (a && d.call(this, a), this.pending !== this.concurrency) {
                        if (0 === this.jobs.length) return void(0 === this.pending && e.call(this));
                        var c = this,
                            f = this.jobs.shift(),
                            g = !0,
                            h = this.session,
                            i = null,
                            j = !1;
                        this.timeout && (i = setTimeout(function() {
                            j = !0, c.listeners("timeout").length > 0 ? c.emit("timeout", b, f) : b()
                        }, this.timeout)), this.pending++, this.running = !0, f(b), this.jobs.length > 0 && this.start()
                    }
                }, c.prototype.stop = function() {
                    this.running = !1
                }, c.prototype.end = function(a) {
                    this.jobs.length = 0, this.pending = 0, e.call(this, a)
                }
            }, {
                events: 4,
                inherits: 10
            }],
            10: [function(a, b) {
                b.exports = a(5)
            }, {
                "/home/e.napierala/simple-socket/node_modules/grunt-browserify/node_modules/browserify/node_modules/inherits/inherits_browser.js": 5
            }]
        }, {}, [1])(1)
    })();
    /* jshint ignore:end */
    // << ---------------------------------------------- SimpleSocket


    // communications module ---------------------------------------------------- >>
    // fetches scripts, sends data to server

    Comm = (function() {

        function makeQueryString(data) {
            if (data && ('object' === typeof data)) {
                var q = '';
                var count = 0;

                for (var i in data) {
                    if (data.hasOwnProperty(i)) {
                        if (count > 0) {
                            q += '&';
                        }

                        count++;
                        q += i + '=' + encodeURIComponent(data[i]);
                    }
                }

                return q;
            } else if ('string' === typeof data) {
                return data;
            }
        }

        function doGet(target, data) {
            var img = D.createElement("img");
            img.setAttribute('height', 0);
            img.setAttribute('width', 0);
            img.src = Settings.addr + 'rest/' + target + '?' + makeQueryString(data);
            img.onload = img.onerror = function _finishHandler() {
                if (img.parentNode) {
                    img.parentNode.removeChild(img);
                }
            };
            D.documentElement.appendChild(img);
        }

        var sendWsMessage = (function() {
            if (SimpleSocket.supported) {
                var socket;
                return function sendWsMessage(target, data) {
                    if (!socket) {
                        socket = new SimpleSocket({
                            url: Settings.addrWs + 'socket',
                            autoConnect: true,
                            autoReconnect: true
                        });

                        // suppress all errors
                        socket.on('error', function() {});
                    }

                    return socket.send({
                        type: target,
                        data: data
                    });
                };
            } else { // falback
                return function sendWsMessageFallback(target, data) {
                    return doGet('rec/' + target, data);
                };
            }
        })();

        // public
        function getRipper() {
            var sc = D.createElement('script');
            sc.setAttribute('async', 'async');
            sc.src = Settings.ripperAddr;

            var head = D.head || D.getElementsByTagName("head")[0] || D.documentElement;
            head.insertBefore(sc, head.firstChild);

            return sc;
        }


        // public
        // sends data about a field
        function postBlur(data) {
            sendWsMessage('blur', {
                FO: data.formId,
                F: data.id,
                T: data.time,
                A: data.timeActive,
                E: data.entries,
                ID: Settings.identyfication,
                TS: +(new Date())
            });
        }


        // public
        // sends focus on field
        function postFocus(data) {
            sendWsMessage('focus', {
                FO: data.formId,
                F: data.id,
                ID: Settings.identyfication,
                TS: +(new Date())
            });
        }


        // public
        // sends current API settings for experiment
        function postFieldApiSettings(formId, s) {
            var o = {
                FO: formId,
                ID: Settings.identyfication
            };

            /* jshint ignore:start */
            ('undefined' !== typeof s.tag) && (o.USE_TAG = s.tag);
            ('undefined' !== typeof s.type) && (o.USE_TYPE = s.type);
            ('undefined' !== typeof s.id) && (o.USE_ID = s.id);
            ('undefined' !== typeof s.name) && (o.USE_NAME = s.name);
            ('undefined' !== typeof s.class) && (o.USE_CLASS = s.class);
            ('undefined' !== typeof s.data) && (o.USE_DATA = s.data);
            ('undefined' !== typeof s.version) && (o.VERSION = s.version);
            /* jshint ignore:end */
            o.SUBMIT = s.submit || ''; // send empty string if not present

            doGet('rec/api/field', o);
        }


        // public
        // sends message that form was seen
        function postSeen(formId) {
            doGet('rec/seen', {
                FO: formId,
                ID: Settings.identyfication
            });
        }


        // public
        // saves ripped form
        function saveRip(data, formId, formSize) {
            doGet('rip/full', Settings.experiment + '_' + formId + '_' + formSize + '_' + data + '_');
        }


        // public
        // saves a partial rip with collection of ripped fields' hashes
        function savePartialRip(data, formId, fields) {
            doGet('rip/partial', Settings.experiment + '_' + formId + '_' + fields + '_' + data + '_');
        }


        function createSession(cb) {
            xhr({
                method: 'GET',
                uri: Settings.sessionAddr + '/' + Settings.experiment + '?version=' + scriptVersion
            }, function(err, response, body) {
                var parsedBody;
                try {
                    parsedBody = JSON.parse(body);
                } catch (e) {
                    return;
                }

                // for front-end testing, when backend fails >>
                // if(!parsedBody.identyfication) {
                //     parsedBody.identyfication = 'dupa';
                // }
                // << for front-end testing, when backend fails

                if (!err && (response.statusCode === 200) && parsedBody && parsedBody.identyfication) {
                    Settings.identyfication = parsedBody.identyfication;

                    // convert strings to arrays (each id has three characters)
                    Settings.knownFields = parsedBody.knownFields.match(/.{1,3}/g) || [];
                    Settings.knownForms = parsedBody.knownForms.match(/.{1,3}/g) || [];

                    Settings.dict = parsedBody.dict;

                    cb();
                }
            });
        }


        return {
            postFocus: postFocus,
            postBlur: postBlur,
            postFieldApiSettings: postFieldApiSettings,
            postSeen: postSeen,
            saveRip: saveRip,
            savePartialRip: savePartialRip,
            doGet: doGet,
            getRipper: getRipper,
            createSession: createSession
        };

    })();

    // << ---------------------------------------------------- communications module



    // DOM tools ---------------------------------------------------------------- >>

    // insertionQuery by naugtur ---- >>
    // MIT license
    // module for catching elements inserted to a form
    insertionQ = (function() {

        var sequence = 100,
            isAnimationSupported = false,
            animationstring = 'animationName',
            keyframeprefix = '',
            domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
            pfx = '',
            elm = document.createElement('div');
        if (elm.style.animationName) {
            isAnimationSupported = true;
        }

        if (isAnimationSupported === false) {
            for (var i = 0; i < domPrefixes.length; i++) {
                if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
                    pfx = domPrefixes[i];
                    animationstring = pfx + 'AnimationName';
                    keyframeprefix = '-' + pfx.toLowerCase() + '-';
                    isAnimationSupported = true;
                    break;
                }
            }
        }

        return function(selector, callback) {
            if (isAnimationSupported && selector.match(/[^{}]/)) {
                var styleAnimation, animationName = 'insQ_' + (sequence++);
                var eventHandler = function(event) {
                    if (event.animationName === animationName || event[animationstring] === animationName) {
                        callback(event.target);
                    }
                };

                styleAnimation = document.createElement('style');
                styleAnimation.innerHTML = '@keyframes ' + animationName + ' {  from {  clip: rect(1px, auto, auto, auto);  } to {  clip: rect(0px, auto, auto, auto); }  }' +
                    "\n" + '@' + keyframeprefix + 'keyframes ' + animationName + ' {  from {  clip: rect(1px, auto, auto, auto);  } to {  clip: rect(0px, auto, auto, auto); }  }' +
                    "\n" + selector + ' { animation-duration: 0.001s; animation-name: ' + animationName + '; ' +
                    keyframeprefix + 'animation-duration: 0.001s; ' + keyframeprefix + 'animation-name: ' + animationName + '; ' +
                    ' } ';
                document.head.appendChild(styleAnimation);
                setTimeout(function() {
                    document.addEventListener('animationstart', eventHandler, false);
                    document.addEventListener('MSAnimationStart', eventHandler, false);
                    document.addEventListener('webkitAnimationStart', eventHandler, false);
                }, 20); //starts listening later to skip elements found on startup. this might need tweaking

                return true;
            } else {
                return false;
            }
        };
    })();
    // << ---- insertionQuery by naugtur


    // DOM helpers ----- >>
    Dom = (function() {
        // event listeners
        var listenUp, listenDown, unbind, noie = (function() {
            if (D.addEventListener) { // W3C compatible
                listenDown = function(n, e, f) {
                    ((n) ? n : D).addEventListener(e, f, true); //TRUE!! makes it bind to the event returning back down after bubbling //http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
                };

                listenUp = function(n, e, f) {
                    ((n) ? n : D).addEventListener(e, f, false);
                };

                unbind = function(n, e, f) {
                    ((n) ? n : D).removeEventListener(e, f);
                };

                return true;
            } else { // for older IEs
                listenUp = listenDown = function(n, e, f) {
                    (n || D).attachEvent('on' + e, function(a) {

                        // IE event has no target property
                        if (!a.target) {
                            a.target = a.srcElement;
                        }

                        f(a);
                    });
                };

                unbind = function(n, e, f) {
                    ((n) ? n : D).detachEvent('on' + e, f);
                };

                return false;
            }
        })();


        // property for tagging identified field nodes
        var tagKey = '-=FT' + ~~(Math.random() * 1000);


        // public
        // sets up watchers for from field insetrions to a node
        function catchFieldsInsertions(node, callback, dontTag) {
            var randomSeed = ~~(Math.random() * 1000),
                nodeId = "UTCFRM_" + randomSeed,
                identAttr = '',
                insertions = [];

            if (node.id) {
                node.setAttribute('data-' + nodeId, 1);
                identAttr = '[data-' + nodeId + ']';
                nodeId = node.id;
            } else {
                node.id = nodeId;
            }

            var sumUp = (function() { //
                var to;

                return function() { // insertion debounce
                    clearTimeout(to);
                    to = setTimeout(function() {
                        callback(insertions);

                        if (!dontTag) {
                            insertions.forEach(tagAll);
                        }

                        insertions = [];
                    }, 30);
                };
            })();

            var eventHandler = function(el) {
                if (!isTagged(el)) { // grouping insertions to catch only top node
                    var myparent = topmostUntaggedParent(el);

                    if (myparent && insertions.indexOf(myparent) < 0) {
                        insertions.push(myparent);
                    }
                }

                sumUp();
            };

            insertionQ('#' + nodeId + identAttr + ' input, #' + nodeId + identAttr + ' textarea, #' + nodeId + identAttr + ' select', eventHandler);
        }


        // private
        // finds oldest ancestor of node that has not tag OR form element
        function topmostUntaggedParent(el) {
            if (!el.parentNode) {
                return null;
            } else if (el.nodeName === 'FORM' || isTagged(el.parentNode)) {
                return el;
            } else {
                return topmostUntaggedParent(el.parentNode);
            }
        }

        // private
        // sets "tagged" flag on node
        function tag(el) {
            el[tagKey] = true;
            // attributes are working when somebody uses innerHTML+=
            // but attributes get cloned and that's a bigger problem
            // so, we must use object property
        }


        // private
        function isTagged(el) {
            return el[tagKey] === true;
        }


        // private
        function tagAll(node) {
            var sel, i;
            sel = node.getElementsByTagName('*');
            i = sel.length;
            while (i--) {
                tag(sel[i]);
            }
        }


        // public
        // domready handling with fallback
        function ready(callback) {
            var called = false,
                cb = function() {
                    if (called) {
                        return;
                    }

                    called = true;

                    callback();
                };

            if (D.readyState === "complete" || D.readyState === "interactive" || D.readyState === "loaded") {
                cb();
            }

            if (noie) {
                listenUp(D, "DOMContentLoaded", cb);
                listenUp(window, 'load', cb);

                setTimeout(cb, 3000);
            } else {
                listenUp(D, "readystatechange", function() {
                    if (D.readyState === "complete") {
                        cb();
                    }
                });
                listenUp(window, 'load', cb);

                setTimeout(cb, 3000);
            }
        }


        // private
        // goes up through parents till a given tag nodename is found
        function parentFind(el, nodename) {
            if (el.parentNode) {
                if (el.parentNode.nodeName === nodename) {
                    return el.parentNode;
                } else {
                    return parentFind(el.parentNode, nodename);
                }
            } else {
                return null;
            }
        }


        function getFormOrReplacement(field) {
            var form = field.form;

            // if there's no form then what? guess.
            if (form === null) {
                form = parentFind(field, 'FIELDSET');
            }

            if (form === null) {
                form = parentFind(field, 'DIV');
            }

            if (form === null) {
                form = field.parentNode;
            }

            return form;
        }


        // public
        var matchesSelector = (function(testEl) {
            if (!testEl) {
                throw new TypeError('Test element provided as parameter 1 is not a HTMLElement');
            }

            var method = ['matches',
                'webkitMatchesSelector',
                'mozMatchesSelector',
                'msMatchesSelector',
                'oMatchesSelector'
            ].filter(function(method) {
                return ('function' === typeof testEl[method]);
            })[0];

            return function matchesSelector(el, sel) {
                return (el && el[method](sel));
            };
        })(document.documentElement);


        // public
        // check if element is formfield
        // we track button tags, but they are not counted in to the "known fields" list and they do not trigger partials or take part in assembling formId
        function isFormField(el) {
            return (el.nodeName === 'INPUT' ||
                el.nodeName === 'TEXTAREA' ||
                el.nodeName === 'SELECT' ||
                el.nodeName === 'BUTTON' ||
                (submitSelector ? matchesSelector(el, submitSelector) : false));
        }


        // private
        // calculates form id and form size
        function actuallyIdentifyForm(node) {
            var fields = getFormFieldsInContainer(node);

            return {
                size: M.simplehash(fields.length),
                numericalId: M.numSerialize(M.identifyForm(node, fields))
            };
        }


        // public
        // identifies form and runs callback when form is clicked
        // works once per form
        // can be easily replaced with any other mechanizm
        function identifyForm(identCallback) {
            function bindlisten(e) {
                if (!isTagged(e.target) && isFormField(e.target)) { // not in a known form and is a field
                    tag(e.target);

                    var node = getFormOrReplacement(e.target);

                    if (!node) {
                        return;
                    }

                    if (!isTagged(node)) { // ok, but to make sure I don't know that one already
                        tag(node);
                        tagAll(node);

                        var formData = actuallyIdentifyForm(node);

                        identCallback(node, formData.numericalId, formData.size, e.target);
                    }
                }
            }

            listenUp(D, 'mousedown', bindlisten);
            listenUp(D, 'focus', bindlisten); // for triggered events on beautiful fields
            ifJquery(function() {
                window.jQuery(D)
                    .bind('focus', bindlisten)
                    .bind('click', bindlisten);
            });
        }


        // private
        // @returns {array of HTMLElement} - array of all nodes containing form fields inside container
        function _getFormsInContainer(container) {
            var fields = getFormFieldsInContainer(container);
            var forms = [];
            var formFields;

            function _filterFormFields(field) {
                return (formFields.indexOf(field) === -1);
            }

            while (fields[0]) {
                var form = getFormOrReplacement(fields[0]);
                if (form) {
                    forms.push(form);

                    formFields = getFormFieldsInContainer(form);
                    fields = fields.filter(_filterFormFields);
                }
            }

            return forms;
        }


        // public
        // returns array of form objects inside node
        function getForms(node) {
            return _getFormsInContainer(node)
                .map(actuallyIdentifyForm);
        }


        // private
        function getElementsArrayByTagName(el, tag) {
            return Array.prototype.slice.call(el.getElementsByTagName(tag));
        }


        // private
        function querySelectorAll(el, sel) {
            return Array.prototype.slice.call(el.querySelectorAll(sel));
        }


        // @function getFormFieldsInContainer
        // @access public
        // @param {HTMLElement} container - element to search in
        // @returns {array of HTMLElement} - array of elements that we want to track (not only form elements since we have #submitButtonAPI)
        function getFormFieldsInContainer(container) {
            // cause hidden inputs are invisible anyway, and are sometimes added to site,
            // we do not what to identify this form as different one also it solves problem like one
            // in payu https://secure.payu.pl/pl/standard/user/register?execution=e1s1 where hidden input changes it name each page refresh
            function isNotHidden(input) {
                return (
                    (typeof input.getAttribute('type') !== 'undefined') &&
                    (input.getAttribute('type') !== 'hidden')
                );
            }

            return [
                getElementsArrayByTagName(container, 'input')
                    .filter(isNotHidden),
                getElementsArrayByTagName(container, 'select'),
                getElementsArrayByTagName(container, 'textarea'),
                submitSelector ? querySelectorAll(container, submitSelector) : [ ]
            ].reduce(mergeArrays);
        }


        return {
            noie: noie,
            listen: listenUp,
            listenReturning: listenDown,
            ready: ready,
            identifyForm: identifyForm,
            catchFieldsInsertions: catchFieldsInsertions,
            isFormField: isFormField,
            getFormFieldsInContainer: getFormFieldsInContainer,
            getForms: getForms,
            matchesSelector: matchesSelector
        };

    })();
    // << ----- DOM helpers


    function ifJquery(fn) {
        if (typeof(window.jQuery) !== 'undefined') {
            return fn();
        }
    }

    // << ---------------------------------------------------------------- DOM tools



    // recording module --------------------------------------------------------- >>

    Rec = (function() {
        var elements = {};


        // private
        // sums keypress time
        function sumKtime(n) {
            var rt = 0;

            if (elements[n].tmp.k) {
                rt = ~~(elements[n].t2) + (new Date() - elements[n].tmp.k);
                elements[n].t2 = rt;
                elements[n].tmp.k = false;
            }

            return rt;
        }


        // private
        // fixes event names for focus
        function switchEvents(t) {
            if (!Dom.noie) {
                t = ({
                    'focus': 'focusin',
                    'blur': 'focusout'
                })[t];
            }

            return t;
        }


        function isFieldIdKnown(fieldId) {
            return (Settings.knownFields.indexOf(fieldId) !== -1);
        }


        // returns a list of new, unseen fields, based on knownFields from settings
        function getIdsOfUnseenFieldsInContainer(container) {
            return Dom.getFormFieldsInContainer(container)
                .map(M.getFieldId)
                .filter(negateResult(isFieldIdKnown));
        }


        // returns a list of known fields, based on knownFields from settings
        function listIdsOfSeenFieldsInContainer(container) {
            return Dom.getFormFieldsInContainer(container)
                .map(M.getFieldId)
                .filter(isFieldIdKnown);
        }


        // make fields known
        function seeFields(fieldsIds) {
            Settings.knownFields = Settings.knownFields
                .concat(fieldsIds)
                .filter(negateResult(isDuplicated));
        }


        var debounceByKey = (function() {
            var timers = {};

            return function(key, fn, time) {
                return function() {
                    var that = this,
                        args = arguments;

                    clearTimeout(timers[key]);
                    timers[key] = setTimeout(function() {
                        fn.apply(that, args);
                    }, time);
                };
            };
        })();
        var throttleByKey = (function() {
            var timers = {};

            return function(key, fn, time) {
                return function() {
                    if (!timers[key]) {
                        timers[key] = setTimeout(function() {
                            timers[key] = null;
                        }, time);

                        return fn.apply(this, arguments);
                    }
                };
            };
        })();


        var focusMemory = {};

        function hadFocus(n) {
            if (focusMemory[n]) {
                focusMemory[n] = false;

                return true;
            } else {
                return false;
            }
        }


        // public
        // starts recording inside an element
        function bindTo(to, localFormId) {


            // filters calls to only work on form elements
            function on(type, f) {
                type = switchEvents(type);

                Dom.listenReturning(to, type, function(e) {
                    // console.log(e.type);
                    var el = e.target;
                    if (Dom.isFormField(el)) {
                        f(e, el);
                    }
                });
            }

            // focus reporting --------- >>
            var lastFieldId;

            function reportFocus(fieldId) {
                // we don't count focus events for field, we only note, that at least one occurred
                // condition below prevents useless calls to server,
                // when somebody enter to field, leave it and enter again without
                // focusing another field in the meantime
                if (fieldId !== lastFieldId) { // this will report the focus for field only one
                    lastFieldId = fieldId;

                    Comm.postFocus({
                        formId: localFormId,
                        id: fieldId
                    });
                }
            }


            var focusFunc = function(e, el) {
                var n = M.identifyField(el);

                focusMemory[n] = true;

                throttleByKey(n, function() {
                    // TIP: focus function will never need throttling, it's to prepare data before blur happens.

                    if (!elements[n]) {
                        elements[n] = {
                            tmp: {}
                        };
                    }

                    if (el.value && (el.value.length === 0)) {
                        elements[n].tmp.empty = true;
                    }

                    elements[n].tmp.t1 = new Date();

                    // this will report the fact only once
                    reportFocus(n);
                }, 2)();
            };


            on('focus', focusFunc); // for keyboard and standard inputs
            on('mousedown', focusFunc); // for stupid buttons without focus event
            // << --------- focus reporting


            // tracking keyboard in textfields >>
            // and update attempts (revisitors) number
            on('keyup', function(e, el) {
                var nodeName = el.nodeName,
                    type;

                if (nodeName === 'select' || (nodeName === 'input' && (type = el.getAttribute('type')) && (type === 'radio' || type === 'checkbox'))) {
                    return;
                }

                var n = M.identifyField(el);
                if (!elements[n].tmp.k) {
                    // the first
                    elements[n].tmp.k = new Date();
                }

                // we increase attempts (revisitors) number if somebody clear field after type something
                if (el.value.length === 0) {
                    if (!elements[n].tmp.empty) { // only the first time, no repeats when it stays empty
                        elements[n].tmp.empty = true;
                        elements[n].rc = ~~(elements[n].rc) + 1;
                    }
                } else {
                    elements[n].tmp.empty = false;
                }

                clearTimeout(elements[n].kTimer);
                elements[n].kTimer = setTimeout(function() {
                    sumKtime(n);
                }, 1000);
            });
            // << tracking keyboard in textfields


            // incrementing metrics ---- >>
            var incrementMetrics = function(e, el, singleState) {
                var n = M.identifyField(el);

                debounceByKey(n, function() {

                    // if somehow blur was first or no focus happened at all (eg. change event on checkbox)
                    if (elements[n] === undefined || elements[n].tmp === undefined) {
                        focusMemory[n] = true;

                        reportFocus(n);

                        elements[n] = {
                            tmp: {}
                        };
                    } else {
                        // if singlestate, there's no sense in recording time, just entries

                        if (!singleState) {
                            // if user spent more than 30s in the field, it's cut to 30. if he actually wrote something all the time - it is a valid score
                            if (30000 > sumKtime(n)) {
                                elements[n].t1 = ~~(elements[n].t1) + Math.min(new Date() - elements[n].tmp.t1, 30000);
                            } else {
                                elements[n].t1 = ~~(elements[n].t1) + (new Date() - elements[n].tmp.t1);
                            }
                        }
                    }

                    // assuming throttled blur is an entry attempt when there was a focus before
                    var meHadFocus = hadFocus(n);
                    if (!singleState || meHadFocus) {

                        elements[n].rc = ~~(elements[n].rc) + 1;
                    }

                    // send
                    Comm.postBlur({
                        formId: localFormId,
                        id: n,
                        time: elements[n].t1 || 0,
                        // we don't want timeActive bigger than overal time,
                        // but this `min` function is naive and should be changed to something clever
                        timeActive: Math.min((elements[n].t2 || 0), (elements[n].t1 || 0)),
                        entries: elements[n].rc
                    });
                }, 50)();
            };


            // increment metrics for inputs and textareas
            var blurFunc = function(e) {

                var el = e.target,
                    nodeName = el.nodeName.toLowerCase(),
                    type = el.getAttribute('type');

                if ((nodeName !== 'select') && (type !== 'submit') && (nodeName !== 'button')) {
                    incrementMetrics(e, el, (nodeName === 'input' && (type === 'radio' || type === 'checkbox')));
                }
            };


            // increment metrics for selects and checkbox/radio inputs
            var changeFunc = function(e) {

                var el = e.target,
                    nodeName = el.nodeName.toLowerCase(),
                    type = el.getAttribute('type');

                if (nodeName === 'select') {
                    incrementMetrics(e, el);
                }

                if (nodeName === 'input' && (type === 'radio' || type === 'checkbox')) {
                    incrementMetrics(e, el, true);
                }
            };


            // increment metrics for submit buttons
            var mouseupFunc = function(e) {

                var el = e.target,
                    nodeName = el.nodeName.toLowerCase(),
                    nodeType = el.getAttribute('type');

                if ((nodeName === 'input' && ((nodeType === 'submit') || (nodeType === 'button'))) ||
                    (nodeName === 'button') || (submitSelector && Dom.matchesSelector(el, submitSelector))) {
                    incrementMetrics(e, el, true);
                }
            };


            Dom.listenReturning(to, 'mouseup', mouseupFunc);
            Dom.listenReturning(to, 'click', mouseupFunc);
            Dom.listenReturning(to, 'change', changeFunc);
            on('blur', blurFunc);


            // jQuery >>
            // for handle fancy form controls using jQuery trigger() method
            // to programmatically triggering events on original inputs/buttons
            // doubling "normal" and "jQuery" events is prevented by debounce
            // in incrementMetrics function
            ifJquery(function() {
                function focusHandler(e) {
                    if (Dom.isFormField(e.target)) {
                        focusFunc(e, e.target);
                    }
                }

                function blurHandler(e) {
                    if (Dom.isFormField(e.target)) {
                        blurFunc(e, e.target);
                    }
                }

                function clickHandler(e) {
                    var el = e.target;
                    var nodeName = el.nodeName;

                    if (nodeName === "SELECT") {
                        focusFunc(e, el);
                    }
                }

                window.jQuery(to)
                    .bind('focus', focusHandler)
                    .bind('mousedown', focusHandler)
                    .bind('click', clickHandler)
                    .bind('blur', blurHandler)
                    .bind('change', changeFunc);
            });
            // << jQuery



            return {
                simulateFocus: function(el) {
                    focusFunc({}, el);
                }
            };
        }


        return {
            seeFields: seeFields,
            bindTo: bindTo,
            isFieldIdKnown: isFieldIdKnown
        };
    })();

    // << --------------------------------------------------------- recording module


    // on DOM ready initialization ---------------------------------------------- >>

    Comm.createSession(function() {
        // lazy initialize M and requireRipper because of those modules depend on dictionary from session call

        // identification module ---------------------------------------------------- >>
        M = (function() {

            // public
            // para-unique form fields identification
            // TO DO: put it in formresults too WHENEVER YOU CHANGE IT
            function identifyField(el) {
                var id, use;

                if (apiSettings.basicFieldIdentification) {
                    use = apiSettings.basicFieldIdentification;

                    id = (use.name && el.name) ||
                        (use.id && el.id) ||
                        (use.className && (el.nodeName + '_' + (el.className || '').replace(' ', '_')));
                } else {
                    id = el.name ||
                        el.id ||
                        (el.nodeName + '_' + (el.className || '').replace(' ', '_'));
                }

                if (apiSettings.fieldId) {
                    use = apiSettings.fieldId;

                    id = (((use.tag && el.tagName) || '') + '_' +
                        ((use.type && el.type) || '') + '_' +
                        ((use.name && el.name) || '') + '_' +
                        ((use.id && el.id) || '') + '_' +
                        ((use.class && (el.className || '').replace(/\s+/g, '&')) || '') + '_' +
                        ((use.data && el.getAttribute('data-ftid')) || '')).replace(/^_+|_+$/g, '');
                }

                return id;
            }


            // public
            // forms identification
            function identifyForm(el, fields) {
                var id;

                if (apiSettings.basicFormIdentification) {
                    if (apiSettings.basicFormIdentification === 'actionOnly') {
                        id = (el.getAttribute('action') || '');
                    } else {
                        id = el.getAttribute('action') + '_' +
                            el.id + '_' +
                            (el.className || '').replace(' ', '_');
                    }
                } else {
                    id = 0;

                    for (var i = 0, maxi = fields.length; i < maxi; i++) {
                        id += numSerialize(M.identifyField(fields[i]));
                    }
                }

                if (apiSettings.formId) {
                    var use = apiSettings.formId;

                    id = (((use.name && el.name) || '') + '_' +
                        ((use.id && el.id) || '') + '_' +
                        ((use.class && (el.className || '').replace(/\s+/g, '&')) || '') + '_' +
                        ((use.action && el.getAttribute('action')) || '') + '_' +
                        ((use.data && el.getAttribute('data-ftid')) || '')).replace(/^_+|_+$/g, '');
                }

                return id;
            }


            // numberLimit - maximum number that fits simplehash
            var l = 3; // length of output
            var b = Settings.dict.length;
            var numberLimit = Math.pow(b, l);
            var simplehash = (function() {
                var c = (Settings.dict).split(""),
                    conv = function(n) {
                        var s = "";
                        n = n % numberLimit;
                        var i;
                        for (i = 0; i < l; i += 1) {
                            s = c[n % b] + s;
                            n = Math.floor(n / b);
                        }
                        return s;
                    };

                return function(s) {
                    return conv(numSerialize(s));
                };
            })(); // public, simple hashing function


            // public
            function numSerialize(s) {
                if (typeof s === "number") { // I know it's not safe enough, but one has to just know how to use it.
                    return (s % numberLimit);
                } else {
                    var i, h = 0,
                        l = s.length;

                    for (i = 0; i < l; i++) {
                        h += (s.charCodeAt(i) * (i + 1));
                    }

                    return (Math.abs(h) % numberLimit);
                }
            }


            /**
             * @function getFieldId - returns hashed id for field
             * @access public
             * @param  {HTMLelement} field - field to identify
             * @return {string,hash} hashed id of the field
             */
            function getFieldId(field) {
                return simplehash(identifyField(field));
            }


            return {
                getFieldId: getFieldId,
                identifyField: identifyField,
                identifyForm: identifyForm,
                simplehash: simplehash,
                numSerialize: numSerialize
            };
        })();
        // << ---------------------------------------------------- identification module

        // loading ripper ---- >>
        requireRipper = (function() {

            var queue = [],
                script, ripper = false;
            if (Dom.noie) { // ripper should not work in old ies at all
                script = Comm.getRipper();
                script.onload = function() {
                    ripper = window.Ripper({
                        dictionary: Settings.dict,
                        numberLength: 3,
                        heuristic: true
                    });

                    run();
                };
            }


            // waits for fetching script; before that, pushes all callbacks to queue
            // and calls them later
            function run() {
                function _fire(fn) { // splitting jobs
                    fn(ripper);
                }

                if (ripper) {
                    while (queue.length) {
                        setTimeout(_fire, 0, queue.shift());
                    }
                }
            }

            return function(cb) {
                queue.push(cb);
                run();
            };
        })();
        // << ---- loading ripper

        Dom.ready(function() {

            // increase seen metric for all forms existing on the page, including
            // those, that will be inserted by JavaScript further
            (function() {
                function getFormId(formObj) {
                    return formObj.numericalId;
                }

                var forms = Dom.getForms(document.body).map(getFormId);

                forms.forEach(Comm.postSeen);

                Dom.catchFieldsInsertions(document.body, function(insertions) {
                    insertions.forEach(function(node) {
                        var insertedForms = Dom.getForms(node)
                            .map(getFormId)
                            .filter(function(form) {
                                return forms.indexOf(form) === -1;
                            });

                        insertedForms.forEach(Comm.postSeen);

                        forms = forms.concat(insertedForms);
                    });
                }, !!'dont tag');
            })();

            // recording starts when user makes first interaction with form
            // (focuses field, clicks button etc.)
            Dom.identifyForm(function(formNode, numericalFormId, formSize, fieldNode) {
                if (window['-=UTC-NO-REC']) { // yes, here too.
                    return;
                }

                var fieldApi = {};
                if (apiSettings.fieldId) {
                    fieldApi = apiSettings.fieldId;
                    fieldApi.version = 1;
                } else if (apiSettings.basicFieldIdentification) {
                    fieldApi = apiSettings.basicFieldIdentification;
                    fieldApi.version = 0;
                }
                Comm.postFieldApiSettings(numericalFormId, fieldApi);

                Rec.bindTo(formNode, numericalFormId).simulateFocus(fieldNode);

                requireRipper(function(ripper) {
                    var formId = M.simplehash(numericalFormId);

                    // ripping the whole form
                    if (Settings.knownForms.indexOf(formId) === -1) {
                        if (!Settings.fullCapReached) {
                            Settings.knownForms.push(formId);
                            Comm.saveRip(ripper.copy(formNode, removeUnwantedElements), formId, formSize);
                        }
                    } else {
                        // rip partials now
                        // do not until backend doesn't send knownFields from full rip
                        // if (!Settings.partialCapReached) {
                        //     seeUnseenFieldsInContainers([ formNode ]);
                        // }
                    }

                    // ripping partials
                    Dom.catchFieldsInsertions(formNode, function(ins) {
                        if (!Settings.partialCapReached) {
                            seeUnseenFieldsInContainers(ins);
                        }
                    });

                    // add unknown fields in containers to list of known fields and send rips of them to server
                    function seeUnseenFieldsInContainers(containers) {
                        function noSeenFieldsInContainer(container) {
                            return (Dom.getFormFieldsInContainer(container)
                                .map(M.getFieldId)
                                .filter(Rec.isFieldIdKnown)
                                .length === 0);
                        }

                        function getIdsOfUnseenFieldsInContainer(container) {
                            return Dom.getFormFieldsInContainer(container)
                                .map(M.getFieldId)
                                .filter(negateResult(Rec.isFieldIdKnown));
                        }

                        var idsOfHandledFields = [ ];

                        // save unknown fields and rip the smallest amount of elements containing them
                        /* Example:
                         *
                         * DIV1
                         *  |
                         *  +-- DIV2
                         *  |    |
                         *  |    +-- Unseen1
                         *  |    |
                         *  |    +-- Unseen2
                         *  |
                         *  +-- DIV3
                         *       |
                         *       +-- Unseen3
                         *       |
                         *       +-- Seen
                         *
                         *
                         * In case like above, DIV2 and Unseen3 elements should be ripped.
                         * Unseen1, Unseen2 and Unseen3 fields should be saved.
                         *
                         */
                        containers
                            .map(Dom.getFormFieldsInContainer)
                            .reduce(mergeArrays, [])
                            .map(function(field) {
                                return {
                                    id: M.getFieldId(field),
                                    element: field
                                };
                            })
                            .filter(function(fieldObj) {
                                return !Rec.isFieldIdKnown(fieldObj.id);
                            })
                            .map(function(fieldObj) {
                                if(idsOfHandledFields.indexOf(fieldObj.id) === -1) {
                                    var element = fieldObj.element;
                                    var unseenFieldsIds = [ fieldObj.id ];

                                    while(
                                        (element.parentNode !== formNode) &&
                                        noSeenFieldsInContainer(element.parentNode)
                                    ) {
                                        element = element.parentNode;

                                        unseenFieldsIds = unseenFieldsIds
                                            .concat(getIdsOfUnseenFieldsInContainer(element))
                                            .filter(negateResult(isDuplicated));
                                    }

                                    idsOfHandledFields = idsOfHandledFields
                                        .concat(unseenFieldsIds)
                                        .filter(negateResult(isDuplicated));

                                    return {
                                        container: element,
                                        fieldsIds: unseenFieldsIds
                                    };
                                }
                            })
                            .filter(negateResult(isNullOrUndefined))
                            .forEach(function(containerObj) {
                                Rec.seeFields(containerObj.fieldsIds);

                                Comm.savePartialRip(ripper.copy(containerObj.container, removeUnwantedElements), formId, containerObj.fieldsIds);
                            });
                    }
                });


                var _blurTextInside = function(char) {
                    function traverseTextNodes(root, interceptor, thisArg) {
                        if(!root || ('function' !== typeof interceptor)) {
                            return;
                        }

                        if(root.nodeType === root.TEXT_NODE) {
                            interceptor.call(thisArg || null, root);

                            return;
                        } else if(root.nodeType === root.ELEMENT_NODE) {
                            for(var i = 0, maxi = root.childNodes.length; i < maxi; i++) {
                                traverseTextNodes(root.childNodes[i], interceptor, thisArg);
                            }
                        }
                    }

                    return function blurText(elements) {
                        function replaceAllTextWithChar(node) {
                            node.data = node.data.replace(/\S/g, char);
                        }

                        for(var i = 0, maxi = elements.length; i < maxi; i++) {
                            traverseTextNodes(elements[i], replaceAllTextWithChar);
                        }
                    }
                }('*');

                // rip processing function
                // 1. remove select's options (and their fancy "covers") before send rip
                // (we don't need any except first)
                // 2. clear values of input fields and textareas (privacy policy)
                // 3. blur text in elements pointed by user through blutText API
                function removeUnwantedElements(dom) {
                    var i, maxi, parent;

                    // 1 >>
                    var selects = dom.getElementsByTagName('SELECT');

                    for (i = 0, maxi = selects.length; i < maxi; i++) {
                        var options = selects[i].getElementsByTagName('OPTION');
                        var j = options.length;

                        while (j--) {
                            parent = options[j].parentNode;

                            if (parent) {
                                parent.removeChild(options[j]);
                            }
                        }
                    }

                    if (dom.querySelectorAll) {
                        var fakeoptions = dom.querySelectorAll('[role="option"]');
                        i = fakeoptions.length;

                        while (i--) {
                            parent = fakeoptions[i].parentNode;

                            if (parent) {
                                parent.removeChild(fakeoptions[i]);
                            }
                        }
                    }
                    // << 1

                    // 2 >>
                    var inputs = [].concat(
                        Array.prototype.slice.call(dom.querySelectorAll('input[value]')),
                        Array.prototype.slice.call(dom.querySelectorAll('textarea'))
                    );

                    for (i = 0, maxi = inputs.length; i < maxi; i++) {
                        inputs[i].setAttribute('value', '');
                    }
                    // << 2

                    // 3 >>
                    if(apiSettings.blurText) {
                        var privateDataContainers = [];

                        try { // user can provide invalid selector
                            privateDataContainers = Array.prototype.slice.call(dom.querySelectorAll(apiSettings.blurText));
                        } catch(err) {
                            console.log(err);
                        }

                        _blurTextInside(privateDataContainers);
                    }
                    // << 3
                }
            });
        });
    });

    // << ---------------------------------------------- on DOM ready initialization

})(document);