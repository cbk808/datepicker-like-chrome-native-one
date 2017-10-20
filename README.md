
## Introduction
Simple simulation of the native datepicker in the webkit browser, and it is still lack some of features, in-complete functions etc. But it avoid an bug on the end of the scroll animation and adjust to the correct day when meet the leap year.
## Version 
0.0.1
## Requirements
- *browser* with webkit core <br/>
- *zepto* library
## Usage
```javascript
var dp = $('#container').DatePicker();
// get 
var dt = dp.val();
// set 
dp.val('10/2/2017'); // receive an argument format same as native Date.
```