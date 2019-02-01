let Drawer;
const width = 750, height = 1700;
let stage;
//let vc = new VConsole

let go = function() {

	let colors1 = ['#6598fe','#00fe00','#0000fe','#fefe00','#32fe32','#65cb65','#32cbfe'],
		colors2 = ['#fe9800','#989898','#fe00fe','#fe0000','#9800fe','#650000','#980000'];	
	//初始化舞台

	stage = new createjs.Stage(document.getElementById('canvas'));
	createjs.Touch.enable(stage);
	let container = stage.addChild(new createjs.Container);
	//createjs.Ticker.framerate = 60;
	//createjs.Ticker.timingMode = 'raf';
	//createjs.Ticker.addEventListener("tick", stage);

	//创建画板构造函数
	let draw = new Drawer(colors1[0],5);
	let controller, thickButton, thickSlide, slideWidth = 400;
	const minThick = 5, maxThick = 70;

	//预加载资源
	let queue = new createjs.LoadQueue(false);
	let loadList = ['bg.jpg','drawbg.png','drawer.png','back.png','upcloud.png','controlbg.png','save.png']
	let imgPath = 'image/';

	for(let i=0;i<loadList.length;i++){
		loadList[i] = {src:imgPath+loadList[i],loadTimeout:20000,id:loadList[i]};
	}

	queue.on('complete',loadup);
	queue.loadManifest(loadList);
	loadList = null;

	function loadup() {
		//舞台背景
		container.addChild(new createjs.Bitmap(queue.getResult('bg.jpg')));

		//画板UI
		let drawContainer = container.addChild(new createjs.Container);
		addImages(['drawbg.png','back.png','save.png',draw],[null,{x:10,y:20,funcName:'back'},{x:570,y:20,funcName:'save'},{x:12,y:94}],drawContainer);
		drawContainer.regX = drawContainer.getBounds().width/2;
		drawContainer.regY = drawContainer.getBounds().height/2;
		drawContainer.x = width/2;
		drawContainer.y = 550;
		draw.addBg(new createjs.Bitmap(queue.getResult('drawer.png')));

		drawContainer.on('click',drawFunc);


		//控制总容器
		controller = container.addChild(new createjs.Container);
		controller.addChild(new createjs.Bitmap(queue.getResult('controlbg.png')));

		//线条粗细控制板
		let slideContainer = controller.addChild(new createjs.Container);
		let pos = {x:170,y:68};
		let thickSlidebg = new createjs.Shape;
		thickSlide = new createjs.Shape;
		thickButton = new createjs.Shape;

		thickSlidebg.graphics.s('white').ss(10,1,1).mt(0,0).lt(slideWidth,0);

		thickSlide.custom = {};
		thickSlide.custom.color = thickSlide.graphics.s(colors1[0]).command;
		thickSlide.custom.lt = thickSlide.graphics.ss(10,1,1).mt(0,0).lt(0,0).command;

		thickButton.custom = {};
		thickButton.custom.color = thickButton.graphics.f(colors1[0]).command;
		thickButton.graphics.s('white').ss(8).dc(0,0,15);

		slideContainer.set(pos).addChild(thickSlidebg,thickSlide,thickButton);

		slideContainer.on('pressmove',swipSlide,null,false,thickButton);

		//颜色选择面板


		let colorContainer = controller.addChild(new createjs.Container);
		let beginx = 183, sumX = 58, y1 = 143, y2 = 188;
		let colorCircle;

		for(let i=0;i<colors1.length;i++){
			colorCircle = new createjs.Shape();
			colorCircle.graphics.f(colors1[i]).dc(0,0,15);
			colorCircle.set({x:beginx+(i*sumX),y:y1,val:colors1[i]});
			colorContainer.addChild(colorCircle);
		}

		for(i=0;i<colors2.length;i++){
			colorCircle = new createjs.Shape();
			colorCircle.graphics.f(colors2[i]).dc(0,0,15);
			colorCircle.set({x:beginx+(i*sumX),y:y2,val:colors2[i]});
			colorContainer.addChild(colorCircle);
		}

		colorContainer.on('click',selectColor);

		resize();

		stage.update();

		function addImages(imgnames,attrs,parent){
			for(let i=0;i<imgnames.length;i++){
				if(typeof(imgnames[i])==='string') imgnames[i] = new createjs.Bitmap(queue.getResult(imgnames[i]));
				attrs[i] && imgnames[i].set(attrs[i]);
				parent.addChild(imgnames[i]);
			}
		}
	}


	function drawFunc(e) {
		if(e.target.funcName==='back'){
			draw.backLine();
		}else if(e.target.funcName==='save'){

		}
	}

	function selectColor(e) {
		thickSlide.custom.color.style = thickButton.custom.color.style = draw.setColor(e.target.val);
		stage.update();
	}

	function resize(){
		let bound = controller.getBounds();
		controller.regX = bound.width/2;
		controller.x = width/2;
		controller.y = document.documentElement.clientHeight - bound.height - 30;
	}

	function swipSlide(e,btn) {
		if(e.localX<0 || e.localX>slideWidth || e.target!==btn)  return;

		if(e.type==='pressmove'){
			e.target.x = e.localX;
			thickSlide.custom.lt.x = e.localX;
			draw.thickness((maxThick-minThick)*(e.localX/slideWidth)+minThick);
			stage.update();
		}
	}
};

///画板的构造函数
(function() {

	let bound = new createjs.Rectangle(0,0,width,height);
	let line;
	//let graph = new createjs.Graphics;

	function drawer(color,thick){
		this.Container_constructor();
		this.on('pressmove',drawline,this);
		this.on('mousedown',addline,this);
		this.on('pressup',onup,this);

		this.custom = {};
		this.custom.color = color||'black';
		this.custom.thick = thick || 10;
		this.custom.builder = new createjs.SpriteSheetBuilder;
		this.custom.staticBoard = this.addChild(new createjs.Container);
	}

	let p = createjs.extend(drawer,createjs.Container);

	function addline(e) {
		this.custom.ondown = true;

		line = new createjs.Shape;
		line.graphics.s(this.custom.color).ss(this.custom.thick,1,1).mt(e.localX,e.localY);
		this.addChild(line);
		this.moved = false;
	}

	function drawline(e) {
		this.moved = true;
		
		if(!this.custom.ondown)  return;

		this.moved = true;
		line.graphics.lt(e.localX,e.localY);
		stage.update()
	}
   
	function onup(e) {
		if(line){
			if(this.moved){
				this.custom.staticBoard.addChild(line);
				//line.cache();
				//line.graphics.store();
				//line = null;
			}else{
				this.removeChild(line);
			}
		}
		this.moved = false;
		this.custom.ondown = false;
	}

	p.backLine = function() {
		if(this.custom.staticBoard.numChildren>1){
			let unline = this.custom.staticBoard.getChildAt(this.custom.staticBoard.numChildren-1);
			this.custom.staticBoard.removeChild(unline);
			stage.update();
		}
		console.log(this.custom.staticBoard.numChildren)
	}

	p.setColor = function(color) {
		this.custom.color = color;
		return color;
	}

	p.thickness = function(thick) {
		return this.custom.thick = thick||this.custom.thick;
	}

	p.save = function(){
		this.custom.builder.addFrame(this,bound);
		this.custom.img = createjs.SpriteSheetUtils.extractFrame(this.custom.builder.build(),0);
	}

	p.addBg = function(o) {
		let bound = o.getTransformedBounds();
		this.custom.staticBoard.addChild(o);
		//this.custom.staticBoard.cache(o.x-bound.width/2,o.y-bound.height/2,bound.width,bound.height)
		//this.mask = new createjs.Shape;
		//this.mask.graphics.r(o.x-bound.width/2,o.y-bound.height/2,bound.width,bound.height);
	}

	Drawer = createjs.promote(drawer,'Container');
})();
