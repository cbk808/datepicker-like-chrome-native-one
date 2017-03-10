
var WeeksData = [];
var MonthsData = [];
(function () {
    var instance;

    function $(selector) {
        return document.querySelector(selector);
    }

    function $$(selector) {
        return document.querySelectorAll(selector);
    }

    function addEventListenerOnce(target, type, listener) {
        target.addEventListener(type, function fn(event) {
            target.removeEventListener(type, fn);
            listener(event);
        });
    }

    function holdOn(direction) {
        return function () {
            var slider = instance.monthSlider;
            slider.direction = direction;
            slider.target = null;
            slider.ticks = 10000;
            Animation(slider.frame.bind(slider), slider.render.bind(slider));
        }
    }

    function isLeapYear(year) {
        return (year%4 == 0 && year%100 != 0) || (year%400 == 0);
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
                    MonthsData[monthIndex++] = [s[0], s[1], s[2], i + 6];
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

    generateData([1950,0,1], [2050,0,2]);

    for (var i=0;i<6;i++) {
        WeeksData.unshift([1,1,1,1,1,1,1]);
        WeeksData.push([1,1,1,1,1,1,1]);

        MonthsData.unshift([1950,0,1, 5 - i]);
        MonthsData.push([2050,0,1, WeeksData.length - 1 + 5-i]);
    }
    WeeksData.push([1,1,1,1,1,1,1]);
    MonthsData.push([2050,0,1, WeeksData.length - 1]);

    function removePreviousAll(parentNode, position) {
        while (parentNode.firstElementChild != parentNode.children[position]) {
            parentNode.removeChild(parentNode.firstElementChild);
        }
    }

    function removeNextAll(parentNode, position) {
        while (parentNode.children[position] != parentNode.lastElementChild) {
            parentNode.removeChild(parentNode.lastElementChild);
        }
    }

    function week(days) {
        return '<div class="week">' +
            '<div class="day">'+ days[0] +'</div>' +
            '<div class="day">'+ days[1] +'</div>' +
            '<div class="day">'+ days[2] +'</div>' +
            '<div class="day">'+ days[3] +'</div>' +
            '<div class="day">'+ days[4] +'</div>' +
            '<div class="day">'+ days[5] +'</div>' +
            '<div class="day">'+ days[6] +'</div>' +
            '</div>';
    }

    function createElements(html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        return div.childNodes;
    }

    var Animation = (function() {
        var started = false;

        return function (frame, render) {
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
                        started = false;
                    }
                }
            }

            if (!started) {
                exec();
            }
        }
    })();

    function moment(arr) {
        return new Date(Date.parse(arr.join('/')));
    }

    function getSunday(dt) {
        var year = dt.getFullYear();
        var month = dt.getMonth();
        var date = dt.getDate();
        var day = dt.getDay();

        var daysInMonthOfNormalYear = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var daysInMonthOfLeapYear = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        while (day != 0) {
            if (date > 1) {
                date = date - 1;
            } else {
                if (month == 0) {
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

    var Datepicker = function (options) {
        instance = this;
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

        this.monthSlider = new Datepicker.MonthSlider(current);

        this.yearSlider = new Datepicker.YearSlider();
    };

    Datepicker.replace = function() {

    };

    Datepicker.prototype = {

    };

    Datepicker.UI = {
        spinUp: $('.dp-input .up'),
        spinDown: $('.dp-input .down'),
        sliderContainer: $('.month-slider .body'),
        slideUp: $('.slider-control .right'),
        slideDown: $('.slider-control .left'),
        today: $('.slider-control .today'),
        monthSlider: $('.month-slider .weeks-container'),
        yearSlider: $('.year-slider')
    };


    // Events
    var isMousedown = false;
    var timer = null;
    var direction = 1;
    function mousedown() {
        isMousedown = true;
        timer = setTimeout(holdOn(direction), 300);
    }

    function mouseup() {
        if (isMousedown) {
            clearTimeout(timer);
            var slider = instance.monthSlider;
            if (slider.ticks == 10000) {
                if (slider.getOffset(slider.current) != slider.offset) {
                    slider.current = slider.current + slider.direction;
                    slider.target = slider.current;
                    slider.ticks = Math.ceil(slider.direction*(slider.getOffset(slider.target)-slider.offset)/5);
                } else {
                    slider.target = slider.current;
                    slider.ticks = 1;
                }
            } else {
                slider.direction = direction;
                slider.target = slider.current + slider.direction;
                slider.current = slider.target;
                slider.ticks = 20;
                Animation(slider.frame.bind(slider), slider.render.bind(slider));
            }
        }

        isMousedown = false;
    }


    Datepicker.UI.slideUp.addEventListener('mousedown', function () {
            direction = 1;
            mousedown();
    });
    Datepicker.UI.slideDown.addEventListener('mousedown', function () {
            direction = -1;
            mousedown();
    });
    $('html').addEventListener('mouseup', mouseup);


    Datepicker.UI.slideDown.addEventListener('mousedown', function (evt) {

    });

    Datepicker.UI.slideDown.addEventListener('mouseup', function (evt) {

    });

    Datepicker.MonthSlider = function (current) {
        this.current = current;
        this.element = $('.datepicker .month-slider');
        this.viewbox = Datepicker.UI.sliderContainer;
        this.min = current;
        this.max = current + 1;
        var html = '';
        for (var i=MonthsData[current][3], len=MonthsData[this.max][3];i<=len;i++) {
            html += week(WeeksData[i]);
        }
        this.container.innerHTML = html;
        this.count = 1;
        this.unshift();
        this.push();
        this.offset = (MonthsData[this.current][3] - MonthsData[this.min][3])*20;
        this.render();
        this.ticks = 0;
        this.target = null;
        this.direction = 1;
    };

    Datepicker.MonthSlider.prototype = {
        shift: function() {
            var min = this.min + this.count;
            var i = MonthsData[min][3];
            var j = MonthsData[this.min][3];
            this.min = min;

            removePreviousAll(this.container, i - j);
        },

        unshift: function() {
            var min = this.min - this.count;
            var i = MonthsData[min][3];
            var j = MonthsData[this.min][3];

            this.min = min;

            var html = '';
            for (;i<j && i>=0;i++) {
                html += week(WeeksData[i]);
            }
            this.container.insertAdjacentHTML('afterbegin', html);
        },

        pop: function() {
            var min = this.min;
            var max = this.max - this.count;
            var i = MonthsData[max][3];
            var j = MonthsData[min][3];

            this.max = max;

            removeNextAll(this.container, i - j);
        },

        push: function() {
            var max = this.max + this.count;
            var i = MonthsData[this.max][3] + 1;
            var j = MonthsData[max][3];

            this.max = max;

            var html = '';
            for (;i<=j;i++) {
                html += week(WeeksData[i]);
            }
            this.container.insertAdjacentHTML('beforeend', html);
        },

        cache: function () {
            if (this.direction == 1 && (this.max - this.current) == 3) {
                this.push();
                this.shift();
            } else if (this.direction == -1 && (this.current - this.min) == 2) {
                this.unshift();
                this.pop();
            }
        },

        frame: function () {
            this.cache();
            var totalOffset;
            if (this.target) {
                totalOffset = this.getOffset(this.target);
                this.offset = this.offset + Math.round((totalOffset - this.offset)/this.ticks);

                this.ticks--;
                return !!this.ticks;
            } else {
                this.offset = this.offset + 5*this.direction;
                if ((this.offset - this.getOffset(this.current))*this.direction > 0) {
                    this.current = this.current + this.direction;
                }

                return !!this.ticks;
            }
        },

        getOffset: function(index) {
            return (MonthsData[index][3] - MonthsData[this.min][3])*20;
        },

        render: function () {
            var rows = MonthsData[this.current+1][3] - MonthsData[this.current][3] + 1;
            if (WeeksData[MonthsData[this.current+1][3]][0] == 1) rows = rows - 1;
            this.viewbox.style.height = (rows*20) + 'px';
            this.container.style.transform = 'translate3d(0, '+ (-this.offset) +'px, 0)';
        }
    };

    Datepicker.YearSlider = function () {

    };

    Datepicker.YearSlider.prototype = {

    };

    window.Datepicker = Datepicker;
})();