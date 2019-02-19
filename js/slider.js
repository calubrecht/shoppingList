
var sliderStates = {};
var sliderContainers = {};

var buttonWidth = 30;

var activeSlider = null;
var activeSliderOrigin = 0;

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
  buttonNode.mousedown(sliderMouseDown);
  buttonNode.on("touchstart", sliderMouseDown);
  setSliderState(sliderNode, enabled);
  return sliderNode;
}
   
function getSliderPos(ev, targ)
{
   var evPos = ev.type.startsWith("touch") ? ev.changedTouches.item(0).pageX : ev.clientX;
   var offset = targ.offset();
   return evPos - offset.left;
}

function sliderMouseDown(ev){
  ev = ev || window.event;
  var targ = $(this);
  activeSlider = targ;
  activeSliderOrigin = getSliderPos(ev, targ);
  $(body).on("mousemove.slider", sliderMouseMove);
  $(body).on("mouseup.slider", sliderMouseUp);
  $(body).on("touchmove.slider", sliderMouseMove);
  $(body).on("touchend.slider", sliderMouseUp);
  $(body).on("touchcancel.slider", sliderMouseUp);
  return false;
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
  var targ = activeSlider
  if (!targ)
  {
    return;
  }
  var slider = targ.parent();
  activeSlider = null;
  activeSliderOrigin = 0;
  $(body).off("mousemove.slider");
  $(body).off("mouseup.slider");
  $(body).off("touchmove.slider");
  $(body).off("touchup.slider");
  $(body).off("touchcancel.slider");
  var offset = targ.offset().left - slider.offset().left;
  if (offset > (slider.innerWidth() - buttonWidth) /2)
  {
    setSliderState(slider, false);
  }
  else
  {
    setSliderState(slider, true);
  }
  return false;
}

function sliderBoundOffset(slider, button, offset)
{
  var maxOffset =slider.innerWidth() - buttonWidth;
  offset = offset < 0 ? 0 : (offset > maxOffset ? maxOffset : offset) ;
  return offset;
}

function sliderMouseMove(ev){
  ev = ev || window.event;
  var targ = activeSlider;
  if (!targ)
  {
    return;
  }
  var slider = targ.parent();
  var offset = getSliderPos(ev, slider) - activeSliderOrigin;
  offset = sliderBoundOffset(slider, targ, offset);
  var p = slider.offset().left + offset + 1;
  var y = targ.offset().top;
  targ.offset({top:y, left:p});
  return false;
}



 function sliderPanelClick(ev)
 {
   ev = ev || window.event;
   var targ = $(this);
   var offset = getSliderPos(ev, targ);
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
