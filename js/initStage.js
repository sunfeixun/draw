let Drawer;
const width = 750, height = 1700;
let stage;
let draw;
//let vc = new VConsole

let go = function() {

	let colors1 = ['#6598fe','#00fe00','#0000fe','#fefe00','#32fe32','#65cb65','#32cbfe'],
		colors2 = ['#fe9800','#989898','#fe00fe','#fe0000','#9800fe','#650000','#980000'];	
	//初始化舞台

	stage = new createjs.Stage(document.getElementById('canvas'));
	createjs.Touch.enable(stage);
	let container = stage.addChild(new createjs.Container);
	let rollEvent = null, oldy, limitY;

	//创建画板构造函数
	draw = new Drawer(colors1[0],5);
	let drawContainer;
	let boardHeight;

	const boardTop = 95, marginTop = 10, marginLr = 10, marginBottom = 5;

	let drawMask = null;
	let controller, thickButton, thickSlide, slideWidth = 450;
	const minThick = 5, maxThick = 70;

	//预加载资源
	let queue = new createjs.LoadQueue(false);
	let loadList = ['drawer.png','boardhead.png','back.png','controlbg.png','save.png','test1.jpg']
	let imgPath = 'image/';

	for(let i=0;i<loadList.length;i++){
		loadList[i] = {src:imgPath+loadList[i],loadTimeout:20000,id:loadList[i]};
	}

	queue.on('complete',loadup);
	queue.loadManifest(loadList);
	loadList = null;

	function loadup() {
		//舞台背景
		//container.addChild(new createjs.Bitmap(queue.getResult('bg.jpg')));

		//画板UI
		drawContainer = container.addChild(new createjs.Container);

		let boardhead = getImage('boardhead.png');
		boardhead.regX = boardhead.getBounds().width/2;
		boardhead.x = width/2;

		//回退和保存按钮
		let back = getImage('back.png').set({funcName:'back',x:40,y:20});
		let save = getImage('save.png').set({funcName:'save',x:660,y:20});


		//画板shape
		let boardbg = new createjs.Shape;
		let round = 30
		boardHeight = boardbg.graphics.f('#C6E7F4').rr(0,0,750,100,round).command;
		draw.y = boardbg.y = boardTop;

		drawMask = new createjs.Shape;
		drawMask.height = drawMask.graphics.rr(marginLr,boardTop+marginTop,width-marginLr*2,100,round).command;

		let test = getImage('test1.jpg');
		draw.addBg(test);

		draw.mask = drawMask;

		drawContainer.addChild(back,save,boardhead,boardbg,draw);
		drawContainer.on('click',drawFunc);

		//控制总容器
		controller = container.addChild(new createjs.Container);
		controller.addChild(new createjs.Bitmap(queue.getResult('controlbg.png')));

		//线条粗细控制板
		let slideContainer = controller.addChild(new createjs.Container);
		let pos = {x:195,y:105};
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

		controller.slideControler = slideContainer;


		//颜色选择面板
		let colorContainer = controller.addChild(new createjs.Container);
		let beginx = 200, sumX = 75, y1 = 198, sumY = 45;
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
			colorCircle.set({x:beginx+(i*sumX),y:y1+sumY,val:colors2[i]});
			colorContainer.addChild(colorCircle);
		}

		colorContainer.on('click',selectColor);

		controller.colorControler = colorContainer;

		container.on('mousedown',roll);

		resize();

		function getImage(name,mode) {
			let img = new createjs.Bitmap(queue.getResult(name));
			if(mode==='center'){
				img.regX = img.getBounds().width/2;
				img.regY = img.getBounds().height/2;
			}
			return img;
		}

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
			draw.save();
		}
	}

	function selectColor(e) {
		thickSlide.custom.color.style = thickButton.custom.color.style = draw.setColor(e.target.val);
		stage.update();
	}

	function resize(){
		let img = draw.getImage();
		let maxHeight
		let imgHeight;

		img.x = marginLr;
		img.scaleX = img.scaleY = (width - marginLr*2)/img.getBounds().width;

		maxHeight = document.documentElement.clientHeight - controller.getTransformedBounds().height - boardTop;
		imgHeight = img.getTransformedBounds().height;

		boardHeight.h = imgHeight>maxHeight? maxHeight:imgHeight;
		drawMask.height.h = boardHeight.h - marginTop - marginBottom;
		controller.y = boardTop + boardHeight.h;

		stage.update();
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

	function roll(e) {
		if(draw.contains(e.target) || controller.slideControler.contains(e.target) || controller.colorControler.contains(e.target)) return;

		if(e.type==='mousedown') oldy = e.localY;
		container.y += e.localY - oldy;
		oldy = e.localY;

		if(container.y>0||container.y<limitY){
			container.y = container.y>0? 0:container.y;
			container.y = container.y<limitY? limitY:container.y;
		}

		stage.update();
	}
};

///画板的构造函数
(function() {

	let line;

	function drawer(color,thick){
		this.Container_constructor();
		this.on('pressmove',drawline,this);
		this.on('mousedown',addline,this);
		this.on('pressup',onup,this);

		this.custom = {};
		this.custom.color = color||'black';
		this.custom.thick = thick || 10;
		this.custom.builder = new createjs.SpriteSheetBuilder;
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
				this.addChild(line);
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
		if(this.numChildren>1){
			let unline = this.getChildAt(this.numChildren-1);
			this.removeChild(unline);
			stage.update();
		}
	}

	p.setColor = function(color) {
		this.custom.color = color;
		return color;
	}

	p.thickness = function(thick) {
		return this.custom.thick = thick||this.custom.thick;
	}

	p.save = function(){
		this.custom.builder.addFrame(this,this.getBounds());
		this.custom.img = createjs.SpriteSheetUtils.extractFrame(this.custom.builder.build(),0);
		console.log(this.getBounds());
		window.img = this.custom.img;
	}

	p.getImage = function() {
		return this.custom.bgImage;
	}

	p.addBg = function(o) {
		this.custom.bgImage = this.addChild(o);
	}

	Drawer = createjs.promote(drawer,'Container');
})();
