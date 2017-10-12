(function () {
    var MAX_YEAR = 1950;
    var MIN_YEAR = 2050;
    var CONTINUOUS_SCROLLING_STEP = 5;
    var TRANSITION_FRAMES_COUNT = 18;
    var BEGIN_CONTINUOUS_SCROLLING_DELAY = 320;
    var ROW_HEIGHT = 20;
    var COLUMN_WIDTH = 34;
    var PIXEL_RATIO = (function () {
        var ctx = document.createElement("canvas").getContext("2d"),
            dpr = window.devicePixelRatio || 1,
            bsr = ctx.webkitBackingStorePixelRatio ||
                ctx.mozBackingStorePixelRatio ||
                ctx.msBackingStorePixelRatio ||
                ctx.oBackingStorePixelRatio ||
                ctx.backingStorePixelRatio || 1;

        return dpr / bsr;
    })();

    var today;
    var $domMain;
    var $domScrollContainer;
    var $domMonthView;

    var $canvasMonthViewBackground;
    var $canvasMonthViewForeground;
    var canvasMonthViewBackgroundContext;
    var canvasMonthViewForegroundContext;

    // Constructor
    function DatePicker(options) {
        today = getDateArray(new Date());
        currentMonth = searchDateInMonthsData(today);
        currentOffset = getOffset(currentMonth);
        $domMain = $(Templates.panel);
        $domMonthView = $(Templates.monthView);
        $domYearView = $(Templates.yearView);

        $canvasMonthViewBackground = $domMonthView.find('.dp-month-canvas-background');
        $canvasMonthViewForeground = $domMonthView.find('.dp-month-canvas-foreground');
        contextMonthViewBackground = $canvasMonthViewBackground[0].getContext('2d');
        contextMonthViewForeground = $canvasMonthViewForeground[0].getContext('2d');

        $domMain.find('.dp-body').append($domMonthView);
        $domMain.find('.dp-header').append($(Templates.buttonGroup));
        $domMain.appendTo('body');

        this.init();
    }

    // Timer for mouse down holding, if time elapsed is less than 320ms,
    // then just scroll to next/prev month,
    // otherwise, scroll continuously until user release mouse button.
    var timer = null;

    function setTimer(cbk, delay) {
        timer = setTimeout(cbk, delay);
    }

    function clearTimer() {
        clearTimeout(timer);
    }

    // Scroll animation
    var isWaitingForStop = false;
    var isScrolling = false;
    var totalFrames = null;
    var updateState = null;
    var currentOffset = 0;
    var stopOffset = 0;
    var currentMonth = null;
    var render = null;
    var scrollDirection = null;

    function runScrollAnimation() {
        updateState();
        render();
        if (isScrolling) {
            window.requestAnimationFrame(runScrollAnimation);
        }
    }

    // Start the scroll animation
    function startMonthViewScroll() {
        isScrolling = true;
        totalFrames = TRANSITION_FRAMES_COUNT;
        updateState = function () {
            var step = (stopOffset - currentOffset) / totalFrames;
            currentOffset += Math.round(step);

            totalFrames--;
            if (totalFrames === 0) {
                stopMonthViewScroll();
            }
        };
        render = function () {
            drawMonthView();
        };
        window.requestAnimationFrame(runScrollAnimation)
    }

    function scrollToPrevMonth() {
        // Having met the first month.
        if (currentMonth === 0) return;

        calcNewStopOffset();
        if (!isScrolling) {
            startMonthViewScroll();
        } else {
            totalFrames = TRANSITION_FRAMES_COUNT;
        }
    }

    function scrollToNextMonth() {
        // Having met the last month.
        if (currentMonth === MonthsData.length - 1) return;

        calcNewStopOffset();
        if (!isScrolling) {
            startMonthViewScroll();
        } else {
            totalFrames = TRANSITION_FRAMES_COUNT;
        }
    }

    function startMonthViewScrollDown() {
        // Having met the first month.
        if (currentMonth === 0) return;

        isWaitingForStop = true;
        isScrolling = true;
        totalFrames = 10000000;
        scrollDirection = -1;
        updateState = function () {
            var maxOffset = getOffset(MonthsData.length - 1);
            if ((maxOffset - currentOffset) <= CONTINUOUS_SCROLLING_STEP) {
                currentOffset = maxOffset;
                // Meet the bottom, then stop animation.
                stopMonthViewScroll();
            } else {
                currentOffset -= CONTINUOUS_SCROLLING_STEP;
            }
        };
        render = function () {
            drawMonthView();
        };
        window.requestAnimationFrame(runScrollAnimation);
    }

    function startMonthViewScrollUp() {
        // Having met the last month.
        if (currentMonth === MonthsData.length - 1) return;

        isWaitingForStop = true;
        isScrolling = true;
        totalFrames = 10000000;
        scrollDirection = 1;
        updateState = function () {
            if (currentOffset <= CONTINUOUS_SCROLLING_STEP) {
                currentOffset = 0;
                // Meet the top, then stop animation.
                stopMonthViewScroll();
            } else {
                currentOffset += CONTINUOUS_SCROLLING_STEP;
            }
        };
        render = function () {
            drawMonthView();
        };
        window.requestAnimationFrame(runScrollAnimation);
    }

    function stopMonthViewScroll() {
        if (isWaitingForStop) {
            isWaitingForStop = false;
            // Scroll to the nearest month.
            if (currentOffset < getOffset(MonthsData.length - 1) && currentOffset > 0) {
                if (scrollDirection === 1) { // up

                } else { // down

                }
            } else {
                isScrolling = false;
            }
        } else {
            isScrolling = false;
        }
    }

    // Canvas
    function drawMonthView() {
        var index = Math.floor(currentOffset / ROW_HEIGHT);
        var diff = currentOffset - index * ROW_HEIGHT;

        contextMonthViewBackground.save();
        contextMonthViewForeground.save();
        contextMonthViewBackground.translate(0, -diff);
        contextMonthViewForeground.translate(0, -diff);
        contextMonthViewBackground.clearRect(0, 0, $canvasMonthViewBackground[0].width, $canvasMonthViewBackground[0].height);
        contextMonthViewForeground.clearRect(0, 0, $canvasMonthViewForeground[0].width, $canvasMonthViewForeground[0].height);

        for (var i = 0; i < 7; i++) {
            for (var j = 0; j < 7; j++) {
                contextMonthViewForeground.fillText(WeeksData[index + i][j], j * 34 + 16, i * 20 + 10);
            }
        }

        contextMonthViewBackground.restore();
        contextMonthViewForeground.restore();
    }

    // Scroll container
    function setScrollContainerHeight(h) {
        $domScrollContainer.height(h);
    }

    DatePicker.prototype = {
        init: function () {
            var w = 238, h = 140;

            $canvasMonthViewBackground.css({
                width: w + 'px',
                height: h + 'px'
            }).attr({
                width: w * PIXEL_RATIO,
                height: h * PIXEL_RATIO
            });

            $canvasMonthViewForeground.css({
                width: w + 'px',
                height: h + 'px'
            }).attr({
                width: w * PIXEL_RATIO,
                height: h * PIXEL_RATIO
            });

            contextMonthViewBackground.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
            contextMonthViewForeground.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
            contextMonthViewForeground.font = 'normal normal normal normal 12px "Helvetica Neue"';
            contextMonthViewForeground.textAlign = "center";
        },
        onBtnPrevMonthDown: function () {
            setTimer(startMonthViewScrollDown, BEGIN_CONTINUOUS_SCROLLING_DELAY);
        },
        onBtnPrevMonthUp: function () {
            clearTimer();
            if (!isWaitingForStop) {
                prevMonthIndex();
                DateLabel.toPrevMonth();
                scrollToPrevMonth();
            } else {
                stopMonthViewScroll();
            }
        },
        onBtnNextMonthDown: function () {
            setTimer(startMonthViewScrollUp, BEGIN_CONTINUOUS_SCROLLING_DELAY);
        },
        onBtnNextMonthUp: function () {
            clearTimer();
            if (!isWaitingForStop) {
                nextMonthIndex();
                DateLabel.toNextMonth();
                scrollToNextMonth();
            } else {
                stopMonthViewScroll();
            }
        }
    };

    DateLabel = {
        year: null,
        month: null,
        toNextMonth: function () {

        },
        toPrevMonth: function () {

        },
        toMonth: function () {

        }
    };

    // Prepare date pool
    var WeeksData = [];
    var MonthsData = [];
    generateData(startWeekOfYear(MAX_YEAR), endWeekOfYear(MIN_YEAR));

    function getDateArray(dt) {
        return [
            dt.getFullYear(),
            dt.getMonth(),
            dt.getDate()
        ];
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    function startWeekOfYear(y) {
        var dt = new Date([y]);
        var weekDay = dt.getDay();
        dt.setTime(dt.getTime() - weekDay * 24 * 3600 * 1000);
        return getDateArray(dt);
    }

    function endWeekOfYear(y) {
        var dt = new Date([y + 1]);
        var weekDay = dt.getDay();
        var remainWeekDays = 0;

        if (weekDay > 0) {
            remainWeekDays = 7 - weekDay;
        }

        dt.setTime(dt.getTime() + (remainWeekDays + 14) * 24 * 3600 * 1000);

        return getDateArray(dt);
    }

    function searchDateInMonthsData(date) {
        for (var i = 0, len = MonthsData.length; i < len; i++) {
            if (MonthsData[i][0] === date[0] && MonthsData[i][1] === date[1]) {
                return i;
            }
        }
    }

    function generateData(s, e) {
        var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var monthIndex = 0;
        var i = 0;
        for (; ;) {
            var ar = [];
            for (var j = 0; j < 7; j++) {
                if (e[0] === s[0] && e[1] === s[1] && e[2] === s[2]) {
                    return;
                }

                ar[j] = s[2];
                if (s[2] === 1) {
                    MonthsData[monthIndex++] = [s[0], s[1], s[2], i];
                }
                if (s[2] === 28 && s[1] === 1 && isLeapYear(s[0])) {
                    s[2] = 29;
                } else if (s[2] === 29 && s[1] === 1) {
                    s[1] = 2;
                    s[2] = 1;
                } else {
                    if (daysInMonth[s[1]] === s[2]) {
                        if (s[1] === 11) {
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
            i++;
        }
    }

    // Get a months's offset in MonthsData by its index.
    function getOffset(index) {
        return MonthsData[index][3] * ROW_HEIGHT;
    }

    // Set a new stop offset for scroll animation.
    function calcNewStopOffset() {
        stopOffset = getOffset(currentMonth);
    }

    function nextMonthIndex() {
        return (currentMonth === MonthsData.length) ? MonthsData.length : ++currentMonth;
    }

    function prevMonthIndex() {
        return (currentMonth === 0) ? 0 : --currentMonth;
    }

    var whichNavBtnDown = null;
    $(document)
        .on('mousedown', '.dp-btn-prev', function (e) {
            whichNavBtnDown = 'prev';
            DatePicker.prototype.onBtnPrevMonthDown();
        })
        .on('mousedown', '.dp-btn-next', function (e) {
            whichNavBtnDown = 'next';
            DatePicker.prototype.onBtnNextMonthDown();
        })
        .on('mouseup', '.dp-btn-prev', function (e) {
            if (whichNavBtnDown === 'prev') {
                DatePicker.prototype.onBtnPrevMonthUp();
            }
        })
        .on('mouseup', '.dp-btn-next', function (e) {
            if (whichNavBtnDown === 'next') {
                DatePicker.prototype.onBtnNextMonthUp();
            }
        })
        .on('mouseup', function (e) {
            whichNavBtnDown = null;
        });

    Templates = {
        panel: '<div class="dp-container">' +
        '<div class="dp-inner-wrapper">' +
        '<div class="dp-header"></div>' +
        '<div class="dp-body">' +
        '</div>' +
        '</div>' +
        '</div>',
        monthView: '<div class="dp-month-view">' +
        '<div class="dp-weeks-title"></div>' +
        '<div class="dp-month-scroll-box">' +
        '<canvas class="dp-month-canvas-background"></canvas>' +
        '<canvas class="dp-month-canvas-foreground"></canvas>' +
        '</div>' +
        '</div>',
        yearView: '<div class="dp-year-view">' +
        '<div class="dp-year-scroll-bobx">' +
        '<canvas class="dp-year-canvas"></canvas>' +
        '</div>' +
        '</div>',
        dateLabel: '<div class="dp-date-label">' +
        '<span class="dp-date-label-txt"></span>' +
        '<span class="dp-date-label-arrow"></span>' +
        '</div>',
        buttonGroup: '<div class="dp-btn-group">' +
        '<div class="dp-btn-prev"></div>' +
        '<div class="dp-btn-curr"></div>' +
        '<div class="dp-btn-next"></div>' +
        '</div>'
    };

    window.DatePicker = DatePicker;
})();
