$(function(){
    $.fn.preview = function(loadUrl,options) {
        var self = $(this),
            preview;
        init();
        function init(){
            self.options={
                loadUrl:'',
                type:''||(options&&options.type)||getType(loadUrl),
                callback:jQuery.noop,
                modelId:'1'
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
            messagePanel,//提示信息
            messageTimer,
            annotationPanel,//批注面板
            fontSize = 24,//字体设置大小,主要解决chrome下12px显示问题
            width,//宽度
            height,//高度
            scale = 1,//缩放比例
            breforeScale,//前一次缩放比例
            markScale,//比例记录
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
            DRAWCOLOR = 1,//画图颜色
            COLORMAP = {
                1:{'stroke':'#FF0000','fill':'#FF0000'},
                2:{'stroke':'#FFFF00','fill':'#FFFF00'},
                3:{'stroke':'#00FF00','fill':'#00FF00'},
                4:{'stroke':'#5CEEEE','fill':'#5CEEEE'},
                5:{'stroke':'#F776C8','fill':'#F776C8'},
                6:{'stroke':'#F38109','fill':'#F38109'},
                7:{'stroke':'#0A43C2','fill':'#0A43C2'},
                8:{'stroke':'#ffffff','fill':'#ffffff'}
            },
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
            messagePanel = $('<div class="svg-message"></div>');
            messagePanel.appendTo(self);
            messagePanel.hide();
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
                beforeSend:function(){
                    showMessage(null,true);
                },
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
            $.ajax({
                url: '/databag/comment/',
                type: "GET",
                data:{modelId:options.modelId},
                dataType: "json",
                beforeSend:function(){
                    showMessage("正在加载批注...",true);
                },
                success:function(resp){
                    if(resp&&resp.result == 'success'){
                        hideMessage();
                        var _datas = resp.queryList;
                        for(var i = 0,len = _datas.length;i < len;i++){
                            var _data = _datas[i],
                                _g = svgObj.group(),
                                _path = _g.path(_data.pathInfo,true);
                            _data.commentId = _data.id;
                            delete _data.id;
                            _path.attr($.extend({'stroke-width': 2,'fill-opacity':"0"},COLORMAP[_data.color]));
                            $(_g.node).attr('transform',_data.matrix);
                            addCommentTag(_g.node);
                            _g.on('click',drawClick);
                            _g.on('mouseover',drawOver);
                            _g.on('mouseout',drawOut);
                            _g.front();
                            $(_g.node).data(_data);
                            if(_data.type == DRAWTEXT){
                                _path.attr('stroke-dasharray',"10, 10");
                                drawTextContent(_g.node,_data.content);
                            }
                        }
                    }
                }
            });  
        }
        //初始化操作面板
        function initToolPanel(){
            var tmpl =  '<div class="svg-tool-group">'+
                            '<a class="svg-tool-item" title="放大"><i class="svg-tool-zoomIn"></i></a>' +
                            '<a class="svg-tool-item" title="缩小"><i class="svg-tool-zoomOut"></i></a>' +
                            '<a class="svg-tool-item" title="全屏"><i class="svg-tool-fullScreen"></i></a>' +
                            '<a class="svg-tool-item" title="隐藏批注"><i class="svg-tool-showhide" data-type="show"></i></a>' +
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
                                '<a class="svg-tool-color" style="background-color: rgb(255, 0, 0);" data-color=1></a>' +
                                '<a class="svg-tool-color" style="background-color: rgb(255, 255, 0);" data-color=2></a>' +
                                '<a class="svg-tool-color" style="background-color: rgb(0, 255, 0);" data-color=3></a>' +
                                '<a class="svg-tool-color" style="background-color: rgb(92, 238, 238);" data-color=4></a>' +
                            '</div>' +
                            '<div>' +
                                '<a class="svg-tool-color" style="background-color: rgb(247, 118, 200);" data-color=5></a>' +
                                '<a class="svg-tool-color" style="background-color: rgb(243, 129, 9);" data-color=6></a>' +
                                '<a class="svg-tool-color" style="background-color: rgb(10, 67, 194);" data-color=7></a>' +
                                '<a class="svg-tool-color" style="background-color: #ffffff;" data-color=8></a>' +
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
            /*if(w < viewbox.width){
                w = viewbox.width
            }
            if(h < viewbox.height){
                h = viewbox.height;
            }*/
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
            self.bind('touchstart',svgMouseDown).bind('touchmove',svgMouseMove).bind('touchend',svgMouseUp);
            self.mousewheel(function(event, delta, deltaX, deltaY) {
                if(delta > 0){
                    zoomIn();
                }else{
                    zoomOut();
                }
                if(selectedShape){
                    setPosition('selected');
                }else{
                    setPosition('cursor');
                }
                return false; // prevent default
            });

            //为tool面板添加事件
            toolPanel.on('click','.svg-tool-zoomIn',toolZoomIn);
            toolPanel.on('click','.svg-tool-zoomOut',toolZoomOut);
            toolPanel.on('click','.svg-tool-fullScreen',toolFullScreen);
            toolPanel.on('click','.svg-tool-showhide',toolShowHide);
            toolPanel.on('click','.svg-tool-cloud',toolDraw);
            toolPanel.on('click','.svg-tool-arrow',toolDraw);
            toolPanel.on('click','.svg-tool-text',toolDraw);
            toolPanel.on('click','.svg-tool-shape',toolDraw);
            toolPanel.on('click','.svg-tool-colorbtn',toolColorBtn);
            toolPanel.on('click','.svg-tool-color',toolColor);
            toolPanel.on('mouseover','.svg-tool-color',toolColorOver);
            toolPanel.on('mouseout','.svg-tool-color',toolColorOut);
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
            popupPanel.on('keyup','.svg-popup-comment textarea',popupCommentInput);
            self.bind('zoomIn zoomOut zoomScale',function(){
                if(selectedShape)
                    showPopup(selectedShape);
            });
            /*self.bind('zoomOut',function(){

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
        function toolShowHide(event){
            var _type = $(this).attr('data-type');
            if(_type == 'show'){
                $('g[svg-type="comment"]').hide();
                $(this).attr('data-type','hide').parent().attr('title','显示批注');
            }else{
                $('g[svg-type="comment"]').show();
                $(this).attr('data-type','show').parent().attr('title','隐藏批注');
            }
            cancelBubble(event);
        }
        function toolDraw(event){
            cancelSelected();
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
            DRAWCOLOR = parseInt($(this).attr('data-color'),10);
            $('.svg-tool-colorbtn',toolPanel).css('background-color',COLORMAP[DRAWCOLOR].stroke);
            $('.svg-colorMenu',toolPanel).hide();
            if(selectedShape){
                var _color = parseInt($(this).attr('data-color'),10);
                $('path',$(selectedShape)).attr(COLORMAP[_color]);
                refreshDrawPath(selectedShape,{color:_color});
                cancelBubble(event);
            }
            cancelBubble(event);
        }
        function toolColorOver(event){
            if(selectedShape){
                var _color = parseInt($(this).attr('data-color'),10);
                $('path',$(selectedShape)).attr(COLORMAP[_color]);
                var _data = $(selectedShape).data();
                if(_data.type == DRAWTEXT){
                   changeTextColor(selectedShape,_color);
                }
                cancelBubble(event);
            }   
        }
        function toolColorOut(event){
            if(selectedShape){
                var $selectedShape = $(selectedShape);
                $('path',$selectedShape).attr(COLORMAP[$selectedShape.data().color]);
                cancelBubble(event);
            }
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
            $svg.css('cursor','crosshair');
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
            $('.svg-shapeMenu',toolPanel).hide();
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
            offsetEndX = point.offsetX;
            offsetEndY = point.offsetY;
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
            offsetEndX = point.offsetX;
            offsetEndY = point.offsetY;
            markScale = scale;
            switch(state){
                //画图操作
                case DRAW:
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
            return false;
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
            breforeScale = scale;
            scale += 1;
            svgObj.size(width*scale,height*scale);
            self.trigger('zoomIn');
        }
        //缩小
        function zoomOut(){
            if(scale <=1 ){
                scale = 1;
                return false;
            }
            breforeScale = scale;
            scale -= 1;
            svgObj.size(width*scale,height*scale);
            self.trigger('zoomOut');
        }
        function zoomScale(_scale){
            breforeScale = scale;
            svgObj.size(width*_scale,height*_scale);
            scale = _scale;
            self.trigger('zoomScale');
        }
        //居中
        function setPosition(_type){
            var _l = 0,
                _t = 0;
            switch(_type){
                case 'center':
                    var _l = -(scale-1)*width/2,
                        _t = -(scale-1)*height/2;
                    
                    break;
                case 'cursor':
                    var _sc = scale/markScale;
                    var _l = -offsetEndX*_sc + endX,
                        _t = -offsetEndY*_sc + endY;
                    break;
                case 'selected':
                    if(!selectedShape) return;
                    var _offset = $(selectedShape).offset(),
                        _cbox = selectedShape.getBoundingClientRect(),
                        _x = _offset.left,
                        _y = _offset.top,
                        _w = _cbox.width,
                        _h = _cbox.height;
                    _l = -(_x + _w/2) + width/2,
                    _t = -(_y + _h/2) + height/2;
                    break;
            }
            _l = _l>0?0:_l;
            _t = _t>0?0:_t;
            $svg.css('left',_l);
            $svg.css('top',_t);
            left = _l;
            top = _t;
            if(selectedShape)
                showPopup(selectedShape);
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
            if(drawShape){
                var _data = $(drawShape.group.node).data(),
                    d = {};
                $.extend(d,_data);
                d.modelId = options.modelId;
                $.ajax({
                    url:'/databag/comment',
                    type:'post',
                    data:JSON.stringify(d),
                    contentType:'application/json;charset=utf-8',
                    success:function(resp){
                        if(resp&&resp.result == 'success'){
                            showMessage("创建批注成功");
                            _data.commentId =  resp.commentId;
                        }else{
                            showMessage("创建批注失败");
                        }
                        drawShape = null;
                    },
                    error:function(res){
                        showMessage("创建批注失败");
                        drawShape = null;
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
                drawShape.path.attr($.extend({'stroke-width': 2,'fill-opacity':"0"},COLORMAP[_color]));
                if(drawType == DRAWTEXT){
                    drawShape.path.attr('stroke-dasharray',"10, 10");
                }
                shapeMatrix(drawShape.group);
                addCommentTag(drawShape.group.node);
                drawShape.group.on('click',drawClick);
                drawShape.group.on('mouseover',drawOver);
                drawShape.group.on('mouseout',drawOut);
            }
            drawShape.group.front();
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
                _d.pathInfo = _pathStr;
                _data.pathInfo = _pathStr;
            }
            if(_record !== false){
                $(_pathDom).data(_data);
                $.ajax({
                    url:'/databag/comment/'+_data.commentId,
                    type:'put',
                    data:JSON.stringify(_data),
                    contentType:'application/json;charset=utf-8',
                    success:function(resp){
                        if(resp&&resp.result == 'success'){
                            showMessage("更新批注成功");
                        }else{
                            showMessage("更新批注失败");
                        }
                        drawShape = null;
                    },
                    error:function(res){
                        showMessage("更新批注失败");
                        drawShape = null;
                    }
                });
            }
            if(_data.type == DRAWTEXT&&$('text',$(_pathDom)).length){
                var _text = $('text',$(_pathDom))[0].instance;
                _text.move(_data.x,_data.y);
                $('rect',_text.clipper.node)[0].instance.move(_data.x,_data.y);
                _text.clipper.move(_data.x,_data.y);
                drawTextContent(_pathDom);
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
                case DRAWTEXT:
                    _pathStr = 'M{0},{1}L{2},{3}L{4},{5},L{6},{7}z'.template(_x,_y,_ex,_y,_ex,_ey,_x,_ey);
                    break;
            }
            return _pathStr;
        }
        //click draw object
        function drawClick(event){
            cancelSelected();
            state = SELECTED;
            selectedShape = this;
            $('path',$(this)).attr({'stroke-opacity':0.6,'fill-opacity':0.1});
            var _data = $(this).data();
            $('.svg-tool-colorbtn',toolPanel).css('background-color',COLORMAP[_data.color].stroke);
            showResize(selectedShape);
            showPopup(selectedShape);
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
                    url:'/databag/comment/'+_data.commentId,
                    type:'DELETE',
                    success:function(resp){
                        if(resp&&resp.result == 'success'){
                            showMessage("删除批注成功");
                        }else{
                            showMessage("删除批注失败");
                        }
                    },
                    error:function(){
                        showMessage("删除批注失败");
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
            if(_tranf){
                $(resizePanel.group.node).attr('transform',_tranf);
            }else{
                $(resizePanel.group.node).attr('transform','');
            }
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
            var _commentInput = $('.svg-popup-comment textarea',popupPanel);
            _commentInput.select();
            _commentInput.val($(selectedShape).data().content);
            refreshPopupPosition(selectedShape);
            cancelBubble(event);
        }
        function hidePopupComment(){
            $('.svg-popup-opt',popupPanel).show();
            $('.svg-popup-comment',popupPanel).hide();
            refreshPopupPosition(selectedShape);
            var _data = $(selectedShape).data();
            if(_data.type == DRAWTEXT){
                drawTextContent(selectedShape,_data.content);
            }
        }
        function popupCommentOk(event){
            var _commentInput = $('.svg-popup-comment textarea',popupPanel),
                _content = _commentInput.val();
            refreshDrawPath(selectedShape,{content:_content});
            showPopup(selectedShape);
            cancelBubble(event);
        }
        function popupCommentCancel(event){
            hidePopupComment();
            cancelBubble(event);
        }
        function popupCommentInput(event){
            var _data = $(selectedShape).data();
            if(_data.type != DRAWTEXT) return false;
            var _content = $(this).val();
            drawTextContent(selectedShape,_content);
            cancelBubble(event);
        }
        function drawTextContent(_svgObj,_content){
            var _text = $('text',_svgObj);
            if(_text.length){
                _text.remove();
                _text[0].instance.clipper.remove();
            }
            var _box = _svgObj.getBBox(),
                _data = $(_svgObj).data(),
                _x = _box.x,
                _y = _box.y,
                _w = _box.width,
                _h = _box.height,
                _result = '',
                cw = 0,
                pw = 8,
                ph = 20,
                rh = 20;
            _content = _content || _data.content;
            if(!_content) return false;
            for(var i = 0,_len = _content.length;i < _len;i++){
                var l = _content[i].charCodeAt() > 255?2:1;
                var tw = cw + l*pw;
                if(tw > _w){
                    _result += '\n' + _content[i];
                    cw = l*pw;
                    rh += ph;
                }else{
                    _result += _content[i];
                    cw = tw;
                }
            }
            if(!_result){
                $('text',_svgObj).remove();
            }else{
                var _group = _svgObj.instance,
                    _text = _group.text(_result);
                _text.font({
                  family:   'serif',
                  size:     16,
                  'fill-opacity':1,
                  'fill':COLORMAP[_data.color].stroke
                });
                _text.move(_x,_y);
                var _rect = svgObj.rect(_w,_h).move(_x,_y);
                _text.clipWith(_rect);
            }
        }
        function changeTextColor(_svgObj,_color){
            var _text = $('text',_svgObj);
            if(!_text.length) return false;
            _text[0].instance.font({'fill':COLORMAP[_color].stroke});
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
            if(deltaX == 0 && deltaY == 0){
                return false;
            }
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
            if(selectedShape){
                $('path',$(selectedShape)).attr({'stroke-opacity':1,'fill-opacity':0});
            }
            $('.svg-tool-colorbtn',toolPanel).css('background-color',COLORMAP[DRAWCOLOR].stroke);
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
        function showMessage(_message,_noTimer){
            _message = _message || "正在加载...";
            messagePanel.html(_message).css('left',canvasPanel.width()/2 - messagePanel.width()/2).show();
            clearTimeout(messageTimer);
            if(!_noTimer){
                messageTimer = setTimeout(function(){
                    messagePanel.fadeOut('slow');
                }, 3000);
            }
        }
        function hideMessage(){
            messagePanel.hide();
        }
        /*function drawAnnotation(x,y,width,height,option){
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
        }*/
        function shapeMatrix(element){
            if(!svg.getCTM()) return;
            var matrix = svg.getCTM().inverse(),
                m = matrix.a + "," + matrix.b + "," + matrix.c + "," + matrix.d + "," + matrix.e + "," + matrix.f;
            element.transform('matrix', m);
            //element.on('mouseover', function(){
            //  hoverBox(element.bbox(),m);
            //});
        }
        function addCommentTag(_svgObj){
            if(!_svgObj) return false;
            $(_svgObj).attr('svg-type','comment');
        }
        function setCTM(element, matrix) {
            var s = "matrix(" + matrix.a + "," + matrix.b + "," + matrix.c + "," + matrix.d + "," + matrix.e + "," + matrix.f + ")";
            element.setAttribute("transform", s);
        }
        function getEventPoint(event){
            return {
                        x:event.clientX || event.pageX || event.originalEvent.clientX || event.originalEvent.pageX,
                        y:event.clientY || event.pageY || event.originalEvent.clientY || event.originalEvent.pageY,
                        offsetX:event.offsetX ||(event.originalEvent&&event.originalEvent.layerX),
                        offsetY:event.offsetY ||(event.originalEvent&&event.originalEvent.layerY)
                    };
        }
        function cancelBubble(_event) {
            if (_event && _event.stopPropagation)
                _event.stopPropagation();
            else{
                if(window.event)
                    window.event.cancelBubble=true;
            }
                
        }
        function cancelDefault(_event) {
            if(_event && _event.preventDefault){
                _event.preventDefault();
            } else{
                if(window.event)
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