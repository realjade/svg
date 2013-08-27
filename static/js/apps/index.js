$(function(){
	var map = new BMap.Map("map");    
	var point = new BMap.Point(116.404, 39.915);
	map.centerAndZoom(point, 15);  // 编写自定义函数，创建标注
	/*function myFun(result){
		tools.log(result);
	    var cityName = result.name;
	    map.setCenter(cityName);
	}
	var myCity = new BMap.LocalCity();
	myCity.get(myFun);
	var listener1 = BMapLib.EventWrapper.addListener(map, 'click', function(e){
	    showEvent(e);
	});
	var eventList = $('#event-list');
	function showEvent (event){
	    var newLine = '';
	    if (!event) { // 手动触发的事件可能没有事件参数，注意需要判断
	        newLine = '手动触发了一个事件';
	    } else { // 注意即使有event对象，但不保证type和target属性都包含，手动触发的事件参数内容是自定义的
	        newLine = event.type + ' event from ' + event.target;
	    }
	    eventList.html(newLine + '<br />' + eventList.html());
	}
	map.centerAndZoom(point, 15);*/
	var polyline = new BMap.Polyline([
	  new BMap.Point(116.399, 39.910),
	  new BMap.Point(116.405, 39.920),
	  new BMap.Point(116.425, 39.900)
	], {strokeColor:"blue", strokeWeight:6, strokeOpacity:0.5});
	map.addOverlay(polyline);
	var listener1 = BMapLib.EventWrapper.addListener(polyline, 'mouseover', function(e){
	    tools.log(e);
	});
});