(function ($) {
    // var MIN_TIME = -62167766400000;
    var MIN_TIME = -62135712000000;
    var MAX_TIME = 750736656000000;
    var MIN_YEAR = 1;
    var MAX_YEAR = 25759;
    var CONTINUOUS_SCROLLING_STEP = 5;
    var TRANSITION_FRAMES_COUNT = 18;
    var BEGIN_CONTINUOUS_SCROLLING_DELAY = 320;
    var ROW_HEIGHT = 20;
    var MAX_OFFSET = Math.floor((MAX_TIME - MIN_TIME)/(7*24*3600000))*ROW_HEIGHT;
    var DAY_CELL_WIDTH = 34;
    var SCROLL_CONTAINER_WIDTH = 238;
    var CANVAS_HEIGHT = 140;
    var COLOR_OUTSIDE_DAY = '#bfbfbf';
    var COLOR_DAY = '#000000';
    var COLOR_DAY_CELL_BORDER = '#bfbfbf';
    var COLOR_DAY_CELL_BACKGROUND = 'rgb(229,236,248)';
    var COLOR_SELECTED_DAY_CELL_BACKGROUND = '#becde9';

    var YEAR_ROW_HEIGHT = 25;
    var YEAR_VIEW_SCROLL_CONTAINER_WIDTH = 223;
    var YEAR_VIEW_SCROLL_CONTAINER_HEIGHT = 120;
    var MONTH_GRID_HEIGHT = 96;
    var MONTH_CELL_WIDTH = 56;
    var MONTH_CELL_HEIGHT = 32;
    var THUMB_HEIGHT = 30;
    var MAX_SCROLL_STEP = 6;
    var COLOR_YEAR_VIEW_BACKGROUND = '#f5f5f5';
    var COLOR_YEAR_BORDER_BOTTOM = '#bfbfbf';
    var COLOR_MONTH_CELL_BACKGROUND = 'rgb(229,236,248)';

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
    var selectedDay;
    var $domMain;
    var $domScrollContainer;
    var $domMonthView;
    var $domYearView;
    var $domMask;
    var $domThumb;

    var $domInput;
    var $domInputYear;
    var $domInputMonth;
    var $domInputDay;
    var $domInputButtonGroup;
    var $domInputSpinUp;
    var $domInputSpinDown;
    var $domInputIndicator;
    var $domInputClear;

    var $canvasMonthViewBackground;
    var $canvasMonthViewForeground;
    var contextMonthViewBackground;
    var contextMonthViewForeground;

    var $canvasYearViewBackground;
    var $canvasYearViewForeground;
    var contextYearViewBackground;
    var contextYearViewForeground;
    
    var $canvasOffScreen;
    var contextOffScreen;

    // Animation
    var render = null;
    var updateState = null;
    var afterAnimation = null;
    function runScrollAnimation() {
        updateState();
        render();
        if (isAnimating) {
            window.requestAnimationFrame(runScrollAnimation);
        } else {
            afterAnimation();
        }
    }
    // Scroll animation
    // states
    var isWaitingForStop = false;
    var isAnimating = false;
    var totalFrames = null;
    var currentOffset = 0;
    var currentTime;
    var inRowOffset = 0;
    var stopOffset = 0;
    var currentMonth = null;
    var scrollDirection = null;


    //region Month view animation
    // Scroll to a calculated offset
    function  scrollToOffset() {
        var step = (stopOffset - currentOffset) / totalFrames;
        currentOffset += Math.round(step);
        currentTime = getTimeFromOffset(currentOffset);
        inRowOffset = currentOffset - getOffset(currentTime);
        totalFrames--;
        if (totalFrames === 0) {
            stopMonthViewScroll();
        }
    }

    // Start the scroll animation
    function startMonthViewScroll() {
        isAnimating = true;
        totalFrames = TRANSITION_FRAMES_COUNT;
        updateState = scrollToOffset;
        render = function () {
            drawMonthView();
        };
        afterAnimation = function () {
            drawAfterAnimation();
        };
        window.requestAnimationFrame(runScrollAnimation)
    }

    function scrollToPrevMonth() {
        // Having met the first month.
        if (currentTime === MIN_TIME) return;

        prevMonthIndex();
        calcNewStopOffset();
        if (!isAnimating) {
            startMonthViewScroll();
        } else {
            totalFrames = TRANSITION_FRAMES_COUNT;
        }
    }

    function scrollToNextMonth() {
        // Having met the last month.
        if (currentTime === MAX_TIME) return;

        nextMonthIndex();
        calcNewStopOffset();
        if (!isAnimating) {
            startMonthViewScroll();
        } else {
            totalFrames = TRANSITION_FRAMES_COUNT;
        }
    }

    function startMonthViewScrollDown() {
        // Having met the first month.
        if (currentTime === MIN_TIME) return;

        isWaitingForStop = true;
        isAnimating = true;
        totalFrames = 10000000;
        scrollDirection = -1;
        updateState = function () {
            if (currentOffset <= CONTINUOUS_SCROLLING_STEP) {
                currentOffset = 0;
                currentTime = MIN_TIME;
                inRowOffset = 0;
                // Meet the top, then stop animation.
                stopMonthViewScroll();
            } else {
                currentOffset -= CONTINUOUS_SCROLLING_STEP;
                currentTime = getTimeFromOffset(currentOffset);
                inRowOffset = currentOffset - getOffset(currentTime);
                if (getOffset(currentMonth) > currentOffset) {
                    prevMonthIndex();

                    // UI
                    DateLabel.update();
                    updateScrollContainerHeight();
                }
            }
        };
        render = function () {
            drawMonthView();
        };
        afterAnimation = function () {
            drawAfterAnimation();
        };
        window.requestAnimationFrame(runScrollAnimation);
    }

    function startMonthViewScrollUp() {
        // Having met the last month.
        if (currentTime === MAX_TIME) return;

        isWaitingForStop = true;
        isAnimating = true;
        totalFrames = 10000000;
        scrollDirection = 1;
        updateState = function () {
            if ((MAX_OFFSET - currentOffset) <= CONTINUOUS_SCROLLING_STEP) {
                currentOffset = MAX_OFFSET;
                currentTime = MAX_TIME;
                inRowOffset = 0;
                // Meet the bottom, then stop animation.
                stopMonthViewScroll();
            } else {
                currentOffset += CONTINUOUS_SCROLLING_STEP;
                currentTime = getTimeFromOffset(currentOffset);
                inRowOffset = currentOffset - getOffset(currentTime);
                if (getOffset(currentMonth) < currentOffset) {
                    nextMonthIndex();

                    //UI
                    DateLabel.update();
                    updateScrollContainerHeight();
                }
            }
        };
        render = function () {
            drawMonthView();
        };
        afterAnimation = function () {
            drawAfterAnimation();
        };
        window.requestAnimationFrame(runScrollAnimation);
    }

    function stopMonthViewScroll() {
        if (isWaitingForStop) {
            isWaitingForStop = false;
            // Scroll to the nearest month.
            if (currentTime < MAX_TIME && currentTime > MIN_TIME) {
                if (scrollDirection === 1) { // up
                    if (getStartTimeOfMonth(currentMonth) < MAX_TIME) {
                        nextMonthIndex();
                        totalFrames = TRANSITION_FRAMES_COUNT;
                        calcNewStopOffset();

                        DateLabel.update();
                        updateScrollContainerHeight();
                    } else {
                        totalFrames = Math.ceil((MAX_OFFSET - currentOffset)/5);
                        calcNewStopOffset();
                    }
                } else { // down
                    if (getStartTimeOfMonth(currentMonth) > MIN_TIME) {
                        prevMonthIndex();
                        totalFrames = TRANSITION_FRAMES_COUNT;
                        calcNewStopOffset();

                        DateLabel.update();
                        updateScrollContainerHeight();
                    } else {
                        totalFrames = Math.ceil(currentOffset/5);
                        calcNewStopOffset();
                    }
                }
                updateState = scrollToOffset;
            } else {
                isAnimating = false;
            }
        } else {
            isAnimating = false;
        }
    }
    //endregion

    //region year view animation
    // Scroll year view
    var scrollStep = 0;
    var expandedYear = null;
    var selectedYear = null;
    var monthGridTop;
    var monthGridBottom;
    var yCurrentOffset = 0;
    var yScrollDirection = null;
    var maxOffset = 25759*YEAR_ROW_HEIGHT;

    function startYearViewScroll() {
        if ((yCurrentOffset === maxOffset && yScrollDirection === 1)
            || (yCurrentOffset === YEAR_ROW_HEIGHT && yScrollDirection === -1)) {
            return;
        }

        monthGridTop = (expandedYear + 1) * YEAR_ROW_HEIGHT;
        monthGridBottom = monthGridTop + MONTH_GRID_HEIGHT;
        isAnimating = true;
        updateState = function () {
            if (yScrollDirection === 1) { // Up
                if ((maxOffset - yCurrentOffset) > scrollStep) {
                    yCurrentOffset += scrollStep;
                } else {
                    yCurrentOffset = maxOffset;
                    isAnimating = false;
                }
            } else { // Down
                if ((yCurrentOffset - YEAR_ROW_HEIGHT) > scrollStep) {
                    yCurrentOffset -= scrollStep;
                } else {
                    yCurrentOffset = YEAR_ROW_HEIGHT;
                    isAnimating = false;
                }
            }
        };
        render = function () {
            drawYearView(contextYearViewForeground);
        };
        afterAnimation = function () {
        };
        window.requestAnimationFrame(runScrollAnimation);
    }

    // Accordion animation
    var collapsingMonthGridHeight;
    var expandingMonthGridHeight;

    function startYearViewFoldAnimation() {
        var offset = (selectedYear * YEAR_ROW_HEIGHT);
        var frames = TRANSITION_FRAMES_COUNT - 8;
        var diff = offset - yCurrentOffset;
        var dy = Math.round(MONTH_GRID_HEIGHT/frames);

        collapsingMonthGridHeight = MONTH_GRID_HEIGHT;
        expandingMonthGridHeight = 0;
        isAnimating = true;
        updateState = function() {
            var step = Math.round(diff/frames);
            yCurrentOffset += step;
            diff -= step;
            frames--;
            if (frames === 0) {
                expandingMonthGridHeight = MONTH_GRID_HEIGHT;
                collapsingMonthGridHeight = 0;
                isAnimating = false;
            } else {
                expandingMonthGridHeight += dy;
                collapsingMonthGridHeight -= dy;
            }
        };
        render = function () {
            contextYearViewForeground.save();
            contextYearViewForeground.clearRect(0, 0, $canvasYearViewForeground[0].width, $canvasYearViewForeground[0].height);
            drawFoldingYearView(contextYearViewForeground);
            contextYearViewForeground.restore();
        };
        afterAnimation = function() {
            expandedYear = selectedYear;
            selectedYear = null;
            monthGridTop = yCurrentOffset + YEAR_ROW_HEIGHT;
            monthGridBottom = monthGridTop + MONTH_GRID_HEIGHT;
        };

        window.requestAnimationFrame(runScrollAnimation);
    }
    //endregion

    // Canvas
    //region Canvas month view
    function drawMonthView() {
        contextMonthViewBackground.save();
        contextMonthViewForeground.save();
        contextMonthViewBackground.translate(0, -inRowOffset);
        contextMonthViewForeground.translate(0, -inRowOffset);
        contextMonthViewBackground.clearRect(0, 0, $canvasMonthViewBackground[0].width, $canvasMonthViewBackground[0].height);
        contextMonthViewForeground.clearRect(0, 0, $canvasMonthViewForeground[0].width, $canvasMonthViewForeground[0].height);

        var t;
        for (var i = 0; i < 7; i++) {
            for (var j = 0; j < 7; j++) {
                t = new Date(currentTime + (i*7+j)*24*3600000);
                contextMonthViewForeground.fillText(t.getDate(), j * DAY_CELL_WIDTH + DAY_CELL_WIDTH/2, i * ROW_HEIGHT + ROW_HEIGHT/2);
                if (isSameDate(t, today)) {
                    drawTodayCellBorder(i, j);
                }
                if (selectedDay) {
                    if (isSameDate(t, selectedDay)) {
                        drawSelectedDayCellBackground(i, j);
                    }
                }
            }
        }



        contextMonthViewBackground.restore();
        contextMonthViewForeground.restore();
    }

    function drawOutsideDays() {
        var d = new Date(currentMonth);
        var w = d.getDay();
        var n = daysInMonth(currentMonth);
        var r = Math.ceil((d.getDay() + daysInMonth(currentMonth))/7);

        contextMonthViewForeground.save();
        contextMonthViewForeground.fillStyle = COLOR_OUTSIDE_DAY;

        if (w > 0) {
            d.setDate(d.getDate() - 1);
            for (var i=w;i>0;i--, d.setDate(d.getDate()-1)) {
                contextMonthViewForeground.clearRect(DAY_CELL_WIDTH * (i - 1), 0, DAY_CELL_WIDTH, ROW_HEIGHT);
                contextMonthViewForeground.fillText(d.getDate(), (i - 1)* DAY_CELL_WIDTH + DAY_CELL_WIDTH/2, ROW_HEIGHT/2);
            }
        }

        d = new Date(currentMonth);
        d.setMonth(d.getMonth() + 1);
        w = d.getDay();
        y = (r - 1)*ROW_HEIGHT;
        if (w > 0) {
            for (var i=w,j=1;i<=6;i++,j++) {
                contextMonthViewForeground.clearRect(DAY_CELL_WIDTH * i, y, DAY_CELL_WIDTH, ROW_HEIGHT);
                contextMonthViewForeground.fillText(j, i * DAY_CELL_WIDTH + DAY_CELL_WIDTH/2, y + ROW_HEIGHT/2);
            }
        }

        contextMonthViewForeground.restore();
    }

    function drawSelectedDayCellBackground(row, col) {
        contextMonthViewBackground.save();
        contextMonthViewBackground.fillStyle = COLOR_SELECTED_DAY_CELL_BACKGROUND;
        contextMonthViewBackground.fillRect(col * DAY_CELL_WIDTH, row * ROW_HEIGHT, DAY_CELL_WIDTH, ROW_HEIGHT);
        contextMonthViewBackground.restore();
    }

    function drawTodayCellBorder(row, col) {
        contextMonthViewBackground.save();
        contextMonthViewBackground.strokeStyle = COLOR_DAY_CELL_BORDER;
        contextMonthViewBackground.strokeRect(col * DAY_CELL_WIDTH, row * ROW_HEIGHT, DAY_CELL_WIDTH, ROW_HEIGHT);
        contextMonthViewBackground.restore();
    }

    function drawBackground(hoverX, hoverY) {
        contextMonthViewBackground.save();
        contextMonthViewBackground.clearRect(0, 0, $canvasMonthViewBackground[0].width, $canvasMonthViewBackground[0].height);

        // If mouse hover on the month view, then highlight the day cell.
        if (hoverX) {
            var row = Math.floor(hoverY/ROW_HEIGHT);
            var col = Math.floor(hoverX/DAY_CELL_WIDTH);

            contextMonthViewBackground.fillStyle = COLOR_DAY_CELL_BACKGROUND;
            contextMonthViewBackground.fillRect(col*DAY_CELL_WIDTH, row*ROW_HEIGHT, DAY_CELL_WIDTH, ROW_HEIGHT);
        }

        // Draw selected day background
        if (selectedDay && selectedDay >= currentTime && selectedDay <= (currentTime + 6*7*24*3600000)) {
            row = Math.floor((selectedDay - currentTime)/(7*24*3600000));
            col = Math.floor((selectedDay - currentTime)%(7*24*3600000)/(24*3600000));
            drawSelectedDayCellBackground(row, col);
        }

        // Draw today cell border
        if (today >= currentTime &&  today <= (currentTime + 6*7*24*3600000)) {
            row = Math.floor((today - currentTime)/(7*24*3600000));
            col = Math.floor((today - currentTime)%(7*24*3600000)/(24*3600000));
            drawTodayCellBorder(row, col);
        }

        contextMonthViewBackground.restore();
    }

    function drawAfterAnimation() {
        drawOutsideDays();
        drawBackground();
    }
    //endregion

    //region Canvas year view
    function drawYearView(ctx) {
        var dy;
        var index;
        var start;

        ctx.save();
        ctx.clearRect(0, 0, $canvasYearViewForeground[0].width, $canvasYearViewForeground[0].height);

        if (yCurrentOffset >= monthGridBottom) {
            index = Math.floor((yCurrentOffset - MONTH_GRID_HEIGHT) / YEAR_ROW_HEIGHT);
            dy = yCurrentOffset - MONTH_GRID_HEIGHT - index * YEAR_ROW_HEIGHT;
            start = index;
        } else if (yCurrentOffset < monthGridTop) {
            index = Math.floor(yCurrentOffset / YEAR_ROW_HEIGHT);
            dy = yCurrentOffset - index * YEAR_ROW_HEIGHT;
            start = index;
        } else {
            dy = yCurrentOffset - monthGridTop;
            start = expandedYear + 1;
        }

        ctx.translate(0, -dy);

        for (var i = start;i < start + 7;i++) {
            if ((i - 1) === expandedYear && yCurrentOffset < monthGridBottom) {
                drawMonthGrid(ctx);
                ctx.translate(0, MONTH_GRID_HEIGHT);
            }
            drawYearItem(ctx, i);
            ctx.translate(0, YEAR_ROW_HEIGHT);
        }

        ctx.restore();
    }

    function drawYearItem(ctx, year) {
        ctx.save();
        ctx.fillStyle = COLOR_YEAR_VIEW_BACKGROUND;
        ctx.fillRect(0, 0, YEAR_VIEW_SCROLL_CONTAINER_WIDTH, YEAR_ROW_HEIGHT);
        ctx.fillStyle = '#000';
        ctx.fillText(year, 20,  YEAR_ROW_HEIGHT/2);
        ctx.strokeStyle = COLOR_YEAR_BORDER_BOTTOM;
        ctx.beginPath();
        ctx.moveTo(0, YEAR_ROW_HEIGHT);
        ctx.lineTo(YEAR_VIEW_SCROLL_CONTAINER_WIDTH, YEAR_ROW_HEIGHT);
        ctx.stroke();
        ctx.restore();
    }

    function drawMonthGrid(ctx) {
        var months = [
            '一月', '二月', '三月', '四月',
            '五月', '六月', '七月', '八月',
            '九月', '十月', '十一月', '十二月'
        ];
        ctx.save();
        ctx.clearRect(0, 0, YEAR_VIEW_SCROLL_CONTAINER_WIDTH, MONTH_GRID_HEIGHT);
        for (var i=0;i<3;i++) {
            for (var j=0;j<4;j++) {
                ctx.fillStyle = 'black';
                ctx.fillText(months[i*4 + j], j*MONTH_CELL_WIDTH + MONTH_CELL_WIDTH/2, i*MONTH_CELL_HEIGHT + MONTH_CELL_HEIGHT/2);
            }
        }
        ctx.strokeStyle = COLOR_YEAR_BORDER_BOTTOM;
        ctx.beginPath();
        ctx.moveTo(0, MONTH_GRID_HEIGHT);
        ctx.lineTo(YEAR_VIEW_SCROLL_CONTAINER_WIDTH, MONTH_GRID_HEIGHT);
        ctx.stroke();
        ctx.restore();
    }

    function drawMonthGridBackground(ctx, x, y) {
        var ox = Math.floor(x/MONTH_CELL_WIDTH)*MONTH_CELL_WIDTH;
        var oy = (monthGridTop - yCurrentOffset) + Math.floor((y - (monthGridTop - yCurrentOffset))/MONTH_CELL_HEIGHT)*MONTH_CELL_HEIGHT;
        if (oy >= 0 && oy <YEAR_VIEW_SCROLL_CONTAINER_HEIGHT) {
            ctx.clearRect(0, 0, YEAR_VIEW_SCROLL_CONTAINER_WIDTH, YEAR_VIEW_SCROLL_CONTAINER_HEIGHT);
            ctx.fillStyle = COLOR_MONTH_CELL_BACKGROUND;
            ctx.fillRect(ox, oy, MONTH_CELL_WIDTH, MONTH_CELL_HEIGHT);
        }
    }

    function drawFoldingYearView(ctx) {
        var index;
        var diff;

        if (selectedYear < expandedYear) {
            index = Math.floor(yCurrentOffset/YEAR_ROW_HEIGHT);
            diff = yCurrentOffset - index * YEAR_ROW_HEIGHT;
            ctx.translate(0, -diff);
            for (var i=index;i<=selectedYear;i++) {
                drawYearItem(ctx, i);
                ctx.translate(0, YEAR_ROW_HEIGHT);
            }
            drawMonthGrid(ctx);
            ctx.translate(0, expandingMonthGridHeight);
            ctx.clearRect(0, 0, YEAR_VIEW_SCROLL_CONTAINER_WIDTH, MONTH_GRID_HEIGHT - expandingMonthGridHeight);
            for (var i=selectedYear + 1;i<selectedYear + 1 + 5;i++) {
                if ((i-1) === expandedYear) {
                    drawMonthGrid(ctx);
                    ctx.translate(0, collapsingMonthGridHeight);
                    ctx.clearRect(0, 0, YEAR_VIEW_SCROLL_CONTAINER_WIDTH, MONTH_GRID_HEIGHT - collapsingMonthGridHeight);
                }
                drawYearItem(ctx, i);
                ctx.translate(0, YEAR_ROW_HEIGHT);
            }
        } else {
            var collapsingMonthGridTop = (expandedYear + 1) * YEAR_ROW_HEIGHT;
            var collapsingMonthGridBottom = collapsingMonthGridTop + collapsingMonthGridHeight;
            if (yCurrentOffset <= collapsingMonthGridTop) {
                index = Math.floor(yCurrentOffset/YEAR_ROW_HEIGHT);
                diff = yCurrentOffset - index * YEAR_ROW_HEIGHT;
                ctx.translate(0, -diff);
                for (var i=index;i<index+6;i++) {
                    if ((i - 1) === expandedYear) {
                        drawMonthGrid(ctx);
                        ctx.translate(0, collapsingMonthGridHeight);
                        ctx.clearRect(0, 0, YEAR_VIEW_SCROLL_CONTAINER_WIDTH, MONTH_GRID_HEIGHT - collapsingMonthGridHeight);

                    }
                    if ((i - 1) === selectedYear) {
                        drawMonthGrid(ctx);
                        ctx.translate(0, expandingMonthGridHeight);
                        ctx.clearRect(0, 0, YEAR_VIEW_SCROLL_CONTAINER_WIDTH, MONTH_GRID_HEIGHT - expandingMonthGridHeight);
                    }
                    drawYearItem(ctx, i);
                    ctx.translate(0, YEAR_ROW_HEIGHT);
                }
            } else if (yCurrentOffset < collapsingMonthGridBottom) {
                ctx.translate(0, -(collapsingMonthGridHeight - (collapsingMonthGridBottom - yCurrentOffset)));
                drawMonthGrid(ctx);
                ctx.translate(0, collapsingMonthGridHeight);
                ctx.clearRect(0, 0, YEAR_VIEW_SCROLL_CONTAINER_WIDTH, MONTH_GRID_HEIGHT - collapsingMonthGridHeight);
                for (var i=expandedYear + 1;i<expandedYear + 1 + 6;i++) {
                    if ((i-1) === selectedYear) {
                        drawMonthGrid(ctx);
                        ctx.translate(0, expandingMonthGridHeight);
                        ctx.clearRect(0, 0, YEAR_VIEW_SCROLL_CONTAINER_WIDTH, MONTH_GRID_HEIGHT - expandingMonthGridHeight);
                    }
                    drawYearItem(ctx, i);
                    ctx.translate(0, YEAR_ROW_HEIGHT);
                }
            } else {
                index = Math.floor((yCurrentOffset - collapsingMonthGridHeight)/YEAR_ROW_HEIGHT);
                diff = yCurrentOffset - collapsingMonthGridHeight - index*YEAR_ROW_HEIGHT;
                ctx.translate(0, -diff);
                for (var i=index;i<index + 6;i++) {
                    if ((i-1) === selectedYear) {
                        drawMonthGrid(ctx);
                        ctx.translate(0, expandingMonthGridHeight);
                        ctx.clearRect(0, 0, YEAR_VIEW_SCROLL_CONTAINER_WIDTH, MONTH_GRID_HEIGHT - expandingMonthGridHeight)
                    }
                    drawYearItem(ctx, i);
                    ctx.translate(0, YEAR_ROW_HEIGHT);
                }
            }
        }
    }
    //endregion

    //region Dom update
    // Scroll container
    function updateScrollContainerHeight() {
        var dt = new Date(currentMonth);
        $domScrollContainer.height(Math.ceil((dt.getDay() + daysInMonth(dt))/7) * ROW_HEIGHT);
    }
    function updateThumbPosition(dy) {
        $domThumb.css('transform', 'translateY('+dy+'px)');
    }
    // Date label
    DateLabel = {
        year: null,
        month: null,
        toNextMonth: function () {
        },
        toPrevMonth: function () {

        },
        toDate: function (dt) {
            $domDateLabelText.text(this._getDateStr(dt));
        },
        update: function () {
            $domDateLabelText.text(this._getDateStr(currentMonth));
        },
        _getDateStr: function(dt) {
            return new Date(dt).toDateString();
        }
    };
    //endregion

    // Month view
    function setMonthView(dt) {
        currentMonth = toFirstDayOfMonth(dt);
        currentTime = getStartTimeOfMonth(currentMonth);
        currentOffset = getOffset(currentTime);
        DateLabel.toDate(dt);
        updateScrollContainerHeight();
        drawMonthView();
        drawOutsideDays();
    }

    // Year view
    function setYearView(year) {
        expandedYear = year;
        yCurrentOffset = expandedYear * YEAR_ROW_HEIGHT;
        monthGridTop = (expandedYear + 1) * YEAR_ROW_HEIGHT;
        monthGridBottom = monthGridTop + MONTH_GRID_HEIGHT;

        drawYearView(contextYearViewForeground);
    }

    function foregroundMonthView() {
        $domYearView.remove();
        $domMonthView.appendTo('.dp-body');
        $domMask.hide();
    }

    function foregroundYearView() {
        $domMonthView.remove();
        $domYearView.appendTo('.dp-body');
        $domMask.show();
    }

    //region Date input
    var editableElement;
    var inputYear = null;
    var inputMonth = null;
    var inputDay = null;
    var inputNumbers = [];
    var keyboardInput = false;

    function updateDateInput(dt) {
        var d = new Date(dt);
        inputYear = d.getFullYear();
        inputMonth = d.getMonth();
        inputDay = d.getDate();

        $domInputYear.text(inputYear);
        $domInputMonth.text(padMonthOrDay(inputMonth + 1));
        $domInputDay.text(padMonthOrDay(inputDay));

        $domMain.hide();
    }

    function isInputDateValid() {
        return inputYear && inputDay && inputMonth !== null;
    }

    function adjustDayOnYearChange() {
        if (inputDay > 28 && inputMonth === 1 && !isLeapYear(inputYear)) {
            inputDay = 28;
            $domInputDay.text(padMonthOrDay(inputDay));
        }
    }

    function adjustDayOnMonthChange() {
        var m1 = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var m2 = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (inputDay > 28) {
            if (inputYear && isLeapYear(inputYear)) {
                if (m1[inputMonth] < inputDay) {
                    inputDay = m1[inputMonth];
                    $domInputDay.text(padMonthOrDay(inputDay));
                }
            } else {
                if (m2[inputMonth] < inputDay) {
                    inputDay = m2[inputMonth];
                    $domInputDay.text(padMonthOrDay(inputDay));
                }
            }
        }
    }

    function adjustDayOnDayChange() {
        var m1 = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var m2 = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (inputDay === 0) {
            inputDay = 1;
        } else if (inputDay > 31) {
            inputDay = 31;
        }
        if (inputMonth !== null) {
            if (inputYear !== null && isLeapYear(inputYear)) {
                if (m1[inputMonth] < inputDay) {
                    inputDay = m1[inputMonth];
                }
            } else {
                if (m2[inputMonth] < inputDay) {
                    inputDay = m2[inputMonth];
                }
            }
        }
        $domInputDay.text(padMonthOrDay(inputDay));
    }

    function highlightEditableElement(el) {
        if (editableElement === el) {
            return;
        }

        onEditableElementBlur();

        if (editableElement)
            editableElement.removeClass('active');
        editableElement = el;
        editableElement.addClass('active');
    }

    function increaseDate() {
        if (editableElement === $domInputYear) {
            increaseYear();
        } else if (editableElement === $domInputMonth) {
            increaseMonth();
        } else {
            increaseDay();
        }
    }

    function decreaseDate() {
        if (editableElement === $domInputYear) {
            decreaseYear();
        } else if (editableElement === $domInputMonth) {
            decreaseMonth();
        } else {
            decreaseDay();
        }
    }

    function increaseYear() {
        if (inputYear) {
            if (inputYear < MAX_YEAR) {
                inputYear++;
            } else {
                clearTimer();
                clearRepeatedTimer();
            }
        } else {
            inputYear = today[0];
        }
        adjustDayOnYearChange();
        $domInputYear.text(inputYear);
    }

    function decreaseYear() {
        if (inputYear) {
            if (inputYear > MIN_YEAR) {
                inputYear--;
            } else {
                clearTimer();
                clearRepeatedTimer();
            }
        } else {
            inputYear = today[0];
        }
        adjustDayOnYearChange();
        $domInputYear.text(inputYear);
    }

    function increaseMonth() {
        if (inputMonth !== null) {
            inputMonth = (inputMonth + 1)%12;
        } else {
            inputMonth = 0;
        }
        adjustDayOnMonthChange();
        $domInputMonth.text(padMonthOrDay(inputMonth + 1));
    }

    function decreaseMonth() {
        if (inputMonth !== null) {
            inputMonth = (inputMonth - 1 + 12)%12;
        } else {
            inputMonth = 0;
        }
        adjustDayOnMonthChange();
        $domInputMonth.text(padMonthOrDay(inputMonth + 1));
    }

    function increaseDay() {
        if (inputDay) {
            if (inputDay < 28) {
                inputDay += 1;
            } else {
                if (inputMonth !== null) {
                    if (inputMonth === 1) {
                        if (inputYear && isLeapYear(inputYear)) {
                            if (inputDay === 29) {
                                inputDay = 1;
                            } else {
                                inputDay++;
                            }
                        } else {
                            inputDay = 1;
                        }
                    } else {
                        inputDay = inputDay%([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][inputMonth]) + 1;
                    }
                } else {
                    inputDay = inputDay%31 + 1;
                }
            }
        } else {
            inputDay = 1;
        }
        $domInputDay.text(padMonthOrDay(inputDay));
    }

    function decreaseDay() {
        if (inputDay) {
            if (inputDay === 1) {
                if (inputMonth !== null) {
                    if (inputMonth === 1 && inputYear && isLeapYear(inputYear)) {
                        inputDay = 29;
                    } else {
                        var daysCount = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][inputMonth];
                        inputDay = (inputDay - 1 + daysCount)%(daysCount + 1);
                    }
                } else {
                    inputDay = 31;
                }
            } else {
                inputDay--;
            }
        } else {
            inputDay = 1;
        }
        $domInputDay.text(padMonthOrDay(inputDay));
    }

    function onSpinUpBtnDown() {
        if (!editableElement) {
            highlightEditableElement($domInputYear);
        }
        increaseDate();
        setTimer(function() {
            setRepeatedTimer(increaseDate, 32);
        }, 300);
    }

    function onSpinUpBtnUp() {
        clearTimer();
        clearRepeatedTimer();
    }

    function onSpinDownBtnDown() {
        if (!editableElement) {
            highlightEditableElement($domInputYear);
        }
        decreaseDate();
        setTimer(function () {
            setRepeatedTimer(decreaseDate, 32);
        }, 300);
    }

    function onSpinDownBtnUp() {
        clearTimer();
        clearRepeatedTimer();
    }

    function onClickClearBtn() {
        $domInputYear.text('年');
        $domInputMonth.text('月');
        $domInputDay.text('日');

        inputYear = inputMonth = inputDay = null;
    }

    function onClickIndicator() {
        if (isInputDateValid()) {
            selectedDay = parseDateArray([inputYear, inputMonth + 1, inputDay]).getTime();
            setMonthView(selectedDay);
        } else {
            setMonthView(today);
        }
    }

    function onDatePickerBlur() {
        onEditableElementBlur();
        editableElement.removeClass('active');
        editableElement = null;
        $domMain.hide();
    }

    function prevEditableElement() {
        if (editableElement === $domInputMonth) {
            highlightEditableElement($domInputYear);
        } else if (editableElement === $domInputDay) {
            highlightEditableElement($domInputMonth);
        }
    }

    function nextEditableElement() {
        if (editableElement === $domInputMonth) {
            highlightEditableElement($domInputDay);
        } else if (editableElement === $domInputYear) {
            highlightEditableElement($domInputMonth);
        }
    }

    function changeFocusOnTabKeyPress(evt) {
        if (evt.shiftKey) {
            if (editableElement !== $domInputYear) {
                evt.preventDefault();
                evt.stopPropagation();
                prevEditableElement();
            }
        } else {
            if (editableElement !== $domInputDay) {
                evt.preventDefault();
                evt.stopPropagation();
                nextEditableElement();
            }
        }
    }

    function onEditableElementBlur() {
        if (editableElement === $domInputYear) {
            onInputYearBlur();
        } else if (editableElement === $domInputMonth) {
            onInputMonthBlur();
        } else if (editableElement === $domInputDay) {
            onInputDayBlur();
        }
        inputNumbers = [];
    }

    function onInputYearBlur() {
        if (inputYear !== null) {
            if (inputYear > MAX_YEAR) {
                inputYear = MAX_YEAR;
                $domInputYear.text(inputYear);
            } else if (inputYear < MIN_YEAR) {
                inputYear = MIN_YEAR;
                $domInputYear.text(inputYear);
            }
            adjustDayOnYearChange();
        }
    }

    function onInputMonthBlur() {
        if (inputMonth !== null) {
            if (inputMonth > 11) {
                inputMonth = 11;
                $domInputMonth.text(inputMonth);
            } else if (inputMonth < 0) {
                inputMonth = 0;
                $domInputMonth.text(padMonthOrDay(inputMonth + 1));
            }
            adjustDayOnMonthChange();
        }
    }

    function onInputDayBlur() {
        if (inputDay !== null) {
            adjustDayOnDayChange();
        }
    }

    function onInputNumber(n) {
        keyboardInput = true;
        if (editableElement === $domInputYear) {
            inputNumbers.push(n);
            inputYear = parseInt(inputNumbers.join(''));
            $domInputYear.text(inputYear);
            if (inputNumbers.length === 6) {
                nextEditableElement();
            }
        } else if (editableElement === $domInputMonth) {
            inputNumbers.push(n);
            inputMonth = parseInt(inputNumbers.join('')) - 1;
            $domInputMonth.text(padMonthOrDay(inputMonth + 1));
            if ((inputNumbers.length === 1 && n > 1) || inputNumbers.length === 2) {
                nextEditableElement();
            }
        } else if (editableElement === $domInputDay) {
            inputNumbers.push(n);
            inputDay = parseInt(inputNumbers.join(''));
            $domInputDay.text(padMonthOrDay(inputDay));
            if (inputNumbers.length === 2) {
                inputNumbers = [];
                onInputDayBlur();
            }
        }
    }

    function clearEditableElement() {
        if (editableElement === $domInputYear) {
            editableElement.text('年');
            inputYear = null;
        } else if (editableElement === $domInputMonth) {
            editableElement.text('月');
            inputMonth = null;
        } else if (editableElement === $domInputDay) {
            editableElement.text('日');
            inputDay = null;
        }
    }

    function onKeyDown(evt) {
        if (isHidden($domMain[0])) {
            switch (evt.keyCode) {
                case 8:
                    clearEditableElement();
                    break;
                case 9:
                    changeFocusOnTabKeyPress(evt);
                    break;
                case 37:
                    prevEditableElement();
                    break;
                case 38:
                    increaseDate();
                    break;
                case 39:
                    nextEditableElement();
                    break;
                case 40:
                    decreaseDate();
                    break;
                default:
                    if (evt.keyCode >= 48 && evt.keyCode <= 57) {
                        onInputNumber(evt.keyCode - 48);
                    }
            }
        } else {
            switch (evt.keyCode) {
                case 37:
                    break;
                case 38:
                    break;
                case 39:
                    break;
                case 40:
                    break;
                default:
            }
        }

    }

    function initDateInput() {
        $domContainer.empty().append($domInput).append($domMain)
            .focus(function (e) {
                if (!editableElement) {
                    highlightEditableElement($domInputYear);
                }
            })
            .blur(function (e) {
                onDatePickerBlur();
            })
            .on('mousedown', '.dp-input', function (e) {
                $domMain.hide();
            })
            .on('mouseleave', '.dp-spin-up, .dp-spin-down', function (e) {
                clearTimer();
                clearRepeatedTimer();
            })
            .on('mousedown', '.dp-spin-up', function (e) {
                if (keyboardInput) {
                    keyboardInput = false;
                    onEditableElementBlur();
                }
                onSpinUpBtnDown();
            })
            .on('click', '.dp-btn-clear', function (e) {
                if (keyboardInput) {
                    keyboardInput = false;
                    onEditableElementBlur();
                }
                onClickClearBtn();
            })
            .on('mouseup', '.dp-spin-up', function (e) {
                onSpinUpBtnUp();
            })
            .on('mousedown', '.dp-spin-down', function (e) {
                if (keyboardInput) {
                    keyboardInput = false;
                    onEditableElementBlur();
                }
                onSpinDownBtnDown();
            })
            .on('mouseup', '.dp-spin-down', function (e) {
                onSpinDownBtnUp();
            })
            .on('mousedown', '.dp-indicator', function (e) {
                e.stopPropagation();
                if (keyboardInput) {
                    keyboardInput = false;
                    onEditableElementBlur();
                }
                if (isInputDateValid()) {
                    selectedDay = parseDateArray([inputYear, inputMonth + 1, inputDay]);
                    setMonthView(selectedDay);
                } else {
                    selectedDay = null;
                    setMonthView(today);
                }
                foregroundMonthView();
                $domMain.show();
            })
            .on('mousedown', '.dp-input-year, .dp-input-month, .dp-input-day', function(e) {
                e.stopPropagation();
                if ($(this).hasClass('dp-input-year')) {
                    highlightEditableElement($domInputYear);
                } else if ($(this).hasClass('dp-input-month')) {
                    highlightEditableElement($domInputMonth);
                } else {
                    highlightEditableElement($domInputDay);
                }
            })
            .on('keydown', function (e) {
                onKeyDown(e);
            });
    }
    //endregion

    // Options
    var defaults = {
        tabIndex: 155,
    };

    function DatePicker(options) {
        defaults = $.extend(defaults, options);

        today = Date.now();
        currentOffset = getOffset(today);
        $domContainer = $(defaults.container);
        $domMain = $(Templates.panel);
        $domMonthView = $(Templates.monthView);
        $domYearView = $(Templates.yearView);
        $domScrollContainer = $domMonthView.find('.dp-month-scroll-box');
        $domDateLabel = $(Templates.dateLabel);
        $domDateLabelText = $domDateLabel.find('.dp-date-label-txt');
        $domMask = $domMain.find('.dp-mask');
        $domThumb = $domYearView.find('.dp-scroll-thumb');

        $domInput = $(Templates.input);
        $domInputButtonGroup = $(Templates.inputButtonGroup);
        $domInputYear = $domInput.find('.dp-input-year');
        $domInputMonth = $domInput.find('.dp-input-month');
        $domInputDay = $domInput.find('.dp-input-day');
        $domInputSpinUp = $domInput.find('.dp-spin-up');
        $domInputSpinDown = $domInput.find('.dp-spin-down');
        $domInputIndicator = $domInput.find('.dp-indicator');

        $canvasMonthViewBackground = $domMonthView.find('.dp-month-canvas-background');
        $canvasMonthViewForeground = $domMonthView.find('.dp-month-canvas-foreground');
        contextMonthViewBackground = $canvasMonthViewBackground[0].getContext('2d');
        contextMonthViewForeground = $canvasMonthViewForeground[0].getContext('2d');

        $canvasYearViewBackground = $domYearView.find('.dp-year-canvas-background');
        $canvasYearViewForeground = $domYearView.find('.dp-year-canvas-foreground');
        contextYearViewBackground = $canvasYearViewBackground[0].getContext('2d');
        contextYearViewForeground = $canvasYearViewForeground[0].getContext('2d');

        $canvasOffScreen = $(document.createElement('canvas'));
        contextOffScreen = $canvasOffScreen[0].getContext('2d');

        $domMain.find('.dp-body').append($domMonthView);
        $domMain.find('.dp-header').append($domDateLabel).append($(Templates.buttonGroup));

        this.init();
    }

    DatePicker.prototype = {
        init: function () {
            var w = SCROLL_CONTAINER_WIDTH;
            var h = CANVAS_HEIGHT;

            // Prepare month view canvas
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
            contextMonthViewForeground.textBaseline = "middle";

            // Prepare year view canvas
            $canvasYearViewBackground.css({
                width: w + 'px',
                height: h + 'px'
            }).attr({
                width: w * PIXEL_RATIO,
                height: h * PIXEL_RATIO
            });

            $canvasYearViewForeground.css({
                width: w + 'px',
                height: h + 'px'
            }).attr({
                width: w * PIXEL_RATIO,
                height: h * PIXEL_RATIO
            });

            contextYearViewBackground.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
            contextYearViewForeground.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
            contextYearViewForeground.font = 'normal normal normal normal 12px "Helvetica Neue"';
            contextYearViewForeground.textAlign = "center";
            contextYearViewForeground.textBaseline = "middle";

            // Prepare off-screen canvas
            $canvasOffScreen.css({
                width: w + 'px',
                height: h*2 + 'px'
            }).attr({
                width: w * PIXEL_RATIO,
                height: h*2 * PIXEL_RATIO
            });

            contextOffScreen.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
            contextOffScreen.font = 'normal normal normal normal 12px "Helvetica Neue"';
            contextOffScreen.textAlign = "center";
            contextOffScreen.textBaseline = "middle";

            this._fillWeeksTitle();
            setMonthView(today);
            $domContainer.addClass('dp-container').attr('tabindex', defaults.tabIndex);

            $domInputButtonGroup.appendTo($domInput.find('.dp-input-inner-wrapper'));
            initDateInput();
            initTimeInput();
        },
        onBtnPrevMonthDown: function () {
            setTimer(startMonthViewScrollDown, BEGIN_CONTINUOUS_SCROLLING_DELAY);
        },
        onBtnPrevMonthUp: function () {
            clearTimer();
            if (!isWaitingForStop) {
                scrollToPrevMonth();

                DateLabel.update();
                updateScrollContainerHeight();
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
                scrollToNextMonth();

                DateLabel.update();
                updateScrollContainerHeight();
            } else {
                stopMonthViewScroll();
            }
        },
        onClickBtnToday: function (e) {
            selectedDay = today;
            setMonthView(today);

            updateDateInput(today);
        },
        _fillWeeksTitle: function () {
            $domMonthView.find('.dp-weeks-title').append($(Templates.weeksTitle));
        }
    };

    function initTimeInput() {

    }

    function getDateArray(dt) {
        return [
            dt.getFullYear(),
            dt.getMonth(),
            dt.getDate()
        ];
    }

    function getCordsOfDate(dt) {
        var i = MonthsData[dt[0]*12 - MonthsData[0][0]*12 + dt[1]][3];
        var wk = WeeksData[i];
        return {
            i: i + Math.ceil((wk.indexOf(1) + dt[2])/7) - 1,
            row: Math.ceil((wk.indexOf(1) + dt[2])/7) - 1,
            col: (wk.indexOf(1) + dt[2] - 1)%7
        }
    }

    function isSameDate(dt1, dt2) {
        var d1 = new Date(dt1);
        var d2 = new Date(dt2);

        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    // Get a months's offset in MonthsData by its index.
    function getOffset(time) {
        return ROW_HEIGHT * Math.floor((time - MIN_TIME)/(24*7*3600000));
    }

    function getTimeFromOffset(offset) {
        return MIN_TIME + Math.floor(offset/ROW_HEIGHT)*(24*7*3600000);
    }

    // Set a new stop offset for scroll animation.
    function calcNewStopOffset() {
        stopOffset = getOffset(currentMonth);
    }

    function nextMonthIndex() {
        var d = new Date(currentMonth);
        d.setMonth(d.getMonth() + 1);
        currentMonth = d.getTime();
    }

    function prevMonthIndex() {
        var d = new Date(currentMonth);
        d.setMonth(d.getMonth() - 1);
        currentMonth = d.getTime();
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

    var repeatedTimer = null;
    function setRepeatedTimer(cbk, period) {
        repeatedTimer = setInterval(cbk, period);
    }
    function clearRepeatedTimer() {
        clearInterval(repeatedTimer);
    }

    function padMonthOrDay(n) {
        return n < 10?'0'+n:n;
    }

    function isHidden(el) {
        return el.offsetParent === null;
    }

    function daysInMonth(dt) {
        var m1 = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var m2 = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var date = new Date(dt);
        if (isLeapYear(date.getFullYear())) {
            return m1[date.getMonth()];
        } else {
            return m2[date.getMonth()];
        }
    }

    function getStartTimeOfMonth(dt) {
        var d = new Date(dt);
        d.setDate(1);
        return d.getTime() - d.getDay() * 24 * 3600000;
    }

    function toFirstDayOfMonth(dt) {
        var d = new Date(dt);
        d.setDate(1);
        d.setHours(0);
        d.setMinutes(0);
        d.setSeconds(0);
        d.setMilliseconds(0);
        return d.getTime();
    }

    function parseDateArray(ar) {
        var d = new Date(0);
        d.setFullYear(ar[0]);
        d.setMonth(ar[1] - 1);
        d.setDate(ar[2]);
        return d.getTime();
    }

    var whichNavBtnDown = null;
    var isMouseDownOnThumb = false;
    var oThumbOffset;
    var oy = 0;
    var dy = 0;

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
                whichNavBtnDown = null;
            }
        })
        .on('mouseup', '.dp-btn-next', function (e) {
            if (whichNavBtnDown === 'next') {
                DatePicker.prototype.onBtnNextMonthUp();
                whichNavBtnDown = null;
            }
        })
        .on('mouseleave', '.dp-btn-next,.dp-btn-prev', function (e) {

        })
        .on('mouseup', function (e) {
            if (whichNavBtnDown === 'prev') {
                DatePicker.prototype.onBtnPrevMonthUp();
                whichNavBtnDown = null;
            } else if (whichNavBtnDown === 'next') {
                DatePicker.prototype.onBtnNextMonthUp();
                whichNavBtnDown = null;
            }
        })
        .on('mousemove', '.dp-month-scroll-box', function (e) {
            drawBackground(e.offsetX, e.offsetY);
        })
        .on('click', '.dp-btn-curr', function (e) {
            DatePicker.prototype.onClickBtnToday(e);
        })
        .on('click', '.dp-date-label', function (e) {
            foregroundYearView();
            setYearView(new Date(currentMonth).getFullYear());
        })
        .on('click', '.dp-year-scroll-box', function (e) {
            var y = (e.offsetY + yCurrentOffset);
            if (y > monthGridTop && y < monthGridBottom) { // Select a month
                setMonthView(parseDateArray([
                    expandedYear,
                    Math.floor((y - monthGridTop)/MONTH_CELL_HEIGHT)*4 + Math.floor(e.offsetX/MONTH_CELL_WIDTH) + 1,
                    1
                ]));
                foregroundMonthView();
            } else { // Expand a year
                if (y <= monthGridTop) {
                    selectedYear = Math.floor(y/YEAR_ROW_HEIGHT);
                } else {
                    selectedYear = Math.floor((y - MONTH_GRID_HEIGHT)/YEAR_ROW_HEIGHT);
                }
                if (selectedYear !== expandedYear) {
                    startYearViewFoldAnimation();
                }
            }
        })
        .on('click', '.dp-month-scroll-box', function (e) {
            var row = Math.floor(e.offsetY/ROW_HEIGHT);
            var col = Math.floor(e.offsetX/DAY_CELL_WIDTH);
            var dt = currentTime + row * 24 * 7 * 3600000 + col * 24 * 3600000;
            var d = new Date(dt);

            if (row === 0 && d.getDate() > 7) {
                scrollToPrevMonth();
            } else if (row > 2 && d.getDate() < 7) {
                scrollToNextMonth();
            }
            DateLabel.update();
            updateScrollContainerHeight();
            selectedDay = dt;
            drawBackground();
            updateDateInput(selectedDay);
        })
        .on('click', '.dp-mask', function (e) {
            foregroundMonthView();
        })
        .on('mousedown', '.dp-scroll-bar', function (e) {
            isMouseDownOnThumb = true;
            oy = e.screenY;
            if (e.target === $domThumb[0]) {
                e.offsetY = e.offsetY + (YEAR_VIEW_SCROLL_CONTAINER_HEIGHT - THUMB_HEIGHT)/2;
            }
            oThumbOffset = e.offsetY - YEAR_VIEW_SCROLL_CONTAINER_HEIGHT/2;
            if (Math.abs(oThumbOffset) > ((YEAR_VIEW_SCROLL_CONTAINER_HEIGHT - THUMB_HEIGHT)/2)) {
                scrollStep = MAX_SCROLL_STEP;
                updateThumbPosition(Math.sign(oThumbOffset)*(YEAR_VIEW_SCROLL_CONTAINER_HEIGHT - THUMB_HEIGHT)/2)
            } else {
                scrollStep = Math.round(Math.abs(oThumbOffset)/((YEAR_VIEW_SCROLL_CONTAINER_HEIGHT - THUMB_HEIGHT)/2/MAX_SCROLL_STEP));
                updateThumbPosition(oThumbOffset);
            }
            yScrollDirection = Math.sign(oThumbOffset);
            startYearViewScroll();
        })
        .on('mouseup', function (e) {
            if (isMouseDownOnThumb) {
                isMouseDownOnThumb = false;
                isAnimating = false;
                $domThumb.css('transform', 'none');
            }
        })
        .on('mousemove', function (e) {
            var thumbOffset;
            if (isMouseDownOnThumb) {
                dy = e.screenY - oy;
                thumbOffset = oThumbOffset + dy;
                yScrollDirection = thumbOffset >= 0 ? 1 : -1;
                if (YEAR_VIEW_SCROLL_CONTAINER_HEIGHT / 2 < Math.abs(thumbOffset)) {
                    thumbOffset -= thumbOffset % (YEAR_VIEW_SCROLL_CONTAINER_HEIGHT / 2);
                }
                if (Math.abs(thumbOffset) > (YEAR_VIEW_SCROLL_CONTAINER_HEIGHT / 2 - THUMB_HEIGHT/2)) {
                    scrollStep = MAX_SCROLL_STEP;
                    updateThumbPosition(thumbOffset -= thumbOffset % ((YEAR_VIEW_SCROLL_CONTAINER_HEIGHT - THUMB_HEIGHT) / 2));
                } else {
                    scrollStep = Math.round(Math.abs(thumbOffset)/((YEAR_VIEW_SCROLL_CONTAINER_HEIGHT - THUMB_HEIGHT)/2/MAX_SCROLL_STEP));
                    updateThumbPosition(thumbOffset);
                }
                if (!isAnimating) {
                    startYearViewScroll();
                }
            }
        })
        .on('mousemove', '.dp-year-scroll-box', function (e) {
            drawMonthGridBackground(contextYearViewBackground, e.offsetX, e.offsetY);
        });

    Templates = {
        panel: '<div class="dp-calendar">' +
        '<div class="dp-mask"></div>' +
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
        '<div class="dp-year-scroll-box">' +
        '<canvas class="dp-year-canvas-background"></canvas>' +
        '<canvas class="dp-year-canvas-foreground"></canvas>' +
        '</div>' +
        '<div class="dp-scroll-bar">' +
        '<div class="dp-scroll-thumb"></div>' +
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
        '</div>',
        weeksTitle: '<div class="dp-week-day">周日</div>' +
        '<div class="dp-week-day">周一</div>' +
        '<div class="dp-week-day">周二</div>' +
        '<div class="dp-week-day">周三</div>' +
        '<div class="dp-week-day">周四</div>' +
        '<div class="dp-week-day">周五</div>' +
        '<div class="dp-week-day">周六</div>',
        input: '<div class="dp-input">' +
        '<div class="dp-input-inner-wrapper">' +
        '<div class="dp-input-text">' +
        '<div class="dp-input-year">年</div><div class="dp-input-slash">/</div>' +
        '<div class="dp-input-month">月</div><div class="dp-input-slash">/</div>' +
        '<div class="dp-input-day">日</div>' +
        '</div>' +
        '</div>' +
        '</div>',
        inputButtonGroup: '<div class="dp-input-btn-group">' +
        '<div class="dp-btn-clear"></div>' +
        '<div class="dp-input-spin">' +
        '<div class="dp-spin-up"></div>' +
        '<div class="dp-spin-down"></div></div>' +
        '<div class="dp-indicator"></div>' +
        '</div>'
    };

    $.fn.DatePicker = function(opts) {
        // try {
            if (!opts) opts = {};
            opts.container = this;
            new DatePicker(opts);
        // } catch (e) {
        //     console.error('There is something wrong with the options.');
        // }
    }
})($);
