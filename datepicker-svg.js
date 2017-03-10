var WeeksData = [];
var MonthsData = [];
(function () {
    function $(selector) {
        return document.querySelector(selector);
    }

    function $$(selector) {
        return document.querySelectorAll(selector);
    }

    function createElementFromHTML(html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        return div.children[0];
    }

    function getPageY( el ) {
	    var _x = 0;
	    var _y = 0;
	    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
	        _x += el.offsetLeft - el.scrollLeft;
	        _y += el.offsetTop - el.scrollTop;
	        el = el.offsetParent;
	    }
	    return { top: _y, left: _x };
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

    function addEventListenerOnce(target, type, listener) {
        target.addEventListener(type, function fn(event) {
            target.removeEventListener(type, fn);
            listener(event);
        });
    }

    function delegateEvent(el, defs, ch) {
        for (var key in defs) {
            el.addEventListener(key, function (evt) {
            	for (var i=0,elems=el.querySelectorAll(ch),len=elems.length;i<len;i++) {
            		if (elems[i] === evt.target) {
	                    defs[key](evt);
            		}         
            	}
            })
        }
    }

    function proxy(fn, target) {
        return fn.bind(target);
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

        return function (frame, render, afterSlide) {
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
                        afterSlide();
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

    var Datepicker = function (options) {
        DPGlobal.instance = this;

        var dt = new Date();
        var year = dt.getFullYear();
        var month = dt.getMonth();
        var current;

        for (var i=0,len=MonthsData.length;i<len;i++) {
            if (MonthsData[i][0]==year && MonthsData[i][1]==month) {
                current = i;
                break;
            }
        }

        this.element = $('.datepicker');
        this.panel = $('.datepicker .panel');

        this.monthSlider = new Datepicker.MonthSlider(current);

        this.yearSlider = new Datepicker.YearSlider();

        this.init();
    };

    Datepicker.replace = function(elem) {
        if (typeof elem == String) {
            elem = $(elem);
        }

        elem.insertAdjacentHTML('afterbegin', DPGlobal.template);

        return new Datepicker();
    };

    Datepicker.prototype = {
        init: function() {
        	var _ = this;
            _.element.addEventListener('click', function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
            });

            $('html').addEventListener('click', function() {
            	hide(_.monthSlider.element, _.panel, _.yearSlider.element);
            });
        },

        current: function() {
        	return this.monthSlider.current;
        }
    };

    Datepicker.MonthSlider = function (current) {
        this.animation = Animation();

        this.current = current;
        this.element = $('.datepicker .month-slider');
        this.controls = $('.datepicker .slider-control')
        this.panel = $('.datepicker > .panel');
        this.datelabel = $('.datepicker .date-label .text');
        this.viewbox = $('.month-slider .body');
        this.open = $('.open-months-slider');
        this.listContainer = $('.month-slider .weeks-container');

        this.offset = MonthsData[this.current][3]*20;
        this.max = MonthsData.length-2;
        this.min = 0;
        this.ticks = 0;
        this.target = null;

        this.msevt = {
            direction: 1,
            timer: 0,
            isMousedown: false
        };

        this.init();
    };

    Datepicker.MonthSlider.prototype = {
        init: function() {
            this.render();

            this.events = [
                [this.controls, '.left,.right,.today', {mousedown: proxy(this.mousedown, this)}],
                [$('html'), {mouseup: proxy(this.mouseup, this)}]
            ];

            this.events.push([
                this.open, {click: proxy(this.show, this)}
            ]);

            attachEvents(this.events);
        },

	holdOn: function(direction) {
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

        mouseup: function() {
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

        show: function () {
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

        render: function () {
            var rows = MonthsData[this.current+1][3] - MonthsData[this.current][3] + 1;
            if (WeeksData[MonthsData[this.current+1][3]][0] == 1) rows = rows - 1;
            this.viewbox.style.height = (rows*20) + 'px';
            var index = Math.floor(this.offset/20);
            var diff = this.offset - index*20;
            var month = MonthsData[this.current][1]+1;
            this.datelabel.textContent = MonthsData[this.current][0] + '年' + ((month>9)?(month):('0'+month)) + '月';
            this.listContainer.style.transform = 'translate3d(0,'+ (-diff) +'px,0)';

            for (var i=0;i<7;i++) {
                var days = this.listContainer.children[i].children;
                days[0].textContent = WeeksData[index+i][0];
                days[1].textContent = WeeksData[index+i][1];
                days[2].textContent = WeeksData[index+i][2];
                days[3].textContent = WeeksData[index+i][3];
                days[4].textContent = WeeksData[index+i][4];
                days[5].textContent = WeeksData[index+i][5];
                days[6].textContent = WeeksData[index+i][6];
            }
        },

        afterSlide: function() {

        }
    };

    Datepicker.YearSlider = function () {
        this.animationScroll = Animation();
        this.animationAccodion = Animation();

        this.element = $('.datepicker .year-slider');
        this.monthTable1 = createElementFromHTML(DPGlobal.monthTableTemplate);
        this.monthTable2 = this.monthTable1.cloneNode();
        this.thumbBox = $('.year-slider .thumb-box');
        this.thumb = $('.year-slider .thumb');
        this.open = $('.datepicker .open-year-slider');
        this.listContainer = $('.year-slider .list');

        this.mainMonthTable = 1;
        this.min = MonthsData[0][0];
        this.max = MonthsData[MonthsData.length-1][0];
        this.current = MonthsData[DPGlobal.instance.current()][0];
        this.target = this.current;
        this.offset = this.getOffset(this.current);
        this.height_monthTable1 = 96;
        this.height_monthTable2 = 0;

        this.msevt = {
            isMousedown: false,
            step: 0
        }

        this.init();
        this.render();
    };

    Datepicker.YearSlider.prototype = {
        init: function() {
            var _ = this;

            _.fill();

            _.events = [
                [_.open, {click: proxy(_.show, _)}],
		 [_.listContainer, 'title', {click: proxy(_.expandMonth, _)}],
		 // [_.thumbBox, {mousedown:  function(evt){_.msevt.isMousedown = true;proxy(_.scroll, _)(evt);}}],
		 [$('html'), {
		 	mouseup: function(evt) {_.msevt.isMousedown = false;evt.preventDefault();evt.stopPropagation()},
		 	// mousemove: proxy(_.scroll, _)
		 }],
            ];

            attachEvents(_.events);
        },

        show: function() {
        	this.current = MonthsData[DPGlobal.instance.current()][0];
        	this.offset = this.getOffset(this.current);
        	this.mainMonthTable = 1;
        	this.height_monthTable1 = '96px';
        	this.height_monthTable2 = 0;
        	this.listContainer.children[this.current - this.min].append(this['monthTable1']);
        	this.render();

        	hide(DPGlobal.instance.monthSlider.element);
        	show(this.element);
        },

        fill: function() {
	 	var listHtml = '';
	        for (var i=this.min,len=this.max;i<len;i++) {
	            listHtml += '<div class="item"><div class="title">'+i+'</div></div>';
	        }
	        this.listContainer.innerHTML = listHtml;
        },

        expandMonth: function (evt) {

        },

        frameAccordion: function() {

        },

        getOffset: function(index) {
            return (this.current - this.min)*25;
        },

        scroll: function(evt) {
        	var _ = this;
        	var diff = 0;
        	var step = 0;
        	if (_.msevt.isMousedown) {
        		diff = (evt.pageY - getPageY(_.thumb) .top - 15);
        		console.log(diff);
        		if (diff > 43)
        			diff = 43;
        		else if (diff < -43)
        			diff = -43;

        		this.msevt.step = Math.round(diff/4);
        		_.animationScroll(proxy(_.frameScroll, _), proxy(_.render, _), proxy(_.afterSlide, _))
        	}
        },

        frameScroll: function () {
            this.offset = this.msevt.step + this.offset;
            return this.msevt.isMousedown;
        },

        afterSlide: function() {

        },

        render: function () {
            this.listContainer.style.transform = 'translate3d(0,'+ (-this.offset) +'px,0)';
            this.monthTable1.style.height= this.height_monthTable1;
            this.monthTable2.style.height= this.height_monthTable2;
        }
    };

    var DPGlobal = {
        template: '<div class="datepicker">'+
        '  <div class="dp-input initial">'+
        '    <span class="txt"><span tabindex="103" class="year">年</span><span class="slash">/</span><span tabindex="103" class="month">月</span><span class="slash">/</span><span tabindex="103" class="day">日</span></span>'+
        '    <div class="control">'+
        '      <div class="reset">'+
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
        '          <div class="weeks-container">'+
        '            <div class="week">'+
        '              <div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div>'+
        '            </div>'+
        '            <div class="week">'+
        '              <div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div>'+
        '            </div>'+
        '            <div class="week">'+
        '              <div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div>'+
        '            </div>'+
        '            <div class="week">'+
        '              <div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div>'+
        '            </div>'+
        '            <div class="week">'+
        '              <div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div>'+
        '            </div>'+
        '            <div class="week">'+
        '              <div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div>'+
        '            </div>'+
        '            <div class="week">'+
        '              <div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div>'+
        '            </div>'+
        '          </div>'+
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
        '</div></div>'
    };

    window.Datepicker = Datepicker;
})();