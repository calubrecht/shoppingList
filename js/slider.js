
function createSlider(parentElement, name)
{
  var sliderNode = document.createElement("span");
  sliderNode.className = "Slider";
  var buttonNode = document.createElement("Button");
  buttonNode.style.width="30px";
  buttonNode.slider = sliderNode;
  sliderNode.name = name;
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
  sliderNode.onpointerdown = sliderPanelClick;
  buttonNode.onpointerdown = sliderMouseDown;
  buttonNode.onpointermove = sliderMouseMove;
  buttonNode.onpointerup = sliderMouseUp;
  buttonNode.onpointerleave = sliderMouseLeave;
  buttonNode.addEventListener('touchstart', sliderTouchstart);
  buttonNode.addEventListener('touchmove', sliderTouchmove);
  buttonNode.addEventListener('touchend', sliderTouchend);
}


function sliderMouseDown(ev){
  ev = ev || window.event;
  if (ev.button != 0)
  {
    return;
  }
  if (ev.pointerType == "touch")
  {
    return;
  }
  var targ;
  targ = ev.target;
  targ.isDown = true;
  if (typeof targ.setPointerCapture == "function")
  {
    targ.setPointerCapture(ev.pointerId);
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
      targ.parentNode.setState(targ.parentNode, false)
    }
    else
    {
      targ.parentNode.setState(targ.parentNode, true)
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

  var offset = (touch.pageX - targ.startOffset);
  offset = sliderBoundOffset(targ.parentNode, offset);
  targ.style.left = (offset).toString()  + "px";
} 
function sliderMouseLeave(ev)
{
  ev = ev || window.event;
  if (ev.pointerType == "touch")
  {
    return;
  }
  var targ;
  targ = ev.srcElement;
  if (typeof targ.setPointerCapture != "function")
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
  if (ev.pointerType == "touch")
  {
    return;
  }
  if (targ.isDown)
  {
    targ.isDown = false;
    if (typeof targ.releasePointerCapture == "function")
    {
      targ.releasePointerCapture(ev.pointerId);
    }
    if (targ.offsetLeft > (targ.parentNode.clientWidth - targ.offsetWidth) /2)
    {
      targ.parentNode.setState(targ.parentNode, false)
    }
    else
    {
      targ.parentNode.setState(targ.parentNode, true)
    }
  }}

function sliderBoundOffset(slider, offset)
{
  var maxOffset =  slider.clientWidth - slider.button.offsetWidth;
  offset = offset < 0 ? 0 : (offset > maxOffset ? maxOffset : offset) ;
  return offset;
}

function sliderMouseMove(ev){
  ev = ev || window.event;
  var targ;
  targ = ev.srcElement;
  if (ev.pointerType == "touch")
  {
    return;
  }
  if (!targ.isDown)
  {
    return;
  }
  var offset = (ev.clientX - targ.parentNode.offsetLeft - targ.startOffset);
  offset = sliderBoundOffset(targ.parentNode, offset);
  targ.style.left = (offset).toString()  + "px";
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


function createLabeledSlider(parentElement, label, name)
{
  var sliderNode = document.createElement("div");
  sliderNode.className = "LabeledSlider";
  var textNode = document.createElement("span");
  textNode.innerText = label;
  textNode.className = "SliderLabel"
  sliderNode.appendChild(textNode);
  createSlider(sliderNode, name);
  parentElement.appendChild(sliderNode);
}
