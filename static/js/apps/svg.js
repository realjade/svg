$(function(){
	$.fn.preview = function(loadUrl,options) {
		var self = $(this),
			preview;
		init();
		function init(){
			self.options={
				loadUrl:'',
				type:''||(options&&options.type)||getType(loadUrl),
				callback:jQuery.noop
			};
			jQuery.extend(self.options, options);
			preview = self['preview_'+self.options.type](loadUrl,self.options);
		}
		function getType(fileName){
			return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
		}
		return preview;
	};
	$.fn.preview_svg = function(loadUrl,options){
		svgObj = null;
		var self = $(this),
			svgRoot,
			toolPanel,//操作面板
			canvasPanel,//预览面板
			propPanel,//属性面板
			fontSize = 24,//字体设置大小,主要解决chrome下12px显示问题
			width,//宽度
			height,//高度
			scale = 1,//缩放比例
			startX,//开始X坐标
			startY,//开始Y坐标
			endX,//结束X坐标
			endY,//结束Y坐标
			moveTimer,//移动计时器
			moveTimerDelta = 100,//移动时每隔500ms处理一次
			left = 0,//SVG左边距离
			top = 0,//SVG上面距离
			state, //状态标示
			NONE = 0,//无状态
			PAN = 1,//平移
			ZOOMIN = 2,//放大
			ZOOMOUT = 3 //缩小;
		init();
		function init(){
			self.options={
				loadUrl:'',
				type:'',
				callback:jQuery.noop
			};
			jQuery.extend(self.options, options);
			canvasPanel = $('<div class="svg-canvas"></div>');
			canvasPanel.appendTo(self);
			optPanel = $('<div class="svg-tool"></div>');
			optPanel.appendTo(self);
			propPanel = $('<div class="svg-prop"></div>');
			propPanel.appendTo(self);
			self.css({position:'relative',overflow:'hidden'});
			canvasPanel.svg({onLoad: loaded,loadURL: loadUrl});
		}
		function loaded(svg){
			svgObj = svg;
			svgRoot = $(svg.root());
			changeTextSize();
			initViewBox();
			bindEvent();
			tools.log($('#text'));
			//svg.configure({viewBox: '100, 0, 300, 200'});
			//var opt = 'svg:ViewBox'; 
		    //var parts = opt.split(':');
		    //var params = {}; 
		    //params['svg' + parts[1]] = values[opt][1];
		}
		function initViewBox(){
			var w = canvasPanel.width(),
				h = canvasPanel.height();
			width = w;
			height = h;
			svgObj.configure({viewBox: '0, 0, '+w+', '+h});
		}
		//改变字体大小,解决chrome下12px以下字体显示问题。做一次字体设置和大小变换
		function changeTextSize(){
			$('text',svgRoot).each(function(){
				var text = $(this),
					size = text.attr('font-size'),
					trans = text.attr('transform').split('(')[1].split(')')[0].split(' '),
					ctm = svgRoot[0].createSVGMatrix();
				ctm.a = trans[0];
				ctm.b = trans[1];
				ctm.c = trans[2];
				ctm.d = trans[3];
				ctm.e = trans[4];
				ctm.f = trans[5];
				var s = size/fontSize;
				var k = svgRoot[0].createSVGMatrix().scale(s);
				var matrix = ctm.multiply(k);
				var t = "matrix(" + matrix.a + "," + matrix.b + "," + matrix.c + "," + matrix.d + "," + matrix.e + "," + matrix.f + ")";
                text.attr("transform", t);
                text.attr('font-size',fontSize);
			});
		}
		function bindEvent(){
			//窗口改变后自动改变大小
			$(window).resize(initViewBox);
			svgRoot.bind('click', svgClick);
			$('g',svgRoot).bind('mouseover', svgOver).bind('mouseout', svgOut);
			svgRoot.bind('mousedown',svgMouseDown).bind('mouseup',svgMouseUp).bind('mousemove',svgMouseMove);
				   //.bind('mouseover', svgOver).bind('mouseout', svgOut)
		    //$(svg._svg).animate(params, 2000); 
			//tools.log(svg);
			//$('svg').svgPan('tt');
			self.mousewheel(function(event, delta, deltaX, deltaY) {
				if(delta > 0){
					zoomIn();
				}else{
					zoomOut();
				}
                return false; // prevent default
            });
		}
		function getEventPoint(event){
			return {x:event.offsetX || event.pageX,y:event.offsetY || event.pageY};
		}
		//鼠标点击
		function svgClick(event){
			tools.log('mouseclick');
			tools.log(event);
			tools.log(event.target);

		}
		//鼠标按下
		function svgMouseDown(event){
			var point = getEventPoint(event);
			startX = point.x;
			startY = point.y;
			tools.log('start:'+startX+','+startY);
			state = PAN;
		}
		//鼠标向上
		function svgMouseUp(event){
			state = NONE;
		}
		//鼠标移动
		function svgMouseMove(event){
			if(state != PAN) return false;
			var now = Date.now();
			if(moveTimer && (now - moveTimer) < moveTimerDelta) return false;
			moveTimer = now;
			var point = getEventPoint(event);
			endX = point.x;
			endY = point.y;
			tools.log('end:'+endX+','+endY);
			deltaX = endX - startX;
			deltaY = endY - startY;
			tools.log(deltaX+','+deltaY);
			left += deltaX;
			top += deltaY;
			if(left >= 0){
				left = 0;
			}
			if(top >= 0){
				top = 0;
			}
			tools.log('left:'+left);
			svgRoot.css('left',left);
			svgRoot.css('top',top);
		}
		//鼠标经过
		function svgOver(event){
			tools.log(this);
			tools.log('mouseover');
			tools.log(event);
		}
		//鼠标移开
		function svgOut(event){
			tools.log('mouseout');
			tools.log(event);
		}
		//状态管理
		function stateManger(){

		}
		//放大
		function zoomIn(){
			scale += 1;
			svgObj.configure({width:width*scale,height:height*scale});
		}
		//缩小
		function zoomOut(){
			if(scale <=1 ){
				scale = 1;
				return false;
			}
			scale -= 1;
			svgObj.configure({width:width*scale,height:height*scale});
		}
		//平移
		function pan(delta){

		}
		return self;
	};
	$('#svg').preview('/static/svg/erul4egd.svg');
	//$('#svg').preview('/static/svg/linear.svg');
	/**$('#svg').svg({onLoad: loaded,loadURL: '/static/svg/linear.svg'});
	var values = {};
	values['svg:ViewBox'] = ['0, 0, 600, 350', '150, 87, 300, 175'];
	function loaded(svg){
		tools.log(svg);
		//svg.configure({viewBox: '100, 0, 300, 200'});
		var opt = 'svg:ViewBox'; 
	    var parts = opt.split(':'); 
	    var params = {}; 
	    params['svg' + parts[1]] = values[opt][1];
	    $(svg.root()).bind('click', svgClicked);//. bind('mouseover', svgOver).bind('mouseout', svgOut);
	    //$(svg._svg).animate(params, 2000); 
		//tools.log(svg);
		//$('svg').svgPan('s1');
	}
	function svgClicked(event){
		tools.log(event);
		tools.log(event.target);
		alert('svgClicked');
	}
	function svgOver(){
		alert('svgOver');
	}
	function svgOut(){
		alert('svgOut');
	}**/
	
});
/**$(function(){
	jQuery(document).ready(function(){
	    $('#target').svg({onLoad: drawInitial});
	    $('circle').click(function(e){
	    	drawShape(e);
	    	var shape = this.id;

	    });

	    $('.drag').mousedown(function(e){
	    	var shape = this.id;
	    	this.setAttribute("cx", e.pageX);
	    	this.setAttribute("cy", e.pageY);
	    });
	})

	function drawInitial(svg) {
	    svg.add($('#svginline')); 
	}

	function drawShape(e) {
	    var svg = $("#target").svg('get');
	    $('#result').text(e.clientX + ": " +  e.pageX);
	    var dragme = svg.circle(e.clientX, e.clientY, 5, {fill: 'green', stroke: 'red', 'stroke-width': 3, class_: 'drag'});	
	    //$(dragme).draggable();
	}
});
$(function() {
	$('#svgview').svg({onLoad: drawInitial,loadURL: '/static/svg/radial.svg'});
	$('#rect,#line,#circle,#ellipse').click(drawShape);
	$('#clear').click(function() {
		$('#svgview').svg('get').clear();
	});
	$('#export').click(function() {
		var xml = $('#svgview').svg('get').toSVG();
		$('#svgexport').html(xml.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
	});
});

function drawInitial(svg) {
	svg.circle(75, 75, 50, {fill: 'none', stroke: 'red', 'stroke-width': 3});
	var g = svg.group({stroke: 'black', 'stroke-width': 2});
	svg.line(g, 15, 75, 135, 75);
	svg.line(g, 75, 15, 75, 135);
}

var colours = ['purple', 'red', 'orange', 'yellow', 'lime', 'green', 'blue', 'navy', 'black'];

function drawShape() {
	var shape = this.id;
	var svg = $('#svgview').svg('get');
	if (shape == 'rect') {
		svg.rect(random(300), random(200), random(100) + 100, random(100) + 100,
			{fill: colours[random(9)], stroke: colours[random(9)],
			'stroke-width': random(5) + 1});
	}
	else if (shape == 'line') {
		svg.line(random(400), random(300), random(400), random(300),
			{stroke: colours[random(9)], 'stroke-width': random(5) + 1});
	}
	else if (shape == 'circle') {
		svg.circle(random(300) + 50, random(200) + 50, random(80) + 20,
			{fill: colours[random(9)], stroke: colours[random(9)],
			'stroke-width': random(5) + 1});
	}
	else if (shape == 'ellipse') {
		svg.ellipse(random(300) + 50, random(200) + 50, random(80) + 20, random(80) + 20,
			{fill: colours[random(9)], stroke: colours[random(9)],
			'stroke-width': random(5) + 1});
	}
}

function random(range) {
	return Math.floor(Math.random() * range);
}**/