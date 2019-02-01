let Drawer;
const width = 750, height = 1700;
const minThick = 5, maxThick = 70;
let stage;

let go = function() {
	//初始化舞台

	stage = new createjs.Stage(document.getElementById('canvas'));
	createjs.Touch.enable(stage);
	createjs.Ticker.framerate = 60;
	createjs.Ticker.timingMode = 'raf';
	createjs.Ticker.addEventListener("tick", stage);

	//创建画板构造函数
	let draw = new Drawer;

	//创建选择颜色按钮
	let colorButtons = new createjs.Container;

	let colors1 = ['#6598fe','#000000','#fefefe','#0000fe','#fefe00','#32fe32','#65cb65','#32cbfe'],
		colors2 = ['#fe9800','#989898','#fe00fe','#fe0000','#9800fe','#650000','#980000','#cb6565'];

	rangeColorButton(colors1,20);
	rangeColorButton(colors2,80);
	colorButtons.height = 100;
	colorButtons.visible = false;

	colorButtons.on('click',selectColor);

	colors1 = null;
	colors2 = null;

	cache(colorButtons);


	//出现、隐藏颜色按钮的按钮
	let colorControler = new createjs.Container;
	let white = new createjs.Shape(new createjs.Graphics().f('white').s('gray').dc(0,0,25)).set({x:90});
	let picker = new createjs.Shape().set({x:90});
	picker.fillcolor = picker.graphics.f('black').command;
	picker.graphics.s('gray').dc(0,0,20);
	colorControler.addChild(white,picker);
	colorControler.picker = picker;
	colorControler.on('click',function() {colorButtons.visible = !colorButtons.visible});

	white = null;
	picker = null;

	cache(colorControler)


	//控制线条粗细的控制条
	let thickControler = new createjs.Container;
	let slideWidth = 450, slideHeight = 10;
	let bgRec = new createjs.Shape(new createjs.Graphics().f('gray').rr(0,-slideHeight/2,slideWidth,slideHeight,slideHeight/2));
	let showRec = new createjs.Shape;
	let slideButton = new createjs.Shape;

	thickControler.custom = {};
	thickControler.custom.slideColor = showRec.graphics.f('black').command;
	thickControler.custom.slideWidth = showRec.graphics.rr(0,-slideHeight/2,0,slideHeight,slideHeight/2).command;
	thickControler.custom.slideButton = slideButton;
	thickControler.custom.slideButtonColor = slideButton.graphics.f('black').command;
	thickControler.custom.limit = slideWidth;
	slideButton.graphics.dc(0,0,20);

	thickControler.addChild(bgRec,showRec,slideButton);
	thickControler.x = 250;

	thickControler.on('pressmove',swipSlide);

	slideWidth = slideHeight = null;
	bgRec = null;
	showRec = null;
	slideButton = null;

	cache(thickControler);

	//撤销按钮
	let cancle = new createjs.Shape(new createjs.Graphics().f('black').r(0,0,100,100));

	stage.addChild(cancle);

	cancle.on('click',function() {draw.backLine()});

	cache(cancle);


	//预加载资源
	let queue = new createjs.LoadQueue(false);
	let loadList = [{src:'image/bg.png',loadTimeout:20000,id:'bg'}];
	queue.on('complete',loadup);
	queue.loadManifest(loadList);
	loadList = null;

	function loadup() {
		//把背景图加到drawer中
		let bg = new createjs.Bitmap(queue.getResult('bg'));
		let bound = bg.getBounds();
		bg.set({regX:bound.width/2,regY:bound.height/2,x:width/2});
		bg.y = document.documentElement.clientHeight/2;
		draw.addBg(bg);

		//添加所有东西

		stage.addChild(draw,colorButtons,colorControler,thickControler);
		resize();
	}


	///自动排列颜色按钮
	function rangeColorButton(colorArry,y) {
		let padding = 130;
		let startx = padding;
		let sumX = (width-(padding*2))/(colorArry.length-1);
		let circle;
		let radius = 20;

		for(i=0;i<colorArry.length;i++){
			circle = new createjs.Shape;
			circle.graphics.f(colorArry[i]).s('gray').ss(2).dc(0,0,radius);
			circle.set({x:startx+sumX*i,y:y,color:colorArry[i]});

			colorButtons.addChild(circle);
		}
	}

	function selectColor(e) {
		e.target.parent.visible = false;
		draw.setColor(e.target.color);
		colorControler.picker.fillcolor.style = e.target.color;
		thickControler.custom.slideColor.style = e.target.color;
		thickControler.custom.slideButtonColor.style = e.target.color;
	}

	function resize(){
		colorButtons.y = document.documentElement.clientHeight - colorButtons.height - 100;
		colorControler.y = colorButtons.y + colorButtons.height + 50;
		thickControler.y = colorControler.y;
	}

	function swipSlide(e) {
		if(e.localX<0 || e.localX>thickControler.custom.limit)  return;

		if(e.type==='pressmove'){
			if(e.target === thickControler.custom.slideButton){
				thickControler.updateCache()
				e.target.x = e.localX;
				thickControler.custom.slideWidth.w = e.localX;
				draw.thickness((maxThick-minThick)*(thickControler.custom.slideButton.x/thickControler.custom.limit)+minThick);
			}
		}
	}
};

///画板的构造函数
(function() {

	let bound = new createjs.Rectangle(0,0,width,1700);

	function drawer(){
		this.Container_constructor();
		this.on('pressmove',drawline,this);
		this.on('mousedown',addline,this);
		this.on('pressup',onup,this);

		this.custom = {};
		this.custom.color = 'black';
		this.custom.thick = new createjs.Graphics.StrokeStyle(5,'round','round');
		this.custom.line = null;
		this.custom.builder = new createjs.SpriteSheetBuilder;
	}

	let p = createjs.extend(drawer,createjs.Container);

	function addline(e) {
		let line = new createjs.Shape;
		let color = this.custom.color;
		let thick = this.custom.thick;

		line = new createjs.Shape;
		line.graphics.s(color).mt(e.localX,e.localY);
		line.graphics.append(thick);
		this.addChild(line);
		this.custom.line = line;
		this.moved = false;

		cache(line);
	}

	function drawline(e) {
		this.moved = true;
		this.custom.line.graphics.lt(e.localX,e.localY);
		this.custom.line.updateCache()
	}
   
	function onup(e) {
		!this.moved && this.backLine();
		this.custom.line.cache(0,0,width,1500);
		this.custom.line.graphics.c();
	}

	p.backLine = function() {
		this.numChildren>1 && this.removeChildAt(this.numChildren-1);
	}

	p.setColor = function(color) {
		this.custom.color = color;
	}

	p.thickness = function(thick) {
		return this.custom.thick.width = thick||this.custom.thick.width;
	}

	p.save = function(){
		this.custom.builder.addFrame(this,bound);
		this.custom.img = createjs.SpriteSheetUtils.extractFrame(this.custom.builder.build(),0);
	}

	p.addBg = function(o) {
		let bound = o.getTransformedBounds();

		this.addChild(o);
		this.setChildIndex(o,0);
		this.mask = new createjs.Shape;
		this.mask.graphics.r(o.x-bound.width/2,o.y-bound.height/2,bound.width,bound.height);
	}

	Drawer = createjs.promote(drawer,'Container');
})();


function cache() {
	
	for(let i=0;i<arguments.length;i++){
		arguments[i].cache(-100,-100,width,height);
	}

	if(!cache.ground){
		let bg = new createjs.Shape(new createjs.Graphics().f('white').r(0,0,width,height));
		bg.cache(0,0,width,height);
		stage.addChild(bg);
		cache.ground = true;
	}
}

