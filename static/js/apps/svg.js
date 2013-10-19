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
            mouseTooltip,//鼠标提示
            annotationPanel,//批注面板
            fontSize = 24,//字体设置大小,主要解决chrome下12px显示问题
            width,//宽度
            height,//高度
            scale = 1,//缩放比例
            startX,//开始X坐标
            startY,//开始Y坐标
            endX,//结束X坐标
            endY,//结束Y坐标
            offsetStartX,//相对开始X坐标
            offsetStartY,//相对开始Y坐标
            offsetEndX,//相对结束X坐标
            offsetEndY,//相对结束Y坐标
            moveTimer,//移动计时器
            moveTimerDelta = 100,//移动时每隔100ms处理一次
            left = 0,//SVG左边距离
            top = 0,//SVG上面距离
            mouseState = 0,//鼠标状态，1:按下，2,移动
            state, //状态标示
            NONE = 0,//无状态
            PANTAG = 0,//平移标示，0代表不能移动，1代表可以移动
            DRAW = 5,//画图
            DRAWTAG = 0,//画图标示，0代表不能画图，1代表可以画图
            DRAWCOLOR = "rgb(255, 0, 0)",//画图颜色
            drawType,//画图类型
            DRAWCLOUD = 1,//画云
            DRAWARROW = 2,//画箭头
            DRAWTEXT = 3,//画文字
            DRAWLINE = 4,//画直线
            DRAWX = 5,//画X
            DRAWCIRCLE = 6,//画圆形
            DRAWRECT = 7,//画矩形
            drawShape,//画出的图形引用
            shapes = {},//画出的图形集合
            hoverBoxPath,//经过框
            pickBoxPath,//拾取框
            currentShape;//当前框中的形状
        init();
        //初始化
        function init(){
            self.options={
                loadUrl:'',
                pickUrl:'/glodon/svg/prop/',
                type:'',
                callback:jQuery.noop
            };
            jQuery.extend(self.options, options);
            canvasPanel = $('<div class="svg-canvas"></div>');
            canvasPanel.appendTo(self);
            toolPanel = $('<div class="svg-tool"></div>');
            toolPanel.appendTo(self);
            mouseTooltip = $('<div class="svg-mouse-tooltip svg-tooltip"></div>');
            mouseTooltip.appendTo(self);
            mouseTooltip.hide();
            //propPanel = $('<div class="svg-prop"></div>');
            //propPanel.appendTo(self);
            self.css({position:'absolute',top:'0px',bottom:'0px',left:'0px',right:'0px',overflow:'hidden'});
            load();
        }
        //外部svg加载完成
        function load(){
            $.ajax({
                url: loadUrl,
                type: "GET",
                dataType: "text",
                success:function(resp){
                    $svg = $(resp.match(/<svg[\s\S]*<\/svg>/)[0]);
                    $svg.appendTo(canvasPanel);
                    $svg.css('cursor','move');
                    svg = $svg[0];
                    svgObj = SVG(svg);
                    changeTextSize();
                    initViewBox();
                    initToolPanel();
                    //initPropPanel();
                    initAnnotationInput();
                    bindEvent();
                },
                progress: function(evt) {
                    if (evt.lengthComputable){
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
                            '<a class="svg-tool-item svg-tool-zoomIn" title="放大">+</a>' +
                            '<a class="svg-tool-item svg-tool-zoomOut" title="缩小">-</a>' +
                            '<a class="svg-tool-item svg-tool-fullScreen" title="全屏"></a>' +
                            '<a class="svg-tool-item svg-tool-cloud" drawType=1></a>' +
                            '<a class="svg-tool-item svg-tool-arrow" drawType=2></a>' +
                            '<a class="svg-tool-item svg-tool-text" drawType=3></a>' +
                            '<a class="svg-tool-item svg-tool-shape" data-type="shape"></a>' +
                            '<a class="svg-tool-colorbtn" data-type="color"></a>' +
                        '</div>'+
                        '<div class="svg-tooltip svg-shapeMenu" style="display:none;">' +
                            '<a class="svg-tool-item svg-tool-rect" data-class="svg-tool-rect" drawType=7></a>' +
                            '<a class="svg-tool-item svg-tool-circle" data-class="svg-tool-circle" drawType=6></a>' +
                            '<a class="svg-tool-item svg-tool-x" data-class="svg-tool-x" drawType=5></a>' +
                            '<a class="svg-tool-item svg-tool-line" data-class="svg-tool-line" drawType=4></a>' +
                        '</div>' +
                        '<div class="svg-tooltip svg-colorMenu" style="display:none;">' +
                            '<div>' +
                                '<a class="svg-tool-color" style="background-color: rgb(255, 0, 0);"></a>' +
                                '<a class="svg-tool-color" style="background-color: rgb(255, 255, 0);"></a>' +
                                '<a class="svg-tool-color" style="background-color: rgb(0, 255, 0);"></a>' +
                                '<a class="svg-tool-color" style="background-color: rgb(92, 238, 238);"></a>' +
                            '</div>' +
                            '<div>' +
                                '<a class="svg-tool-color" style="background-color: rgb(247, 118, 200);"></a>' +
                                '<a class="svg-tool-color" style="background-color: rgb(243, 129, 9);"></a>' +
                                '<a class="svg-tool-color" style="background-color: rgb(10, 67, 194);"></a>' +
                                '<a class="svg-tool-color" style="background-color: rgb(0, 0, 0);"></a>' +
                            '</div>' +
                        '</div>' +
                        '<div class="svg-tool-cancel" style="display:none;">取消' +
                        '</div>';
            $(tmpl).appendTo(toolPanel);
            $('.svg-tool-pick',toolPanel).trigger('click');
        }
        //初始化属性面板
        function initPropPanel(){
            var tmpl = '<div class="svg-prop-content"></div>';
            $(tmpl).appendTo(propPanel);
        }
        //初始化批注输入框
        function initAnnotationInput(){
            var tmpl =  '<div class="svg-annotation">' +
                        '<textarea></textarea>' +
                            '<div class="svg-annotation-opt">' +
                                '<span class="svg-annotation-confirm">保存</span>' +
                                '<span class="svg-annotation-cancel">取消</span>' +
                            '</div>' +
                        '</div>';
            annotationPanel = $(tmpl);
            annotationPanel.appendTo(self);
        }
        //初始化视口
        function initViewBox(){
            var w = canvasPanel.width(),
                h = canvasPanel.height(),
                viewbox = svgObj.viewbox();
            width = w;
            height = h;
            if(w < viewbox.width){
                w = viewbox.width
            }
            if(h < viewbox.height){
                h = viewbox.height;
            }
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
                text.attr('text-rendering',"geometricPrecision");
            });
        }
        //初始化所有事件
        function bindEvent(){
            //窗口改变后自动改变大小
            $(window).resize(initViewBox);
            $svg.click(svgClick);
            //文本禁止选中
            $svg.disableSelection();
            $svg.on('mouseover','*',groupOver).on('mouseout','*',groupOut);
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
            toolPanel.on('click','.svg-tool-zoomIn',toolZoomIn);
            toolPanel.on('click','.svg-tool-zoomOut',toolZoomOut);
            toolPanel.on('click','.svg-tool-fullScreen',toolFullScreen);
            toolPanel.on('click','.svg-tool-cloud',toolDraw);
            toolPanel.on('click','.svg-tool-arrow',toolDraw);
            toolPanel.on('click','.svg-tool-text',toolDraw);
            toolPanel.on('click','.svg-tool-shape',toolDraw);
            toolPanel.on('click','.svg-tool-colorbtn',toolColorBtn);
            toolPanel.on('click','.svg-tool-color',toolColor);
            toolPanel.on('click','.svg-shapeMenu .svg-tool-item',toolShape);
            toolPanel.on('click','.svg-tool-cancel',toolCancel);
            /*self.bind('zoomIn',function(){

            });
            self.bind('zoomOut',function(){

            });
            self.bind('fullscreen',function(){

            });*/
        }
        
        function toolZoomIn(event){
            zoomIn();
            cancelBubble(event);
        }
        function toolZoomOut(event){
            zoomOut();
            cancelBubble(event);
        }
        function toolFullScreen(event){
            fullScreen();
            cancelBubble(event);
        }
        function toolDraw(event){
            var _toolgroup = $('.svg-tool-group',toolPanel);
            $('.selected',_toolgroup).removeClass('selected');
            $(this).addClass('selected');
            state = DRAW;
            drawType = parseInt($(this).attr('drawType'),10);
            $svg.css('cursor','crosshair');
            var _offset = $(this).position(),
                _cancelBtn = $('.svg-tool-cancel',toolPanel);
            _cancelBtn.css('top',_offset.top+10).show();
            $('.svg-tooltip',toolPanel).hide();
            var _data_type = $(this).attr('data-type');
            if(_data_type === 'shape'){
                _cancelBtn.hide();
                $('.svg-shapeMenu',toolPanel).show();
            }
            cancelBubble(event);
        }
        function toolColorBtn(event){
            $('.svg-colorMenu',toolPanel).show();
            cancelBubble(event);
        }
        //change color
        function toolColor(event){
            DRAWCOLOR = $(this).css('background-color');
            $('.svg-tool-colorbtn',toolPanel).css('background-color',DRAWCOLOR);
            $('.svg-colorMenu',toolPanel).hide();
            cancelBubble(event);
        }
        //change shape
        function toolShape(event){
            var _shapeMenu = $('.svg-shapeMenu',toolPanel),
                _shapeBtn = $('.svg-tool-shape',toolPanel);
            _shapeMenu.hide();
            $('.svg-tool-cancel',toolPanel).show();
            drawType = parseInt($(this).attr('drawtype'),10);
            _shapeBtn.attr('drawtype',drawType);
            $('.selected',_shapeMenu).removeClass('selected');
            $(this).addClass('selected');
            _shapeBtn.removeClass('svg-tool-rect svg-tool-circle svg-tool-x svg-tool-line');
            _shapeBtn.addClass($(this).attr('data-class'));
            cancelBubble(event);
        }
        function toolCancel(event){
            $('.selected',toolPanel).removeClass('selected');
            var _cancelBtn = $('.svg-tool-cancel',toolPanel),
                _shapeBtn = $('.svg-tool-shape',toolPanel);
            _cancelBtn.hide();
            state = NONE;
            $svg.css('cursor','move');
            _shapeBtn.removeClass('svg-tool-rect svg-tool-circle svg-tool-x svg-tool-line');
            cancelBubble(event);
        }
        function addMouseTooltip(){
            var _text = '';
            mouseTooltip.show();
            switch(drawType){
                case 1:
                    _text = mouseState == 0 ? "按下并且移动鼠标画云批注" : "松开鼠标完成批注";
                    break;
                case 2:
                    _text = mouseState == 0 ? "按下并且移动鼠标画箭头批注" : "松开鼠标完成批注";
                    break;
                case 3:
                    _text = mouseState == 0 ? "按下并且移动鼠标画文字批注" : "松开鼠标完成批注";
                    break;
                case 4:
                    _text = mouseState == 0 ? "按下并且移动鼠标画直线批注" : "松开鼠标完成批注";
                    break;
                case 5:
                    _text = mouseState == 0 ? "按下并且移动鼠标画X批注" : "松开鼠标完成批注";
                    break;
                case 6:
                    _text = mouseState == 0 ? "按下并且移动鼠标画椭圆批注" : "松开鼠标完成批注";
                    break;
                case 7:
                    _text = mouseState == 0 ? "按下并且移动鼠标画矩形批注" : "松开鼠标完成批注";
                    break;
                default:
                    mouseTooltip.hide();
                    break;
            }
            mouseTooltip.text(_text);
            mouseTooltip.factWidth = mouseTooltip.width();
            mouseTooltip.factHeight = mouseTooltip.height();
        }
        //状态管理
        function stateManger(){

        }
        //鼠标点击
        function svgClick(event){
            var point = getEventPoint(event),
                target = event.target;
            switch(state){
                default:
                    if(currentShape instanceof SVGElement){
                        var geom_id = $(currentShape).attr('geom_id');
                        pickProperty(geom_id);
                    }
                    break;
            }
        }
        //鼠标按下
        function svgMouseDown(event){
            mouseState = 1;
            var point = getEventPoint(event);
            startX = point.x;
            startY = point.y;
            offsetStartX = point.offsetX;
            offsetStartY = point.offsetY;
            switch(state){
                //画图操作
                case DRAW:
                    drawShape = null;
                    DRAWTAG = 1;
                    break;
                default:
                    //平移操作
                    PANTAG = 1;
                    break;
            }
        }
        //鼠标向上
        function svgMouseUp(event){
            mouseState = 0;
            switch(state){
                //画图操作
                case DRAW:
                    DRAWTAG = 0;
                    drawEnd();
                    break;
                default:
                    //平移操作
                    PANTAG = 0;
                    left = parseFloat($svg.css('left')) || 0;
                    top = parseFloat($svg.css('top')) || 0;
                    break;
            }
        }
        //鼠标移动
        function svgMouseMove(event){
            mouseState = 2;
            var point = getEventPoint(event);
            endX = point.x;
            endY = point.y;
            switch(state){
                //画图操作
                case DRAW:
                    offsetEndX = point.offsetX;
                    offsetEndY = point.offsetY;
                    if(DRAWTAG == 1){
                        var point = getEventPoint(event);
                        draw(offsetEndX,offsetEndY);
                    }
                    var _top = offsetEndY - mouseTooltip.factHeight/2 - 4,
                        _left = offsetEndX - mouseTooltip.factWidth - 28;
                    mouseTooltip.css({top:_top,left:_left});
                    break;
                default:
                    //平移操作
                    if(PANTAG == 1){
                        var deltaX = endX - startX,
                            deltaY = endY - startY;
                        pan(deltaX,deltaY);
                    }
                    break;
            }
            cancelBubble(event);
            cancelDefault(event);
        }
        //鼠标经过g标签
        function groupOver(event){
            var p = $(this).parents('g');
            if(p.length){
                currentShape = p[0];
            }else{
                currentShape = this;
            }
            if(!$(currentShape).attr('geom_id')) return false;
            box = currentShape.getBBox();
            hoverBox(box);
            cancelBubble(event);
            cancelDefault(event);
        }
        //鼠标移开g标签
        function groupOut(event){
            //hoverBoxPath.hide();
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
                  stroke: '#fff',
                  'stroke-dasharray': "5,5"
                }).style('pointer-events:none');
            }
        }
        //拾取属性
        function pickProperty(geom_id){
            if(!geom_id) return false;
            $.ajax({
                url: self.options.pickUrl,
                data:{geom_id:geom_id},
                type: "GET",
                dataType: "json",
                success:function(resp){
                    if(resp&&resp.code == 0){
                        var data = resp.data,
                            str = '';
                        for(var key in data){
                            str += key+':'+data[key]+'\n';
                        }
                        //propPanel.find('.svg-prop-content').html(str);
                    }
                }
            });
        }
        //平移
        function pan(deltaX,deltaY){
            if(scale == 1) return false;
            var now = Date.now();
            if(moveTimer && (now - moveTimer) < moveTimerDelta) return false;
            moveTimer = now;
            var l = left + deltaX,
                t = top + deltaY;
            if(l >= 0){
                l = 0;
            }
            if(t >= 0){
                t = 0;
            }
            var cw = width*scale,
                ch = height*scale;
            if(cw + l < width){
                l = width -cw ;
            }
            if(ch + t < height){
                t = height - ch ;
            }
            $svg.css('left',l);
            $svg.css('top',t);
        }
        //放大
        function zoomIn(){
            scale += 1;
            svgObj.size(width*scale,height*scale);
            setCenter();
            self.trigger('zoomIn');
        }
        //缩小
        function zoomOut(){
            if(scale <=1 ){
                scale = 1;
                return false;
            }
            scale -= 1;
            svgObj.size(width*scale,height*scale);
            setCenter();
            self.trigger('zoomOut');
        }
        //居中
        function setCenter(){
            var l = -(scale-1)*width/2,
                t = -(scale-1)*height/2;
            $svg.css('left',l);
            $svg.css('top',t);
            left = l;
            top = t;
            $svg.children().each(function(){

            });
        }
        //全屏
        function fullScreen(){
            self.fullScreen();
            self.trigger('fullScreen');
        }
        //画图
        function draw(offsetEndX,offsetEndY){
            var now = Date.now();
            if(moveTimer && (now - moveTimer) < moveTimerDelta) return false;
            moveTimer = now;
            switch(drawType){
                case DRAWCLOUD:
                    break;
                case DRAWARROW:
                    
                    break;
                case DRAWTEXT:
                    break;
                case DRAWLINE:
                    drawLine(offsetStartX,offsetStartY,offsetEndX,offsetEndY);
                    break;
                case DRAWX:
                    break;
                case DRAWCIRCLE:
                    break;
                case DRAWRECT:
                    break;
            }
        }
        function drawEnd(){
            switch(drawType){
                case DRAWCLOUD:
                    break;
                case DRAWARROW:
                    
                    break;
                case DRAWTEXT:
                    break;
                case DRAWLINE:
                    drawLine(offsetStartX,offsetStartY,offsetEndX,offsetEndY);
                    break;
                case DRAWX:
                    break;
                case DRAWCIRCLE:
                    break;
                case DRAWRECT:
                    break;
            }
        }
        //
        function drawPath(){

        }
        function drawLine(x1,y1,x2,y2){
            tools.log(drawType);
            if(drawShape){
                drawShape.plot(x1,y1,x2,y2);
            }else{
                drawShape = svgObj.line(x1,y1,x2,y2);
                drawShape.attr({fill: '#f06', 'fill-opacity': 0.5, stroke: DRAWCOLOR, 'stroke-width': 2});
                shapeMatrix(drawShape);
            }
            drawShape.front();
        }
        function drawRect(){

        }
        function drawCircle(){

        }
        function drawText(){

        }
        function drawAnnotation(x,y,width,height,option){
            var shape = annotationShape(x,y,width,height,option);
        }

        function annotationShape(x,y,w,h,option){
            w = Math.abs(w) < 100?100*(Math.abs(w)/w):w;
            h = Math.abs(h) < 70?70*(Math.abs(h)/h):h;
            var path = generatePath(x,y,w,h);
            if(drawShape){
                drawShape.path.plot(path.join(' '));
            }else{
                drawShape = {};
                drawShape.group = svgObj.group();
                drawShape.path = drawShape.group.path(path.join(' '),true);
                drawShape.path.attr(option);
                shapeMatrix(drawShape.group);
                drawShape.group.size(w,h).style('overflow','hidden');
            }
            drawShape.pathArray = path;
            drawShape.group.attr('data-text','');
            drawShape.group.attr('data-x',x);
            drawShape.group.attr('data-y',y);
            drawShape.group.attr('data-width',w);
            drawShape.group.attr('data-height',h);
        }
        function generatePath(x,y,w,h,kx,ky){
            var path = [];
            path[0] = 'M' + x + ',' + y;
            path[1] = 'C' + x + ',' + (y-h*0.1) + ' ' + x + ',' + (y-h*0.1) + ' ' + (x+w*0.1) + ',' + (y-h*0.1);
            path[2] = 'L' + (x+w*0.9) + ',' + (y-h*0.1);
            path[3] = 'C' + (x+w) + ',' + (y-h*0.1) + ' ' + (x+w) + ',' + (y-h*0.1) + ' ' + (x+w) + ',' + y;
            path[4] = 'L' + (x+w) + ',' + (y+h*0.8);
            path[5] = 'C' + (x+w) + ',' + (y+h*0.9) + ' ' + (x+w) + ',' + (y+h*0.9) + ' ' + (x+w*0.9) + ',' + (y+h*0.9);
            path[6] = 'L' + (x+w*0.8) + ',' + (y+h*0.9);
            path[7] = 'L' + (x+w*0.7) + ',' + (y + h*1.4);
            path[8] = 'L' + (x+w*0.6) + ',' + (y+h*0.9);
            path[9] = 'L' + (x+w*0.1) + ',' + (y+h*0.9);
            path[10] = 'C' + x + ',' + (y+h*0.9) + ' ' + x + ',' + (y+h*0.9) + ' ' + x + ',' + (y+h*0.8);
            path[11] = 'z';
            return path;
        }
        function refreshPath(path,x,y,w,h,kx,ky){
            var pathStr = generatePath(x,y,w,h,kx,ky);
            path.plot(pathStr.join(' '));
        }
        function annotationTextarea(){
            if(!drawShape){

            }else{
                var text = drawShape.group.attr('data-text'),
                    x = drawShape.group.attr('data-x'),
                    y = drawShape.group.attr('data-y'),
                    w = drawShape.group.attr('data-width'),
                    h = drawShape.group.attr('data-height');
                annotationPanel.css({top:y+top-h*0.1+5,left:x+left+5,width:w-10,height:h-10}).show();
                $('textarea',annotationPanel).focus().val('');
            }
        }
        function annotationConfirm(){
            var text = $('textarea',annotationPanel).val(),
                x = drawShape.group.attr('data-x'),
                y = drawShape.group.attr('data-y'),
                w = drawShape.group.attr('data-width'),
                h = drawShape.group.attr('data-height');
            if(!text){
                alert('请输入批注内容');
                return false;
            }
            if(!drawShape){

            }else{
                annotationText(text,drawShape);
                drawShape = null;
                annotationPanel.hide();
            }
        }
        function annotationCancel(){
            if(!drawShape){

            }else{
                drawShape.group.remove();
                drawShape = null;
                annotationPanel.hide();
            }
        }
        function annotationText(text,shape){
            var x = shape.group.attr('data-x'),
                y = shape.group.attr('data-y'),
                w = shape.group.attr('data-width'),
                h = shape.group.attr('data-height'),
                _length = text.length,
                _result = '',
                cw = 0,
                pw = 8,
                ph = 20,
                rh = 20;
            $('text',shape.group).remove();
            text = text.replace('\n','').replace('\r','');
            for(var i = 0;i < _length;i++){
                var l = text[i].charCodeAt() > 255?2:1;
                var tw = cw + l*pw;
                if(tw > w){
                    _result += '\n' + text[i];
                    cw = l*pw;
                    rh += ph;
                }else{
                    _result += text[i];
                    cw = tw;
                }
            }
            drawShape.text = shape.group.text(_result);
            drawShape.text.font({
              family:   'serif',
              size:     16,
              'fill-opacity':1,
              'stroke-opacity':1,
              'stroke' :'#000',
              'fill':'#fff',
              'stroke-width':0
            });
            h = h<rh?rh:h;
            drawShape.text.move(x+2,y-h*0.1);
            refreshPath(drawShape.path,x,y,w,h);
        }
        function shapeMatrix(element){
            var matrix = svg.getCTM().inverse(),
                m = matrix.a + "," + matrix.b + "," + matrix.c + "," + matrix.d + "," + matrix.e + "," + matrix.f;
            element.transform('matrix', m);
            //element.on('mouseover', function(){
            //  hoverBox(element.bbox(),m);
            //});
        }
        function setCTM(element, matrix) {
            var s = "matrix(" + matrix.a + "," + matrix.b + "," + matrix.c + "," + matrix.d + "," + matrix.e + "," + matrix.f + ")";
            element.setAttribute("transform", s);
        }
        function getEventPoint(event){
            return {
                        x:event.clientX || event.pageX,
                        y:event.clientY || event.pageY,
                        offsetX:event.offsetX ||(event.originalEvent&&event.originalEvent.layerX),
                        offsetY:event.offsetY ||(event.originalEvent&&event.originalEvent.layerY)
                    };
        }
        function cancelBubble(_event) {
            if (_event && _event.stopPropagation)
                _event.stopPropagation();
            else
                window.event.cancelBubble=true;
        }
        function cancelDefault(_event) {
            if(_event && _event.preventDefault){
                _event.preventDefault();
            } else{
                window.event.returnValue = false;
            }
            return false;
        }
        String.prototype.template=function(){
            var args=arguments;
            return this.replace(/\{(\d+)\}/g, function(m, i){
                return args[i];
            });
        }
        return self;
    };
    $('#svg').preview('/static/svg/qpen05cm.svg');
});