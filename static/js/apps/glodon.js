$(function(){
	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
	$.fn.ModelPreview = function(o){
		var self = this;
		self.options={
			container:self,
			stlUrl:'/static/dae/monster.dae'
	    };
	    var container = self.options.container,
	    	scene,cameraTarget, camera, plane, renderer, stats;
	    jQuery.extend(self.options, o);
	    var camera, cameraTarget, light, scene, renderer, mesh, controls, center;
		var particleLight, pointLight;
		var model, skin, collada;
	    loadDAE(self.options.stlUrl);
		//bindEvent();
		function loadDAE(path){
	    	var loader = new THREE.ColladaLoader();
			loader.options.convertUpAxis = true;
			loader.load(path, function (daeData) {
				collada = daeData;
				model = daeData.scene;
				skin = daeData.skins[ 0 ];
				model.updateMatrix();
				init();
				animate();
				bindEvent();
				//setCenter();
				tools.log(model);
				dae.scale.x = dae.scale.y = dae.scale.z = 0.002;
			
				//init();
				//animate();

			} );
	    }
		function init(){
			/*camera = new THREE.PerspectiveCamera( 45, container.width() / container.height(), 1, 500000);
			camera.position.z=100;
			camera.position.x=-0;
			camera.position.y=-0;*/
			camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
			camera.position.set( 2, 2, 100 );
			/*camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, 15 );
			camera.position.set( 3, 400, 800 );
			cameraTarget = new THREE.Vector3( 0, -0.25, 0 );*/

			scene = new THREE.Scene();
			//scene.fog = new THREE.Fog( 0x72645b, 2, 15 );

			// Grid

			var material = new THREE.LineBasicMaterial( { color: 0x303030 } );
			var geometry = new THREE.Geometry();
			var floor = -0.04, step = 1, size = 14;

			for ( var i = 0; i <= size / step * 2; i ++ ) {

				geometry.vertices.push( new THREE.Vector3( - size, floor, i * step - size ) );
				geometry.vertices.push( new THREE.Vector3(   size, floor, i * step - size ) );
				geometry.vertices.push( new THREE.Vector3( i * step - size, floor, -size ) );
				geometry.vertices.push( new THREE.Vector3( i * step - size, floor,  size ) );

			}

			var line = new THREE.Line( geometry, material, THREE.LinePieces );
			//scene.add( line );
			// Add the COLLADA

			//model.getChildByName( 'camEye_camera', true ).visible = false;
			//model.getChildByName( 'camTarget_camera', true ).visible = false;

			scene.add( model );
			// Lights
			light = new THREE.AmbientLight(0xf2f2f2);
			light.position.set( 0, 0, 0 );
			scene.add( light );

			// renderer
			renderer = new THREE.WebGLRenderer( { antialias: true, alpha: false } );
			renderer.setSize( container.width(), container.height());
			renderer.setClearColor(0xf2f2f2, 1 );
			//renderer.gammaInput = true;
			//renderer.gammaOutput = true;
			//renderer.physicallyBasedShading = true;
			//renderer.shadowMapEnabled = true;
			//renderer.shadowMapCullFace = THREE.CullFaceBack;

			container.append( renderer.domElement );

			// stats
			stats = new Stats();
			stats.domElement.style.position = 'absolute';
			stats.domElement.style.top = '0px';
			container.append( stats.domElement );
		}

		function loadSTL(path){
	    	var loader = new THREE.STLLoader();
			loader.addEventListener( 'load', function (event){
				var geometry = event.content;
				var material = new THREE.MeshPhongMaterial( { ambient: 0xff5533, color: 0xff5533, specular: 0x111111, shininess: 200 } );
				mesh = new THREE.Mesh(geometry,material);
				//tools.log( geometry.boundingBox);
				setCenter(geometry);
				//mesh.position.set( 0, 0, 0 );
				//mesh.rotation.set( -Math.PI/2, 0 , 0 );
				//mesh.scale.set(0.00013, 0.00013,0.00013);
				/*mesh.position.set( 0, - 0.37, - 0.6 );
				mesh.rotation.set( - Math.PI / 2, 0, 0 );
				mesh.scale.set( 2, 2, 2 );*/

				//mesh.castShadow = true;
				//mesh.receiveShadow = true;

				scene.add(mesh);

			});
			loader.load(path);
	    }
	    
	    
	    function bindEvent(){
	    	window.addEventListener( 'resize', onWindowResize, false );
	    	//controls = new THREE.EditorControls(camera,self.options.container[0]);
	    	controls = new THREE.EditorControls( camera,self.options.container[0] );
			controls.addEventListener('change',render);
	    }
	    function setCenter(){
	    	//stl代码
	    	/*var box = geometry.boundingBox,
	    		position = camera.position,
			    offset = position.clone(),
			    min = new THREE.Vector3( box.min.x, box.min.y, box.min.z),
			    max = new THREE.Vector3( box.max.x, box.max.y, box.max.z),
			    distance = max.distanceTo(min);
			center = new THREE.Vector3((box.max.x+box.min.x)/2, (box.min.y+box.max.y)/2, (box.min.z+box.max.z));
			tools.log(position);
			tools.log(offset);
			tools.log(min);
			tools.log(max);
			tools.log(distance);
			camera.position.z = distance*1.5;
			camera.lookAt(center);
			animate();*/
			//dae代码
			var minX = 100;
			var minY = 100;
			var minZ = 100;
			var maxX = 0;
			var maxY = 0;
			var maxZ = 0;
			var geometries = collada.dae.geometries;               
			for(var propName in geometries){
				if(geometries.hasOwnProperty(propName) && geometries[propName].mesh){
				    var geometry = geometries[propName].mesh.geometry3js;
				    geometry.computeBoundingBox();
				    bBox = geometry.boundingBox;
				    if(bBox.min.x < minX) minX = bBox.min.x;
				    if(bBox.min.y < minY) minY = bBox.min.x;
				    if(bBox.min.z < minZ) minZ = bBox.min.z;
				    if(bBox.max.x > maxX) maxX = bBox.max.x;
				    if(bBox.max.y > maxY) maxY = bBox.max.x;
				    if(bBox.max.z > maxZ) maxZ = bBox.max.z;
				}
			}
			var min = new THREE.Vector3( minX, minY, minZ),
				max = new THREE.Vector3( maxX, maxY, maxZ),
				distance = max.distanceTo(min);
				center = new THREE.Vector3((maxX+minX)/2, (maxY+minY)/2, (maxZ+minZ)/2);
			tools.log(min);
			tools.log(max);
			tools.log(distance);
			camera.position.z = distance*model.scale.x;
			camera.lookAt(center);
	    }

		function onWindowResize() {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize( window.innerWidth, window.innerHeight );
		}

		var t = 0;
		var clock = new THREE.Clock();

		function animate() {

			var delta = clock.getDelta();

			requestAnimationFrame( animate );

			if ( t > 1 ) t = 0;
			if ( skin ) {

				// guess this can be done smarter...

				// (Indeed, there are way more frames than needed and interpolation is not used at all
				//  could be something like - one morph per each skinning pose keyframe, or even less,
				//  animation could be resampled, morphing interpolation handles sparse keyframes quite well.
				//  Simple animation cycles like this look ok with 10-15 frames instead of 100 ;)

				for ( var i = 0; i < skin.morphTargetInfluences.length; i++ ) {

					skin.morphTargetInfluences[ i ] = 0;

				}

				skin.morphTargetInfluences[ Math.floor( t * 30 ) ] = 1;

				t += delta;

			}

			render();
			stats.update();

		}

		function render() {
			renderer.render( scene, camera );
		}
		container.dblclick (function(){
			camera.lookAt(center);
			render();
		});
		//self.startAnimate = startAnimate;
		//self.stopAnimate = stopAnimate;
		return self;
	}
	var preview = $('#webgl').ModelPreview();
	$('#animate').click(function(){
		preview.startAnimate();
	});
	$('#unanimate').click(function(){
		preview.stopAnimate();
	});
});