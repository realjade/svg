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
		var self = $(this),
			$svg,//svg元素jquery对象
			svgObj,//svg插件对象
			svg,//svg对象
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
			moveTimerDelta = 100,//移动时每隔100ms处理一次
			left = 0,//SVG左边距离
			top = 0,//SVG上面距离
			state, //状态标示
			NONE = 0,//无状态
			PICK = 1,//拾取
			PAN = 2,//平移
			PANTAG = 0,//平移标示，0代表不能移动，1代表可以移动
			ZOOMIN = 3,//放大
			ZOOMOUT = 4, //缩小
			DRAW = 5,//画图
			drawType,//画图类型
			DRAWPATH = 1,//画路径
			DRAWLINE = 2,//画直线
			DRAWRECT = 3,//画矩形
			DRAWCIRCLE = 4,//画圆形
			DRAWTEXT = 5,//画文字
			hoverBoxPath,//经过框
			pickBoxPath,//拾取框
			currentShape;//当前框中的形状
		init();
		//初始化
		function init(){
			self.options={
				loadUrl:'',
				type:'',
				callback:jQuery.noop
			};
			jQuery.extend(self.options, options);
			canvasPanel = $('<div class="svg-canvas"></div>');
			canvasPanel.appendTo(self);
			toolPanel = $('<div class="svg-tool"></div>');
			toolPanel.appendTo(self);
			propPanel = $('<div class="svg-prop"></div>');
			propPanel.appendTo(self);
			self.css({position:'relative',overflow:'hidden'});
			load();
		}
		//外部svg加载完成
		function load(){
			$.ajax({
			    url: loadUrl,
			    type: "GET",
			    dataType: "text",
			    success:function(resp){
			    	$svg = $($.trim(resp));
			    	$svg.appendTo(canvasPanel);
			    	$svg.attr('id','eee');
			    	svg = $svg[2];
			    	svgObj = SVG($svg[2]);
			    	changeTextSize();
			    	initViewBox();
					bindEvent();
					initToolPanel();
					initPropPanel();
			    },
			    progress: function(evt) {
			        if (evt.lengthComputable){
			            //console.log("Loaded " + parseInt( (evt.loaded / evt.total * 100), 10) + "%");
			        }
			        else {
			            //console.log("Length not computable.");
			        }
			    }
			 
			});
		}
		//初始化操作面板
		function initToolPanel(){
			var tmpl =  '<div class="svg-tool-group">'+
							'<div class="svg-tool-item svg-tool-pick" title="选择">选</div>' +
							'<div class="svg-tool-item svg-tool-pan" title="移动">移</div>' +
							'<div class="svg-tool-item svg-tool-zoomIn" title="放大">大</div>' +
							'<div class="svg-tool-item svg-tool-zoomOut" title="缩小">小</div>' +
							'<div class="svg-tool-item svg-tool-path" title="画线">线</div>' +
							'<div class="svg-tool-item svg-tool-line" title="画直线">直</div>' +
							'<div class="svg-tool-item svg-tool-rect" title="画矩形">矩形</div>' +
							'<div class="svg-tool-item svg-tool-circle" title="画圆形">圆形</div>' +
							'<div class="svg-tool-item svg-tool-text" title="画文字">字</div>' +
					    '</div>';
			$(tmpl).appendTo(toolPanel);
			$('.svg-tool-pick',toolPanel).trigger('click');
		}
		//初始化属性面板
		function initPropPanel(){

		}
		//初始化视口
		function initViewBox(){
			var w = canvasPanel.width(),
				h = canvasPanel.height();
			width = w;
			height = h;
			svgObj.viewbox(0, 0, w, h);
		}
		//改变字体大小,解决chrome下12px以下字体显示问题。做一次字体设置和大小变换
		function changeTextSize(){
			if(!window.chrome) return false;
			$('text',$svg).each(function(){
				var text = $(this),
					size = parseFloat(text.attr('font-size')),
					trans = text.attr('transform'),
					ctm = svg.createSVGMatrix();
				if(!trans) return;
				trans = trans.split('(')[1].split(')')[0].split(' ');
				ctm.a = trans[0];
				ctm.b = trans[1];
				ctm.c = trans[2];
				ctm.d = trans[3];
				ctm.e = trans[4];
				ctm.f = trans[5];
				var s = size/fontSize;
				var k = svg.createSVGMatrix().scale(s);
				var matrix = ctm.multiply(k);
				var t = "matrix(" + matrix.a + "," + matrix.b + "," + matrix.c + "," + matrix.d + "," + matrix.e + "," + matrix.f + ")";
                text.attr("transform", t);
                text.attr('font-size',fontSize);
			});
		}
		//初始化所有事件
		function bindEvent(){
			//窗口改变后自动改变大小
			$(window).resize(initViewBox);
			$svg.click(svgClick);
			//文本禁止选中
			$svg.disableSelection();
			$('g',$svg).mouseover(groupOver).mouseout(groupOut).click(groupClick);
			$svg.mousedown(svgMouseDown).mouseup(svgMouseUp).mousemove(svgMouseMove);
			self.mousewheel(function(event, delta, deltaX, deltaY) {
				if(delta > 0){
					zoomIn();
				}else{
					zoomOut();
				}
                return false; // prevent default
            });

            //为tool面板添加事件
            toolPanel.on('click','.svg-tool-pick',toolPick);
            toolPanel.on('click','.svg-tool-pan',toolPan);
            toolPanel.on('click','.svg-tool-zoomIn',toolZoomIn);
            toolPanel.on('click','.svg-tool-zoomOut',toolZoomOut);
            toolPanel.on('click','.svg-tool-path',toolPath);
            toolPanel.on('click','.svg-tool-line',toolLine);
            toolPanel.on('click','.svg-tool-rect',toolRect);
            toolPanel.on('click','.svg-tool-circle',toolCircle);
            toolPanel.on('click','.svg-tool-text',toolText);
		}
		
		function toolPick(event){
			$('.selected',toolPanel).removeClass('selected');
			$(this).addClass('selected');
			state = PICK;
			$svg.css('cursor','crosshair');
			tools.cancelBubble(event);
		}
		function toolPan(event){
			$('.selected',toolPanel).removeClass('selected');
			$(this).addClass('selected');
			state = PAN;
			$svg.css('cursor','move');
			tools.cancelBubble(event);
		}
		function toolZoomIn(event){
			$('.selected',toolPanel).removeClass('selected');
			$(this).addClass('selected');
			state = ZOOMIN;
			tools.cancelBubble(event);
		}
		function toolZoomOut(event){
			$('.selected',toolPanel).removeClass('selected');
			$(this).addClass('selected');
			state = ZOOMOUT;
			tools.cancelBubble(event);
		}
		function toolPath(event){
			$('.selected',toolPanel).removeClass('selected');
			$(this).addClass('selected');
			state = DRAW;
			drawType = DRAWPATH;
			tools.cancelBubble(event);
		}
		function toolLine(event){
			$('.selected',toolPanel).removeClass('selected');
			$(this).addClass('selected');
			state = DRAW;
			drawType = DRAWLINE;
			tools.cancelBubble(event);
		}
		function toolRect(event){
			$('.selected',toolPanel).removeClass('selected');
			$(this).addClass('selected');
			state = DRAW;
			drawType = DRAWRECT;
			tools.cancelBubble(event);
		}
		function toolCircle(event){
			$('.selected',toolPanel).removeClass('selected');
			$(this).addClass('selected');
			state = DRAW;
			drawType = DRAWCIRCLE;
			tools.cancelBubble(event);
		}
		function toolText(event){
			$('.selected',toolPanel).removeClass('selected');
			$(this).addClass('selected');
			drawType = DRAW;
			state = DRAWTEXT;
			tools.cancelBubble(event);
		}
		//状态管理
		function stateManger(){

		}
		//鼠标点击
		function svgClick(event){
			var point = getEventPoint(event),
				target = event.target;
			switch(state){
				//平移操作
				case ZOOMIN:
					zoomIn();
					break;
				case ZOOMOUT:
					zoomOut();
					break;
				default:
					break;
			}
		}
		//鼠标按下
		function svgMouseDown(event){
			var point = getEventPoint(event);
			startX = point.x;
			startY = point.y;
			switch(state){
				//平移操作
				case PAN:
					PANTAG = 1;
					break;
				default:
					break;
			}
		}
		//鼠标向上
		function svgMouseUp(event){
			switch(state){
				//平移操作
				case PAN:
					PANTAG = 0;
					break;
				default:
					break;
			}
		}
		//鼠标移动
		function svgMouseMove(event){
			//平移操作
			switch(state){
				//平移操作
				case PAN:
					if(PANTAG == 1){
						var point = getEventPoint(event);
						endX = point.x;
						endY = point.y;
						deltaX = endX - startX;
						deltaY = endY - startY;
						pan(deltaX,deltaY);
					}
					break;
				default:
					break;
			}
			tools.cancelBubble(event);
			tools.cancelDefault(event);
		}
		//鼠标经过g标签
		function groupOver(event){
			var box = this.getBBox();
			currentShape = this;
			if(state == PICK){
				hoverBox(box);
			}
		}
		//鼠标移开g标签
		function groupOut(event){
			//hoverBoxPath.hide();
		}
		//鼠标点击g标签
		function groupClick(event){
			var target = $(this);
			switch(state){
				case PICK:
					var geom_id = target.attr('geom_id') || $(currentShape).attr('geom_id');
					tools.log(geom_id);
					break;
				default:
					break;
			}
		}
		//给经过的对象添加包围框
		function hoverBox(box){
			var p1 = {x:box.x+box.width,y:box.y},
				p2 = {x:box.x+box.width,y:box.y+box.height},
				p3 = {x:box.x,y:box.y+box.height},
				str = 'M{0},{1} L{2},{3} {4},{5} {6},{7}z'.template(box.x,box.y,p1.x,p1.y,p2.x,p2.y,p3.x,p3.y);
			if(hoverBoxPath){
				hoverBoxPath.plot(str);
			}else{
				hoverBoxPath = svgObj.path(str,true);
				hoverBoxPath.attr({
				  fill: 'none',
				  stroke: '#22C',
				  'stroke-dasharray': "5,5"
				}).style('pointer-events:none');
			}
			//hoverBoxPath.show();
		}
		//给拾取的对象添加包围框
		function pickBox(box){
			pickBoxPath = pickBoxPath || 1;
		}
		//拾取属性
		function pickProperty(geom_id){

		}
		//平移
		function pan(deltaX,deltaY){
			var now = Date.now();
			if(moveTimer && (now - moveTimer) < moveTimerDelta) return false;
			moveTimer = now;
			left += deltaX;
			top += deltaY;
			if(left >= 0){
				left = 0;
			}
			if(top >= 0){
				top = 0;
			}
			$svg.css('left',left);
			$svg.css('top',top);
		}
		//放大
		function zoomIn(){
			scale += 1;
			svgObj.size(width*scale,height*scale);
		}
		//缩小
		function zoomOut(){
			if(scale <=1 ){
				scale = 1;
				return false;
			}
			scale -= 1;
			svgObj.size(width*scale,height*scale);
		}
		
		function getEventPoint(event){
			return {
						x:event.clientX || event.pageX,
						y:event.clientY || event.pageY,
						offsetX:event.offsetX ||(event.originalEvent&&event.originalEvent.layerX),
						offsetY:event.offsetY ||(event.originalEvent&&event.originalEvent.layerY)
					};
		}
		String.prototype.template=function(){
		    var args=arguments;
		    return this.replace(/\{(\d+)\}/g, function(m, i){
		        return args[i];
		    });
		}
		return self;
	};
	$('#svg').preview('/static/svg/uml5ha5v.svg');
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