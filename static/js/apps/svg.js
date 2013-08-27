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
			svgObj,
			svgRoot,
			toolPanel,//操作面板
			canvasPanel,//预览面板
			propPanel,//属性面板
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
			svgRoot = svg.root();
			tools.log(svg);
			tools.log(svg.root());
			tools.log(svg._svg);
			tools.log(svg._svg == svg.root());
			initViewBox();
			bindEvent();
			//svg.configure({viewBox: '100, 0, 300, 200'});
			//var opt = 'svg:ViewBox'; 
		    //var parts = opt.split(':');
		    //var params = {}; 
		    //params['svg' + parts[1]] = values[opt][1];
		}
		function initViewBox(){
			var w = canvasPanel.width(),
				h = canvasPanel.height();
			svgObj.configure({viewBox: '0, 0, '+w+', '+h});
		}
		function bindEvent(){
			//窗口改变后自动改变大小
			$(window).resize(initViewBox);
			$(svgRoot).bind('click', clicked);//. bind('mouseover', svgOver).bind('mouseout', svgOut);
		    //$(svg._svg).animate(params, 2000); 
			//tools.log(svg);
			//$('svg').svgPan('s1');
			$(svgRoot).mousewheel(function(event, delta, deltaX, deltaY) {
                var o = '';
                if (delta > 0)
                    o = '#test2: up ('+delta+')';
                else if (delta < 0)
                    o = '#test2: down ('+delta+')';

                if (deltaX > 0)
                    o = o + ', east ('+deltaX+')';
                else if (deltaX < 0)
                    o = o + ', west ('+deltaX+')';

                if (deltaY > 0)
                    o = o + ', north ('+deltaY+')';
                else if (deltaY < 0)
                    o = o + ', south ('+deltaY+')';

                if( o != '' )
                    tools.log( o );
                return false; // prevent default
            });
		}
		function clicked(event){

		}
		return self;
	};
	$('#svg').preview('/static/svg/linear.svg');
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