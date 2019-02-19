
var sliderStates = {};
var sliderContainers = {};

var buttonWidth = 30;

function getSliderState(slider)
{
  var key = slider.attr('id');
  return sliderStates[key];
}

function setSliderContainer(key, container)
{
  sliderContainers[key] = container;
}

function setSliderState(slider, value)
{
  var key = slider.attr('id');
  sliderStates[key]= value;
  var container = slider.parents(".Item");
  var button = slider.children("button");
  var p;
  if (value)
  {
    p = slider.offset().left;
    if (container)
    {
      container.removeClass("disabled");
    }
    var y = button.offset().top;
    p = slider.offset().left + 1;
    button.offset({top:y, left:p});
  }
  else
  {
    p = slider.offset().left +1 + slider.innerWidth() - buttonWidth;
    if (container)
    {
      container.addClass("disabled");
    }
    var y = button.offset().top;
    button.offset({top:y, left:p});
  }
}
function createSlider(parentElement, name, enabled)
{
  var sliderNode = $("<span/>").addClass("Slider");
  var buttonNode = $("<button/>").width(buttonWidth).height(25).attr('id',name + "SliderKnob");
  buttonNode.slider = sliderNode;
  buttonNode.appendTo(sliderNode);
  sliderNode.name = name;
  sliderNode.button = buttonNode;
  sliderNode.state = true;
  sliderNode.container = null;
  sliderNode.attr('id',  name + "Slider");
  jQuery.data(sliderNode, "container", null);
  sliderNode.setState = function(slider, value)
    {
      var p;
      if (value)
      {
        p = 0;
        slider.state = true;
        if (sliderNode.container)
        {
          sliderNode.container.classList.remove("disabled");
        }
      }
      else
      {
        p = slider.clientWidth - slider.button.offsetWidth;
        slider.state = false;
        if (sliderNode.container)
        {
          sliderNode.container.classList.add("disabled");
        }
      }
      var y = slider.button.offset().top;
      slider.button.offset(p, y);
    }
  parentElement.appendChild(sliderNode.get(0));
  sliderNode.mousedown(sliderPanelClick);
  buttonNode.onpointerdown = sliderMouseDown;
  buttonNode.onpointermove = sliderMouseMove;
  buttonNode.onpointerup = sliderMouseUp;
  buttonNode.onpointerleave = sliderMouseLeave;
 // buttonNode.addEventListener('touchstart', sliderTouchstart);
 // buttonNode.addEventListener('touchmove', sliderTouchmove);
 // buttonNode.addEventListener('touchend', sliderTouchend);
  setSliderState(sliderNode, enabled);
  return sliderNode;
}
   
function getSliderPos(ev)
{
   var targ = ev.currentTarget;
   var offset = $("#" + targ.id).offset();
   console.log("clientX = " + ev.clientX + " offset = " + offset.left);
   return ev.clientX - offset.left;
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
  targ.startOffset = getSliderPos(ev);
}
function sliderTouchstart(ev)
{
  ev = ev || window.event;
  var targ;
  targ = ev.target;
  ev.preventDefault();
  var touch = ev.changedTouches.item(0);
  targ.isDown = true;
  targ.startOffset = getSliderPos(ev);
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
  var offset = getSliderPos(ev) - targ.startOffset;
  offset = sliderBoundOffset(targ.parentNode, offset);
  console.log("setPosition to " + offset+ " from " + targ.startOffset);
  targ.style.left = (offset).toString()  + "px";
  }



 function sliderPanelClick(ev)
 {
   ev = ev || window.event;
   var targ = $(this);
   var offset = getSliderPos(ev);
   if (offset >  2*targ.clientWidth /3)
   {
      setSliderState(targ, false);
   }
   else if (offset <  targ.clientWidth /3)
   {
      setSliderState(targ, true);
   }
   else
   {
      setSliderState(targ, !getSliderState(targ));
   }
 }
