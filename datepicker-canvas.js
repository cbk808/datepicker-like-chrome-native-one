var WeeksData = [];
var MonthsData = [];
(function () {
    function $(selector) {
        return document.querySelector(selector);
    }

    function find(el, selector) {
        return el.querySelector(selector);
    }

    function createElementFromHTML(html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        return div.children[0];
    }

    function fmtMD(i) {
        return (i>9)?i:('0'+i);
    }

    function getViewOffset(node, singleFrame) {
        function addOffset(node, coords, view) {
            var p = node.offsetParent;
            coords.x += node.offsetLeft - (p ? p.scrollLeft : 0);
            coords.y += node.offsetTop - (p ? p.scrollTop : 0);

            if (p) {
                if (p.nodeType == 1) {
                    var parentStyle = view.getComputedStyle(p, '');
                    if (parentStyle.position != 'static') {
                        coords.x += parseInt(parentStyle.borderLeftWidth);
                        coords.y += parseInt(parentStyle.borderTopWidth);

                        if (p.localName == 'TABLE') {
                            coords.x += parseInt(parentStyle.paddingLeft);
                            coords.y += parseInt(parentStyle.paddingTop);
                        }
                        else if (p.localName == 'BODY') {
                            var style = view.getComputedStyle(node, '');
                            coords.x += parseInt(style.marginLeft);
                            coords.y += parseInt(style.marginTop);
                        }
                    }
                    else if (p.localName == 'BODY') {
                        coords.x += parseInt(parentStyle.borderLeftWidth);
                        coords.y += parseInt(parentStyle.borderTopWidth);
                    }

                    var parent = node.parentNode;
                    while (p != parent) {
                        coords.x -= parent.scrollLeft;
                        coords.y -= parent.scrollTop;
                        parent = parent.parentNode;
                    }
                    addOffset(p, coords, view);
                }
            }
            else {
                if (node.localName == 'BODY') {
                    var style = view.getComputedStyle(node, '');
                    coords.x += parseInt(style.borderLeftWidth);
                    coords.y += parseInt(style.borderTopWidth);

                    var htmlStyle = view.getComputedStyle(node.parentNode, '');
                    coords.x -= parseInt(htmlStyle.paddingLeft);
                    coords.y -= parseInt(htmlStyle.paddingTop);
                }

                if (node.scrollLeft)
                    coords.x += node.scrollLeft;
                if (node.scrollTop)
                    coords.y += node.scrollTop;

                var win = node.ownerDocument.defaultView;
                if (win && (!singleFrame && win.frameElement))
                    addOffset(win.frameElement, coords, win);
            }
        }

        var coords = { x: 0, y: 0 };
        if (node)
            addOffset(node, coords, node.ownerDocument.defaultView);

        return coords;
    }

    function show(elems) {
        Array.prototype.forEach.call(arguments, function(el) {
            el.classList.remove('hide');
        });
    }

    function hide(elems) {
        Array.prototype.forEach.call(arguments, function(el) {
            el.classList.add('hide');
        });
    }

    function addCls(el, cls) {
        el.classList.add(cls);
    }
    
    function rmCls(el, cls) {
        el.classList.remove(cls);
    }
    
    // function addEventListenerOnce(target, type, listener) {
    //     target.addEventListener(type, function fn(event) {
    //         target.removeEventListener(type, fn);
    //         listener(event);
    //     });
    // }

    function delegateEvent(el, defs, ch) {
        for (var key in defs) {
            el.addEventListener(key, function (evt) {
                var parent = evt.target.parentNode;
                var els;
                while (parent) {
                    els = parent.querySelectorAll(ch);
                    for (var i=0,len=els.length;i<len;i++) {
                        if (els[i] === evt.target) {
                            defs[key](evt);
                            return;
                        }
                    }

                    parent = parent.parentNode;
                }
            })
        }
    }

    function proxy(fn, target, name) {
        var func = fn.bind(target);
        if (name)
            DPGlobal.tmpEvtHdl.name = func;
        return func;
    }

    function applyEvent(evt) {
        var el, def;
        el = evt[0];
        if (evt.length === 2) {
            for (def in evt[1]) {
                el.addEventListener(def, evt[1][def]);
            }
        } else if (evt.length === 3) {
            delegateEvent(el, evt[2], evt[1]);
        }
    }

    function attachEvents(events) {
        events.forEach(function(item) {
            applyEvent(item);
        });
    }

    function isLeapYear(year) {
        return (year%4 === 0 && year%100 !== 0) || (year%400 === 0);
    }

    function generateData(s, e) {
        var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var monthIndex = 0;
        for (var i=0;i<10000;i++) {
            var ar = [];
            for (var j=0;j<7;j++) {
                if (e[0] == s[0] && e[1] == s[1] && e[2] == s[2]) {
                    return;
                }

                ar[j] = s[2];
                if (s[2] == 1) {
                    MonthsData[monthIndex++] = [s[0], s[1], s[2], i];
                }
                if (s[2] == 28 && s[1] == 1 && isLeapYear(s[0])) {
                    s[2] = 29;
                } else if (s[2] == 29 && s[1] == 1) {
                    s[1] = 2;
                    s[2] = 1;
                } else {
                    if (daysInMonth[s[1]] == s[2]) {
                        if (s[1] == 11) {
                            s[0] = s[0] + 1;
                            s[1] = 0;
                            s[2] = 1;
                        } else {
                            s[1] = s[1] + 1;
                            s[2] = 1;
                        }
                    } else {
                        s[2] = s[2] + 1;
                    }
                }
            }
            WeeksData[i] = ar;
        }
    }

    function getSunday(dt) {
        var year = dt.getFullYear();
        var month = dt.getMonth();
        var date = dt.getDate();
        var day = dt.getDay();

        var daysInMonthOfNormalYear = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var daysInMonthOfLeapYear = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        while (day !== 0) {
            if (date > 1) {
                date = date - 1;
            } else {
                if (month === 0) {
                    year = year - 1;
                    month = 11;
                    date = 31;
                } else {
                    month = month - 1;
                    if (isLeapYear(year)) {
                        date = daysInMonthOfLeapYear[month];
                    } else {
                        date = daysInMonthOfNormalYear[month];
                    }
                }
            }
            day = day - 1;
        }

        return [year, month, date];
    }


    function Animation() {
        var started = false;

        return function (frame, render, onEnd) {
            function exec() {
                if (!started) {
                    window.requestAnimationFrame(exec);
                    started = true;
                } else {
                    if (frame()) {
                        render();
                        window.requestAnimationFrame(exec);
                    } else {
                        render();
                        if (onEnd)
                            onEnd();
                        started = false;
                    }
                }
            }

            if (!started) {
                exec();
            }
        }
    }

    generateData([1950,0,1], [2050,0,16]);

    var _Datepicker = function () {

    };

    _Datepicker.prototype.replace = function(elem, opts) {
        var id;
        if (typeof elem == String) {
            elem = $(elem, true);
        }
        id = DPGlobal.generateId();
        elem.insertAdjacentHTML('afterbegin', DPGlobal.template);
        elem.classList.add(id);

        return new Datepicker(id, elem, opts);
    };

    var Datepicker = function (id, root, options) {
        DPGlobal.instances[id] = this;

        var current;
        var today = DPGlobal.today();

        for (var i=0,len=MonthsData.length;i<len;i++) {
            if (MonthsData[i][0]==today[0] && MonthsData[i][1]==today[1]) {
                current = i;
                break;
            }
        }

        $.prototype.namespace = '.' + id;

        this.root = root;
        this.element = find(root, '.datepicker');
        this.panel = find(root, '.datepicker .panel');

        this.id = id;
        this.isActive = false;

        this.input = new Datepicker.Input(this);
        this.monthSlider = new Datepicker.MonthSlider(this, current);
        this.yearSlider = new Datepicker.YearSlider(this, current);

        this.init();
    };

    Datepicker.prototype = {
        current: function() {
            return this.monthSlider.current;
        },

        selectedDate: function () {
            var dt = this.input.date;
            if (dt[0] == null || dt[1] == null || dt[2] == null)
                return null;
            return this.input.date;
        },

        init: function() {
            var _ = this;
            var isMousedown = false;

            function dp_blur() {
                isMousedown = false;
                _.isActive = false;
                _.input.focusedEl = [0,0,0];
                _.input.render();
                hide(_.panel, _.monthSlider.element, _.yearSlider.element);
            }

            this.events = [
                [_.element, {
                    mousedown: function (evt) {
                        evt.stopPropagation();
                    },
                    click: function (evt) {
                        _.isActive = true;
                        for (var x in DPGlobal.instances) {
                            if (DPGlobal.instances[x].isActive && DPGlobal.instances[x].id != _.id) {
                                DPGlobal.instances[x].blur();
                            }
                        }
                        evt.stopPropagation();
                    },
                    focus: function (evt) {
                        _.input.onfocus(evt);
                    },
                    blur: function (evt) {
                        hide(_.panel);
                        _.input.onblur(evt);
                    },
                    keydown: function (evt) {
                        if (_.input.isFocused)
                            _.input.keydown(evt);
                        evt.preventDefault();
                    }
                }],
                [$('html'), {
                    click: function() {if (!isMousedown)return;dp_blur();},
                    mousedown: function () {
                        isMousedown = true;
                    }
                }]

            ];

            this.blur = dp_blur;
            attachEvents(this.events);
        },
        value: function () {
            if (this.selectedDate() == null)
                return '';
            else
                return this.selectedDate().join('-');
        }
    };

    Datepicker.Input = function (dp) {
        this._dp = dp;
        this.animation = Animation();
        this.element = find(this._dp.root, '.datepicker .dp-input');
        this.year = find(this._dp.root, '.dp-input .txt .year');
        this.month = find(this._dp.root, '.dp-input .txt .month');
        this.day = find(this._dp.root, '.dp-input .txt .day');
        this.resetEl = find(this._dp.root, '.dp-input .control .reset');
        this.spinUpEl = find(this._dp.root, '.dp-input .control .up');
        this.spinDownEl = find(this._dp.root, '.dp-input .control .down');

        this.isFocused = false;
        this.focusedEl = [0,0,0];
        this.date = [null, null, null];
        this.kprsevt = {
            year: [0,0,0,0],
            month: [0,0],
            day: [0,0]
        };
        this.msevt = {
            isMousedown: false,
            timer: 0,
            dir: 1,
            counter: -1
        };

        this.init();
        this.render();
    };

    Datepicker.Input.prototype = {
        init: function () {
            var _ = this;
            _.events = [
                [_.element, {
                    keydown: proxy(_.keydown, _),
                    keyup: proxy(_.keyup, _),
                    keypress: proxy(_.keypress, _),
                    mousedown: function () {
                        _.isFocused = true;
                        hide(_._dp.panel);
                    }
                }],
                [_.spinUpEl, {
                    mousedown: proxy(_.spinUp, _),
                    mouseup: function() {}
                }],
                [_.spinUpEl, {
                    mousedown: function (evt) {
                        _.msevt.isMousedown = true;
                        _.msevt.timer = setTimeout(function(){_.msevt.dir = 1;_.spin();}, 300);
                    },
                    mouseup: function () {
                        _.msevt.isMousedown = false;
                        _.msevt.counter = -1;
                        clearTimeout(_.msevt.timer);
                    }
                }],
                [_.spinDownEl, {
                    mousedown: function () {
                        _.msevt.isMousedown = true;
                        _.msevt.timer = setTimeout(function(){_.msevt.dir = -1;_.spin();}, 300);
                    },
                    mouseup: function () {
                        _.msevt.isMousedown = false;
                        _.msevt.counter = -1;
                        clearTimeout(_.msevt.timer);
                    }
                }],
                [_.spinDownEl, {
                    mousedown: proxy(_.spinDown, _),
                    mouseup: function() {}
                }],
                [_.resetEl, {
                    click: proxy(_.reset, _)
                }],
                [_.element, '.year, .month, .day', {
                    click: proxy(_.activeField, _)
                }],
                [_.element, {
                    click: function () {
                        _.render();
                    }
                }]
            ];

            attachEvents(this.events);
        },

        activeField: function (evt) {
            if (evt.target.classList.contains('year'))
                this.focusedEl = [1,0,0];
            else if (evt.target.classList.contains('month'))
                this.focusedEl = [0,1,0];
            else
                this.focusedEl = [0,0,1];

            this.render();
        },

        keypress: function (evt) {
            var _ = this;
            var num = evt.keyCode;
            var tmp;
            var i = _.focusedEl.indexOf(1);
            // if (num >= 48 && num <= 57) {
            //     if (i === 0) {
            //         if ()
            //         tmp = parseInt((_.kprsevt.year.join('') + i).substring(1));
            //         if (tmp)
            //     } else if (i === 1) {
            //
            //     } else if (i === 2) {
            //
            //     }
            // }
            evt.preventDefault();
        },

        keyup: function () {

        },

        keydown: function (evt) {
            switch(evt.keyCode) {
                case 37:
                    this.focusedEl.push(this.focusedEl.shift());

                    evt.preventDefault();
                    break;
                case 38:
                    this.spinUp();

                    evt.preventDefault();
                    break;
                case 39:
                    this.focusedEl.unshift(this.focusedEl.pop());

                    evt.preventDefault();
                    break;
                case 40:
                    this.spinDown();

                    evt.preventDefault();
                    break;
                case 9:
                    if (evt.shiftKey) {
                        this.focusedEl.push(this.focusedEl.shift());
                    }
                    else {
                        this.focusedEl.unshift(this.focusedEl.pop());
                    }

                    evt.preventDefault();
                    break;
            }

            this.render();
        },

        onfocus: function () {
            this.focusedEl = [1,0,0];
            this.renderFocusedEl();
        },

        onblur: function () {
            this.focusedEl = [0,0,0];
        },

        reset: function () {
            this.date = [null, null, null];
            this.focused = [1, 0, 0];
        },

        spin: function () {
            this.animation(proxy(this.frame, this), proxy(this.render, this), new Function())
        },

        frame: function () {
            var _ = this;

            _.msevt.counter = (_.msevt.counter + 1)%5;
            if (_.msevt.counter%5 != 0)
                return _.msevt.isMousedown;

            if (_.msevt.isMousedown) {
                if (_.msevt.dir == 1) {
                    _.spinUp();
                } else {
                    _.spinDown();
                }
            }

            if (_.date[0] == 1950 || _.date[0] == 2049)
                return false;

            return _.msevt.isMousedown;
        },

        spinDown: function () {
            var i;
            var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            i = this.focusedEl.indexOf(1);
            if (i === -1)
                i = 0;
            if (i === 0) {
                if (this.date[i] == null) {
                    this.date[i] = MonthsData[this._dp.current()][0];
                } else {
                    this.date[i] = this.date[i] - 1;
                    if (this.date[i] < 1950)
                        this.date[i] = 1950;
                }
            }
            else if (i === 1) {
                if (this.date[i] == null) {
                    this.date[i] = 0;
                } else {
                    this.date[i] = (this.date[i] + 11)%12;
                }

                if (this.date[2] != null) {
                    if (this.date[0] != null && isLeapYear(this.date[0]) && this.date[i] == 1) {
                        if (this.date[2] > 29) {
                            this.date[2] = 29;
                        }
                    } else {
                        if (this.date[2] > daysInMonth[this.date[1]]) {
                            this.date[2] = daysInMonth[this.date[1]];
                        }
                    }
                }
            }
            else {
                if (this.date[i] == null) {
                    this.date[i] = 1;
                } else {
                    if (this.date[1] != null) {
                        if (this.date[1] == 1 && this.date[0] && isLeapYear(this.date[0])) {
                            this.date[i] = (this.date[i] + 27)%29 + 1;
                        } else {
                            this.date[i] = (this.date[i] + daysInMonth[this.date[1]] - 2)%daysInMonth[this.date[1]] + 1;
                        }
                    } else {
                        this.date[i] = (this.date[i] + 29)%31 + 1;
                    }
                }

            }
        },

        spinUp: function () {
            var i;
            var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            i = this.focusedEl.indexOf(1);
            if (i === -1)
                i = 0;
            if (i === 0) {
                if (this.date[i] == null) {
                    this.date[i] = MonthsData[this._dp.current()][0];
                } else {
                    this.date[i] = this.date[i] + 1;
                    if (this.date[i] > 2049)
                        this.date[i] = 2049;
                }

                if (isLeapYear(this.date[i]) && this.date[1] != null && this.date[1] == 1 && this.date[2] != null && this.date[2] > 29) {
                    this.date[2] = 29;
                } else {
                    if (this.date[1] != null) {
                        if (this.date[2] != null && this.date[2] > daysInMonth[this.date[1]]) {
                            this.date[2] = daysInMonth[this.date[1]];
                        }
                    }
                }
            }
            else if (i === 1) {
                if (this.date[i] == null) {
                    this.date[i] = 0;
                } else {
                    this.date[i] = (this.date[i] + 1)%12;
                }

                if (this.date[2] != null) {
                    if (this.date[0] != null && isLeapYear(this.date[0]) && this.date[i] == 1) {
                        if (this.date[2] > 29) {
                            this.date[2] = 29;
                        }
                    } else {
                        if (this.date[2] > daysInMonth[this.date[1]]) {
                            this.date[2] = daysInMonth[this.date[1]];
                        }
                    }
                }
            }
            else {
                if (this.date[i] == null) {
                    this.date[i] = 1;
                } else {
                    if (this.date[1] != null) {
                        if (this.date[1] == 1 && this.date[0] && isLeapYear(this.date[0])) {
                            this.date[i] = this.date[i]%29 + 1;
                        } else {
                            this.date[i] = (this.date[i])%daysInMonth[this.date[1]] + 1;
                        }
                    } else {
                        this.date[i] = (this.date[i])%31 + 1;
                    }
                }

            }
        },

        renderFocusedEl: function () {
            var _ = this;

            [
                this.year,
                this.month,
                this.day
            ].forEach(function(el, i) {
                if (_.focusedEl[i] == 1) {
                    addCls(el, 'focused');
                } else {
                    rmCls(el, 'focused');
                }
            })
        },
        
        render: function () {
            this.renderFocusedEl();
            this.year.textContent = (this.date[0] === null)?'年':this.date[0];
            this.month.textContent = (this.date[1] === null)?'月':fmtMD(this.date[1] + 1);
            this.day.textContent = (this.date[2] === null)?'日':fmtMD(this.date[2]);
            if (this.date[0] == null && this.date[1] == null && this.date[2] == null)
                hide(this.resetEl);
            else
                show(this.resetEl);
        }
    };

    Datepicker.MonthSlider = function (dp, current) {
        var _ = this;
        _._dp = dp;
        _.animation = Animation();
        _.current = current;
        _.element = find(_._dp.root, '.datepicker .month-slider');
        _.controls = find(_._dp.root, '.datepicker .slider-control')
        _.panel = find(_._dp.root, '.datepicker > .panel');
        _.datelabel = find(_._dp.root, '.datepicker .date-label .text');
        _.viewbox = find(_._dp.root, '.month-slider .body');
        _.open = find(_._dp.root, '.open-months-slider');
        _.listContainer = find(_._dp.root, '.month-slider .weeks-container');
        _.mask = find(_._dp.root, '.datepicker .mask');

        _.offset = MonthsData[this.current][3]*20;
        _.max = MonthsData.length-2;
        _.min = 0;
        _.ticks = 0;
        _.target = null;
        _.selectedDayCoords = null;
        _.cvs = $('#dp-one-month');
        _.ctx = _.cvs.getContext('2d');

        _.msevt = {
            direction: 1,
            timer: 0,
            isMousedown: false
        };

        _.init();
    };

    Datepicker.MonthSlider.prototype = {
        init: function() {
            var _ = this;
            _.events = [
                [_.controls, '.left,.right,.today', {mousedown: proxy(_.clearSelectedDay, _)}],
                [_.controls, '.left,.right', {mousedown: proxy(_.mousedown, _)}],
                [$('html'), {mouseup: proxy(_.mouseup, _, 'dp_stopMonthSlide')}],
//                 [_.listContainer, '.day', {click:proxy(_.clickDayCell, _)}],
                [_.controls, '.today', {click: proxy(_.clickToday, _)}],
                [_.controls, {click: function (evt) {
                    _._dp.input.isFocused = false;
                }}]
            ];

            _.events.push([
                _.open, {click: proxy(_.show, _)}
            ]);

            attachEvents(_.events);
          
            _.cvs.width = 238;
            _.cvs.height = 140;
        },

        holdOn: function() {
            var _ = this;
            if ((_.msevt.direction == 1 && _.current == _.max)
                ||(_.msevt.direction == -1 && _.current == _.min))
                return;

            _.target = null;
            _.ticks = 10000;
            _.animation(proxy(_.frame, _), proxy(_.render, _), proxy(_.afterSlide, _));
        },

        mousedown: function(evt) {
            this.msevt.direction = evt.target.classList.contains('right')?1:-1;
            this.msevt.isMousedown = true;
            this.msevt.timer = setTimeout(proxy(this.holdOn, this), 300);
        },

        mouseup: function(evt) {
            var _ = this;
            var direction = _.msevt.direction;
            var timer = _.msevt.timer;

            if (_.msevt.isMousedown) {
                clearTimeout(timer);
                if ((direction == 1 && _.current == _.max)
                    ||(direction == -1 && _.current == _.min))
                    return;
                if (this.ticks == 10000) {
                    if (_.getOffset(_.current) != _.offset) {
                        _.current = _.current + direction;
                        _.target = _.current;
                        _.ticks = Math.ceil(direction*(_.getOffset(_.target)-_.offset)/5);
                    } else {
                        _.target = _.current;
                        _.ticks = 1;
                    }
                } else {
                    _.target = _.current + direction;
                    _.current = _.target;
                    _.ticks = 20;
                    _.animation(proxy(_.frame, _), proxy(_.render, _), proxy(_.afterSlide, _));
                }
            }

            this.msevt.isMousedown = false;
        },

        clickToday: function (evt) {
            this._dp.input.isFocused = true;
            this._dp.input.date = DPGlobal.today();
            this._dp.input.render();
            hide(this._dp.panel);
        },

        clickDayCell: function (evt) {
            var dt,d;
            d = parseInt(evt.target.innerText);
            if (evt.target.classList.contains('outside')) {
                if (d < 7) {
                    this.current += 1;
                } else {
                    this.current -= 1;
                }
            }
            dt = MonthsData[this.current];
            this._dp.input.isFocused = true;
            this._dp.input.date = [dt[0], dt[1], d];
            this._dp.input.render();
            hide(this._dp.panel);
        },

        show: function () {
            var dt = this._dp.selectedDate();
            if (dt) {
                this.current = dt[0]*12 - MonthsData[0][0]*12 + dt[1];
            }
            this.offset = this.getOffset(this.current);

            this.clearSelectedDay();
            this.render();
            this.afterSlide();

            this._dp.input.isFocused = false;

            hide(this.mask, this._dp.yearSlider.element);
            show(this.panel, this.element);
        },

        getOffset: function(index) {
            return MonthsData[index][3]*20;
        },

        frame: function () {
            var totalOffset;
            var _ = this;
            if (_.target != null) {
                totalOffset = _.getOffset(_.target);
                _.offset = _.offset + Math.round((totalOffset - _.offset)/_.ticks);

                _.ticks--;
                return !!_.ticks;
            } else {
                if ((_.offset == _.getOffset(_.max) && _.msevt.direction == 1)
                    ||(_.offset === 0 && _.msevt.direction == -1)) {
                    _.ticks = 0;
                    return false;
                }

                _.offset = _.offset + 5*_.msevt.direction;
                if ((_.offset - _.getOffset(_.current))*_.msevt.direction > 0) {
                    _.current = _.current + _.msevt.direction;
                }

                return !!_.ticks;
            }
        },

        clearSelectedDay: function () {
//             var dt, o_coords = this.selectedDayCoords;
//             if (o_coords)
//                 rmCls(this.listContainer.children[o_coords.row].children[o_coords.col], 'selected');
//             dt = DPGlobal.today();
//             o_coords = DPGlobal.getCoords(dt);
//             rmCls(this.listContainer.children[o_coords.row].children[o_coords.col], 'today');
        },

        render: function () {
            var _ = this;
            var rows = MonthsData[this.current+1][3] - MonthsData[this.current][3] + 1;
            if (WeeksData[MonthsData[this.current+1][3]][0] == 1) rows = rows - 1;
            this.viewbox.style.height = (rows*20) + 'px';
            var index = Math.floor(this.offset/20);
            var diff = this.offset - index*20;
            var month = MonthsData[this.current][1]+1;
            this.datelabel.textContent = MonthsData[this.current][0] + '年' + fmtMD(month) + '月';
//             this.listContainer.style.transform = 'translate3d(0,'+ (-diff) +'px,0)';

//             console.log(diff)
            var x, y, w, d;
            y = 13 - diff;
          
            console.log(_.ctx.font)
          _.ctx.font = '12px "Microsoft Yahei"';
            _.ctx.clearRect(0,0,238,140);
          
          var styles = [
            'rgba(255, 0, 165, .5)',
            'rgba(255, 165, 0, .5)'
          ]
          
//             for (var i=0;i<7;i++) {
//               for (var j=0;j<7;j++) {
//                 _.ctx.fillStyle = styles[(i*7+j)%2];
//                 _.ctx.fillRect(j*34, i*20, 34, 20)
//               }
//             }
          
            for (var i=0;i<7;i++) {
              for (var j=0;j<7;j++) {
                d = WeeksData[index+i][j];
                w = _.ctx.measureText(d).width;
                _.ctx.fillText(d, j*34+17-w/2, y+20*i)
              }
            }
            
        },

        afterSlide: function() {
          var _ = this;
            _.ctx.clearRect(0,0,238,140);
          var style1 = 'rgb(191,191,191)';
          var style2 = 'rgb(0,0,0)';
          var index = Math.floor(this.offset/20);
          var last = MonthsData[this.current + 1][3] - MonthsData[this.current][3];
          var w,d,y;
          y = 13;
          for (var i=0;i<7;i++) {
              for (var j=0;j<7;j++) {
                d = WeeksData[index+i][j];
                
                  _.ctx.fillStyle = style2;
                
                w = _.ctx.measureText(d).width;
                if (i===0) {
                  if (d>7) {
                    _.ctx.fillStyle = style1;
                  }
                }
                
                if (i === last) {
                  if (d<7)_.ctx.fillStyle = style1;
                }
                
                _.ctx.fillText(d, j*34+17-w/2, y+20*i)
              }
            }
          
//             var firstRow = this.listContainer.children[0].children;
//             var lastRow = this.listContainer.children[MonthsData[this.current + 1][3] - MonthsData[this.current][3]].children;
//             var secondLastRow = this.listContainer.children[MonthsData[this.current + 1][3] - MonthsData[this.current][3] - 1].children;
//             var dt, dt2, today, coords;

//             for (var i=0;i<7;i++) {
//                 if (parseInt(firstRow[i].innerText) > 7)
//                     addCls(firstRow[i], 'outside');
//                 else
//                     rmCls(firstRow[i], 'outside');

//                 if (parseInt(lastRow[i].innerText) < 7)
//                     addCls(lastRow[i], 'outside');
//                 else
//                     rmCls(lastRow[i], 'outside');

//                 rmCls(secondLastRow[i], 'outside');
//             }

//             dt = this._dp.selectedDate();
//             dt2 = MonthsData[this.current];
//             if (dt) {
//                 if (dt[0] == dt2[0] && dt[1] == dt2[1]) {
//                     coords = DPGlobal.getCoords(dt);
//                     addCls(this.listContainer.children[coords.row].children[coords.col], 'selected');
//                     this.selectedDayCoords = coords;
//                 }
//             }

//             today = DPGlobal.today();
//             if (dt2[0] == today[0] && dt2[1] == today[1]) {
//                 coords = DPGlobal.getCoords(today);
//                 addCls(this.listContainer.children[coords.row].children[coords.col], 'today');
//             }
        }
    };

    Datepicker.YearSlider = function (dp, current) {
        this._dp = dp;
        this.animationScroll = Animation();
        this.animationAccodion = Animation();

        this.element = find(this._dp.root, '.datepicker .year-slider');
        this.monthTable1 = createElementFromHTML(DPGlobal.monthTableTemplate);
        this.monthTable2 = this.monthTable1.cloneNode(true);
        this.thumbBox = find(this._dp.root, '.year-slider .thumb-box');
        this.thumb = find(this._dp.root, '.year-slider .thumb');
        this.open = find(this._dp.root, '.datepicker .open-year-slider');
        this.listContainer = find(this._dp.root, '.year-slider .list');
        this.mask = find(this._dp.root, '.datepicker .mask');

        this.mainMonthTable = 1;
        this.min = MonthsData[0][0];
        this.max = MonthsData[MonthsData.length-1][0];
        this.current = MonthsData[current][0];
        this.target = this.current;
        this.offset = this.getOffset(this.current);
        this.height_monthTable1 = 96;
        this.height_monthTable2 = 0;

        this.msevt = {
            isMousedown: false,
            diff: 0
        };
        this.anmevt = {
            offset: 0,
            distance: 0,
            ticks: 10,
            distance2: 0
        },

        this.init();
        this.render();
    };

    Datepicker.YearSlider.prototype = {
        init: function() {
            var _ = this;

            _.fill();

            _.events = [
                [_.mask, {click: function() {_._dp.monthSlider.show()}}],
                [_.open, {click: proxy(_.show, _)}],
                [_.listContainer, '.title', {click: proxy(_.expandMonth, _)}],
                [_.thumbBox, {mousedown:  function(evt){_.msevt.isMousedown = true;$('html').addEventListener('mousemove', proxy(_.scroll, _, 'dp_dragThumb'));proxy(_.scroll, _)(evt);}}],
                [$('html'), {
                    mouseup: function(evt) {_.msevt.isMousedown = false;_.afterSlide();evt.preventDefault();evt.stopPropagation()}
                }],
                [_.monthTable1, '.four-months>div', {click:proxy(_.clickMonthCell, _)}],
                [_.monthTable2, '.four-months>div', {click:proxy(_.clickMonthCell, _)}]
            ];

            attachEvents(_.events);
        },

        show: function() {
            this.current = MonthsData[this._dp.current()][0];
            this.offset = this.getOffset(this.current);
            this.mainMonthTable = 1;
            this.height_monthTable1 = 96;
            this.height_monthTable2 = 0;
            this.listContainer.children[this.current - this.min].append(this['monthTable1']);
            this.render();

            hide(this._dp.monthSlider.element, this.monthTable2);
            show(this.mask, this.monthTable1, this.element);
        },

        fill: function() {
            var listHtml = '';
            for (var i=this.min,len=this.max;i<len;i++) {
                listHtml += '<div class="item"><div class="title">'+i+'</div></div>';
            }
            this.listContainer.innerHTML = listHtml;
        },

        clickMonthCell: function (evt) {
            var m = evt.target.innerText;
            var months = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
            this._dp.monthSlider.current = (this.current*12 - 1950*12 + months.indexOf(m));
            hide(this.element, this.mask);
            show(this._dp.monthSlider.element);
            this._dp.monthSlider.clearSelectedDay();
            this._dp.monthSlider.render();
            this._dp.monthSlider.afterSlide();
        },

        expandMonth: function (evt) {
            var yr;
            yr = parseInt(evt.target.innerText);
            if (yr == this.current) return;
            this.current = yr;
            this.anmevt.offset = this.getOffset(yr);
            this.anmevt.distance = this.anmevt.offset - this.offset;
            this.anmevt.distance2 = 96;
            this.anmevt.ticks = 10;
            this.mainMonthTable = (this.mainMonthTable)%2 + 1;
            show(this['monthTable' + this.mainMonthTable]);
            (this.listContainer.children[yr - this.min]).append(this['monthTable' + this.mainMonthTable]);

            this.animationAccodion(proxy(this.frameAccordion, this), proxy(this.render, this), proxy(this.afterAccordion, this));
        },

        frameAccordion: function() {
            var step, step2, main=this.mainMonthTable;
            var anmevt = this.anmevt;
            step = Math.round(anmevt.distance/anmevt.ticks);
            step2 = Math.round(anmevt.distance2/anmevt.ticks);
            anmevt.distance -= step;
            anmevt.distance2 -= step2;
            anmevt.ticks--;
            this.offset += step;

            this['height_monthTable'+main] += step2;
            this['height_monthTable'+(main%2+1)] -= step2;

            return !!anmevt.ticks;
        },

        getOffset: function(index) {
            return (index - this.min)*25;
        },

        scroll: function(evt) {
            if (!this.msevt.isMousedown)
                return;

            var _ = this;

            var diff = (evt.pageY - getViewOffset(_.thumb).y - 15);
            if (diff > 43)
                diff = 43;
            else if (diff < -43)
                diff = -43;
            if (this.msevt.diff != 0)
                this.msevt.diff = diff;
            else {
                this.msevt.diff = diff;
                _.animationScroll(proxy(_.frameScroll, _), proxy(_.render, _), proxy(_.afterSlide, _))
            }
        },

        frameScroll: function () {
            this.offset = Math.round(this.msevt.diff/5) + this.offset;
            if (this.offset > (this.getOffset(this.max) + 96 - 122)) {
                this.offset = (this.getOffset(this.max) + 96 - 122);
                return false;
            }

            if (this.offset < 0) {
                this.offset = 0;
                return false;
            }

            return this.msevt.isMousedown;
        },

        afterAccordion: function () {
            hide(this['monthTable' + (this.mainMonthTable%2+1)]);
        },

        afterSlide: function() {
            if (!this.msevt.isMousedown) {
                this.msevt.diff = 0;
            }

            $('html').removeEventListener('mousemove', DPGlobal.tmpEvtHdl.dp_dragThumb);
            this.render();
        },

        render: function () {
            this.thumb.style.transform = 'translate3d(0,'+ this.msevt.diff +'px,0)';
            this.listContainer.style.transform = 'translate3d(0,'+ (-this.offset) +'px,0)';
            this.monthTable1.style.height= this.height_monthTable1 + 'px';
            this.monthTable2.style.height= this.height_monthTable2 + 'px';
        }
    };

    var DPGlobal = {
        _id: 0,
        instances: {},
        template: '<div class="datepicker" tabindex="103">'+
        '  <div class="dp-input initial">'+
        '    <span class="txt"><span  class="year">年</span><span class="slash">/</span><span  class="month">月</span><span class="slash">/</span><span  class="day">日</span></span>'+
        '    <div class="control">'+
        '      <div class="reset hide">'+
        '        <svg width="9" height="9" style="display:block;">'+
        '          <defs>'+
        '            <linearGradient id="blue-gradient" x1="0" y1="0" x2="0" y2="1">'+
        '              <stop stop-color="rgb(64,116,185)" offset="0%"></stop>'+
        '              <stop stop-color="rgb(40,71,122)" offset="100%"></stop>'+
        '            </linearGradient>'+
        '            <clipPath id="clipPath2">'+
        '              <text x="0" y="8.5" style="font-size: 16px;line-height: 1;font-weight: 800;">x</text>'+
        '            </clipPath>'+
        '          </defs>'+
        '          <rect fill="url(#blue-gradient)" x="0" y="0" clip-path="url(#clipPath2)" width="9" height="9">'+
        '          </rect>'+
        '        </svg>'+
        '      </div>'+
        '      <div class="spin-buttons">'+
        '        <div class="up"></div>'+
        '        <div class="down"></div>'+
        '      </div>'+
        '      <div class="open-months-slider"></div>'+
        '    </div>'+
        '  </div>'+
        '  <div class="panel hide">'+
        '    <div class="mask hide"></div>' +
        '    <div class="panel-header">'+
        '      <div class="date-label open-year-slider">'+
        '        <span class="text"></span>'+
        '        <span class="triangle">'+
        '          <svg width="8" height="4">'+
        '            <polygon points="0,0 8,0 4,4" fill="black"></polygon>'+
        '          </svg>'+
        '        </span>'+
        '      </div>'+
        '      <div class="slider-control">'+
        '        <div class="left"></div>'+
        '        <div class="today"></div>'+
        '        <div class="right"></div>'+
        '      </div>'+
        '    </div>'+
        '    <div class="panel-body">'+
        '      <div class="month-slider">'+
        '        <div class="header"><span>周日</span><span>周一</span><span>周二</span><span>周三</span><span>周四</span><span>周五</span><span>周六</span></div>'+
        '        <div class="body">'+
        '<canvas id="dp-one-month"></canvas>'+
        '        </div>'+
        '      </div>'+
        '      <div class="year-slider hide">'+
        '        <div class="list">'+
        '        </div>'+
        '        <div class="thumb-box">'+
        '          <div class="thumb"></div>'+
        '        </div>'+
        '      </div>'+
        '    </div>'+
        '  </div>'+
        '</div>',
        monthTableTemplate: '<div class="month-table"><div class="four-months">' +
        '<div>一月</div><div>二月</div><div>三月</div><div>四月</div>' +
        '</div>' +
        '<div class="four-months">' +
        '<div>五月</div><div>六月</div><div>七月</div><div>八月</div>' +
        '</div>' +
        '<div class="four-months">' +
        '<div>九月</div><div>十月</div><div>十一月</div><div>十二月</div>' +
        '</div></div>',
        tmpEvtHdl: {},
        getCoords: function (dt) {
            var wk;
            if (dt) {
                wk = WeeksData[MonthsData[dt[0]*12 - MonthsData[0][0]*12 + dt[1]][3]];
                return {
                    row: Math.ceil((wk.indexOf(1) + dt[2])/7) - 1,
                    col: (wk.indexOf(1) + dt[2] - 1)%7
                }
            }

            return null;
        },

        today: function () {
            var dt = new Date();
            var year = dt.getFullYear();
            var month = dt.getMonth();
            var day = dt.getDate();

            return [year, month, day];
        },
        generateId: function () {
            return 'dapepicker_' + this._id++;
        }
    };

    window.Datepicker = new _Datepicker();
})();
Datepicker.replace(document.querySelector('.container'))
