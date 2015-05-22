(function() {
    //cross tool communication
    if (window['-=UTC-NO-REC']) {
        return;
    }
    //--------------------------------------------------------------settings

    function p(s) {
        return parseInt(s);
    }

    function b(s) {
        return (s === 'true');
    }

    //settings
    var S = {
        client: "123", //client id
        dict: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!~*;:/$,", //dictionary for baseN number encoding
        geta: "https://usabilitytools.com/clicktracker/", //URL to send GET requests to
        jsdir: "/statics/js/", //path to js files, relative to `geta`

        poll: p("3000"), //DOM polling time - once every `poll` DOM will be checked for changes in old browsers
        getl: p("1300"), //length of content that is big enough to send with GET. A string a bit longer than that, appended to `geta` should fit in GET length limit
        cN: p("10"), //click coordinates rounded by N pixels
        hN: p("10"), //hover coordinates rounded by N pixels
        tq: p("100"), //time quant in miliseconds. 1 hover = `tq` miliseconds
        tx: p("2000"), //stop recording hovers if mouse stays in the same spot for longer than `tx`
        cntr: true,
        disabled: b("true") //turns tracker off
    };

    //data holders
    var E = {C: {}, H: {}, T: {}};
    var SITE = '', URL = '';

    //API controlled flags/variables
    var urlOverride = null, //stored URL override
        settingsOverride = null,
        manualDisable = false;

//==================

    var ddE = document.documentElement,
        D = document;

//==================

    var M = { //Maths

        //converter for signed integers, from signed integer to baseN
        mkConverterSigned: function(l) { //L character Signed (Integer) number converter factory
            var c = (S.dict).split(""), b = S.dict.length, b2 = b * b, mod = Math.pow(b, l); //one time init

            if (l === 2) { //twochar unrolled for speed
                return function(n) {
                    n = (n < 0) ? -n << 1 | 1 : n << 1;//one bit for sign
                    var s = "";
                    n = n % b2;

                    s = c[n % b];
                    n = Math.floor(n / b);
                    s = c[n % b] + s;
                    return s;
                };
            } else {
                return function(n) {
                    n = (n < 0) ? -n << 1 | 1 : n << 1;//lowest bit is the sign
                    var s = "";
                    n = n % mod;
                    var i;
                    for (i = 0; i < l; i += 1) {
                        s = c[n % b] + s;
                        n = Math.floor(n / b);
                    }
                    return s;
                };
            }
        },
        //converter for UNsigned integers, from signed integer to baseN
        //this is only used for writing hash function values to baseN
        mkConverterUnsigned: function(l) { //L character Unsigned (Natural) number converter factory
            var c = (S.dict).split(""), b = S.dict.length, mod = Math.pow(b, l); //one time init
            //
            return function(n) {
                var s = "";
                n = n % mod;
                var i;
                for (i = 0; i < l; i += 1) {
                    s = c[n % b] + s;
                    n = Math.floor(n / b);
                }
                return s;
            };
        },
        /* //decoder for unsigned version, might be useful for testing
         dVN=function(x){
         var ret=0;
         for(var i=1;x.length>0;i*=b){
         ret += s.indexOf(x.charAt(x.length-1)) * i
         x = x.substr(0,x.length-1);
         }
         return ret;
         }
         */

        //simplehash hashing function
        //cares more about differences in the beginning of the string
        mkHash: function(c) { //factory of hashing functions. accepts c - converter function (eg. the unsigned converter)
            return function(s) { //accepts string
                var i, h = 0, l = s.length;
                for (i = 0; i < l; i++) {
                    h += (s.charCodeAt(i) * (i + 1));
                }
                return c(Math.abs(h)); //converter has a built-in limit for number of output chars
            };
        }
    };//eof Maths

    //Framework
    var F = {
        cV: M.mkConverterSigned(2), //creates a 2char converter
        has: function(t, w) {
            return t.hasOwnProperty(w);
        }
    };
    F.sH = M.mkHash(F.cV); //simplehash made of 2char converter

    //--------------------------------------------------------------DOM elements identification
    //e-element, n-parent, k-iterator number, u - undefined
    F.iD = function(e, n, k, u) {
        if (e.zzi === u) { //identifies only once
            var x = (e.firstChild && e.firstChild.nodeValue) ? e.firstChild.nodeValue.replace(/\s*/g, '') : ''; //first node is a text node
            //this causes the beginning of the content to be taken into account when the identifier is created

            //creates the id
            e.zzi = n + '' + F.sH(k + e.id + e.className + e.nodeName.substr(0, 2) + x);
            //e.zzi=n+e.nodeName.substr(0,1)+sH(k+e.id+e.className+e.nodeName.substr(0,2)+x);


        }

        //recursion for DOM tree, identifies every node there is
        //faster than jquery.sibling
        k = 0;
        x = e.firstChild;
        for (; x; x = x.nextSibling) {
            if (x.nodeType === 1 && x !== u) {
                k++;
                F.iD(x, e.zzi, k);
            }
        }

    };


    //-------------------------------------------------------------- Location / page URL handling

    //Page - handles page identyfication, first call made after loading tracker if it runs.
    //useful for popstate/pushstate handling (modern stuff, mobile stuff)
    function escapeUnderscores(string) {
	var from = '_';
	var fromCharCode = from.charCodeAt(0);
	var to = '%5F';
        var newString = string.toString();
        var fromIndex;


        for(var i = 0; i < newString.length; i++) {
	     if(newString.charCodeAt(i) === fromCharCode) {
	         newString = newString.substring(0, i) + to + newString.substring(i + 1);
                 i += to.length - 1;
             }
        }

        return newString;
    }


    F.P = function() {
        F.L();
        F.G(escapeUnderscores(SITE + S.client) + '_' + escapeUnderscores(escape(URL)) + '_' + F.cV(S.Ww) + '_' + F.cV(S.Hh) + '_' + escapeUnderscores(escape(D.referrer)), 'site');
    };
    //pagehasher - a hash function returning 5 chars
    F.pH = M.mkHash(M.mkConverterUnsigned(5));
    //Location handling function
    F.L = function() {
        //remove index.* from the address to make sure that the main page has all the results no matter how somebody enters it
        //hard to introduce, because it breaks backward compatibility
        //SITE=F.pH(window.location.href.replace(/index\.[a-z]+/gi,'').replace(/\/$/,'').split("").reverse().join(""));

        URL = (urlOverride) ? urlOverride : window.location.href;
        SITE = F.pH(URL.split("").reverse().join(""));//reverse is here to make changes at the end more prominent for the hash function
    };

    //--------------------------------------------------------------DOM changes monitoring
    var _S = 0; //semaphore to run R just once

    //DOM ready handler
    F.R = function() {
        //checking for forced stop
        if (window['-=UTC-NO-REC'] || manualDisable) {
            return;
        }
        //checking semaphore
        if (_S) {
            return;
        }
        _S = 1;
        if (settingsOverride) {
            S = settingsOverride(S);
        } //if API defined the override, run it

        F.oF = initiateOffsetFunction(); //run the offset function init so that the init does not trigger DOMchange listeners


        function readWindowSize() {
            var Ww = 0;
            if (window.innerWidth) {
                Ww = window.innerWidth;
            } else if (ddE && ddE.clientWidth) {
                Ww = ddE.clientWidth;
            } else if (D.body) {
                Ww = D.body.clientWidth;
            }
            return Ww;
        }
        S.Ww = readWindowSize();


        S.Hh = window.screen.height; //TODO check for cross-browsery


        //DOM identification run
        D.body.zzi = '';
        F.iD(D.body);

//REPLACE WITH INSERTIONQUERY or alike!!
//
        //monitorowanie zmian
        var TC = D.body.innerHTML;//total crap - zapis wszystkich elementów
        var STA = 0;//stan - przechowuje info o zmianach
        clearInterval(F.In);
        F.In = setInterval(function() {
            //liczba elementów
            var lg = D.body.innerHTML; //D.getElementsByTagName("*").length;//szybkie, ale co jeśli ktoś podmieni na tą samą ilość?
            if (Math.abs(TC.length - lg.length) > 200) { //if change in length is major
                STA = 1; //zauwazono roznice
                TC = lg;
            } else {
                if (STA == 1) {//po zauwazeniu roznicy zmiany ustaly
                    STA = 0;
                    F.iD(D.body);
                }
            }
        }, S.poll);
        if (F.noie) {
            //bad preformance
            F.listen("DOMNodeInserted", function(e) {  //domnodeinserted reaguje też na textnody
                clearInterval(F.In);        //wyłącza poprzednią metodę jeśli zostanie złapany event
                var x = e.target.parentNode.tagName;
                if (x !== 'HTML' && x !== 'HEAD') {
                    F.iD(e.target.parentNode); //tu można użyć e.target, bo to nie jest odpalane w IE
                }
            }, D.body);
        }
//END OF REPLACE WITH INSERTIONQUERY

        //--------------------------------------------------------------------------- START HERE
        //THE APP FLOW ACTUALLY STARTS HERE

        //choose the usecase
        var nme = window.name.substr(0, 3);
        if (nme === 'key') { //usecase: client wants to see the data
            //run location evaluation for analyze also, but no reason to send page info
            F.L();
            //Push some things to the M lib, to be used by the results script
            var t = window.name.substr(3, 1);
            S.view = t;//determines which tab was selected
            M.S = S;
            M.SITE = SITE;
            M.key = window.name.substring(4);
            //communicate with other scripts
            window['-=UTC-NO-REC'] = true;
            //leak M and F out of the closure for the results script to use
            window['.-=get=-.'] = function() {
                return {M: M, F: F};
            };

            F.GS(S.jsdir + 'results.js');

            function reload() {
                // we can't reload heatmap, so, reload whole page
                setTimeout(function() {
                    window.location.reload();
                }, 100);
            }

            setTimeout(function() {
                // soo ugly
                var pushState = window.history.pushState;
                window.history.pushState = function() {
                    pushState.apply(window.history, arguments);

                    reload();
                };

                F.listen("popstate", reload, window);
            }, 1000);
        } else {
            if (!S.disabled) {
                //react to resize
                F.listen("resize", function(e) {
                    S.Ww = readWindowSize();
                }, window);

                //Evaluate location and send page data
                F.P();
                //handle statechange
                setTimeout(function() {
                    // soo ugly
                    var pushState = window.history.pushState;
                    window.history.pushState = function() {
                        pushState.apply(window.history, arguments);

                        F.P();
                    };

                    F.listen("popstate", F.P, window);
                }, 1000);//assuming initial popstate runs before the end of this time, and everything after that is reasonable

                ///start listening to events
                F.sLE();
            }
        }

        //done
    } // /R




    //initiation, DOMReady attached here
    F.noie = (function() {
        if (D.addEventListener) { //W3C compatible
            F.listen = function(e, f, n) {
                ((n) ? n : D).addEventListener(e, f, false)
            };
            F.listen("DOMContentLoaded", F.R);
            return true;
        } else {
            F.listen = function(e, f, n) {
                ((n) ? n : D).attachEvent('on' + e, function(a) {
                    //a trick to get event.target to work in IE
                    a.target || (a.target = a.srcElement);
                    f(a);
                });
            }; //IE8 or worse
            F.listen("readystatechange", function() {
                if (D.readyState === "complete") {
                    F.R();
                }
            });
            return false;
        }
    })();

    //in case it's after DOMReady, because the script was loaded dynamically much later
    //I don't like what this can do to LOOONG pages
    //this fallback should be removed
    setTimeout(function() {
        F.R();
    }, 2000);



    //--------------------------------------------------------------check if collected data reached max GET size and send
    F.c1 = M.mkConverterSigned(1);

    //Aggregation - generates the payload with data and decides if it should be sent (big enough)
    //forceSend=true overrides the decision and sends whatever there is
    F.A = function(forceSend) {
        //qu - query string, data part. tags - tags array
        var qu = F.c1((new Date()).getHours()) + '' + SITE + '' + S.client + '_',
            tags = [];

        for (var y in E) { //loop event types
            if (F.has(E, y)) {
                for (var i in E[y]) { //loop all elements that it encountered
                    if (F.has(E[y], i)) {
                        var s = i + '' + y;  //name+eventType, name contains a dash at the end
                        for (var j in E[y][i])
                            F.has(E[y][i], j) && (s += '' + j + F.cV(E[y][i][j])); // concatenate xy and values, no separators
                    }
                    tags[tags.length] = s;
                }
            }
        }
        //add separators between data chunks
        qu += tags.join("_");
        if (uLs || forceSend || qu.length > S.getl) { //if unload event in progress or force or length is enough
            F.G(qu, 'rec');
            E = {C: {}, H: {}, T: {}}; //REINIT to the same value as default empty events set
        }

    };

    //Make a GET request
    ////adds an img tag after body
    //qu - query part, name - service name optional
    F.G = function(qu, nme, u) {
        if (nme === u) {
            nme = ''
        }
        var im = D.createElement("img");//switched it to img, better handled on unload
        im.setAttribute('height', 0);
        qu = (qu) ? '?' + qu : '';
        im.src = S.geta + nme + qu;
        ddE.appendChild(im);
        setTimeout(function() {
            ddE.removeChild(im);
        }, 2000);
        return im;
        //ignoring whatever is returned
    };
    //get script
    F.GS = function(nme) {
        var sc = D.createElement("script");
        sc.setAttribute('async', 'async');
        sc.src = S.geta + nme;
        //qu&&(sc.src+='?'+qu); //if qu is not falsy, append it
        var head = D.head || D.getElementsByTagName("head")[0] || ddE;
        head.insertBefore(sc, head.firstChild);
    };

    //unload - page exit handling
    var uLs = false; //unload state

    // unload handler
    F.uL = function(e) {
        uLs = true;
        F.A(true); //force seending
        //dummy operations to give it some time to
        if (window.localStorage) {
            window.localStorage.setItem('qpalzmwoskxneidjcnrufhvbtyg', 'qpalzmwoskxneidjcnrufhvbtyg');
            window.localStorage.removeItem('qpalzmwoskxneidjcnrufhvbtyg');
        } else {
            Math.sqrt(Math.pow(2342345345345, 2342345345345 * i));
        }

    };

    //some browsers give `unload` more time to send than `beforeunload`
    //this assumption should be validated again
    if (navigator.userAgent.indexOf('Gecko/2') > 0 || navigator.userAgent.indexOf('Opera') > 0) {
        window.onunload = F.uL;
    } else {
        window.onbeforeunload = F.uL;
        window.onunload = F.uL;
    }


    //--------------------------------------------------------------nasłuchiwanie kliknięć


    //gets XY mouse coords, computes and stores the element offset
    //nn - choice of N rounding value to use, deprecated
    F.gXY = function(e, nn) {
        nn = (nn) ? nn : 'cN'; //defaults to click, deprecated
        var el = e.target;
        //get element position and cache it
        //TODO counting again is not done. if the element moves, it doesn't work too well
        if (!el.zzp) {
            var p = F.oF(el);
            if (S.cntr) {
                el.zzp = F.cV(~~(~~(p.left) - (~~(S.Ww) >> 1) - 1) / S[nn]) + '' + F.cV(~~(p.top / S[nn]));//this includes the case when page is centered. x coord 0 is in the center in that case
            } else {
                el.zzp = F.cV(~~(p.left / S[nn])) + '' + F.cV(~~(p.top / S[nn]));
            }
        }

        //determine mouse position
        var pageX, pageY;
        if (e.pageX || e.pageY) {
            pageX = e.pageX;
            pageY = e.pageY;
        } else {
            //horribly old browsers
            if (e.clientX || e.clientY) {
                pageX = e.clientX + D.body.scrollLeft
                    + ddE.scrollLeft;
                pageY = e.clientY + D.body.scrollTop
                    + ddE.scrollTop;
            }	//else - what now?
        }
        //ignore NaN values and errors in getting position and (0,0) is not popular while being a probable result of a browser error...
        if(pageX>0 && pageY>0){
            //relative coords
            if (S.cntr) {
                pageX = pageX - (~~(S.Ww) >> 1) - 1;
            }
            return F.cV(Math.floor(pageX / S[nn])) + F.cV(~~(pageY / S[nn]));
        }
    };
    //Factory of event saving function.
    //et - event type, must be an existing key in the E collection
    F.mkS = function(et) { //et - event type
        return function(e) {
            var el = e.target;
            if (!el.zzi) {
                return;
            }//if unidentified, it's useless
            var xy = F.gXY(e);
            if(xy){
                var k = el.zzi + '-' + el.zzp; //key consisting of elementId and element position
                //prepares a collection for k if needed
                E[et][k] || (E[et][k] = {});
                //stores 1 or increments existing
                E[et][k][xy] = (E[et][k][xy]) ? E[et][k][xy] + 1 : 1;
                //Aggregate (and send if large enough)
                F.A();
            }
        };
    };
    // - - - - - - - - - - - - - - - - - -
    // sets up all the listeners, F.R calls this function
    F.sLE = function() {

        var cL = F.mkS('C');
        F.listen('mouseup', cL); //main click handling - catches it all
        var tL = F.mkS('C'); //F.mkS('T')
        F.listen('touchend', tL); //catches touches as well

        var tiv, to; //interval handler ids

        F.listen('mousemove', function(e) {
            clearInterval(tiv);
            clearTimeout(to); //drop all intervals, they are for updating counter while mouse stays in place
            var el = e.target;
            if (!el.zzi) {
                return;
            }//if unidentified, it's useless
            var xy = F.gXY(e);
            var k = el.zzi + '-' + el.zzp; //same as for clicks
            E.H[k] || (E.H[k] = {});
            E.H[k][xy] = (E.H[k][xy]) ? E.H[k][xy] + 1 : 1;
            F.A();
            //bump time up if the mouse stops for a moment
            tiv = setInterval(function() {
                E.H[k] || (E.H[k] = {});
                E.H[k][xy] = (E.H[k][xy]) ? E.H[k][xy] + 1 : 1;
            }, S.tq);
            to = setTimeout(function() {//stop increasing the value after some time of hangin there
                clearInterval(tiv);
            }, S.tx);
        });
    };
//===============================================================================================
//DEPRECATED, WAITING TO BE REMOVED
//external handler
    window['.-=exCT=-.'] = function(n, f) {
        if (!f.call) {
            S[n] = f;
            return S;
        } else {
            F[n] = f;
            return F;
        }
    };

//NEW API
    var API={
        pageChanged: function() {
            F.P();
        },
        overridePage: function(url) {
            urlOverride = url;
            F.L();//reevaluate
        },
        disableTracker: function() {
            if(URL===''){
                S.disabled=true;
            }
            return S.disabled;
        },
        forceLeftLayout: function() {
            S.cntr = false;
        }
    };
    window['UT-CT-API'] = API;
    if(window['UT-CT-API-STATIC']){
        if(window['UT-CT-API-STATIC'].overridePage){
            API.overridePage(window['UT-CT-API-STATIC'].overridePage);
        }
        if(window['UT-CT-API-STATIC'].disableTracker){
            API.disableTracker(window['UT-CT-API-STATIC'].disableTracker);
        }
        if(window['UT-CT-API-STATIC'].leftLayout){
            API.forceLeftLayout();
        }
    }

//===============================================================================================

// Offset handling derived from jQuery and licensed under MIT license
// http://jquery.org/license

//===============================================================================================

//offset from jQuery adapted and stripped-down
    function initiateOffsetFunction() {

        var fn = {};

//regexy
        var rtable = /^t(?:able|d|h)$/i,
            rroot = /^(?:body|html)$/i,
            rnumpx = /^-?\d+(?:px)?$/i;

//support
// Figure out if the W3C box model works as expected
// D.body must exist before we can do this

        var div = D.createElement("div"),
            body = D.body || D.getElementsByTagName("body")[0];
        div.style.width = div.style.paddingLeft = "1px";
        body.appendChild(div);
        var boxModel = div.offsetWidth === 2;
        //sprzatanie
        body.removeChild(div).style.display = "none";
        div = null;
// /support

//mój mały extend
        function extend(e, w) {
            for (var i in w) {
                if (F.has(w, i)) {
                    e[i] = w[i];
                }
            }
            return e;
        }

//pobieracz CSS

        if (D.defaultView && D.defaultView.getComputedStyle) {
            var css = function(e, n) {
                var ret, defaultView, computedStyle;

                if (!(defaultView = e.ownerDocument.defaultView)) {
                    return undefined;
                }

                if ((computedStyle = defaultView.getComputedStyle(e, null))) {
                    ret = computedStyle.getPropertyValue(n);

                }

                return ret;
            };
        } else {

            if (ddE.currentStyle) {
                var css = function(e, n) {
                    var left,
                        ret = e.currentStyle && e.currentStyle[ n ],
                        rsLeft = e.runtimeStyle && e.runtimeStyle[ n ],
                        style = e.style;

                    // From the awesome hack by Dean Edwards
                    // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

                    // If we're not dealing with a regular pixel number
                    // but a number that has a weird ending, we need to convert it to pixels
                    if (!rnumpx.test(ret) && rnum.test(ret)) {
                        // Remember the original values
                        left = style.left;

                        // Put in the new values to get a computed value out
                        if (rsLeft) {
                            e.runtimeStyle.left = e.currentStyle.left;
                        }
                        style.left = n === "fontSize" ? "1em" : (ret || 0);
                        ret = style.pixelLeft + "px";

                        // Revert the changed values
                        style.left = left;
                        if (rsLeft) {
                            e.runtimeStyle.left = rsLeft;
                        }
                    }

                    return ret;
                };
            }
        }


//window getter
        function getWindow(obj) {
            return (obj && typeof obj === "object" && "setInterval" in obj) ?
                obj :
                obj.nodeType === 9 ?
                obj.defaultView || obj.parentWindow :
                false;
        }

//offset
        var offset = {
            initialize: function() {
                var body = D.body, container = D.createElement("div"), innerDiv, checkDiv, table, td, bodyMarginTop = parseFloat(css(body, "marginTop")) || 0, stlz = "position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;",
                    html = "<div style='" + stlz + "'><div></div></div><table style='" + stlz + "' cellpadding='0' cellspacing='0'><tr><td></td></tr></table>";



                extend(container.style, {position: "absolute", top: 0, left: 0, margin: 0, border: 0, width: "1px", height: "1px", visibility: "hidden"});

                container.innerHTML = html;
                body.insertBefore(container, body.firstChild);
                innerDiv = container.firstChild;
                checkDiv = innerDiv.firstChild;
                td = innerDiv.nextSibling.firstChild.firstChild;

                this.doesNotAddBorder = (checkDiv.offsetTop !== 5);
                this.doesAddBorderForTableAndCells = (td.offsetTop === 5);

                checkDiv.style.position = "fixed";
                checkDiv.style.top = "20px";

                // safari subtracts parent border width here which is 5px
                this.supportsFixedPosition = (checkDiv.offsetTop === 20 || checkDiv.offsetTop === 15);
                checkDiv.style.position = checkDiv.style.top = "";

                innerDiv.style.overflow = "hidden";
                innerDiv.style.position = "relative";

                this.subtractsBorderForOverflowNotVisible = (checkDiv.offsetTop === -5);

                this.doesNotIncludeMarginInBodyOffset = (body.offsetTop !== bodyMarginTop);

                body.removeChild(container);
                offset.initialize = function() {
                };
            },
            bodyOffset: function(body) {
                var top = body.offsetTop,
                    left = body.offsetLeft;

                if (offset.doesNotIncludeMarginInBodyOffset) {
                    top += parseFloat(css(body, "marginTop")) || 0;
                    left += parseFloat(css(body, "marginLeft")) || 0;
                }

                return {top: ~~(top), left: ~~(left)}; //ja dodałem tyldy, żeby nie dostawać floatów.
            }


        };

//inicjalizuje od razu
        offset.initialize();

        if ("getBoundingClientRect" in ddE) {
            fn.offset = function(e) {

                /* niepotrzebne
                 if ( !e || !e.ownerDocument ) {
                 return null;
                 }
                 */
                if (e === e.ownerDocument.body) {
                    return offset.bodyOffset(e);
                }

                try {
                    var box = e.getBoundingClientRect();
                } catch (e) {
                }

                var doc = e.ownerDocument,
                    docElem = doc.documentElement;

                /* niepotrzebne
                 // Make sure we're not dealing with a disconnected DOM node
                 if ( !box || !jQuery.contains( docElem, e ) ) {
                 return box ? { top: box.top, left: box.left } : { top: 0, left: 0 };
                 }
                 */
                var body = doc.body,
                    win = getWindow(doc),
                    clientTop = docElem.clientTop || body.clientTop || 0,
                    clientLeft = docElem.clientLeft || body.clientLeft || 0,
                    scrollTop = win.pageYOffset || boxModel && docElem.scrollTop || body.scrollTop,
                    scrollLeft = win.pageXOffset || boxModel && docElem.scrollLeft || body.scrollLeft,
                    top = box.top + scrollTop - clientTop,
                    left = box.left + scrollLeft - clientLeft;

                return {top: ~~(top), left: ~~(left)}; //ja dodałem tyldy, żeby nie dostawać floatów.
            };

        } else {



            fn.offset = function(elem) {

                if (!elem || !elem.ownerDocument) {
                    return null;
                }

                if (elem === elem.ownerDocument.body) {
                    return offset.bodyOffset(elem);
                }

                /* potrzebne i tak zawsze, przenoszę wyzej
                 offset.initialize();
                 */
                var computedStyle,
                    offsetParent = elem.offsetParent,
                    prevOffsetParent = elem,
                    doc = elem.ownerDocument,
                    docElem = doc.documentElement,
                    body = doc.body,
                    defaultView = doc.defaultView,
                    prevComputedStyle = defaultView ? defaultView.getComputedStyle(elem, null) : elem.currentStyle,
                    top = elem.offsetTop,
                    left = elem.offsetLeft;

                while ((elem = elem.parentNode) && elem !== body && elem !== docElem) {
                    if (offset.supportsFixedPosition && prevComputedStyle.position === "fixed") {
                        break;
                    }

                    computedStyle = defaultView ? defaultView.getComputedStyle(elem, null) : elem.currentStyle;
                    top -= elem.scrollTop;
                    left -= elem.scrollLeft;

                    if (elem === offsetParent) {
                        top += elem.offsetTop;
                        left += elem.offsetLeft;

                        if (offset.doesNotAddBorder && !(offset.doesAddBorderForTableAndCells && rtable.test(elem.nodeName))) {
                            top += parseFloat(computedStyle.borderTopWidth) || 0;
                            left += parseFloat(computedStyle.borderLeftWidth) || 0;
                        }

                        prevOffsetParent = offsetParent;
                        offsetParent = elem.offsetParent;
                    }

                    if (offset.subtractsBorderForOverflowNotVisible && computedStyle.overflow !== "visible") {
                        top += parseFloat(computedStyle.borderTopWidth) || 0;
                        left += parseFloat(computedStyle.borderLeftWidth) || 0;
                    }

                    prevComputedStyle = computedStyle;
                }

                if (prevComputedStyle.position === "relative" || prevComputedStyle.position === "static") {
                    top += body.offsetTop;
                    left += body.offsetLeft;
                }

                if (offset.supportsFixedPosition && prevComputedStyle.position === "fixed") {
                    top += Math.max(docElem.scrollTop, body.scrollTop);
                    left += Math.max(docElem.scrollLeft, body.scrollLeft);
                }

                return {top: ~~(top), left: ~~(left)}; //ja dodałem tyldy, żeby nie dostawać floatów.
            };
        }

        return fn.offset;

    }

})();

