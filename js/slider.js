
function createSlider(parentElement, name)
{
  var sliderNode = document.createElement("span");
  sliderNode.className = "Slider";
  var buttonNode = document.createElement("Button");
  buttonNode.style.width="30px";
  buttonNode.style.height="25px";
  sliderNode.button = buttonNode;
  sliderNode.state = true;
  sliderNode.setState = function(slider, value)
    {
      var p;
      if (value)
      {
        p = 0;
        slider.state = true;
      }
      else
      {
        p = slider.clientWidth - slider.button.offsetWidth;
        slider.state = false;
      }
      slider.button.style.position="absolute";
      slider.button.style.left = '' + p + 'px';
    }
  sliderNode.appendChild(buttonNode);
  parentElement.appendChild(sliderNode);
  sliderNode.onmousedown = sliderPanelClick;
}


function sliderMouseDown(ev){
  ev = ev || window.event;
  if (ev.button != 0)
  {
    return;
  }
  var targ;
  targ = ev.target;
  targ.isDown = true;
  if (typeof targ.setCapture == "function")
  {
    targ.setCapture(true);
  }
  targ.startOffset = ev.offsetX;
}
function sliderTouchstart(ev)
{
  ev = ev || window.event;
  var targ;
  targ = ev.target;
  ev.preventDefault();
  var touch = ev.changedTouches.item(0);
  targ.isDown = true;
  targ.startOffset = touch.pageX - targ.offsetLeft;
}
function sliderTouchend(ev)
{
  ev = ev || window.event;
  var targ;
  targ = ev.target;
  if (targ.isDown)
  {
    ev.preventDefault();
    targ.isDown = false;
    targ.isDown = true;
    if (targ.offsetLeft > (targ.parentNode.clientWidth - targ.offsetWidth) /2)
    {
      targ.setState(targ.slider, false)
    }
    else
    {
      targ.setState(targ.slider, true)
    }
  }
}

function sliderTouchmove(ev){
  ev = ev || window.event;
  var targ;
  targ = ev.srcElement;
  if (!targ.isDown)
  {
    return;
  }
  ev.preventDefault();
  var touch = ev.changedTouches.item(0);

  targ.style.left = (touch.pageX - targ.parentNode.offsetLeft - targ.startOffset).toString()  + "px";
} 
function sliderMouseLeave(ev)
{
  ev = ev || window.event;
  var targ;
  targ = ev.srcElement;
  if (typeof targ.setCapture != "function")
  {
    sliderMouseUp(ev);
  }
}

function sliderSetState(slider, state)
{
  slider.state = state;
  if (state)
  {
  }
}

function sliderMouseUp(ev){
  ev = ev || window.event;
  var targ;
  targ = ev.target;
  if (targ.isDown)
  {
    targ.isDown = false;
    if (typeof targ.releaseCapture == "function")
    {
      targ.releaseCapture();
    }
    if (targ.offsetLeft > (targ.parentNode.clientWidth - targ.offsetWidth) /2)
    {
      targ.setState(targ.slider, false)
    }
    else
    {
      targ.setState(targ.slider, true)
    }
  }}
function sliderMouseMove(ev){
  ev = ev || window.event;
  var targ;
  targ = ev.srcElement;
  if (!targ.isDown)
  {
    return;
  }
  targ.style.left = (ev.clientX - targ.parentNode.offsetLeft - targ.startOffset).toString()  + "px";
  }
 function sliderPanelClick(ev)
 {
   ev = ev || window.event;
   var targ = ev.currentTarget;
   if (ev.clientX - targ.offsetLeft >  2*targ.clientWidth /3)
   {
      targ.setState(targ, false);
   }
   else if (ev.clientX - targ.offsetLeft <  targ.clientWidth /3)
   {
      targ.setState(targ, true);
   }
   else
   {
      targ.setState(targ, !targ.state);
   }
 }
