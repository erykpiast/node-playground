(function() {var g = window["UT-VR"] = (window["UT-VR"] || {});g.experimentId = (g.experimentId || "113625");g.ioAddress = "wss://usabilitytools.com";g.ioResource ="nuvr-rec/socket.io";g.sessionKey ="NUVR_113625_";})();
;(function() {var define=null;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {

     // if some other UTC script told that we should not record
    if (window['-=UTC-NO-REC']) {
        return;
    }

    // if we are on the CT analyze page
    if(window.name.match(/key(?:G|E|H|A)[0-9a-z]{40}/)) {
        return;
    }


    var support = require('./support');
    if (support) { //all the browser feature detection you'll ever need
        var DomRecorder = require('./domrecorder');
        var Persist = require('./persist');
        var EventMachine = require('./eventmachine');
        var Ripper = require('../lib/ripper');
        var domId = require('../lib/domid');
        var domReady = require('../lib/domready');

        var ripper = Ripper({
            dictionary: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!~*;:/$,",
            numberLength: 3,
            heuristic: false,
            compress: false
        });

        Persist.handleDeath(function() {
            EventMachine.destroy();
            DomRecorder.destroy();
        });

        var time = Date.now();
        Persist.init(time);


        domReady(function() {
            if (!window['-=UTC-NO-REC']) {
                var domIdInstance = domId.init(document);

                EventMachine.init(domIdInstance, {
                    moveTimespan: 100,
                    actionTimespan: 500
                });

                DomRecorder.init(Persist, ripper, domIdInstance);
            }
        });
    }

})();

},{"../lib/domid":5,"../lib/domready":6,"../lib/ripper":7,"./domrecorder":24,"./eventmachine":25,"./persist":28,"./support":34}],2:[function(require,module,exports){
/*
 * KeyMap constructor accepts two settings
 *  {
 *      String valueKey    - key for saving value in map entry object; if falsy, value is persisted without map entry object
 *      Boolean allowFalsy - tolerate falsy values or not
 *  }
 *
 * Public methods:
 *  - Object add(String key, Mixed value) - add element to map with key `key`; if key is occupied, throws error
 *  - Object get(string key) - get value/map entry object for key; throws error if key is not set
 *  - Boolean has(String key) - check if key is set in map
 *
 */

module.exports = (function() {

    var _ = require('underscore');


    function KeyMap(settings) {
        this._map = { };
        this._settings = _.extend({
           valueKey: null,
           allowFalsy: true
        }, settings);
    }

    _.extend(KeyMap.prototype, {
        name: 'KeyMap',
        add: function(key, value) {
           if(this._map[key] !== undefined) {
               throw new Error('key "' + key + '" already exists in map');
           } else if(!this._settings.allowFalsy && !value) {
               throw new Error('value can not be falsy but it is "' + value + '"');
           } else {
                if(this._settings.valueKey) {
                    this._map[key] = { };
                    this._map[key][this._settings.valueKey] = value;
                } else {
                    this._map[key] = value;
                }
            }

            return this._map[key];
        },
        has: function(key) {
            return !!this._map.hasOwnProperty(key);
        },
        get: function(key) {
            if(!this.has(key)) {
                throw new Error('no key "' + key + '" in map');
            } else {
                return this._map[key];
            }
        }
    });


    return KeyMap;

})();
},{"underscore":22}],3:[function(require,module,exports){
/*
 * Translate constructor accepts array with object in format
 *  {
 *      String long  - long version of key
 *      String short - short version of key
 *      Array values - array of objects with keys "short" and "long" used for translation map for object values
 *  }
 *
 * Public methods:
 *  - Object toLong  - translate object from short to long version
 *  - Object toShort - translate object from long to short version
 *
 * Returned objects don't contain keys with undefined values!
 */

module.exports = (function() {

    var _ = require('underscore');
    var KeyMap = require('./KeyMap');


    function Translate(map) {
        if(!(map && map.length)) {
            throw new Error(this.name + ' constructor: not empty Array required as first argument');
        }

        this._maps = {
            longToShort: new KeyMap({
                valueKey: 'short',
                allowFalsy: false
            }),
            shortToLong: new KeyMap({
                valueKey: 'long',
                allowFalsy: false
            })
        };

        map.forEach(function addToMap(entry) {
            var longToShort = this._maps.longToShort.add(entry.long, entry.short);
            var shortToLong = this._maps.shortToLong.add(entry.short, entry.long);

            if(entry.values && entry.values.length) {
                longToShort.values = new KeyMap({
                    allowFalsy: false
                });


                shortToLong.values = new KeyMap({
                    allowFalsy: false
                });

                entry.values.forEach(function(entry) {
                    longToShort.values.add(entry.long, entry.short);
                    shortToLong.values.add(entry.short, entry.long);
                });
            }
        }, this);
    }

    _.extend(Translate.prototype, {
        name: 'Translate',
        _translate: function(keysMap, valueKey, o, replaceKeys) {
            var res = (replaceKeys ? o : { });

            _.each(o, function(value, key) {
                if(value !== undefined) {
                    var keyEntry = keysMap.get(key);
                    var valueEntry = (keyEntry.values && keyEntry.values.get(value)) || value;

                    res[keyEntry[valueKey]] = valueEntry;
                }

                if(replaceKeys) {
                    delete res[key];
                }
            });

            return res;
        },
        toLong: function(o, replaceKeys) {
            return this._translate(this._maps.shortToLong, 'long', o, !!replaceKeys);
        },
        toShort: function(o, replaceKeys) {
            return this._translate(this._maps.longToShort, 'short', o, !!replaceKeys);
        }
    });


    return Translate;

})();
},{"./KeyMap":2,"underscore":22}],4:[function(require,module,exports){
//absifying helpers for ripper
(function() {



    function parseURI(url) {
        var m = String(url).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
        // authority = '//' + user + ':' + pass '@' + hostname + ':' port
        return (m ? {
            href: m[0] || '',
            protocol: m[1] || '',
            authority: m[2] || '',
            host: m[3] || '',
            hostname: m[4] || '',
            port: m[5] || '',
            pathname: m[6] || '',
            search: m[7] || '',
            hash: m[8] || ''
        } : null);
    }

    function absolutizeURI(base, href) {// RFC 3986

        function removeDotSegments(input) {
            var output = [];
            input.replace(/^(\.\.?(\/|$))+/, '')
                    .replace(/\/(\.(\/|$))+/g, '/')
                    .replace(/\/\.\.$/, '/../')
                    .replace(/\/?[^\/]*/g, function(p) {
                if (p === '/..') {
                    output.pop();
                } else {
                    output.push(p);
                }
            });
            return output.join('').replace(/^\//, input.charAt(0) === '/' ? '/' : '');
        }

        href = parseURI(href || '');
        base = parseURI(base || '');

        return !href || !base ? null : (href.protocol || base.protocol) +
                (href.protocol || href.authority ? href.authority : base.authority) +
                removeDotSegments(href.protocol || href.authority || href.pathname.charAt(0) === '/' ? href.pathname : (href.pathname ? ((base.authority && !base.pathname ? '/' : '') + base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1) + href.pathname) : base.pathname)) +
                (href.protocol || href.authority || href.pathname ? href.search : (href.search || base.search)) +
                href.hash;
    }



    //all node types that are worth absing, attr name for each to parse
    var interestingNodes = {
        'LINK': 'href',
        'IMG': 'src',
        'AREA': 'href',
        'IMAGE': 'src',
        'A': 'href'
    };



//module constructor
    module.exports = {
        init: function(makeRecursiveTraverser) {
            var memAbsolutizeURI = (function() {
                var mem = {}, base = window.location.origin + window.location.pathname;
                return function(url) {
                    if (mem[url]) {
                        return mem[url];
                    } else {
                        mem[url] = absolutizeURI(base, url);
                        return mem[url];
                    }
                };
            })();

            function absify(dom) {
                makeRecursiveTraverser(function(e, id) {
                    if (interestingNodes[e.nodeName]) {
                        if (e.hasAttribute(interestingNodes[e.nodeName])) {
                            e.setAttribute(interestingNodes[e.nodeName], memAbsolutizeURI(e.getAttribute(interestingNodes[e.nodeName])));
                        }
                    }
                })(dom, 0);
                return dom;
            }

            return {
                absify: absify,
            };
        },
        parseURI: parseURI
    };

})();
},{}],5:[function(require,module,exports){
(function(undefined) {

    var _ = require('./underscore');

    var ignoredElements = {
        'SCRIPT': 1,
        'NOSCRIPT': 1
    };

    var tag = 'utcid',
        htmlId = 'R',
        headId = 'H',
        bodyId = 'B';

    // creates a converter function that translates numbers to base(dictionary.length) which can be more than base64
    var numConvert = (function(dictionary) { // factory for a l-character converter
        var c = (dictionary).split(""),
            b = dictionary.length,
            max = b * b;
        return function(n) {
            if (typeof(n) !== 'number') {
                return '';
            }
            var s = "";
            if (n >= max) {
                throw 'Number too big to convert. Use bigger dictionary or numberLength.';
            }
            s = c[n % b];
            n = Math.floor(n / b);
            s = c[n % b] + s;
            return s;
        };
    })("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!~*;:/$,");


    function isDocumentRoot(nodeId) {
        return (nodeId === htmlId);
    }


    function init(doc) {

        var targetDoc = doc,
            simpleHash = function(s) {
            s = (s + '');//.replace(/\s+/g, ''); //fix for class attribute. not needed as we stopped using that attribute
            var i, h = 0, l = s.length;
            for (i = 0; i < l; i++) {
                h += (s.charCodeAt(i) * (i + 1));
            }
            return numConvert(Math.abs(h) % 4900);

        },
            documentNodeIdMap = {};

        // hardcoded HTML tag for sites not coverd by body
        documentNodeIdMap[htmlId] = doc.documentElement;

        function traverseDomWith(action) {
            return function recur(element, currentId, counter) {
                var x, id = action(element, currentId, counter);
                //doing stuff
                if (id) {
                    //go deeper
                    counter = 0;
                    x = element.firstChild;
                    for (; x; x = x.nextSibling) {
                        if ((x !== undefined) && (x.nodeType === 1) && !ignoredElements.hasOwnProperty(x.tagName)) {
                            counter++;
                            recur(x, currentId + '' + simpleHash(counter + element.nodeName.substr(0, 2)));
                        }
                    }
                }
            };
        }


        //el-element, n-tag for starting element
        function iD(el, n, force) {
            targetDoc.documentElement[tag] = htmlId;

            traverseDomWith(function(element, currentId) {
                if (force || (element[tag] === undefined)) {
                    element[tag] = currentId;
                    //e.setAttribute('data-zzi',id);
                }
                return element[tag];
            })(el, n, 0);

            return true;
        }


        function forceRun(el, n) {
            return iD(el, n, true);
        }


        function run(el, n) {
            return iD(el, n);
        }


        function getNodeById(id) {
            return documentNodeIdMap[id];
        }


        // identify all significant nodes (don't care about these ones outside body and head, because ripper doesn't care)
        function identifyDocument() {
            run(doc.head, headId);
            run(doc.body, bodyId);

            return true;
        }


        function mapTree(el, n) {
            traverseDomWith(function(element, currentId) {
                if (element[tag] === undefined) { // if not tagged
                    element[tag] = currentId; // this line is useful
                } else { // in case there was a tag override
                    currentId = element[tag];
                }
                documentNodeIdMap[currentId] = element;
                return currentId;
            })(el, n, 0);
        }


        function mapDocument() {
            mapTree(doc.head, headId);
            mapTree(doc.body, bodyId);
        }


        function markNode(node, id) {
            node[tag] = id; // this is needed and important
            documentNodeIdMap[id] = node;
        }


        function getId(node) {
            var id;

            if (node === targetDoc.documentElement) {
                id = htmlId;
            } else if (!!node[tag]) {
                id = node[tag];
            } else {
                (function() {
                })('ho ho ho, we have no id for this node!', node);
            }

            return id;
        }


        function hasId(node) {
            return (node[tag] !== undefined);
        }


        function destroy() {
            _.each(documentNodeIdMap, function(node, key) {
                delete node[tag];

                delete documentNodeIdMap[key];
            });

            documentNodeIdMap = {};
        }


        return {
            traverseDomWith: traverseDomWith,
            run: run,
            forceRun: forceRun,
            mapTree: mapTree,
            getId: getId,
            hasId: hasId,
            markNode: markNode,
            getNodeById: getNodeById,
            mapDocument: mapDocument,
            identifyDocument: identifyDocument,
            isDocumentRoot: isDocumentRoot,
            getTag: function() {
                return tag;
            },
            destroy: destroy
        };

    }


    module.exports = {
        init: init,
        isDocumentRoot: isDocumentRoot
    };

})();


},{"./underscore":9}],6:[function(require,module,exports){
var domReady = (function() {
    var cb, loaded = false;

    if((document.readyState === 'complete')
    || (document.readyState === 'loaded')
    || (document.readyState === 'interactive')) {
        loaded = true;
    } else {
        document.addEventListener('DOMContentLoaded', function fn() {
            document.removeEventListener('DOMContentLoaded', fn, false);

            loaded = true;

            if(!!cb) {
                cb();
            }
        }, false);
    }


    return function(_cb) {
            if(!!_cb && !cb) {
                cb = function(){
                    //initial rip will contain modifications made on domready by the site
                    setTimeout(_cb,1);
                };

                if(loaded) {
                    cb();
                }
            }
        };
    })();

    module && (module.exports=domReady);
},{}],7:[function(require,module,exports){
/*!
 * Ripper.js v0.1
 * Copyright 2012, Zbigniew Tenerowicz, naugtur.pl
 * MIT License, see license.txt
 */

var Ripper = function(S) {
  'use strict';

  S || (S = {});
  S.dictionary || (S.dictionary = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!~*;:/$,-_");
  S.numberLength || (S.numberLength = 2);
  S.heuristic || (S.heuristic = false);
  S.keepJS || (S.keepJS = false);
  S.compress || (S.compress = false);
  //------------------------------------------------------------------- /Math
  var M = (function() {
    var c = (S.dictionary).split(""),
    b = S.dictionary.length;

    //creates a converter function that translates numbers to base(dictionary.length) which can be more than base64

    function makeConverter(l) { //factory for a l-character converter
      var max;

      if (l === 2) { //case of 2 chars - unrolled for performance
        max = b * b;
        return function(n) {
          if (typeof(n) !== 'number') {
            return ''
          }
          var s = "";
          if (n >= max) {
            throw 'Number too big to convert. Use bigger dictionary or numberLength.';
          }
          s = c[n % b];
          n = Math.floor(n / b);
          s = c[n % b] + s;
          return s;
        };
      } else {
        max = Math.pow(b, l); //init once
        return function(n) {
          if (typeof(n) !== 'number') {
            return ''
          }
          var s = "";
          if (n >= max) {
            throw 'Number too big to convert. Use bigger dictionary or numberLength.';
          }
          for (var i = 0; i < l; i += 1) {
            s = c[n % b] + s;
            n = Math.floor(n / b);
          }
          return s;
        };
      }
    }

    //for any length of input converts it to proper integer based on dictionary

    function reverseConverter(x) {
      var ret = 0;
      for (var i = 1; x.length > 0; i *= b) {
        ret += S.dictionary.indexOf(x.charAt(x.length - 1)) * i;
        x = x.substr(0, x.length - 1);
      }
      return ret;
    }

    return {
      makeConverter: makeConverter,
      reverseConverter: reverseConverter
    }
  })();


  //------------------------------------------------------------------- /CSS
  var CSS = (function() {

    var defaultsStore = {}, prefix;

    function getVendorPrefix() {
      if (prefix) {
        return prefix;
      }

      var someScript = document.getElementsByTagName('script')[0],
          pfxRegex = /^(Moz|Webkit|Khtml|O|ms)(?=[A-Z])/;

      for(var prop in someScript.style) {
        if(pfxRegex.test(prop)) {
          // test is faster than match, so it's better to perform
          // that on the lot and match only when necessary
          return prefix = prop.match(pfxRegex)[0];
        }
      }

      // Nothing found so far? Webkit does not enumerate over the CSS properties of the style object.
      // However (prop in style) returns the correct value, so we'll have to test for
      // the precence of a specific property
      if('WebkitOpacity' in someScript.style) return prefix = 'Webkit';
      if('KhtmlOpacity' in someScript.style) return prefix = 'Khtml';

      return prefix = '';
    }

    //replace -rr- prefix to the one used by current browser, or to optionally specified one
    function prefixify(value, prefix) {
      if (typeof prefix === "undefined") {
        prefix = '-' + getVendorPrefix().toLowerCase() + '-';
      }
      return value.replace(/(^|[\s,])-rr-/, prefix);
    }

    //change aaa-bbb into aaaBbb
    function camelize(prop) {
      prop = prefixify(prop, getVendorPrefix()+'-'); // we can't use -prefix- notation here, because in JS side one of the prefixes starts with lowercase. It's "ms" - what a surprise!
      var rep = function(a, b) {
        return b.toUpperCase();
      };
      return prop.replace(/\-([a-z])/g, rep);
    };

    function getStyleObject(dom) {
      var style, returns = {};
      if (window.getComputedStyle) {
        style = window.getComputedStyle(dom, null);
        for (var i = 0, l = style.length; i < l; i += 1) {
          var prop = style[i],
          val = style.getPropertyValue(prop);
          returns[prop] = val;
        }
        return returns;
      }
      if (style = dom.currentStyle) {
        for (var prop in style) {
          returns[prop] = style[prop];
        }
        return returns;
      }
      if (style = dom.style) {
        for (var prop in style) {
          if (typeof style[prop] != 'function') {
            returns[prop] = style[prop];
          };
        };
        return returns;
      };
      return returns;


    }

    //Single instance sandbox iframe
    var getSandbox = (function() {
      var ifr, iframeSandbox = false;
      ifr = document.createElement('iframe');
      ifr.title='UsabilityTools Visitor Recording';
      ifr.style.display = 'none';
      document.documentElement.appendChild(ifr);
      return function() {
        if (iframeSandbox) {
          return iframeSandbox;
        } else {

          iframeSandbox = ifr.contentDocument.body;
          return iframeSandbox;
        }
      };
    })();


    //memoized function to get the default style of an element
    //TODO [not sure anymore] prefetch styles for some form elements eg. putting OPTION in SELECT

    function memDefaults(tag, type) {
      var key = tag + type;
      if (defaultsStore[key]) {
        return defaultsStore[key];
      } else {
        //get styles for defaults
        var sandBox = getSandbox(),
        e = document.createElement(tag);
        type && (e.type = type);
        e.style.visibility = 'hidden';
        sandBox.appendChild(e);
        defaultsStore[key] = getStyleObject(e);
        defaultsStore[key].visibility = 'visible';
        sandBox.removeChild(e);
        return defaultsStore[key];
      }
    }

    //returns non-default styles for element
    // e is the element

    function getDiff(e) {
      var styles = getStyleObject(e),
      nn = e.nodeName,
      defaults, r = false; //result not empty
      if (nn === 'INPUT') {
        defaults = memDefaults(nn, e.getAttribute('type'));
      } else {
        defaults = memDefaults(nn, '');
      }

      for (var i in defaults) {
        if (defaults.hasOwnProperty(i)) {
          if (styles[i] === defaults[i]) {
            delete styles[i];
          } else {
            styles[i]=prefixify(styles[i], '-rr-');
            if(i.substr(0,1)==='-'){
              styles[i.replace(/^-[a-z]*-/,'-rr-')]=styles[i];
              delete(styles[i]);
            }
            //something remains
            r = true;

          }
        }
      }

      if(styles['cssFloat']){
          styles['float']=styles['cssFloat'];
          delete styles['cssFloat'];
      }

      return (r) ? styles : {};
    }


    return {
      get: getDiff,
      camelize:camelize,
      prefixify: prefixify
    }

  })();

  //------------------------------------------------------------------- /Heuristic Compress
  var Heuristic = (function() {

    var z = {},
    dictionary = ['color', 'div', 'border', 'font', 'text', 'origin', 'left', 'width', 'right', 'bottom', 'size', 'height', 'family', 'padding', 'transform', 'perspective', 'align', 'none', 'type', 'option', 'background', 'value', 'collapse', 'margin', 'outline', 'display', 'serif', 'sans', 'solid', 'spacing', 'cursor', 'href', 'Arial', 'auto', 'position', 'block', 'vertical', 'Tahoma', 'span', 'name', 'input', 'line', 'default', 'float', 'label', 'Helvetica', 'hidden', 'horizontal', 'repeat', 'center', 'absolute', 'Verdana', 'recaptcha', 'overflow', 'image', 'relative'],
    //some popular longer words in html and css
    keys = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''); //71
    //naive compression for html and CSS

    function compress(text) {
      var result;
      result = text.replace(/~/g, '~~'); //Not too often I guess
      for (var i = 0, l = dictionary.length; i < l; i += 1) {
        result=result.replace(RegExp(dictionary[i], 'g'), '~' + keys[i]);
      }
      return result;
    }

    //decompression

    function decompress(text) {
      var result = text;
      for (var i = 0, l = dictionary.length; i < l; i += 1) {
        result=result.replace(RegExp('~' + keys[i], 'g'), dictionary[i]);
      }
      result=result.replace(/~~/g, '~');
      return result;
    }

    return {
      compress: compress,
      decompress: decompress
    }
  })()

  //------------------------------------------------------------------- /LZW
  var LZW = (function() {
    //setup for basic dictionary
    var rootDict = 382;
    //good characters: ((n>31 && n<127)||n>=160) //TODO later?

    function compress(uncompressed) {
      // Build the dictionary.
      var i, dictionary = {},
      c, wc, w = "",
      result = [],
      dictSize = rootDict;
      for (i = 0; i < rootDict; i += 1) {
        dictionary[String.fromCharCode(i)] = i;
      }

      for (i = 0; i < uncompressed.length; i += 1) {
        c = uncompressed.charAt(i);
        if (c.charCodeAt(0) > rootDict) {
          continue;
        }
        wc = w + c;
        if (dictionary[wc]) {
          w = wc;
        } else {
          result[result.length] = dictionary[w];
          // Add wc to the dictionary.
          dictionary[wc] = dictSize++;
          w = String(c);
        }
      }

      // Output the code for w.
      if (w !== "") {
        result[result.length] = dictionary[w];
      }
      return result;
    }

    function decompress(compressed) {
      // Build the dictionary.
      var i, dictionary = [],
      w, result, k, entry = "",
      dictSize = rootDict;
      for (i = 0; i < rootDict; i += 1) {
        dictionary[i] = String.fromCharCode(i);
      }

      w = String.fromCharCode(compressed[0]);
      result = w;
      for (i = 1; i < compressed.length; i += 1) {
        k = compressed[i];
        if (dictionary[k]) {
          entry = dictionary[k];
        } else {
          if (k === dictSize) {
            entry = w + w.charAt(0);
          } else {
            throw "Unexpected character in decompression";
          }
        }

        result += entry;

        // Add w+entry[0] to the dictionary.
        dictionary[dictSize++] = w + entry.charAt(0);

        w = entry;
      }
      return result;
    }

    return {
      compress: function(txt, cV) {
        return compress(txt).map(function(a) {
          return cV(a)
        }).join('');
      },
      decompress: function(data, dV, chunkSize) {
        //split into chunks of characters
        var tmp = [],val;
        data = data.split('');
        while (data.length) {
          val = dV(data.splice(0, chunkSize).join(''));
          if(val<32){ //nothing less than space makes sense anyway
            throw "Unexpected entity in decoding";
          }
          tmp[tmp.length] = val;
        }
        return decompress(tmp);
      }
    };

  })();

  //------------------------------------------------------------------- /Main
  //creates a function that runs a callback for every node, recursively, and provides identification

  function makeRecursiveTraverser(callback) {
    var action = callback,
    cV = M.makeConverter(2);

    function recur(e, n, k, u) {
      var x, id = n + '' + cV(k);
      //doing stuff
      action(e, id);

      //go deeper
      k = 0;
      x = e.firstChild;
      for (; x; x = x.nextSibling) {
        if (x !== u && x.nodeType === 1 && (S.keepJS || x.nodeName!=='SCRIPT')) {
          recur(x, id, ++k);
        }
      }
    }
    return recur;
  }

  function mirror(node,preprocess,cssSkipped){
      var htmlContent, tmpdom, scripts;

    tmpdom = document.createElement(node.nodeName);
    tmpdom = node.cloneNode(true);
    if( typeof(preprocess) === 'function' ){
            preprocess(tmpdom);
        }

    if(S.keepJS){
    htmlContent = tmpdom.innerHTML;
      if(!cssSkipped){
            //no need for style and class
            htmlContent = htmlContent.replace(/\sstyle=("[^"<]*")|('[^'<]*')/gi, '');
        }
    }else{
        scripts = tmpdom.getElementsByTagName('script');
        var i = scripts.length;
        while (i--) {
          scripts[i].parentNode.removeChild(scripts[i]);
        }
      htmlContent = tmpdom.innerHTML;
        if(cssSkipped){
        htmlContent = htmlContent.replace(/\s(on[^ =]*)=("[^"<]*")|('[^'<]*')/gi, '');
        }else{
        //no need for style, drop events
        htmlContent = htmlContent.replace(/\s(style|on[^ =]*)=("[^"<]*")|('[^'<]*')/gi, '');
        }
    }

    //; ignore whitespace
    htmlContent = htmlContent.replace(/\s+/g, ' ');

    return htmlContent;

  }

  function getAttrs(node){
      var ret=[];
      for(var i=0;i<node.attributes.length;i+=1){
           ret.push({name:node.attributes[i].name,value:node.attributes[i].value});
      }
      return ret;
  }

  function rip(node,preprocess,skipCSS) {
    var htmlContent, rippedData, compressed;

    htmlContent = mirror(node,preprocess,skipCSS);

    rippedData = {
      html: htmlContent,
      attrs:getAttrs(node),
      name:node.nodeName,
      css: {}
    };
    if(!skipCSS){
        //store CSS recursively
        makeRecursiveTraverser(function(e, id) {
          rippedData.css[id] = CSS.get(e);
        })(node, '', 1);
    }

    var fragment = JSON.stringify(rippedData);
    //(function() {})(fragment);


    if (S.compress){
      if (S.heuristic) {
        fragment = Heuristic.compress(fragment);
      }
      compressed = LZW.compress(fragment, M.makeConverter(S.numberLength));
      return compressed;
    }else{
      return fragment;
    }

    return compressed;

  }

  function extract(data){
    var obj = data;
    if (S.compress) {
      obj= LZW.decompress(data, M.reverseConverter, S.numberLength);
      if (S.heuristic) {
        obj = Heuristic.decompress(obj);
      }
    }

    obj = JSON.parse(obj);
    return obj;
  }

  function put(data,target) {
    var node,findTR,
    obj = extract(data),
    nodeName = (obj.name)?obj.name:'div';


    if(target){
      node=target;
    }else{
      //if code starts from tr, it needs a table tag to work
      findTR = obj.html.substring(0,5);
      if(findTR.indexOf('<tr')>-1 || findTR.indexOf('<th')>-1 || findTR.indexOf('<td')>-1 ){
        nodeName = 'table';
      }
      node = document.createElement(nodeName);
    }
    node.innerHTML = obj.html;

    //add attributes to node
    if(obj.attrs){
      for(var i=0;i<obj.attrs.length;i+=1){
        node.setAttribute(obj.attrs[i].name,obj.attrs[i].value);
      }
    }
    //(function() {})(obj);
    //set css back, recursively
    makeRecursiveTraverser(function(e, id) {
      var i,css = obj.css[id];
      for (var p in css) {
        i=CSS.camelize(p);
        e.style[i] = CSS.prefixify(css[p]);
        //(function() {})(p,i,css[p],CSS.prefixify(css[p]));
        if(i==='float'){
            e.style['cssFloat'] = css[p];
        }
      }
    })(node, '', 1);

    return node;

  }

  return {
    copy: rip,
    paste: put,
    tools: {
      extract:extract,
      M: M,
      Heuristic:Heuristic,
      makeRecursiveTraverser: makeRecursiveTraverser
    },
    testCompression: function(fragment) {
      var test = LZW.compress(fragment, M.makeConverter(S.numberLength));
      return [test, LZW.decompress(test, M.reverseConverter, S.numberLength)];
    }
  };

}

module && (module.exports=Ripper);
/*
init example:
var ripper=Ripper({
  dictionary: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!~*;:/$,"
});

*/

},{}],8:[function(require,module,exports){
/*
 * translate data to send or expand recieved data
 */

module.exports = (function() {

    var Translate = require('./Translate');


    return {
        content: new Translate([
            {
                long: 'node',
                short: 'n'
            }, {
                long: 'prev',
                short: 'pr'
            }, {
                long: 'parent',
                short: 'pa'
            }, {
                long: 'rip',
                short: 'r'
            }, {
                long: 'version',
                short: 'v'
            }, {
                long: 'tagname',
                short: 't'
            }, {
                long: 'source',
                short: 's',
                values: [{
                    long: 'insertion',
                    short: 'i'
                }, {
                    long: 'attr',
                    short: 'a'
                }]
            }, {
                long: 'page',
                short: 'p'
            }
        ]),
        event: new Translate([
            {
                long: 'type',
                short: 'e',
                values: [{
                    long: 'focus',
                    short: 'fo'
                },  {
                    long: 'blur',
                    short: 'bl'
                }, {
                    long: 'change',
                    short: 'ch'
                }, {
                    long: 'mousemove',
                    short: 'mm'
                }, {
                    long: 'mousedragging',
                    short: 'dd'
                }, {
                    long: 'click',
                    short: 'mc'
                }, {
                    long: 'keypress',
                    short: 'kp'
                }, {
                    long: 'create',
                    short: 'dc'
                }, {
                    long: 'remove',
                    short: 'dr'
                }, {
                    long: 'attrChange',
                    short: 'dm'
                }, {
                    long: 'resize',
                    short: 'rs'
                }, {
                    long: 'page',
                    short: 'pg'
                }]
            }, {
                long: 'nodeId',
                short: 'i'
            }, {
                long: 'timestamp',
                short: 't'
            }, {
                long: 'offset',
                short: 'o'
            }, {
                long: 'mouseButton',
                short: 'b'
            }, {
                long: 'windowSize',
                short: 'wh'
            }, {
                long: 'version',
                short: 'v'
            }, {
                long: 'page',
                short: 'p'
            }
        ])
    };

})();
},{"./Translate":3}],9:[function(require,module,exports){
(function() {

    var _ = require('underscore');

    _.mixin({
        deepClone: function(obj) {
            return JSON.parse(JSON.stringify(obj));
        }
    });


    module.exports = _;

})();
},{"underscore":22}],10:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],11:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],12:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],13:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],14:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":13,"_process":12,"inherits":11}],15:[function(require,module,exports){
/*!
 * Cookies.js - 0.3.1
 * Wednesday, April 24 2013 @ 2:28 AM EST
 *
 * Copyright (c) 2013, Scott Hamper
 * Licensed under the MIT license,
 * http://www.opensource.org/licenses/MIT
 */
(function (undefined) {
    'use strict';

    var Cookies = function (key, value, options) {
        return arguments.length === 1 ?
            Cookies.get(key) : Cookies.set(key, value, options);
    };

    // Allows for setter injection in unit tests
    Cookies._document = document;
    Cookies._navigator = navigator;

    Cookies.defaults = {
        path: '/'
    };

    Cookies.get = function (key) {
        if (Cookies._cachedDocumentCookie !== Cookies._document.cookie) {
            Cookies._renewCache();
        }

        return Cookies._cache[key];
    };

    Cookies.set = function (key, value, options) {
        options = Cookies._getExtendedOptions(options);
        options.expires = Cookies._getExpiresDate(value === undefined ? -1 : options.expires);

        Cookies._document.cookie = Cookies._generateCookieString(key, value, options);

        return Cookies;
    };

    Cookies.expire = function (key, options) {
        return Cookies.set(key, undefined, options);
    };

    Cookies._getExtendedOptions = function (options) {
        return {
            path: options && options.path || Cookies.defaults.path,
            domain: options && options.domain || Cookies.defaults.domain,
            expires: options && options.expires || Cookies.defaults.expires,
            secure: options && options.secure !== undefined ?  options.secure : Cookies.defaults.secure
        };
    };

    Cookies._isValidDate = function (date) {
        return Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date.getTime());
    };

    Cookies._getExpiresDate = function (expires, now) {
        now = now || new Date();
        switch (typeof expires) {
            case 'number': expires = new Date(now.getTime() + expires * 1000); break;
            case 'string': expires = new Date(expires); break;
        }

        if (expires && !Cookies._isValidDate(expires)) {
            throw new Error('`expires` parameter cannot be converted to a valid Date instance');
        }

        return expires;
    };

    Cookies._generateCookieString = function (key, value, options) {
        key = encodeURIComponent(key);
        value = (value + '').replace(/[^!#$&-+\--:<-\[\]-~]/g, encodeURIComponent);
        options = options || {};

        var cookieString = key + '=' + value;
        cookieString += options.path ? ';path=' + options.path : '';
        cookieString += options.domain ? ';domain=' + options.domain : '';
        cookieString += options.expires ? ';expires=' + options.expires.toGMTString() : '';
        cookieString += options.secure ? ';secure' : '';

        return cookieString;
    };

    Cookies._getCookieObjectFromString = function (documentCookie) {
        var cookieObject = {};
        var cookiesArray = documentCookie ? documentCookie.split('; ') : [];

        for (var i = 0; i < cookiesArray.length; i++) {
            var cookieKvp = Cookies._getKeyValuePairFromCookieString(cookiesArray[i]);

            if (cookieObject[cookieKvp.key] === undefined) {
                cookieObject[cookieKvp.key] = cookieKvp.value;
            }
        }

        return cookieObject;
    };

    Cookies._getKeyValuePairFromCookieString = function (cookieString) {
        // "=" is a valid character in a cookie value according to RFC6265, so cannot `split('=')`
        var separatorIndex = cookieString.indexOf('=');

        // IE omits the "=" when the cookie value is an empty string
        separatorIndex = separatorIndex < 0 ? cookieString.length : separatorIndex;

        return {
            key: decodeURIComponent(cookieString.substr(0, separatorIndex)),
            value: decodeURIComponent(cookieString.substr(separatorIndex + 1))
        };
    };

    Cookies._renewCache = function () {
        Cookies._cache = Cookies._getCookieObjectFromString(Cookies._document.cookie);
        Cookies._cachedDocumentCookie = Cookies._document.cookie;
    };

    Cookies._areEnabled = function () {
        return Cookies._navigator.cookieEnabled ||
            Cookies.set('cookies.js', 1).get('cookies.js') === '1';
    };

    Cookies.enabled = Cookies._areEnabled();

    // AMD support
    if (typeof define === 'function' && define.amd) {
        define(function () { return Cookies; });
    // CommonJS and Node.js module support.
    } else if (typeof exports !== 'undefined') {
        // Support Node.js specific `module.exports` (which can be a function)
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = Cookies;
        }
        // But always support CommonJS module 1.1.1 spec (`exports` cannot be a function)
        exports.Cookies = Cookies;
    } else {
        window.Cookies = Cookies;
    }
})();
},{}],16:[function(require,module,exports){

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

module.exports = function forEach (obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};


},{}],17:[function(require,module,exports){
(function (process){
module.exports = (function () {

    var util = require('util');
    var EventEmitter = require('events').EventEmitter;
    var queue = require('queue');
    var extend = require('extend');

    var SocketImplementation = require('./lib/web-socket');


    function SimpleSocket(options) {
        EventEmitter.prototype.constructor.call(this);

        this._queue = queue({
            timeout: 100,
            concurrency: 1
        });

        this.engine = null;
        this._connecting = false;
        this._disconnected = true;
        this._options = extend({
            autoConnect: false, // connect automatically when instance is created
            autoReconnect: true // reconnect when try to send if socket is disconnected
        }, options);

        this.url = this._options.url;

        if(this._options.autoConnect) {
            this.connect(this.url);
        }
    }

    SimpleSocket.supported = !!SocketImplementation;

    util.inherits(SimpleSocket, EventEmitter);

    extend(SimpleSocket.prototype, {
        connect: function(url) {
            if(this._disconnected) {
                if(this.engine) {
                    this._queue.end();

                    this.engine.close();

                    this.engine = null;
                }

                this._disconnected = false; // true if engine is in CLOSED state
                this._closedManually = false; // true if disconnect method was called
                this._connected = true; // true if connect method was called

                this.url = (this.url || url);

                this._createSocket();
            } else {
                this.emit('error', 'socket connection is already estabilished');
            }

            return this;
        },
        disconnect: function () {
            if(!this._disconnected && !this._closedManually) {
                this._closedManually = true;

                this.engine.close();
            } else {
                this.emit('error', 'socket connection is already closed or closing');
            }

            return this;
        },
        isConnected: function() {
            return (this.engine && (this.engine.readyState === this.engine.OPEN));
        },
        send: function (message) {
            var messageString;

            try {
                messageString = JSON.stringify(message);
            } catch(err) {
                this.emit('error', 'cannot parse message to JSON');

                return false;
            }

            if (this.isConnected()) {
                this.engine.send(messageString);
            } else {
                this._queue.push(this.send.bind(this, message));

                if(this._connected) {
                    if(this._options.autoReconnect && !this._closedManually && !this._connecting) {
                        this._reconnect();
                    } else {
                        this.emit('error', 'try to send a message but socket was closed manually or is disconnected and autoReconnect option is not enabled');

                        return false;
                    }
                } else {
                    this.emit('error', 'try to send a message but socket has never been connected');
                }
            }

            return this;
        },
        receive: function(messageTypes, handler) {
            var messageTypesLC = messageTypes.split(' ').map(function(messageType) {
                return messageType.toLowerCase();
            });

            messageTypesLC.forEach(function() {
                this.addListener('message_' + messageTypesLC, handler);
            }, this);

            return function() {
                messageTypesLC.forEach(function() {
                    this.removeListener('message_' + messageTypesLC, handler);
                }, this);
            };
        },
        _reconnect: function() {
            this._reconnecting = true;

            this._createSocket();
        },
        _createSocket: function() {
            try {
                this.engine = new SocketImplementation(this.url);
            } catch (err) {
                return this.emit('error', err);
            }

            this._connecting = true; // true if _createSocket method was called but open handler was not

            this.engine.addEventListener('open', this._engineHandlers.open.bind(this));
            this.engine.addEventListener('message', this._engineHandlers.message.bind(this));
            this.engine.addEventListener('error', this._engineHandlers.error.bind(this));
            this.engine.addEventListener('close', this._engineHandlers.close.bind(this));
        },
        _engineHandlers: {
            open: function () {
                // sometimes, IE 11 fires this callback when connection is not really open
                // and then once again when everything is ok
                // so, make sure that `opened` flag is set when socket is ready to send message
                if(this.engine.readyState === this.engine.OPEN) {
                    if(!this._reconnecting) {
                        this.emit('connect');
                    } else {
                        this.emit('reconnect');

                        this._reconnecting = false;
                    }

                    this._connecting = false;

                    // flush queue in next tick to allow sending some initial message on connect / reconnect
                    process.nextTick(function() {
                        this._queue.start();
                    }.bind(this));
                }
            },
            message: function (e) {
                var message;

                try {
                    message = JSON.parse(e.data);
                    message.type = message.type.toLowerCase();
                } catch(err) {
                    this.emit('error', 'cannot parse message to JSON', message);

                    return false;
                }

                if(('undefined' !== typeof message.type) && (message.type !== null) && (message.type !== '')) {
                    this.emit('message', message);
                    this.emit('message_' + message.type, message.data);

                    return true;
                } else {
                    this.emit('error', 'message has not a valid type', message);

                    return false;
                }
            },
            close: function(e) {
                if(this._closedManually || !this._options.autoReconnect) {
                    this._disconnected = true;

                    this.engine = null;

                    this.emit('disconnect', e);
                }
            },
            error: function (err) {
                this.emit('error', err);
            }
        }
    });

    return SimpleSocket;

})();

}).call(this,require('_process'))
},{"./lib/web-socket":18,"_process":12,"events":10,"extend":19,"queue":20,"util":14}],18:[function(require,module,exports){
module.exports = (window.WebSocket || window.mozWebSocket || window.webkitWebSocket);

},{}],19:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;
var undefined;

var isPlainObject = function isPlainObject(obj) {
	"use strict";
	if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval) {
		return false;
	}

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {}

	return key === undefined || hasOwn.call(obj, key);
};

module.exports = function extend() {
	"use strict";
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === "boolean") {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if (typeof target !== "object" && typeof target !== "function" || target == undefined) {
			target = {};
	}

	for (; i < length; ++i) {
		// Only deal with non-null/undefined values
		if ((options = arguments[i]) != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target === copy) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
					if (copyIsArray) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];
					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[name] = extend(deep, clone, copy);

				// Don't bring in undefined values
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}],20:[function(require,module,exports){
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;

module.exports = Queue;

function Queue(options) {
  if (!(this instanceof Queue))
    return new Queue(options);

  EventEmitter.call(this);
  options = options || {};
  this.concurrency = options.concurrency || Infinity;
  this.timeout = options.timeout || 0;
  this.pending = 0;
  this.session = 0;
  this.running = false;
  this.jobs = [];
}
inherits(Queue, EventEmitter);

var arrayMethods = [
  'push',
  'unshift',
  'splice',
  'pop',
  'shift',
  'slice',
  'reverse',
  'indexOf',
  'lastIndexOf'
];

for (var method in arrayMethods) (function(method) {
  Queue.prototype[method] = function() {
    return Array.prototype[method].apply(this.jobs, arguments);
  };
})(arrayMethods[method]);

Object.defineProperty(Queue.prototype, 'length', { get: function() {
  return this.pending + this.jobs.length;
}});

Queue.prototype.start = function(cb) {
  if (cb) {
    callOnErrorOrEnd.call(this, cb);
  }

  if (this.pending === this.concurrency) {
    return;
  }

  if (this.jobs.length === 0) {
    if (this.pending === 0) {
      done.call(this);
    }
    return;
  }

  var self = this;
  var job = this.jobs.shift();
  var once = true;
  var session = this.session;
  var timeoutId = null;
  var didTimeout = false;

  function next(err, result) {
    if (once && self.session === session) {
      once = false;
      self.pending--;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      if (err) {
        self.emit('error', err, job);
      } else if (didTimeout === false) {
        self.emit('success', result, job);
      }

      if (self.session === session) {
        if (self.pending === 0 && self.jobs.length === 0) {
          done.call(self);
        } else if (self.running) {
          self.start();
        }
      }
    }
  }

  if (this.timeout) {
    timeoutId = setTimeout(function() {
      didTimeout = true;
      if (self.listeners('timeout').length > 0) {
        self.emit('timeout', next, job);
      } else {
        next();
      }
    }, this.timeout);
  }

  this.pending++;
  this.running = true;
  job(next);

  if (this.jobs.length > 0) {
    this.start();
  }
};

Queue.prototype.stop = function() {
  this.running = false;
};

Queue.prototype.end = function(err) {
  this.jobs.length = 0;
  this.pending = 0;
  done.call(this, err);
};

function callOnErrorOrEnd(cb) {
  var self = this;
  this.on('error', onerror);
  this.on('end', onend);

  function onerror(err) { self.end(err); }
  function onend(err) {
    self.removeListener('error', onerror);
    self.removeListener('end', onend);
    cb(err);
  }
}

function done(err) {
  this.session++;
  this.running = false;
  this.emit('end', err);
}

},{"events":10,"inherits":21}],21:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11}],22:[function(require,module,exports){
//     Underscore.js 1.8.2
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.2';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var isArrayLike = function(collection) {
    var length = collection && collection.length;
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, target, fromIndex) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    return _.indexOf(obj, target, typeof fromIndex == 'number' && fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = input && input.length; i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (array == null) return [];
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    if (array == null) return [];
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = array.length; i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, 'length').length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = list && list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    var i = 0, length = array && array.length;
    if (typeof isSorted == 'number') {
      i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
    } else if (isSorted && length) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (item !== item) {
      return _.findIndex(slice.call(array, i), _.isNaN);
    }
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  _.lastIndexOf = function(array, item, from) {
    var idx = array ? array.length : 0;
    if (typeof from == 'number') {
      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
    }
    if (item !== item) {
      return _.findLastIndex(slice.call(array, 0, idx), _.isNaN);
    }
    while (--idx >= 0) if (array[idx] === item) return idx;
    return -1;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = array != null && array.length;
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createIndexFinder(1);

  _.findLastIndex = createIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],23:[function(require,module,exports){
(function() {

    var domIdTag,
        observer,
        callbacks = {
        insertion: null,
        removal: null,
        attrChange: null
    },
    interestingAttributes = ['class', 'style', 'id'],
        omitTags = ['script','meta'];


    var spanTimeByKey = (function() {
        var time = 1100, // ms, 600 is guessed value
            timers = {},
            initials = {};

        return function(key, node, attr, newValue, oldValue) {
            if(!initials[key]) {
                initials[key] = {
                    value: (oldValue ? oldValue.trim() : ''),
                    timestamp: Date.now()
                };
            }

            clearTimeout(timers[key]);
            timers[key] = setTimeout(function(initial, newValue) {
                // if different than initial value, commit
                if (initial.value !== newValue) {
                    callbacks.attrChange && callbacks.attrChange(node, attr, newValue, initial.timestamp);
                }

                delete initials[key];
            }, time, initials[key], (newValue ? newValue.trim() : ''));
        };
    })();


    function observe() {
        observer = new MutationObserver(function(mutations) {
            if (!mutations) {
                return;
            }

            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    var nodes = Array.prototype.filter.call(mutation.addedNodes, function(node) {
                        //get only tags
                        //drop scripts
                        return (node.nodeType === 1 && omitTags.indexOf(('' + node.nodeName).toLowerCase()) < 0);
                    });

                    if (nodes.length) {
                        setTimeout(function(nodes) {
                            callbacks.insertion && callbacks.insertion(nodes);
                        }, 0, nodes);
                    }
                }

                if (mutation.removedNodes.length) {
                    var nodes = Array.prototype.filter.call(mutation.removedNodes, function(node) {
                        return node.nodeType === 1;
                    });

                    if (nodes.length) {
                        setTimeout(function(nodes) {
                            callbacks.removal && callbacks.removal(nodes);
                        }, 0, nodes);
                    }
                }

                if (mutation.attributeName) {
                    var node = mutation.target,
                        attr = mutation.attributeName,
                        attrValue = node.getAttribute(attr);

                    spanTimeByKey(attr + lookupTag(node), node, attr, attrValue, mutation.oldValue);

                }
            });
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeOldValue: true,
            attributeFilter: interestingAttributes
        });
//        observer.observe(document.head,
//            childList: true,
//            subtree: true,
//            attributes: false
//        });
    }




    function init(tag) {
        destroy();

        observe();

        domIdTag = tag;
    }

    function destroy() {
        if (observer) {
            observer.disconnect();
        }
    }

//future implementation will have to use actual mutationObserver

//aggregates multiple insertion events into a common parent
    function catchInsertions(callback) {
        if (callbacks.insertion !== null) {
            throw('there is already a callback for insertions');
        }
        callbacks.insertion = (callback);
    }

    function catchRemovals(callback) {
        if (callbacks.removal !== null) {
            throw('there is already a callback for removal');
        }
        callbacks.removal = (callback);
    }

    function catchAttrChanges(callback) {
        if (callbacks.attrChange !== null) {
            throw('there is already a callback for attrChange');
        }
        callbacks.attrChange = (callback);
    }


//private
    function lookupTag(el) { // get id
        return (el[domIdTag]);
    }

    module.exports = {
        init: init,
        destroy: destroy,
        catchInsertions: catchInsertions,
        catchRemovals: catchRemovals,
        catchAttrChanges: catchAttrChanges
    };


})();
},{}],24:[function(require,module,exports){
(function() {

    var AbsURL = require('../lib/absURL');
    var domObserver = require('./domObserver');
    var EventMachine = require('./eventmachine');

    var insertionSequence = 0;


    var ripSemaphore = require('./ripsemaphore');


    function _ripDocument(doc, ripper, absify) {
        return ripper.copy(doc.documentElement, function(dom) {
            var head = dom.getElementsByTagName('head')[0] || dom.querySelector('head'),
                body = dom.getElementsByTagName('body')[0] || dom.querySelector('body');

            /* --- HEAD --- */
            if (head) {
                var allowedTags = ['LINK', 'STYLE', 'TITLE', 'META'];

                /* remove invalid tags from head */
                var invalidElements = Array.prototype.filter.call(head.children, function(el) {
                    return (allowedTags.indexOf(el.tagName) < 0);
                }),
                    i = invalidElements.length;

                while (i--) {
                    invalidElements[i].parentNode.removeChild(invalidElements[i]);
                }
            }

            /* --- BODY --- */

            /* remove src of iframes (leave nodes in DOM!) */
            var iframes = dom.getElementsByTagName('iframe'),
                i = iframes.length;

            while (i--) {
                iframes[i].removeAttribute('src');
            }


            /* --- other --- */
            if (head) {
                /* remove all nodes outside HEAD and BODY */
                while (head.previousElementSibling) { // before head
                    head.parentNode.removeChild(head.previousElementSibling);
                }
            }
            if (body) {
                while (body.previousElementSibling && (body.previousElementSibling !== head /*yeah, that's right. if no head, this comparison is just redundant*/)) {
                    body.parentNode.removeChild(body.previousElementSibling);
                }
                while (body.nextElementSibling) { // after body
                    body.parentNode.removeChild(body.nextElementSibling);
                }
            }
            /* make URL absolute to page domain */
            return absify(dom);

        }, !!'skip CSS');
    }


    function init(Persist, ripperInstance, domId) {
        var ripper = ripperInstance,
            absify = AbsURL.init(ripper.tools.makeRecursiveTraverser).absify; // helper function to make urls absolute in dom tree

        domObserver.init(domId.getTag()); // important to init after domId init

        domId.identifyDocument();

        // initial rip
        var docElemId = domId.getId(document.documentElement),
            docContent = _ripDocument(document, ripper, absify);

        // cause it to get sent :)
        EventMachine.injectEvent({targetId: docElemId, type: 'create', time: 1}, !!'override time');

        Persist.saveContent({
            source: 'insertion',
            rip: docContent,
            node: docElemId,
            prev: 0,
            parent: 0
        });




        // rip new stuff

        var cV = ripper.tools.M.makeConverter(2);
        var ripVersionSequence = 0;

        //this seems too long
        domObserver.catchInsertions(function(elemList) {
            var elem, elemId, elemContent, prev, insertionObj;

            for (var i = 0; i < elemList.length; i += 1) {
                elem = elemList[i];


                if (!ripSemaphore.isWaiting(elem)) {

                    elemId = "in" + cV(insertionSequence++);
//                    (function() {})('element inserted', elem);


                    // if element has no parent, assume it was inserted and immediately removed from document
                    // but still you should tag it, for incredible fast clickers
                    if (elem.parentNode) {
                        ripSemaphore.wait(elem);
                        domId.run(elem, elemId);
//                        (function() {})('element inserted identified', elem);
                    }


                    setTimeout(function(elem, elemId, eventTime) {
                        if (elem.parentNode && domId.hasId(elem)) {
//                            (function() {})('element inserted will be ripped', elem);

                            domId.forceRun(elem, elemId);

                            elemContent = ripper.copy(elem, function(dom) {
                                var iframes = dom.getElementsByTagName('iframe');
                                var i = iframes.length;
                                while (i--) {
                                    iframes[i].removeAttribute('src');
                                }

                                return absify(dom);
                            }, true);//true==skipCSS

//                            (function() {})('element inserted ripped', elem, elemContent);

                            ripSemaphore.done(elem);

                            prev = elem.previousSibling;
                            //skip till found a tag
                            for (; prev; prev = prev.previousSibling) {
                                //looking for previous tag that was identified (this will skip all ignored tags without knowing what they are)
                                if (prev !== undefined && prev.nodeType === 1 && domId.hasId(prev)) {
                                    break;
                                }
                            }
                            insertionObj = {
                                source: 'insertion',
                                rip: elemContent,
                                node: elemId,
                                tagname: elem.nodeName,
                                parent: domId.getId(elem.parentNode),
                                version: ripVersionSequence++
                            };
                            //still not sure if tag is found
                            if (prev) {
                                insertionObj.prev = domId.getId(prev);
                            }

                            Persist.saveContent(insertionObj);

                            EventMachine.injectEvent({
                                targetId: elemId,
                                type: 'create',
                                time: eventTime
                            });
                        } else {
//                            (function() {})('inserted element has no parent', elem);
                        }
                    }, 700, elem, elemId, Date.now()); // delay is used for reject temporary changes in document

                }
            }

        });


        domObserver.catchRemovals(function(elemList) {
            var elem;

            for (var i = 0; i < elemList.length; i += 1) {
                elem = elemList[i];

                if (domId.hasId(elem) && !ripSemaphore.isWaiting(elem)) { // if element has no id, it wasn't be sent to server
                    (function() {
                    })('element removed', elem);

                    EventMachine.injectEvent({
                        targetId: domId.getId(elem),
                        type: 'remove',
                        time: Date.now() + 1 //+1 to make sure remove is always after an element, even if it was inserted and removed straight away. People do stupid things.
                    });
                } else {
                    (function() {
                    })('removed element has no tag', elem);
                }
            }
        });

        //unique version numbers
        var attrVersionSequence = 0;
        domObserver.catchAttrChanges(function(elem, attrName, attrValue, changeTime) {
            var changeObj;

            if (domId.hasId(elem) && !ripSemaphore.isWaiting(elem)) { // if element is not saved, we could not save attr change
                var elemId = domId.getId(elem);

                setTimeout(function(elemId, eventTime) {
                    attrVersionSequence++;

                    changeObj = {
                        source: 'attr',
                        rip: attrName + '=' + attrValue,
                        node: elemId,
                        version: attrVersionSequence
                    };

                    Persist.saveContent(changeObj);

                    (function() {
                    })('attr changed: ', changeObj);

                    EventMachine.injectEvent({
                        targetId: elemId,
                        type: 'attrChange',
                        time: eventTime,
                        version: attrVersionSequence
                    });
                }, 0, domId.getId(elem), changeTime);
            } else {
                if (!domId.hasId(elem)) {
                    (function() {
                    })('changed element has no tag', elem);
                } else {
                    (function() {
                    })('attr change won\'t be saved - waiting for rip', elem);
                }
            }
        });

    }

    function destroy() {
        domObserver.destroy();
    }

    module.exports = {
        init: init,
        destroy: destroy
    };

})();
},{"../lib/absURL":4,"./domObserver":23,"./eventmachine":25,"./ripsemaphore":30}],25:[function(require,module,exports){
(function() {

    var Persist = require('./persist');
    var pageStartTime = require('./page-start-time');


    var DomId,
        settings,
        getOffsetOnElement,
        listeners = [],
        onceOnly = true,
        lastResizeWidth = window.innerWidth;



    function bind(events, handler, node) {
        events.forEach(function(event) {
            listeners.push({
                event: event,
                handler: handler
            });

            (node || document).addEventListener(event, handler, false);
        });
    }


    function unbind(event, handler, node) {
        (node || document).removeEventListener(event, handler);
    }


    // TODO: this might be a bit faster...
    function activitySpanThrottle(startF, stopF, wait, skipZeros) {
        var context, args, timer, inActivity = false,
            recordedTimeOfEvent;

        var later = function() {
            timer = null;
            inActivity = !inActivity;
            stopF.apply(context, (Array.prototype.slice.call(args)).concat(recordedTimeOfEvent));
        };

        return function(e) {
            // mute the mouse event when in position 0,0
            // Why? because of some stupid ass browser bug that triggers mousemove on 0,0 when hovering over sys rendered things like options of selectbox
            if (!skipZeros || (e.clientX !== 0 || e.clientY !== 0)) {
                context = this;
                args = arguments;

                clearTimeout(timer);

                if (!inActivity) { // run event starter
                    inActivity = !inActivity;

                    if (startF) {
                        startF.apply(this, arguments);
                    }
                }

                // if it never repeats, end straight away
                timer = setTimeout(later, wait);
                recordedTimeOfEvent = pointInTime();
            }
        };
    }


    // generates timestamp since start of collecting data
    function pointInTime() {
        return Date.now();
    }


    var handle = (function() {
        var started = {};
        return {
            start: function(handler) {
                return function() {
                    var report = handler.apply(this, arguments);
                    if (report) {
                        started[report.type] = report;
                    }
                };
            },
            end: function(handler) {
                return function() {
                    var r2 = handler.apply(this, arguments);
                    if (r2) {
                        var r1 = started[r2.type],
                            origTime = arguments[arguments.length - 1];

                        // override time generated by reporter, because we have the original time here
                        r2.timestamp = origTime;

                        if (r1 && r2) { // both event parts are available
                            storeEvent(r1);
                            storeEvent(r2);
                            started[r2.type] = null;
                        } else {
                            // some report?
                        }
                    }
                };
            },
            // reports events that are points in time, not timespans
            report: function(handler) {
                return function() {
                    var report = handler.apply(this, arguments);

                    if (report) {
                        storeEvent(report);
                    } else {
                        //if id is missing, we might just need to wait for the insertion to be tagged. Let's rerun the reporter
                        setTimeout(function(that, args) {
                            var report = handler.apply(that, args);
                            if (report) {
                                storeEvent(report);
                            }
                        }, 10, this, arguments);

                    }
                };
            }
        };

    })();


    function pretendDropdownClickEventReporter(e) {
        if (e.target.nodeName === 'SELECT') {
            e.type = 'click';
            mouseEventReporter(e);
        }
    }


    function resizeEventReporter(e) {
        var report = anyEventReporter({target: document.documentElement}, 'resize');
        if (report) {
            if (lastResizeWidth !== window.innerWidth) {
                lastResizeWidth = window.innerWidth;

                report.windowSize = new Array(lastResizeWidth, window.innerHeight);

                return report;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }


    // generic handler for mouse events
    function mouseEventReporter(e) {
        // if event is broken (stupid location) it is treated asif it never happened
        // IT'S NOT SO STUPID LOCATION; window.innerWidth can be significantly
        // smaller than page (body) width on small, tall screens, when horizontal screen shows up
//        if (e.pageX > (lastResizeWidth + 10)) {
//            return null;
//        }


        // dragging override - broken in FF, which returns strange code in `which` property
//        if (e.type === 'mousemove' && e.which === 1) {
//            eventOverride = "mousedragging";
//        }

        var elem = e.target,
            eventOverride = null;


        // rightclick override
        if (e.type === 'mousedown') {
            if(e.which === 3) {
                eventOverride = 'click';
            } else {
                return null;
            }
        }

        var report = anyEventReporter(e, eventOverride);

        if (report) {
            // extension
            // if element is considered large or needs details
            var offset = getOffsetOnElement(report.nodeId, elem, report.e, e.pageX, e.pageY);

            if (offset) {
                report.offset = Array.prototype.slice.call(offset);
            }

            if (e.which === 3) {
                report.mouseButton = 3;
            } else {
                report.mouseButton = 1;
            }

            return report;
        } else {
            return null;
        }
    }


    // generic handler for other events
    function anyEventReporter(e, eventOverride) {
        var type;
        switch(e.type) {
            case 'focusin':
                type = 'focus';
                break;
            case 'focusout':
                type = 'blur';
                break;
            default:
                type = e.type;
        }

        return {
            type: (eventOverride ? eventOverride : type),
            nodeId: DomId.getId(e.target),
            timestamp: pointInTime()
        };
    }


    function injectEventReporter(time, id, type, version, dataExtension) {
        return function() {
            var e = dataExtension || { };

            // we have no extend function here!
            e.type = type;
            e.nodeId = id;
            e.timestamp = (time !== undefined ? time : pointInTime());
            e.version = version;

            return e;
        };
    }


    function storeEvent(report) {
        if (report && report.nodeId) {
            Persist.saveEvent(report);
        } else {
            // info about dropped report?
        }
    }


    // public
    function init(domIdInstance, S) {
        if (onceOnly) {
            // run offset module after domReady etc. Here is fine.
            // TODO: make initialization function in Offset module and require it on the top
            var Offset = require('./offset');

            // returns offset position of click relative to element position
            // has logic for memorizing element offsets
            getOffsetOnElement = (function() {
                var domElemOffset = Offset(),
                    mem = {}, //cache offset information
                    memTime = 1000; //how long to cache

                // logic for determining if we are interested in exact mouse position on element
                function elementIsOffsetable(el) {
                    if (el.nodeName === "SELECT") {
                        return true;
                    }

                    if (el.offsetWidth > settings.resaonableSize || el.offsetHeight > settings.resaonableSize) {
                        return true;
                    }
                }

                // memorized by id
                // TODO: clear memory after time OR after any dom modification?
                return function(id, el, myType, x, y) {
                    // no mem or mem is stale
                    if (!mem[id] || !mem[id].ok) {
                        mem[id] = {
                            ok: true
                        };

                        if (elementIsOffsetable(el)) {
                            mem[id].o = domElemOffset(el);
                        } else {
                            mem[id].o = null;
                        }

                        setTimeout(function() {
                            mem[id].ok = false;
                        }, memTime);
                    }

                    // count offset and return
                    if (mem[id].o) {
                        // TODO: if results are out of the bounding box, it'd be nice to recount element offset and this.
                        return [ x - mem[id].o.left, y - mem[id].o.top ];
                    } else {
                        return null;
                    }
                };
            })();


            DomId = domIdInstance;

            onceOnly = false;

            S || (S = {});
            S.moveTimespan || (S.moveTimespan = 50);
            S.actionTimespan || (S.actionTimespan = 500);
            S.resaonableSize || (S.resaonableSize = 200);
            settings = S;

            // create event handling here

            bind(['click'], handle.report(mouseEventReporter));
            bind(['mousedown'], handle.report(mouseEventReporter));
            // pretend clicks foe selectboxes
            bind(['mousedown'], handle.report(pretendDropdownClickEventReporter));


            // throttle for mousemove
            bind(['mousemove'], activitySpanThrottle(handle.start(mouseEventReporter), handle.end(mouseEventReporter), settings.moveTimespan, !!'skipZerosTrue'));

            bind(['focus', 'blur', 'focusin', 'focusout', 'change', 'copy', 'cut', 'paste', 'submit', 'unload'], handle.report(anyEventReporter));
            bind(['keypress'], activitySpanThrottle(handle.report(anyEventReporter), function() {
            }, settings.actionTimespan));

            bind(['resize', 'orientationchange'], activitySpanThrottle(null, handle.report(resizeEventReporter), settings.moveTimespan), window);


            // page event
            injectEvent({
                type: 'page',
                time: 0,
                targetId: window.location.href
            }, !!'override time');

            // initial page resize event
            injectEvent({
                type: 'resize',
                time: 2,
                extendData: {
                    windowSize: new Array(window.innerWidth, window.innerHeight)
                }
            }, !!'override time');

        }

    }


    function destroy() {
        listeners.forEach(function(listener) {
            unbind(listener.event, listener.handler);
        });

        listeners = [];
    }


    // public
    // accepts prototype object for event creation
    function injectEvent(prot, overrideTime) {

        prot.time = overrideTime ? (parseInt(prot.time, 10) + pageStartTime()) : parseInt(prot.time, 10);
        prot.targetId = prot.targetId ? prot.targetId : DomId.getId(document.documentElement);

        var reporter = handle.report(injectEventReporter(prot.time, prot.targetId, prot.type, prot.version, prot.extendData));
        reporter({});
    }


    module.exports = {
        init: init,
        destroy: destroy,
        injectEvent: injectEvent
    };

})();

},{"./offset":26,"./page-start-time":27,"./persist":28}],26:[function(require,module,exports){

//===============================================================================================

// Offset handling derived from jQuery and licensed under MIT license
// http://jquery.org/license

//===============================================================================================

	var D = document, ddE = D.documentElement;
//offset z jQuery zaadaptowant i okrojony
module.exports = function(){

var fn={};

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
	body.appendChild( div );
	var boxModel = div.offsetWidth === 2;
	//sprzatanie
	body.removeChild( div ).style.display = "none";
		div=null;
// /support

//mój mały extend
function extend(e,w){
	for(var i in w){
		if(w.hasOwnProperty(i)){
			e[i]=w[i];
			}
		}
	return e;
	}

//pobieracz CSS

if ( D.defaultView && D.defaultView.getComputedStyle ) {
	var css = function( e, n ) {
		var ret, defaultView, computedStyle;

		if ( !(defaultView = e.ownerDocument.defaultView) ) {
			return undefined;
		}

		if ( (computedStyle = defaultView.getComputedStyle( e, null )) ) {
			ret = computedStyle.getPropertyValue( n );

		}

		return ret;
	};
}else{

	if ( ddE.currentStyle ) {
		var css = function( e, n ) {
			var left,
				ret = e.currentStyle && e.currentStyle[ n ],
				rsLeft = e.runtimeStyle && e.runtimeStyle[ n ],
				style = e.style;

			// From the awesome hack by Dean Edwards
			// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

			// If we're not dealing with a regular pixel number
			// but a number that has a weird ending, we need to convert it to pixels
			if ( !rnumpx.test( ret ) && rnum.test( ret ) ) {
				// Remember the original values
				left = style.left;

				// Put in the new values to get a computed value out
				if ( rsLeft ) {
					e.runtimeStyle.left = e.currentStyle.left;
				}
				style.left = n === "fontSize" ? "1em" : (ret || 0);
				ret = style.pixelLeft + "px";

				// Revert the changed values
				style.left = left;
				if ( rsLeft ) {
					e.runtimeStyle.left = rsLeft;
				}
			}

			return ret;
		};
	}
}


//window getter
function getWindow( obj ) {
	return (obj && typeof obj === "object" && "setInterval" in obj) ?
		obj :
		obj.nodeType === 9 ?
			obj.defaultView || obj.parentWindow :
			false;
}

//offset
var offset = {
	initialize: function() {
		var body = D.body, container = D.createElement("div"), innerDiv, checkDiv, table, td, bodyMarginTop = parseFloat(css(body, "marginTop") ) || 0,stlz="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;",
			html = "<div style='"+stlz+"'><div></div></div><table style='"+stlz+"' cellpadding='0' cellspacing='0'><tr><td></td></tr></table>";



		extend( container.style, { position: "absolute", top: 0, left: 0, margin: 0, border: 0, width: "1px", height: "1px", visibility: "hidden" } );

		container.innerHTML = html;
		body.insertBefore( container, body.firstChild );
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

		body.removeChild( container );
		offset.initialize = function(){};
	},

	bodyOffset: function( body ) {
		var top = body.offsetTop,
			left = body.offsetLeft;

		if ( offset.doesNotIncludeMarginInBodyOffset ) {
			top  += parseFloat(css(body, "marginTop") ) || 0;
			left += parseFloat(css(body, "marginLeft") ) || 0;
		}

		return { top: ~~(top), left: ~~(left) }; //ja dodałem tyldy, żeby nie dostawać floatów.
	}


};

//inicjalizuje od razu
offset.initialize();

if ( "getBoundingClientRect" in ddE ) {
	fn.offset = function( e ) {

/* niepotrzebne
		if ( !e || !e.ownerDocument ) {
			return null;
		}
*/
		if ( e === e.ownerDocument.body ) {
			return offset.bodyOffset( e );
		}

		try {
			var box = e.getBoundingClientRect();
		} catch(e) {}

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
			clientTop  = docElem.clientTop  || body.clientTop  || 0,
			clientLeft = docElem.clientLeft || body.clientLeft || 0,
			scrollTop  = win.pageYOffset || boxModel && docElem.scrollTop  || body.scrollTop,
			scrollLeft = win.pageXOffset || boxModel && docElem.scrollLeft || body.scrollLeft,
			top  = box.top  + scrollTop  - clientTop,
			left = box.left + scrollLeft - clientLeft;

		return { top: ~~(top), left: ~~(left) }; //ja dodałem tyldy, żeby nie dostawać floatów.
	};

} else {



	fn.offset = function( elem ) {

		if ( !elem || !elem.ownerDocument ) {
			return null;
		}

		if ( elem === elem.ownerDocument.body ) {
			return offset.bodyOffset( elem );
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
			prevComputedStyle = defaultView ? defaultView.getComputedStyle( elem, null ) : elem.currentStyle,
			top = elem.offsetTop,
			left = elem.offsetLeft;

		while ( (elem = elem.parentNode) && elem !== body && elem !== docElem ) {
			if ( offset.supportsFixedPosition && prevComputedStyle.position === "fixed" ) {
				break;
			}

			computedStyle = defaultView ? defaultView.getComputedStyle(elem, null) : elem.currentStyle;
			top  -= elem.scrollTop;
			left -= elem.scrollLeft;

			if ( elem === offsetParent ) {
				top  += elem.offsetTop;
				left += elem.offsetLeft;

				if ( offset.doesNotAddBorder && !(offset.doesAddBorderForTableAndCells && rtable.test(elem.nodeName)) ) {
					top  += parseFloat( computedStyle.borderTopWidth  ) || 0;
					left += parseFloat( computedStyle.borderLeftWidth ) || 0;
				}

				prevOffsetParent = offsetParent;
				offsetParent = elem.offsetParent;
			}

			if ( offset.subtractsBorderForOverflowNotVisible && computedStyle.overflow !== "visible" ) {
				top  += parseFloat( computedStyle.borderTopWidth  ) || 0;
				left += parseFloat( computedStyle.borderLeftWidth ) || 0;
			}

			prevComputedStyle = computedStyle;
		}

		if ( prevComputedStyle.position === "relative" || prevComputedStyle.position === "static" ) {
			top  += body.offsetTop;
			left += body.offsetLeft;
		}

		if ( offset.supportsFixedPosition && prevComputedStyle.position === "fixed" ) {
			top  += Math.max( docElem.scrollTop, body.scrollTop );
			left += Math.max( docElem.scrollLeft, body.scrollLeft );
		}

		return { top: ~~(top), left: ~~(left) }; //ja dodałem tyldy, żeby nie dostawać floatów.
	};
}

return fn.offset;

};

},{}],27:[function(require,module,exports){
module.exports = (function() {

	var time;

	return function(aTime) {
		// it can be only one start time, right?
		if(('undefined' !== typeof aTime) && !time) {
			time = aTime;
		}

		return time;
	};

})();
},{}],28:[function(require,module,exports){
(function () {

    var each = require('foreach');

    var SimpleSocket = require('simple-socket');

    var recordingStartTime = require('./recording-start-time');

    var translate = require('../lib/translatedata');
    var settings = require('./settings');
    var Session = require('./session');


    var sessionData, dyingHandler;
    var simpleSocket = new SimpleSocket();


    function init(time) {
        sessionData = Session.start(time);

        simpleSocket.on('connect', function() {
            simpleSocket.send({
                type: 'hi',
                data: sessionData
            });
        });

        simpleSocket.on('disconnect', function() {
            sendingAllowed = false;
        });

        simpleSocket.on('reconnect', function() {
            simpleSocket.send({
                type: 'reconnect',
                data: sessionData
            });
        });

        simpleSocket.on('error', function() {
            // log?
            // throw err;
        });

        simpleSocket.on('message_die', _dieHandler);

        // be gentle for backend
        window.addEventListener('beforeunload', function () {
            if(simpleSocket) {
                simpleSocket.disconnect();
            }
        });

        simpleSocket.connect(settings.get('ioAddress') + '/' + settings.get('ioResource'));
    }


    function saveContent(content) {
        content.page = sessionData.pid;

        if(simpleSocket) {
            simpleSocket.send({
                type: 'content',
                data: _removeToJson(translate.content.toShort(content))
            });
        }
    }


    function saveEvent(e) {
        e.page = sessionData.pid;
        e.timestamp -= recordingStartTime();

        if(simpleSocket) {
            simpleSocket.send({
                type: 'event',
                data: _removeToJson(translate.event.toShort(e))
            });

            if([ 'focus', 'blur', 'change', 'mousemove', 'mousedragging', 'click', 'keypress', 'resize' ].indexOf(e.type) !== -1) {
               Session.extend();
            }
        }
    }


    // if somebody implements toJSON methods for global objects like Array, Number, String or Date
    // (and Object especially!)
    // it can break stringifying of data, even with simpleSocket.io JSON implementation
    // so, remove it FROM INSTANCES (not for prototypes) don't use delete,
    // it won't work until JavaScript has prototype chains
    function _removeToJson(o) {
        // watch out, circular reference might be
        // so, implement so counter or flags manager or simply take care about events objects
        // circular ones can't be parsed to JSON
        each(o, function (value) {
            value.toJSON = undefined;

            // calling each on string causes endless calls loop
            if (!((value instanceof String) || ('string' === typeof value))) {
                _removeToJson(value);
            }
        });

        return o;
    }


    function _dieHandler() {
        Session.destroy();

        simpleSocket.disconnect();

        simpleSocket = null;

        if (dyingHandler) {
            dyingHandler();
        }
    }


    function handleDeath(cb) {
        dyingHandler = cb;
    }


    module.exports = {
        init: init,
        saveContent: saveContent,
        saveEvent: saveEvent,
        handleDeath: handleDeath
    };

})();

},{"../lib/translatedata":8,"./recording-start-time":29,"./session":31,"./settings":32,"foreach":16,"simple-socket":17}],29:[function(require,module,exports){
module.exports = (function() {

	var time;

	return function(bTime) {
		// it can be only one start time, right?
		if(('undefined' !== typeof bTime) && !time) {
			time = bTime;
		}

		return time;
	};

})();
},{}],30:[function(require,module,exports){
var key = '.:rips';

function wait(el) {
    el[key] = true;
}

function done(el) {
    delete el[key];
}

function isWaiting(el) {
    if(!el || (el === document.documentElement)) {
        return false;
    } else if(el[key] === true) {
        return true;
    } else {
        return isWaiting(el.parentNode);
    }
}

module.exports = {
    wait: wait,
    done: done,
    isWaiting: isWaiting
};
},{}],31:[function(require,module,exports){
module.exports = (function() {

    var store = require('./store');
    var settings = require('./settings');

    var recordingStartTime = require('./recording-start-time');
    var pageStartTime = require('./page-start-time');


    var timeout = (5 * 60 * 1000);
    var eid, rid, pid; // save session data in scope to avoid conflicts with new ones


    // create or update session and save data in local storage
    function start() {
        var pageStartTimeValue = Date.now();

        var recordingStartTimeValue = pageStartTimeValue;

        eid = settings.get('experimentId');
        rid = store.get('rid'); // id of already started session
        pid = '0';

        var recordingEnd = parseInt(store.get('end'), 10); // end time of already started session

        // brand new recording
        if (!rid || isNaN(recordingEnd) || (recordingEnd < pageStartTimeValue)) {
            rid = settings.get('recordingId') || _generateRid(pageStartTimeValue);

            // save cookies for another trackers
            store.set('eid', eid);
            store.set('rid', rid);
            store.set('pid', pid);
            store.set('inittime', recordingStartTimeValue);

            extend(Date.now());
        // continuation of already started session
        } else {
            recordingStartTimeValue = parseInt(store.get('inittime'), 10);
            pid = (~~(store.get('pid')) + 1) + '';

            store.set('pid', pid);
        }

        recordingStartTime(recordingStartTimeValue);
        pageStartTime(pageStartTimeValue);


        return {
            pid: pid,
            rid: rid,
            eid: eid
        };
    }


    // clear session store but only if it's current one!
    function destroy() {
        if(_isCurrent()) {
            store.set('eid', '');
            store.set('rid', '');
            store.set('pid', '');
            store.set('end', '');
            store.set('inittime', '');
        }
    }


    // generate new recording id
    function _generateRid(time) {
        return Math.round(Math.random() * 10e16).toString(36).substr(0, 5) +
            time.toString(36).substr(1, 8) +
            Math.round(Math.random() * 10e16).toString(36).substr(6, 11);
    }


    function _throttle(fn, time) {
        var timer, callTime;

        return function() {
            callTime = Date.now();

            if(!timer) {
                timer = setTimeout(function() {
                    timer = null;

                    fn(callTime);
                }, time);
            }
        };
    }


    // make session longer (but only if it's current one!)
    function extend(callTime) {
        if (_isCurrent()) {
            store.set('end', callTime + timeout);
        }
    }


    // check if session isn't timeouted or replaced
    function isValid() {
        return _isCurrent() && (parseInt(store.get('end'), 10) > Date.now());
    }


    // check if session wasn't replaced with new one
    function _isCurrent() {
        return ((eid === store.get('eid')) && (rid === store.get('rid')));
    }


    return {
        start: start,
        destroy: destroy,
        extend: _throttle(extend, 10 * 1000),
        isValid: isValid
    };

})();
},{"./page-start-time":27,"./recording-start-time":29,"./settings":32,"./store":33}],32:[function(require,module,exports){
module.exports = (function() {
    var settings = { };

    // copy data from global
    if (window.hasOwnProperty(globalKey)) {
        var g = window[globalKey];

        for (var key in g) {
            // experimentId is global from bundled script scope, added by script server;
            // we don't want to have recordingId override if it was generated for another experiment
            // ex. by Google Analytics integration snippet
            if((key === 'recordingId') && (g.experimentId !== experimentId)) {
                continue;
            } else if(key === 'experimentId') {
                settings[key] = experimentId;
            } else {
                settings[key] = g[key];
            }
        }
    }

    function get(sett) {
        return settings[sett];
    }


    return {
        get: get
    };

})();
},{}],33:[function(require,module,exports){
module.exports = (function() {

    var Cookies = require('cookies-js');
    var absUrl = require('../lib/absURL');

    var settings = require('./settings');


    // create storage for session data (Cookie or Local Storage)
    function _getStore(prefix) {
        var store;

        if (Cookies.enabled) {
            var allPossibleTopLevelDomains =  window.location.hostname.split('.').reverse().map(function(currentPart, index, arr) {
                return '.' + arr.slice(0, index + 1).reverse().join('.');
            }).slice(1);

            Cookies.defaults = {
                path: '/' // zt is a moron.
            };

            store = {
                get: function (key) {
                    return Cookies.get(prefix + key);
                },
                set: function (key, value) {
                    // stringify it to make further comparsion easier
                    value = (([ null, undefined ].indexOf(value) === -1) ? value + '' : '');

                    // try to set a cookie for all possible top-level domain
                    // ex. for it-13.cpu2.cogision.pl it should try to set cookies for (in order)
                    // ".cogision.pl", ".cpu2.cogision.pl", ".it-13.cpu2.cogision.pl"
                    // and for "www.brw.com.pl":
                    // ".com.pl", ".brw.com.pl", ".www.brw.com.pl"
                    // we want to set cookie for the highest possible level (for above examples - .cogision.pl and .brw.com.pl)
                    // fortunatelly, browsers are smart enough and not allow setting cookie for domains like .com.pl
                    return allPossibleTopLevelDomains.some(function(currentDomain) {
                        Cookies.set(prefix + key, value, {
                            domain: currentDomain
                        });

                        // if cookie was set correctly, finish
                        return (Cookies.get(prefix + key) === value);
                    });
                }
            };
        } else if ('undefined' !== typeof window.localStorage) {
            // panic mode. WHY? because localStorage doesn't allow to share data between multiple subdomains,
            // ex. //www.example.com and //example.com
            store = {
                get: function (key) {
                    return localStorage.getItem(prefix + key);
                },
                set: function (key, value) {
                    return localStorage.setItem(prefix + key, value);
                }
            };
        }

        return store;
    }


    return _getStore(settings.get('sessionKey'));

})();
},{"../lib/absURL":4,"./settings":32,"cookies-js":15}],34:[function(require,module,exports){
module.exports = (function () {
    return require('simple-socket').supported && window.MutationObserver;
})();
},{"simple-socket":17}]},{},[1]);
})();