window.app = {view:{}};
$(function(){
	// 全局AJAX请求失败处理
	jQuery(document).ajaxError(function (e, xmlhttp, opt) {
        smallnote(xmlhttp.responseText,{pattern:'error'});
        if(xmlhttp.status == 401){
            window.location.href=visitor.rootPath+'/logout';
        }
	});

	/*// 全局AJAX请求异常处理
	jQuery(document).ajaxSuccess(function (e, xmlhttp, opt) {
	    if(opt.dataType != 'json') return false;
	    var res = JSON.decode(xmlhttp.responseText);
	    if (jQuery.isNumeric(res.code) && res.code != 0) {
	        if (res.code == 10460 || res.code == 9460) {
	            location.href = '/login/';
	        }
	        else {
	            smallnotes(res.message || '服务器异常，请稍后再试！');
	        }
	    }
	});*/
	//扩展系统方法
	//为funciton添加bind方法
	if(!Function.prototype.bind) {
	    Function.prototype.bind = function(thisArg) {
	        var bargs = Array.prototype.slice.call(arguments, 1);
	        var method = this;
	        return function() {
	            var args = bargs.slice(0);
	            args.push.apply(args, arguments);
	            var ret = method.apply(thisArg, args);
	            return ret;
	        };
	    };
	}
	if(!Date.now){
	    Date.now = function(){
	        return new Date().valueOf();
	    };
	}
	//工具代码
	tools = {
	    cookie:{
	        set:function(name,value){
	            var exp  = new Date();
	            exp.setTime(exp.getTime() + 30*24*60*60*1000);   
	            document.cookie = name + '='+ escape (value) + ';expires=' + exp.toGMTString()+';path=/';
	        },
	        get:function(name){
	            var arr = document.cookie.match(new RegExp('(^| )'+name+'=([^;]*)(;|$)'));
	            if(arr != null) return unescape(arr[2]); return null;
	        },
	        del:function(name){
	            var exp = new Date();
	            exp.setTime(exp.getTime() - 1);
	            var cval=api.cookie.getCookie(name);
	            if(cval!=null){
	                document.cookie= name + '='+cval+';expires='+exp.toGMTString()+';path=/';
	                document.cookie= name + '='+cval+';expires='+exp.toGMTString();
	            }
	        }
	    },
	    log:function(_message){
	        if('console' in window && 'log' in window.console){
	            console.log(_message);
	        }
	    },
	    // 纵向滚动到指定位置
	    scrollTween: function(y, callback) {
	        jQuery('html, body').animate({
	                scrollTop: (y || 0)
	        }, 500, 'easeOutExpo', function () {
	            return callback && callback();
	        });
	    },
	    
	    // 取消选中的文本
	    clearSelect: function() {
	        if(document.selection && document.selection.empty) {
	            document.selection.empty();
	        }
	        else if(window.getSelection) {
	            window.getSelection().removeAllRanges();
	        }
	    },
	    
	    // 计算字符串的字节长度
	    countByte: function(str) {
	        var size = 0;
	        for (var i = 0, l = str.length; i < l; i++) {
	            size += str.charCodeAt(i) > 255 ? 2 : 1;
	        }

	        return size;
	    },
	    
	    // 根据字节截取长度
	    substrByByte: function (str, limit) {
	        for (var i = 1, l = str.length + 1; i < l; i++) {
	            if (this.countByte(str.substring(0, i)) > limit) {
	                return str.substring(0, i - 1);
	            }
	        }
	        return str;
	    },
	    
	    //获得URL中键值对
	    paramOfUrl: function (url) {
	        url = url || location.href;
	        var paramSuit = url.substring(url.indexOf('?') + 1).split("&");
	        var paramObj = {};
	        for (var i = 0; i < paramSuit.length; i++) {
	            var param = paramSuit[i].split('=');
	            if (param.length == 2) {
	                var key = decodeURIComponent(param[0]);
	                var val = decodeURIComponent(param[1]);
	                if (paramObj.hasOwnProperty(key)) {
	                    paramObj[key] = jQuery.makeArray(paramObj[key]);
	                    paramObj[key].push(val);
	                }
	                else {
	                    paramObj[key] = val;
	                }
	            }
	        }
	        return paramObj;
	    },
	    
	    cancelBubble: function(_event) {
	        if (_event && _event.stopPropagation)
	            _event.stopPropagation();
	        else
	            window.event.cancelBubble=true;
	    },
	    
	    cancelDefault: function(_event) {
	        if(_event && _event.preventDefault){
	            _event.preventDefault();
	        } else{
	            window.event.returnValue = false;
	        }
	        return false;
	    },
	    
	    reflow: function(obj) {
	        jQuery(obj).each(function() {
	            jQuery(this).hide().show();
	        });
	    },
	    
	    dateformat:function(datetime,type){
	        if(type=='full'){
	            return new Date(datetime).strftime('%Y年%m月%d日, %H:%M:%S');
	        }
	        if(!type||type=='medium'){
	            return new Date(datetime).strftime('%m月%d日%H:%M');
	        }
	    },
	    emailGoto:function(email){
	    	if(!this.isEmail(email)){
	    		return email;
	    	}
	    	var emailList = {
	    		"gmail.com":"http://gmail.com",
                "hotmail.com":"http://www.hotmail.com",
                "live.com":"http://www.hotmail.com",
                "126.com":"http://mail.126.com",
                "163.com":"http://mail.163.com",
                "sina.com":"http://mail.sina.com.cn",
                "sina.cn":"http://mail.sina.com.cn",
                "qq.com":"http://mail.qq.com",
                "vip.qq.com":"http://mail.qq.com",
                "foxmail.com":"http://mail.qq.com",
                "yahoo.com":"http://mail.yahoo.com",
                "yahoo.com.tw":"http://mail.yahoo.com.tw",
                "yahoo.com.hk":"http://mail.yahoo.com.hk",
                "sohu.com":"http://mail.sohu.com",
                "yeah.net":"http://wwww.yeah.net",
                "189.cn":"http://mail.189.cn"
	    	};
	    	var domain = email.split('@')[1];
	    	return emailList[domain] || 'http://mail.'+ domain;
	    },
	    isEmail:function(email){
	    	return /^([a-z0-9A-Z]+[-|._]*)*[a-z0-9A-Z]@([a-z0-9A-Z]+(-[a-z0-9A-Z]+)?.)+[a-zA-Z]+$/.test(email);
	    },
	    isMobile:function(mobile){
	    	return /^\d{11}$/.test(mobile);
	    },
        isTelephone:function(telephone){
            return /^(0[0-9]{2,3}-)?([2-9][0-9]{6,7})+(-[0-9]{1,4})?$/.test(telephone);
        },
        isZipcode:function(zipcode){
            return /^\d{6}$/.test(zipcode);
        },
        isDigit:function(digit,len){
            if(len){
                return new RegExp('^\d{'+len+'}$','g').test(digit);
            }else{
                return /^\d+$/.test(digit);
            }
        },
	    uniqueID:function(){
	    	return Date.now().toString(36);
	    },
        setStore:function(key,value){
            var storage = window.localStorage;
            if(!storage) return '';
            storage.setItem(key,value);

        },
        getStore:function(key){
            var storage = window.localStorage;
            if(!storage) return '';
            return storage.getItem(key) || '';
        },
        formVerify:{
            error:function(input,message){
                var tag = input.data('tag') || tools.uniqueID(),
                    panel = DOMPanel.getPanel();
                $('.message[data-tag="'+tag+'"]',panel).remove();
                input.data('tag',tag);
                var tmpl = $('<span class="message"><i class="aicon-wrong"></i><span class="error">'+message+'</span></span>');
                tmpl.attr('data-tag',tag).appendTo(panel);
                var inputitme = input.parents('.input-item'),
                    offset = inputitme.offset(),
                    w = inputitme.width(),
                    h = inputitme.height();
                tmpl.css({'position':'absolute','left':offset.left+w+15,'top':offset.top+5,'z-index':1});
                input.focus();
                inputitme.addClass('error');
            },
            success:function(input,message){
                var tag = input.data('tag') || tools.uniqueID(),
                    panel = DOMPanel.getPanel();
                $('.message[data-tag="'+tag+'"]',panel).remove();
                input.data('tag',tag);
                var tmpl = $('<span class="message"><i class="aicon-right"></i></span>');
                tmpl.attr('data-tag',tag).appendTo(panel);
                var inputitme = input.parents('.input-item'),
                    offset = inputitme.offset(),
                    w = inputitme.width(),
                    h = inputitme.height();
                tmpl.css({'position':'absolute','left':offset.left+w+15,'top':offset.top+5,'z-index':1});
                inputitme.removeClass('error');
            },
            clear:function(){
                $('.message',DOMPanel.getPanel()).remove();
            }
        },
        redirect:function(ele){
            var timerEle = ele,
            total = parseInt(timerEle.text(),10);
            var timer = setInterval(function(){
                total--;
                if(total==0){
                    window.location.href = timerEle.siblings('a').attr('href') || visitor.rootPath;
                    return;
                }
                timerEle.html(total);
            },1000);
        }
	};
});
/** 全局模板 **/
window.Template = null;
$(function() {
    Template = jQuery('#glodonTempl').html();
});
/** 所有由脚本创建的DOM结构都应该放置在这个容器里**/
(function () {

    var panel = null;

    this.DOMPanel = {

        append: function (dom) {
            this.getPanel().append(dom);
        },

        prepend: function (dom) {
            this.getPanel().prepend(dom);
        },

        getPanel: function () {
            if (panel === null) {
                panel = jQuery('#domPanel');
                if (panel.size() === 0) {
                    panel = jQuery('<div id="domPanel" />').prependTo('body');
                }
            }

            return panel;
        }
    };

})();
/**指定位置**/
var Offset = function(element, o){
    this.options = {
        top: null,
        left: null
    };
    jQuery.extend(this.options,o);
    this.initialize(element);   
};

Offset.prototype={
    initialize: function(element) {
        this.element = jQuery(element);
        this.setOffset();
        this.listenResize();
    },
    
    setOffset: function() {
        var left = this.options.left;
        // 如果LEFT没有指定 那么水平居中
        if(left == null) {
            left = (jQuery(window).width() - this.element.outerWidth()) / 2;
            left = Math.max(0, left);
        }
    
        var top = this.options.top;
        // 如果TOP没有指定 那么垂直居中
        if(top == null) {
            top = (jQuery(window).height() - this.element.outerHeight()) / 2;
            top = Math.max(0, top);
        }
        
        // 如果元素不是fixed定位 那么加上滚动条距离
        if(this.element.css('position') != 'fixed') {
            left += jQuery(document).scrollLeft();
            top += jQuery(document).scrollTop();
        }
        
        this.element.css({left:left, top:top});
    },
    
    listenResize: function() {
        var self = this;
        var contextProxy = function() {
            // 防止销魂元素后导致内存泄露（因为RESIZE事件是注册在WINDOW对象上 而不是ELEMENT元素上）
            if(self.element.parent().size() === 0) {
                jQuery(window).unbind('resize', contextProxy);
            }
            else if(self.element.is(':visible') && parseInt(self.element.css('top')) >= 0) {
                self.setOffset();
            }
        };
        jQuery(window).resize(contextProxy);
    }
};

/**提示smallnot**/
SmallNote=function(o){
    this.options={
        top: 0, time: 4000, pattern: null,text:'加载中...',hold:false,remove:false,callback:jQuery.noop
    };
    jQuery.extend(this.options, o);
    var element = this.element = jQuery('<div class="smallnote">' + this.options.text + '</div>');
    element.css({top: this.options.top});
    
    // 额外的定制样式 目前支持的只有一种： error
    // 如果传递额外的类型 需要自行定义style, 需要注意的是class会自动添加前缀：supernatant-[pattern]
    if(this.options.pattern !== null) {
        element.addClass('smallnote-' + this.options.pattern);
    }

    // 保持单例
    if(SmallNote.present) {
        SmallNote.present.remove();
    }
    if(!this.options.remove){
        SmallNote.present = this;
        DOMPanel.append(element);
        this.offset = new Offset(element, {top: this.options.top});
        if(!this.options.hold){
            // 启用销毁定时器
            this.destroyTimer();
        }
    }
};
SmallNote.prototype={
    destroyTimer: function() {
        var that = this;
        setTimeout(function() {
            that.element.fadeOut('slow', function() {
                that.remove();
                that.options.callback.call(that);
            });
        }, this.options.time);
    },
    remove:function(){
        return this.element && this.element.remove();
    }
};
function smallnote(text,options){
    var o;
    if(options){
        options.text=text;
        o=options;
    }else{
        o={text:text};
    }
    new SmallNote(o);
}
/**loading 加载开始**/
jQuery(function () {
    $.fn.loading = function(o){
        o = o || "正在加载...";
        $(this).html('');
        $(this).append('<div style="margin:20px"><img style="margin-right:10px;" src="'+visitor.staticPath+'/images/modules/loading.gif">'+o+'</div>');
    };
});
/**loading 加载结束**/
/**HTML各种功能判断**/
$(function() {
   jQuery.support.placeholder = false;
   var test = document.createElement('input');
   if('placeholder' in test && !($.browser.msie && $.browser.version == '10.0')) jQuery.support.placeholder = true;
   //jQuery.support.placeholder = false;
});
/**
 * placeholder实现
 */
 $(function () {
    $.fn.placeholder=function(o){
        if(typeof o == 'string'){
            if(!jQuery.support.placeholder){
                $(this).siblings('label').html(o);
            }else{
                $(this).attr('placeholder',o);
            }
            return false;
        }
        if(jQuery.support.placeholder) return false;
        var target = jQuery(this),
            parent = target.parent(),
            element = jQuery('<div class="placeholder">'
                          +'<label>'+target.attr('placeholder')+'</label>'
                       +'</div>');
        target.prop('placeholder','');
        element.append(target);
        parent.append(element);
        var label = target.siblings('label');
        if (target.val()){
            label.hide();
        }
    };
    $(document).on('change input propertychange focus blur keyup','.placeholder input,.placeholder textarea',function (e) {
        var input = jQuery(this),
            label = jQuery(this).siblings('label');
        if(input.val().length > 0 || (e.type == 'keyup' && !e.ctrlKey && !e.altKey && !e.shiftKey)) {
            label.hide();
        }
        else {
            label.show();
        }
    });
    // 添加一个FOCUS状态
    $(document).on('focus','.placeholder input, .placeholder textarea',function () {
        var input = jQuery(this);
        input.parent('.placeholder').addClass('focus');
    });
    $(document).on('blur','.placeholder input, .placeholder textarea',function () {
        var input = jQuery(this);
        input.parent('.placeholder').removeClass('focus');
    });
    $(document).on('click','.placeholder label',function () {
        var label = jQuery(this),
            input = jQuery(this).siblings('input,textarea');
        input.focus();
    });
    if(!jQuery.support.placeholder){
        jQuery('input[placeholder],textarea[placeholder]').each(function(){
            $(this).placeholder();
        });
    }
});
//enter键提交
$(function(){
    //按enter键则触发提交操作
    $.fn.inputEnter=function(callback){
        var self = $(this),
            bargs = Array.prototype.slice.call(arguments, 1);
        self.keypress(function(e){
            if(e.keyCode === 13){

                callback.apply(self,bargs);
            }
        });
    }
});
/**弹层组建**/
//遮罩层
MaskLayer={
	getElement:function(){
        if (!this.element) {
            this.element = jQuery('#masklayer');
            if (this.element.size() == 0) {
                this.element = jQuery('<div id="masklayer" />').appendTo(DOMPanel.getPanel());
            }
        }
        return this.element;
    },
    show: function () {
        this.getElement().show();
    },
    hide: function () {
        this.getElement().hide();
    }
};

// 弹窗单例管理
DialogManager = {
    present: null,
    
    keepSingle: function (dialog) {
        if (this.present instanceof CommonDialog) {
            this.present.close();
            this.present = null;
        }
        this.present = dialog;
        this.bindEvent();
    },

	escCancel: function (e) {
		if (e.keyCode == 27 && DialogManager.present) {
			var dialog = DialogManager.present,
				element = dialog.element;

			if (element.is(':visible') && element.css('top').toInt() > 0) {
				dialog.hide();
			}
		}
	},

    bindEvent: function () {
        jQuery(document).keydown(this.escCancel);
        this.bindEvent = jQuery.noop;
    }
};

// 弹窗
CommonDialog = function(o){
	this.options={
		width: 560,
        title: '提示',
        message: '你木有事做吗？你真的木有事做吗？那你替我写封情书给布娃娃吧~',
        isFixed: true,
        denyEsc: false,
        modal: true,
        minify: false,
        independence: false,
        isAlert:false,
        isConfirm:false,
        okText:'确定',
        cancelText:'取消',
        okCallback:jQuery.noop,
        cancelCallback:jQuery.noop
    };
    jQuery.extend(this.options, o);
    this.init();
};
CommonDialog.prototype={
	init:function(message, options){
	    //做个参数格式兼容 方便调用
        if (typeof message === 'object') {
            this.setOptions(message);
        }
        else if (typeof message === 'string') {
            this.options.message = message;
            this.setOptions(options);
        }

        var element = this.element = this.getElement();
        this.bindEvent();

        // 保持单例
        if (this.options.independence !== true) DialogManager.keepSingle(this);

        // 添加到页面
        DOMPanel.append(element);

        // 定位
        this.offset = new Offset(element, {
            top: this.options.top,
            left: this.options.left
        });

        // 显示
        this.show();
	},
	getElement: function () {
        var fragment = ['<div class="common-dialog">', '<div class="wrapper">', '<header>', '<h3 class="title">',
        this.options.title, '</h3>',
        this.options.minify ? '<a class="minify">最小</a>' : '', '<a class="aicon-close close"></a>', '</header>', '<section>',
        this.options.message, '</section>', '</div>', '</div>'].join('');
        var element = jQuery(fragment);
        if(this.options.isAlert){
        	element.find('.wrapper').append('<footer><button class="input-ok"><span>' + this.options.okText + '</span></button></footer>');
        }
        if(this.options.isConfirm){
        	element.find('.wrapper').append('<footer><button class="input-ok"><span>' + this.options.okText + '</span></button></footer>');
        	element.find('footer').append('<button class="input-cancel"><span>'+ this.options.cancelText +'</span></button>');
        }	
        // 设置样式
        element.css({
            width: this.options.width
        });
        if (this.isFixed === true && jQuery.support.fixed) {
            element.css({
                position: 'fixed'
            });
        }
        
        return element;
    },
    reLocation:function(){
        // 定位
        this.offset = new Offset(this.element, {
            top: this.options.top,
            left: this.options.left
        });
    },
    setWith:function(width){
        // 设置样式
        this.element.css({
            width: width
        });
        this.options.width = width;
    },
    getHeader: function () {
        return this.find('.wrapper > header');
    },
    
    getFooter: function () {
        return this.find('.wrapper > footer');
    },

    show: function () {
        if (this.options.modal === true) MaskLayer.show();
        this.element.show();
        this.offset.setOffset();
    },

    hide: function () {
        MaskLayer.hide();
        this.element.css('top', '-9999px');
    },

    close: function (keepMask) {
        !keepMask && MaskLayer.hide();
        this.element.remove();
    },

    find: function (rule) {
        return this.element.find(rule);
    },

    confirm:function(){
        var self = this;
        self.element.find('footer .input-ok').trigger('click');
    },

    bindEvent: function () {
        var self = this;
        this.find('header .close').click(function () {
            self.close();
        });
        this.find('header .minify').click(function () {
            self.hide();
        });
        this.element.find('footer .input-ok').click(function () {
            if (self.options.okCallback.call(self) !== false) {
            	self.close();
            }
        });
        this.element.find('footer .input-cancel').click(function () {
            if (self.options.cancelCallback.call(self) !== false) {
            	self.close();
            }
        });
    }
};