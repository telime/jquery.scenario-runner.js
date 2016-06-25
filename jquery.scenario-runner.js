/*
Scenario Runner 1.1
(old name: Visual builder)
2015-2016 telime(atali)
MIT License

use: 
jQuery1.1x.js
jQuery.imgloader.js
slick.js
*/
// debug 
var _visual_debug = false;

if (!('console' in window)) {
	window.console = {};
	window.console.log = function(str){
		return str;
	};
}

/*
 Check User Agent 2015 + IE legacy check
 2015 W3G.
 https://w3g.jp/blog/js_browser_sniffing2015
*/
var _ua = (function(u){
	return {
		Tablet: (u.indexOf("windows") != -1 && u.indexOf("touch") != -1)
			|| u.indexOf("ipad") != -1
			|| (u.indexOf("android") != -1 && u.indexOf("mobile") == -1)
			|| (u.indexOf("firefox") != -1 && u.indexOf("tablet") != -1)
			|| u.indexOf("kindle") != -1
			|| u.indexOf("silk") != -1
			|| u.indexOf("playbook") != -1,
		Mobile: (u.indexOf("windows") != -1 && u.indexOf("phone") != -1)
			|| u.indexOf("iphone") != -1
			|| u.indexOf("ipod") != -1
			|| (u.indexOf("android") != -1 && u.indexOf("mobile") != -1)
			|| (u.indexOf("firefox") != -1 && u.indexOf("mobile") != -1)
			|| u.indexOf("blackberry") != -1,
		IE: (function(){
			if (u.indexOf("msie") == -1) return false;
			
			var appVersion = window.navigator.appVersion.toLowerCase();
			if (appVersion.indexOf("msie 7.") != -1) {
				return '7';
			} else if (appVersion.indexOf("msie 8.") != -1) {
				return '8';
			} else if (appVersion.indexOf("msie 9.") != -1) {
				return '9';
			} else {
				return '10';
			}
		}())
	}
})(window.navigator.userAgent.toLowerCase());

var visualBuild = (function($){
	'use strict';
	var evScreenShow = new $.Event('screen_show');
	var evScreenHidden = new $.Event('screen_hidden');
	
	//functions
	var idToNumber = function($el, str_hash) {
		var success = false;
		var _c = 0;
		
		$el.each(function(){
			var _id = '#' + this.id;
			if(_id == str_hash){
				success = true;
				return false;
			}
			_c++;
		});
		
		if(success) return _c;
		else return -1;
	};
	
	var stopAnimate = (function($target){
		$target.stop(true).removeAttr('style').hide();
	});
	
	var animCtrl = (function(elStop, elStart ,objTimeline){
		stopAnimate($('.anim', elStop));
		$(elStop).trigger(evScreenHidden, {});
		
		$(elStop).off();
		
		if(typeof objTimeline === 'undefined') return;
		if(typeof elStart === 'undefined') return;
		
		var _id = ('id' in elStart)? elStart.id : 'other';
		console.log('animate', _id );
		
		if(typeof objTimeline[_id] === 'function') {
			objTimeline[_id](elStart);
		}
		$(elStart).trigger(evScreenShow, {});
	});
	
	//contsractor
	return (function($target, objTimeline){
		//追加要素生成
		$('.anim', $target).hide();
		$('> div', $target).wrapAll('<div class="visual-b-wrapper"></div>');
		$target.append('<div class="visual-b-loader"></div>');
		$target.append('<div class="visual-b-debug"></div>');
		
		//変数準備
		var $cont = $('> .visual-b-wrapper', $target).hide();
		var $loader = $('> .visual-b-loader', $target).hide();
		var $debugwindow = $('> .visual-b-debug', $target).hide();
		
		var $elPrevSlide;
		var $elCurrentSlide;
		var loader = new $.ImgLoader();
		
		//パブリックオブジェクト
		var func = {
			target : $target,
			slide : $cont,
			start : (function(){
				loader.load();
			}),
			hashMove : (function(str_hash) {
				var els = func.slide.slick('getSlick');
				var _c = idToNumber(els.$slides, str_hash);
				if(_c >= 0){
					console.log('hashMove', _c );
					func.slide.slick('slickGoTo', _c);
				}
				
				return;
			})
		};
		
		//スライダー設定
		$cont.on('beforeChange', function(event, slick, currentSlide, nextSlide){
			$elPrevSlide = slick.$slides[currentSlide];
			$elCurrentSlide = slick.$slides[nextSlide];
			console.log('nextSlide',{'id': nextSlide,'prev': $elPrevSlide, 'current': $elCurrentSlide});
		});
		
		$cont.on('afterChange', function(event, slick, currentSlide){
			console.log('beforeSlide',{'prev': $elPrevSlide, 'current': $elCurrentSlide});
			animCtrl($elPrevSlide, $elCurrentSlide, objTimeline);
		});
		
		$cont.on('init', function(event, slick){
			console.log('slickinit',slick);
			$elPrevSlide = slick.$slides[slick.currentSlide];
			$elCurrentSlide = slick.$slides[slick.currentSlide];
		});
		
		$cont.on('click', 'a.visual-move', function(event){
			event.preventDefault();
			func.hashMove(this.hash);
		});
		
		//ローダー設定
		loader.on('allload', function($img){
			$loader.hide();
			$cont.fadeIn();
			animCtrl($target, $elCurrentSlide, objTimeline);
		});
		
		loader.on('progress', function(progressInfo){
			$loader.show();
			var percent = (Math.floor(progressInfo.loadedRatio * 1000) / 10);
			$loader.html('<p class="percent">' + percent + '<span>%</span></p>');
		});
		
		//loader entry
		$('img', $cont).each(function(){
			loader.add($(this).attr('src'));
		});
		
		//rollover
		var supfix = "_on";
		$cont.on({
			'mouseenter': (function(){
				var _self = $(this);
				if(_self.hasClass('hover')){
					_self.attr("src",_self.attr("src").replace(/^(.+)_on(\.[a-z]+)$/, "$1$2"));
				}
				_self.addClass('hover').attr("src",_self.attr("src").replace(/^(.+)(\.[a-z]+)$/, "$1"+supfix+"$2"));
			}),
			'mouseleave': (function(){
				$(this).removeClass('hover').attr("src",$(this).attr("src").replace(/^(.+)_on(\.[a-z]+)$/, "$1$2"));
			})
		}, 'img.visual-rollover,a.visual-rollover img');
		
		$('img.visual-rollover, a.visual-rollover img').each(function(){//preload
			var _src = $(this).attr("src").replace(/^(.+)(\.[a-z]+)$/, "$1"+supfix+"$2");
			loader.add(_src);
		});
		
		//構成
		$cont.slick({
			accessibility: false,
			fade: true,
			dots: (_visual_debug)? true : false,
			arrows: false,
			draggable: false,
			swipe: false,
			slidesToShow: 1,
			adaptiveHeight: false
		});
		
		return func;
	});
	
}(jQuery));
