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
            popupPanel,//弹出框
            resizePanel = {},//改变大小的panel
            propPanel,//属性面板
            annotationPanel,//批注面板
            fontSize = 24,//字体设置大小,主要解决chrome下12px显示问题
            width,//宽度
            height,//高度
            scale = 1,//缩放比例
            breforeScale,
            startX,//开始X坐标
            startY,//开始Y坐标
            endX,//结束X坐标
            endY,//结束Y坐标
            offsetStartX,//相对开始X坐标
            offsetStartY,//相对开始Y坐标
            offsetEndX,//相对结束X坐标
            offsetEndY,//相对结束Y坐标
            selectedStartX,
            selectedStartY,
            moveTimer,//移动计时器
            moveTimerDelta = 100,//移动时每隔100ms处理一次
            left = 0,//SVG左边距离
            top = 0,//SVG上面距离
            mouseState = 0,//鼠标状态，1:按下，2,移动
            state = 0, //状态标示
            NONE = 0,//无状态
            PANTAG = 0,//平移标示，0代表不能移动，1代表可以移动
            SELECTED = 1,//标注选中状态
            RESIZE = 2,
            resizeDirection = 0,
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
            selectedShape,//选中的图形
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
            popupPanel = $('<div class="svg-popup svg-tooltip">'+
                            '<div class="svg-popup-opt"><a class="svg-popup-delete"><i></i></a><a class="svg-popup-commentbtn" title="点击输入备注信息">点击输入备注信息</a></div>'+
                            '<div class="svg-popup-comment"><textarea placeholder="请输入备注信息"></textarea><a class="svg-popup-comment-cancel">取消</a><a class="svg-popup-comment-ok">确定</a></div></div>');
            popupPanel.appendTo(self);
            popupPanel.hide();
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
                    initResizePanel();
                    //initPropPanel();
                    initAnnotationInput();
                    bindEvent();
                    loadComment();
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
        //加载评论
        function loadComment(){
            /*$.ajax({
                url: '/glodon/svg/',
                type: "GET",
                dataType: "json",
                success:function(resp){
                    
                }
            });*/
            var _datas = [{color: "rgb(255, 0, 0)",
content: undefined,
h: 95,
matrix: 'matrix(1.5390781563126252 0 0 1.5390781563126252 -435.30561122244495 0)',
pathInfo: "M986,219L1113,219L1113,314,L986,314z",
scale: 1,
type: 7,
w: 127,
x: 986,
y: 219},{color: "rgb(255, 0, 0)",
content: undefined,
h: 57,
matrix: 'matrix(1.5390781563126252 0 0 1.5390781563126252 -435.30561122244495 0)',
pathInfo: "M329.5,254A38.5,28.5,0,1,1,329.4,254 z",
scale: 1,
type: 6,
w: 77,
x: 291,
y: 254}];
            for(var i = 0,len = _datas.length;i < len;i++){
                var _data = _datas[i],
                    _g = svgObj.group(),
                    _path = _g.path(_data.pathInfo,true);
                _path.attr({stroke: _data.color, 'stroke-width': 2,'fill-opacity':"0"});
                $(_g.node).attr('transform',_data.matrix);
                _g.on('click',drawClick);
                _g.on('mouseover',drawOver);
                _g.on('mouseout',drawOut);
                _g.front();
                $(_g.node).data(_data);
            }
        }
        //初始化操作面板
        function initToolPanel(){
            var tmpl =  '<div class="svg-tool-group">'+
                            '<a class="svg-tool-item" title="放大"><i class="svg-tool-zoomIn"></i></a>' +
                            '<a class="svg-tool-item" title="缩小"><i class="svg-tool-zoomOut"></i></a>' +
                            '<a class="svg-tool-item" title="全屏"><i class="svg-tool-fullScreen"></i></a>' +
                            '<a class="svg-tool-item"><i class="svg-tool-cloud" drawType=1></i></a>' +
                            '<a class="svg-tool-item"><i class="svg-tool-arrow" drawType=2></i></a>' +
                            '<a class="svg-tool-item"><i class="svg-tool-text" drawType=3></i></a>' +
                            '<a class="svg-tool-item"><i class="svg-tool-shape" data-type="shape"></i></a>' +
                            '<a class="svg-tool-colorbtn" data-type="color"></a>' +
                        '</div>'+
                        '<div class="svg-tooltip svg-shapeMenu" style="display:none;">' +
                            '<a class="svg-tool-item" data-class="svg-tool-rect" drawType=7><i class="svg-tool-rect"></i></a>' +
                            '<a class="svg-tool-item" data-class="svg-tool-circle" drawType=6><i class="svg-tool-circle"></i></a>' +
                            '<a class="svg-tool-item" data-class="svg-tool-x" drawType=5><i class="svg-tool-x"></i></a>' +
                            '<a class="svg-tool-item" data-class="svg-tool-line" drawType=4><i class="svg-tool-line"></i></a>' +
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
        function initResizePanel(){
            resizePanel.group = svgObj.group();
            resizePanel.leftup = resizePanel.group.rect(10,10).attr({stroke: '#fff', 'stroke-width': 1,'fill-opacity':"0"}).style({'cursor':'nw-resize'}).data('resizeDirection','leftup');
            resizePanel.rightup = resizePanel.group.rect(10,10).attr({stroke: '#fff', 'stroke-width': 1,'fill-opacity':"0"}).style({'cursor':'ne-resize'}).data('resizeDirection','rightup');
            resizePanel.rightbottom = resizePanel.group.rect(10,10).attr({stroke: '#fff', 'stroke-width': 1,'fill-opacity':"0"}).style({'cursor':'se-resize'}).data('resizeDirection','rightbottom');
            resizePanel.leftbottom = resizePanel.group.rect(10,10).attr({stroke: '#fff', 'stroke-width': 1,'fill-opacity':"0"}).style({'cursor':'sw-resize'}).data('resizeDirection','leftbottom');
            resizePanel.group.hide();
            shapeMatrix(resizePanel.group);
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
            $(document).on('keydown',svgKeyDown);
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
            resizePanel.leftup.on('mousedown',resizeStart);
            resizePanel.rightup.on('mousedown',resizeStart);
            resizePanel.rightbottom.on('mousedown',resizeStart);
            resizePanel.leftbottom.on('mousedown',resizeStart);
            popupPanel.on('click','.svg-popup-delete',drawDelete);
            popupPanel.on('click','.svg-popup-commentbtn',showPopupComment);
            popupPanel.on('click','.svg-popup-comment-ok',popupCommentOk);
            popupPanel.on('click','.svg-popup-comment-cancel',popupCommentCancel);
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
            $(this).parent().addClass('selected');
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
        function resizeStart(event){
            state = RESIZE;
            resizeDirection = this.instance.data('resizeDirection');
            PANTAG = 1;
        }
        //鼠标点击
        function svgClick(event){
            var point = getEventPoint(event),
                target = event.target;
            switch(state){
                case SELECTED:
                    cancelSelected();
                    break;
                default:
                    if(currentShape instanceof SVGElement){
                        var geom_id = $(currentShape).attr('geom_id');
                        pickProperty(geom_id);
                    }
                    break;
            }
        }
        function svgKeyDown(event){
            switch(state){
                case SELECTED:
                    drawKeyDown(event);
                    break;
                default:
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
                case SELECTED:
                    PANTAG = 1;  
                    break;
                case RESIZE:
                    PANTAG = 1;
                default:
                    //平移操作
                    PANTAG = 1;
                    break;
            }
        }
        //鼠标向上
        function svgMouseUp(event){
            mouseState = 0;
            var point = getEventPoint(event);
            switch(state){
                //画图操作
                case DRAW:
                    DRAWTAG = 0;
                    drawEnd();
                    break;
                case SELECTED:
                    PANTAG = 0;
                    var deltaX = endX - startX,
                        deltaY = endY - startY;
                    selectedEnd(deltaX,deltaY);
                    break;
                case RESIZE:
                    PANTAG = 0;
                    offsetEndX = point.offsetX;
                    offsetEndY = point.offsetY;
                    resizeEnd(offsetEndX,offsetEndY);
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
                    break;
                case SELECTED:
                    if(PANTAG == 1){
                        var deltaX = endX - startX,
                            deltaY = endY - startY;
                        selectedPan(deltaX,deltaY);
                    }
                    break;
                case RESIZE:
                    offsetEndX = point.offsetX;
                    offsetEndY = point.offsetY;
                    if(PANTAG == 1){
                        var point = getEventPoint(event);
                        resizePan(offsetEndX,offsetEndY);
                    }
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
            if(state != NONE) return false;
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
            breforeScale = scale;
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
            breforeScale = scale;
            svgObj.size(width*scale,height*scale);
            setCenter();
            self.trigger('zoomOut');
        }
        function zoomScale(_scale){
            svgObj.size(width*_scale,height*_scale);
            scale = _scale;
            setCenter();
            self.trigger('zoomScale');
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
            var _x = offsetStartX,
                _y = offsetStartY,
                _w = offsetEndX-offsetStartX,
                _h = offsetEndY-offsetStartY;
            drawPath(drawType,_x,_y,_w,_h,DRAWCOLOR);
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
                    //drawLine(offsetStartX,offsetStartY,offsetEndX,offsetEndY);
                    break;
                case DRAWX:
                    break;
                case DRAWCIRCLE:
                    break;
                case DRAWRECT:
                    break;
            }
            if(drawShape){
                var _data = $(drawShape.group.node).data(),
                    d = {};
                $.extend(d,_data);
                $.ajax({
                    url:'/glodon/svg/',
                    type:'post',
                    data:{},
                    contentType:'application/json;charset=utf-8',
                    success:function(res){
                        tools.log('success');
                        //drawShape = null;
                    },
                    error:function(res){
                        tools.log('error');
                        //drawShape = null;
                    }
                });
            }
            toolCancel();
        }
        function drawPath(_type,_x,_y,_w,_h,_color,_content){
            if(Math.abs(_w) < 10 || Math.abs(_h) <10) return false;
            var _pathStr = getDrawPathStr(_type,_x,_y,_w,_h);
            if(drawShape){
                drawShape.path.plot(_pathStr);
            }else{
                drawShape = {};
                drawShape.group = svgObj.group();
                drawShape.path = drawShape.group.path(_pathStr,true);
                drawShape.path.attr({stroke: _color, 'stroke-width': 2,'fill-opacity':"0"});
                shapeMatrix(drawShape.group);
                drawShape.group.on('click',drawClick);
                drawShape.group.on('mouseover',drawOver);
                drawShape.group.on('mouseout',drawOut);
            }
            drawShape.group.front();
            tools.log({x:_x,y:_y,w:_w,h:_h,color:_color,content:_content,type:_type,scale:scale,matrix:$(drawShape.group.node).attr('matrix'),pathInfo:_pathStr});
            $(drawShape.group.node).data({x:_x,y:_y,w:_w,h:_h,color:_color,content:_content,type:_type,scale:scale,matrix:$(drawShape.group.node).attr('transform'),pathInfo:_pathStr});
        }
        function refreshDrawPath(_pathDom,_options,_record){
            var _d = $(_pathDom).data(),
                _path = $('path',$(_pathDom))[0].instance,
                _data = {};
            $.extend(_data,_d);
            $.extend(_data,_options);
            if(_options.x || _options.y || _options.w || _options.h){
                var _pathStr = getDrawPathStr(_data.type,_data.x,_data.y,_data.w,_data.h);
                _path.plot(_pathStr);
            }
            if(_record !== false){
                $(_pathDom).data(_data);
            }
            return _data;
        }
        function getDrawPathStr(_type,_x,_y,_w,_h){
            var _pathStr = '',
                _ex = _x+_w,
                _ey = _y+_h;
            switch(_type){
                case DRAWCLOUD:
                    if(Math.abs(_w) < 20 || Math.abs(_h) <20 ) return;
                    _pathStr = 'M{0},{1}'.template(_x,_y);
                    var _xf = Math.abs(_w)/_w,
                        _yf = Math.abs(_h)/_h,
                        _cx = _x,
                        _cy = _y - 12*_yf,
                        _dx = _x,
                        _dy = _y;
                    for(var _b = 0; _b < Math.abs(_w) - 16; _b+=16){
                        _cx = _cx + (_b == 0?8:16)*_xf;
                        _dx = _dx + 16*_xf;
                        _pathStr += 'Q{0},{1},{2},{3}'.template(_cx,_cy,_dx,_dy);
                    }
                    _cx = _dx + 12*_xf;
                    _cy = _y;
                    _dy = _y;
                    for(var _b = 0; _b < Math.abs(_h) - 16; _b+=16){
                        _cy = _cy + (_b == 0?8:16)*_yf;
                        _dy = _dy + 16*_yf;
                        _pathStr += 'Q{0},{1},{2},{3}'.template(_cx,_cy,_dx,_dy);
                    }

                    _cx = _dx;
                    _cy = _dy + 12*_yf;
                    _dy = _dy;

                    for(var _b = 0; _b < Math.abs(_w) - 16; _b+=16){
                        _cx = _cx - (_b == 0?8:16)*_xf;
                        _dx = _dx - 16*_xf;
                        _pathStr += 'Q{0},{1},{2},{3}'.template(_cx,_cy,_dx,_dy);
                    }

                    _cx = _x - 12*_xf;
                    _cy = _dy;
                    _dx = _x;

                    for(var _b = 0; _b < Math.abs(_h) - 16; _b+=16){
                        _cy = _cy - (_b == 0?8:16)*_yf;
                        _dy = _dy - 16*_yf;
                        _pathStr += 'Q{0},{1},{2},{3}'.template(_cx,_cy,_dx,_dy);
                    }
                    _pathStr += 'z';
                    break;
                case DRAWARROW:
                    var p1 = svg.createSVGPoint(),
                        p2 = svg.createSVGPoint(),
                        arc = Math.atan2(_h,_w),
                        carc = Math.cos(arc),
                        sarc = Math.sin(arc),
                        ctm = svg.createSVGMatrix(),
                        len = Math.sqrt(Math.pow(_w,2)+Math.pow(_h,2));
                    p1.x = len-4;
                    p1.y = -3;
                    p2.x = len-4;
                    p2.y = 3;
                    ctm.a = carc;
                    ctm.b = sarc;
                    ctm.c = -sarc;
                    ctm.d = carc;
                    p1 = p1.matrixTransform(ctm);
                    p2 = p2.matrixTransform(ctm);
                    _pathStr = 'M{0},{1}L{2},{3}L{4},{5}L{6},{7}L{8},{9}'.template(_x,_y,_ex,_ey,p1.x+_x,p1.y+_y,p2.x+_x,p2.y+_y,_ex,_ey);
                    break;
                case DRAWLINE:
                    _pathStr = 'M{0},{1}L{2},{3}'.template(_x,_y,_ex,_ey);
                    break;
                case DRAWX:
                    _pathStr = 'M{0},{1}l{2},{3}m{4},{5}l{6},{7}'.template(_x,_y,_w,_h,0,-_h,-_w,_h);
                    break;
                case DRAWCIRCLE:
                    _pathStr = 'M{0},{1}A{2},{3},{4},{5},{6},{7},{8} z'.template(_x+_w/2,_y,_w/2,_h/2,0,1,1,_x+_w/2-0.1,_y);
                    break;
                case DRAWRECT:
                    _pathStr = 'M{0},{1}L{2},{3}L{4},{5},L{6},{7}z'.template(_x,_y,_ex,_y,_ex,_ey,_x,_ey);
                    break;
            }
            return _pathStr;
        }
        function drawText(){

        }
        //click draw object
        function drawClick(event){
            state = SELECTED;
            selectedShape = this;
            showResize(selectedShape);
            showPopup(selectedShape);
            //breforeScale = scale;
            //zoomScale(data.scale);
            cancelBubble(event);
        }
        function drawOver(event){
            $svg.css('cursor','pointer');
        }
        function drawOut(event){
            $svg.css('cursor','move');
        }
        function drawKeyDown(event){
            switch(event.keyCode){
                case 46:
                    drawDelete();
                    break;
                default:
                    break;
            }
        }
        function drawDelete(){
            if(confirm('确定要删除该批注吗？')){
                var _data = $(selectedShape).data();
                selectedShape.instance.remove();
                cancelSelected();
                hidePopup();
                $.ajax({
                    url:'',
                    data:{commentId:_data.commentId},
                    type:'DELETE',
                    success:function(){

                    },
                    error:function(){

                    }
                });
            }
        }
        function showResize(_svgobj){
            resizePanel.group.show();
            var _box = _svgobj.getBBox();
            var _x = _box.x,
                _y = _box.y,
                _w = _box.width,
                _h = _box.height;
            resizePanel.leftup.move(_x-15,_y-15);
            resizePanel.rightup.move(_x+_w+15,_y-15);
            resizePanel.rightbottom.move(_x+_w+15,_y+_h+15);
            resizePanel.leftbottom.move(_x-15,_y+_h+15);
            var _tranf = $(_svgobj).attr('transform');
            $(resizePanel.group.node).attr('transform',_tranf);
        }
        function hideResize(){
            resizePanel.group.hide();
        }
        function showPopup(_svgobj){
            var _data = $(_svgobj).data();
            if(_data.content){
                $('.svg-popup-commentbtn',popupPanel).text(_data.content);
                $('.svg-popup-comment textarea',popupPanel).val(_data.content);
            }else{
                $('.svg-popup-commentbtn',popupPanel).text("点击输入备注信息");
                $('.svg-popup-comment textarea',popupPanel).val('');
            }
            popupPanel.show();
            hidePopupComment();
        }
        function refreshPopupPosition(_svgobj){
            var _box = _svgobj.getBoundingClientRect(),
                _offset = self.offset();
            popupPanel.css({'left':_box.left - _offset.left + _box.width/2 - popupPanel.width()/2,'top':_box.top - _offset.top - popupPanel.height()-30});
        }
        function hidePopup(){
            popupPanel.hide();
        }
        function showPopupComment(event){
            $('.svg-popup-opt',popupPanel).hide();
            $('.svg-popup-comment',popupPanel).show();
            refreshPopupPosition(selectedShape);
            cancelBubble(event);
        }
        function hidePopupComment(){
            $('.svg-popup-opt',popupPanel).show();
            $('.svg-popup-comment',popupPanel).hide();
            refreshPopupPosition(selectedShape);
        }
        function popupCommentOk(event){
            var _commentInput = $('.svg-popup-comment textarea',popupPanel),
                _content = _commentInput.val();
            refreshDrawPath(selectedShape,{content:_content});
            hidePopupComment();
            cancelBubble(event);
        }
        function popupCommentCancel(event){
            hidePopupComment();
            cancelBubble(event);
        }
        //选择图形平移
        function selectedPan(deltaX,deltaY){
            var now = Date.now();
            if(moveTimer && (now - moveTimer) < moveTimerDelta) return false;
            moveTimer = now;
            var data = $(selectedShape).data(),
                _x = data.x + deltaX,
                _y = data.y + deltaY;
            refreshDrawPath(selectedShape,{x:_x,y:_y},false);
            showResize(selectedShape);
            hidePopup();
        }
        function selectedEnd(deltaX,deltaY){
            var data = $(selectedShape).data(),
                _x = data.x + deltaX,
                _y = data.y + deltaY;
            refreshDrawPath(selectedShape,{x:_x,y:_y});
            showResize(selectedShape);
        }
        function cancelSelected(){
            state = NONE;
            hideResize();
            hidePopup();
            //zoomScale(breforeScale);
            selectedShape = null;
        }
        function resizePan(offsetEndX,offsetEndY){
            var now = Date.now();
            if(moveTimer && (now - moveTimer) < moveTimerDelta) return false;
            moveTimer = now;
            hideResize();
            hidePopup();
            refreshDrawPath(selectedShape,resizeVal(offsetEndX,offsetEndY),false);
        }
        function resizeEnd(offsetEndX,offsetEndY){
            state = SELECTED;
            showResize(selectedShape);
            showPopup(selectedShape);
            refreshDrawPath(selectedShape,resizeVal(offsetEndX,offsetEndY));
        }
        function resizeVal(offsetEndX,offsetEndY){
            var _data = $(selectedShape).data(),
                data = {};
                _w = offsetEndX-offsetStartX,
                _h = offsetEndY-offsetStartY,
                _x = 0,
                _y = 0;
            data.x = _data.w > 0 ? _data.x : _data.x + _data.w;
            data.y = _data.h > 0 ? _data.y : _data.y + _data.h;
            data.w = Math.abs(_data.w);
            data.h = Math.abs(_data.h);
            switch(resizeDirection){
                case 'leftup':
                    _x = data.x + data.w;
                    _y = data.y + data.h;
                    _w += -data.w;
                    _h += -data.h;
                    break;
                case 'rightup':
                    _x = data.x;
                    _y = data.y + data.h;
                    _w += data.w;
                    _h += -data.h;
                    break;
                case 'rightbottom':
                    _x = data.x;
                    _y = data.y;
                    _w += data.w;
                    _h += data.h;
                    break;
                case 'leftbottom':
                    _x = data.x + data.w;
                    _y = data.y;
                    _w += -data.w;
                    _h += data.h;
                    break;
                default:
                    break;
            }
            return {x:_x,y:_y,w:_w,h:_h};
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
                m = matrix.a + "," + matrix.b + "," + matrix.c + "," + matrix.d + "," + matrix.e + "," + matrix.f
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