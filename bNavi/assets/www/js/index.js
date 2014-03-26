/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
 

//settings parameters

function stepDetail(startLocation,endLocation,instruction,path)
{
	this.startLocation = startLocation;
	this.endLocation =endLocation;
	this.instruction =instruction;
	this.path = path;
}

function addressInfo(name,corrdinate,info)
{
	this.name = name;
	this.corrdinate =corrdinate;
	this.info =info;
}

var db;

/*var favourite =[];

var homec ="45.4096947,-75.6569581";

var homeAdd = "1545 Alta Vista Dr Ottawa, ON K1G 3P4";

var marketc ="45.39182,-75.679592";

var marketAdd ="10-18 Cameron Ave Ottawa, ON K1S 1S2";

var shopc ="45.413394,-75.647076";

var shopAdd ="Railmarket Private Ottawa, ON K1G 0Z3";

var parkingc ="unknown";

var parkingAdd ="unknown";
*/
var map;

var map2;

var markers = [];

var poly;

var currentMarker =new google.maps.Marker();

var bluetoothSerial = cordova.require('bluetoothSerial');

var naviGuideID;

var arrivalDetectionID;

var compassTimerId;

var currentHeading;

var nextHeading;

var positionTimerId;

var directionsDisplay;

var directionsService = new google.maps.DirectionsService();

var bounds;

var oC;

var dC;


var app = {
    macAddress:"00:11:10:17:03:55",  // get your mac address from bluetoothSerial.list
    chars: "",
	GPSlat:"",
	GPSlon:"",
	TAG:"0",
	
	/*
	get the current location and heading by compass and GPS
	*/
	watchPosition:function (){
            if(positionTimerId) navigator.geolocation.clearWatch(positionTimerId); 
            positionTimerId = navigator.geolocation.watchPosition(function(position)
			{
				 // 50 accury is accepted as valuable data
 				
				app.GPSlat=position.coords.latitude;
				app.GPSlon =position.coords.longitude
				
				
			}, function(){ app.watchPosition();}, {
                enableHighAccuracy: true,
                timeout: 1000,
                maxiumumAge: 0
            });
        },

     watchCompass:function (){
            if(compassTimerId) navigator.compass.clearWatch(compassTimerId);
            compassTimerId = navigator.compass.watchHeading(app.onCompassUpdate, app.onCompassError, {
                frequency: 3000 // Update interval in ms
            });
        },
		
		
		onCompassUpdate:function(heading)
		{
			
			var t = heading.trueHeading >= 0 ? Math.round(heading.trueHeading) : Math.round(heading.magneticHeading);
			if(t >180){currentHeading =t -360;}else{currentHeading=t;}
			$("#cheading").val(currentHeading);
            
		},
		
		
		onCompassError:function (error){
            app.watchCompass();

            if(prevCompassErrorCode && prevCompassErrorCode == error.code) return; 

            var errorType;
            switch(error.code){
                case 1:
                    errorType = "Compass not supported";
                    break;
                case 2:
                    errorType = "Compass internal error";
                    break;
                default:
                    errorType = "Unknown compass error";
            }

            alert("Error while retrieving compass heading: "+errorType);

            prevCompassErrorCode = error.code;
        },
	
	
	/*
    Connects if not connected, and disconnects if connected:
*/
    manageConnection: function() {

        // connect() will get called only if isConnected() (below)
        // returns failure. In other words, if not connected, then connect:
        var connect = function () {
            // if not connected, do this:
            // clear the screen and display an attempt to connect
            //app.clear();
            console.log("-----Attempting to connect devices.------ ");
         // attempt to connect:
            bluetoothSerial.connect(
                "00:11:10:17:03:55",  // device to connect to
               	app.openPort,    // start listening if you succeed
                app.showError    // show the error if you fail
            );
        };

        // disconnect() will get called only if isConnected() (below)
        // returns success  In other words, if  connected, then disconnect:
        var disconnect = function () {
            console.log("------attempting to disconnect-----");
            // if connected, do this:
            bluetoothSerial.disconnect(
                app.closePort,     // stop listening to the port
                app.showError      // show the error if you fail
            );
        };

        // here's the real action of the manageConnection function:
        bluetoothSerial.isConnected(disconnect, connect);
    },
/*
    subscribes to a Bluetooth serial listener for newline
    and changes the button:
*/
    openPort: function() {
        // if you get a good Bluetooth serial connection:
        console.log("------Connected success!------- ");
        // change the button's name:
        
        // set up a listener to listen for newlines
        // and display any new data that's come in since
        // the last newline:
        bluetoothSerial.subscribe('\n', function (data) {
            app.clear();
            app.display(data);
        });
    },

/*
    unsubscribes from any Bluetooth serial listener and changes the button:
*/
    closePort: function() {
        // if you get a good Bluetooth serial connection:
        console.log("------Disconnected success------");
        // change the button's name:
        
        // unsubscribe from listening:
        bluetoothSerial.unsubscribe(
                function (data) {
                    app.display(data);
                },
                app.showError
        );
    },
/*
    appends @error to the message div:
*/
    showError: function(error) {
        alert(error);
    },
 
/*
    Application constructor
 */
    initialize: function() {
		document.addEventListener("backbutton", function(e){
		if($.mobile.activePage.is('#home')){
			e.preventDefault();
			navigator.app.exitApp();
		}
		/*else if($.mobile.activePage.is('#navigation')){
			app.initialMenu();
			}
		else if($.mobile.activePage.is('#setting')){
			app.initialMenu();
		}
		else if($.mobile.activePage.is('#addEdit')){
			app.initialMenu();
		}*/
		else {
			navigator.app.backHistory();
		}
	}, false);
		document.addEventListener('deviceready', this.onDeviceReady, false);
		console.log("------Starting app-------");	
	},
	
	onDeviceReady: function(){
		app.initialDatabase();
        app.bindEvents();
		app.watchPosition();
		app.watchCompass();
		// check if Bluetooth is on:
        bluetoothSerial.isEnabled(
           app.manageConnection,
           notEnabled
        );
		
		// if isEnabled returns failure, this function is called:
        var notEnabled = function() {
            alert("-----Bluetooth is not enabled.-------")
        }

	},
	
	
	/*
		initial the databse
	*/
	initialDatabase: function(){
		console.log("------Starting database-------")
		db = window.openDatabase("naviSetting", "1.0", "myNaviData", 200000);
		db.transaction(app.populateDB, app.errorCB, app.successCB);
		},
	errorCB: function(err){
			 alert('Error: ' + err.message+' code: ' + err.code);
		},
	successCB: function(){
			console.log("----loading database successfully--------");
		},
	
	populateDB:function(tx) {
		
		tx.executeSql('CREATE TABLE IF NOT EXISTS userSettings (id INTEGER NOT NULL PRIMARY KEY, itemName TEXT NOT NULL, itemCorrdinate TEXT NOT NULL, itemAddress TEXT NOT NULL)');
		
		tx.executeSql('SELECT * from userSettings',[],function(tx,results){
		var len = results.rows.length;
		if(len==0)
		{
			//new database
			tx.executeSql('INSERT INTO userSettings (id, itemName, itemCorrdinate, itemAddress) VALUES (1, "home", "45.4096947,-75.6569581", "1545 Alta Vista Dr Ottawa, ON K1G 3P4")');
			tx.executeSql('INSERT INTO userSettings (id, itemName, itemCorrdinate, itemAddress) VALUES (2, "shop", "45.387088,-75.679886", "2277 Riverside Drive Ottawa, ON K1H 7X6")');
			tx.executeSql('INSERT INTO userSettings (id, itemName, itemCorrdinate, itemAddress) VALUES (3, "Supermarket", "45.382838,-75.669293", "1500 Bank Ottawa, ON K1H 7Z2")');
			tx.executeSql('INSERT INTO userSettings (id, itemName, itemCorrdinate, itemAddress) VALUES (4, "Parking", "45.4096947,-75.6569581", "1545 Alta Vista Dr Ottawa, ON K1G 3P4")');
		}
			
			},app.errorCB);
		},
		
		
	
	/*
    bind any events that are required on startup to listeners:
*/
    bindEvents: function() {
		
		console.log("------Starting initial app-------");
		// 0 row ==1st item
		// list menu items
	/*	db.transaction( function(tx){
		tx.executeSql('SELECT * from userSettings',[],function(tx,results){
			 var len = results.rows.length;
			 $("#menuItems").html("");
			 $("#menuItems").append("<div class=\"ui-grid-a\"><div class=\"ui-block-a\"><button id=\"item0\" onClick=\"javascript:app.startNavipre("+results.rows.item(0).id+");\" style=\"height:160px;\"><img src=\"img/home_96.png\"><h2>"+results.rows.item(0).itemName+"<\/h2><\/button><\/div><div class=\"ui-block-b\"><button id=\"item1\" onClick=\"javascript:app.startNavipre("+results.rows.item(1).id+");\" style=\"height:160px;\"><img src=\"img/market_96.png\"><h2>"+results.rows.item(1).itemName+"</h2></button></div></div>"); 
			 $("#menuItems").append("<div class=\"ui-grid-a\"><div class=\"ui-block-a\"><button id=\"item2\" onClick=\"javascript:app.startNavipre("+results.rows.item(2).id+");\" style=\"height:160px;\"><img src=\"img/shop_96.png\"><h2>"+results.rows.item(2).itemName+"<\/h2><\/button><\/div><div class=\"ui-block-b\"><button id=\"item3\" onClick=\"javascript:app.startNavipre("+results.rows.item(3).id+");\" style=\"height:160px;\"><img src=\"img/parking_96.png\"><h2>"+results.rows.item(3).itemName+"</h2></button></div></div>"); 
			if(len>4)
			{
				var j =4;
				while(j<len)
				{
					if(j<len&&(j+1)<len)
					{
						$("#menuItems").append("<div class=\"ui-grid-a\"><div class=\"ui-block-a\"><button id=\"item"+j+"\" onClick=\"javascript:app.startNavipre("+results.rows.item(j).id+");\" style=\"height:160px;\"><img src=\"img/favorite_96.png\"><h2>"+results.rows.item(j).itemName+"<\/h2><\/button><\/div><div class=\"ui-block-b\"><button id=\"item"+(j+1)+"\" onClick=\"javascript:app.startNavipre("+results.rows.item(j+1).id+");\"  style=\"height:160px;\"><img src=\"img/favorite_96.png\"><h2>"+results.rows.item(j+1).itemName+"</h2></button></div></div>"); 
						$("#menuItems").trigger("create");
						
						j=j+2;
					}
					else if(j<len&&(j+1)==len)
					{
						$("#menuItems").append("<div class=\"ui-grid-a\"><div class=\"ui-block-a\"><button id=\"item"+j+"\" onClick=\"javascript:app.startNavipre("+results.rows.item(j).id+");\" style=\"height:160px;\"><img src=\"img/favorite_96.png\"><h2>"+results.rows.item(j).itemName+"<\/h2><\/button><\/div><div class=\"ui-block-b\"></div></div>"); 
						$("#menuItems").trigger("create");
						j=j+2;
					}
					
				}
			}
			$("#menuItems").trigger("create");
			},
			app.errorCB);
		}
	,app.errorCB);*/
	 	app.initialMenu();
		
		$("#mySettings").off().on("click",function(){app.reload_setting();});
		$("#cancelEdit").off().on("click",function(){app.initialMenu();});
		
	 },
	
	getMap: function()
	{
		oC = $("#orignal").val();
		dC = $("#destination").val();
		$("#rs1").css("width","80%");
		$("#rs1").css("height",$(window).height()/3);
		
		$("#rs2").css("width","80%");
		$("#rs2").css("height",$(window).height()/3);
		window.location="index.html#mapDisplay";
		var res1 = oC.split(",");
		var res2 = dC.split(",");
	
		var route2 = new google.maps.Map(document.getElementById("rs2"),{center: new google.maps.LatLng(45.353834,-75.684181),zoom: 8,mapTypeId: google.maps.MapTypeId.ROADMAP});
		
		
		var directionsService = new google.maps.DirectionsService();
		var directionsDisplay = new google.maps.DirectionsRenderer();
		directionsDisplay.setMap(route2);
		
		
		var request=
		{	
			origin:new google.maps.LatLng(res1[0],res1[1]),
     		destination:new google.maps.LatLng(res2[0],res2[1]),
			//destination:destination,
      		travelMode: google.maps.TravelMode.DRIVING
		};
		directionsService.route(request, function(response, status){
    	if (status == google.maps.DirectionsStatus.OK) {
			alert("done");
			directionsDisplay.setDirections(response);
			bounds =response.routes[0].bounds;
			setTimeout(function(){
				google.maps.event.trigger(route2,'resize');
				route2.fitBounds(bounds);
				
				}, 1000);
			} 
		});
	$.ajax({
				   type: "POST",
				   url: "http://10.69.182.92:8080/infotainment.asmx/getRouting?jsoncallback=?",
				   data: {originLat:res1[0],originLon:res1[1],destinationLat:res2[0],detinationLon:res2[1]},
				   dataType: "jsonp",
				   jsonp: "jsoncallback",
				   success: function (json){
					   var route1 = new google.maps.Map(document.getElementById("rs1"),{center: new google.maps.LatLng(45.353834,-75.684181),zoom: 8,mapTypeId: google.maps.MapTypeId.ROADMAP});
					   var ctaLayer = new google.maps.KmlLayer('http://www.cdn.mto.gov.on.ca/kml/construction.kml',{preserveViewport:true});
					   ctaLayer.setMap(route1);
					   
					   var str1=[];
					   var str ="";
					   var collection = new Array();
					   var array = null;
					   if(json.type == "4")
					   {				
						   for(var i=0;i<json.shapePoints.length;i++)
						   {
							   collection[i] = new google.maps.LatLng(json.shapePoints[i].latitude, json.shapePoints[i].longitude);
							   str1.push(collection[i]);
							}
							var marker = new google.maps.Marker({
											map:route1,
											draggable:true,
											animation: google.maps.Animation.DROP,
											position: new google.maps.LatLng(json.construction[0].Construction.latitude, json.construction[0].Construction.longitude)
										  });
							var path={
							//path: response.routes[0].overview_path,
							path:str1,
							geodesic: true,
							strokeColor: '#FF0000',
							strokeOpacity: 1.0,
							strokeWeight: 4,
							};
					   		var poly = new google.maps.Polyline(path);
							poly.setMap(route1);			  
										  
						}else
						{
							str = json.routeLine.replace(/\s+/g,"");
							array = google.maps.geometry.encoding.decodePath(str);
							var path={
							//path: response.routes[0].overview_path,
							path:array,
							geodesic: true,
							strokeColor: '#FF0000',
							strokeOpacity: 1.0,
							strokeWeight: 4,
							};
					   		var poly = new google.maps.Polyline(path);
							poly.setMap(route1);
						}
						
						setTimeout(function(){
					  	google.maps.event.trigger(route1,'resize');
						route1.fitBounds(bounds);
						}, 1000);
 },
				   error: function (e){alert(e.message);}
			}
		);
		
		
	
		
		
	},
	
	
	
	
	
	initialMenu: function()
	{
		app.testDatabase2();
		
		db.transaction( function(tx){
		tx.executeSql('SELECT * from userSettings',[],function(tx,results){
			 var len = results.rows.length;
			 $("#menuItems").html("");
			 $("#menuItems").append("<div class=\"ui-grid-a\"><div class=\"ui-block-a\"><button id=\"item0\" onClick=\"javascript:app.startNavipre("+results.rows.item(0).id+");\" style=\"height:160px;\"><img src=\"img/home_96.png\"><h2>"+results.rows.item(0).itemName+"<\/h2><\/button><\/div><div class=\"ui-block-b\"><button id=\"item1\" onClick=\"javascript:app.startNavipre("+results.rows.item(1).id+");\" style=\"height:160px;\"><img src=\"img/market_96.png\"><h2>"+results.rows.item(1).itemName+"</h2></button></div></div>"); 
			 $("#menuItems").append("<div class=\"ui-grid-a\"><div class=\"ui-block-a\"><button id=\"item2\" onClick=\"javascript:app.startNavipre("+results.rows.item(2).id+");\" style=\"height:160px;\"><img src=\"img/shop_96.png\"><h2>"+results.rows.item(2).itemName+"<\/h2><\/button><\/div><div class=\"ui-block-b\"><button id=\"item3\" onClick=\"javascript:app.startNavipre("+results.rows.item(3).id+");\" style=\"height:160px;\"><img src=\"img/parking_96.png\"><h2>"+results.rows.item(3).itemName+"</h2></button></div></div>"); 
	
			if(len>4)
			{
				var j =4;
				while(j<len)
				{
					if(j<len&&(j+1)<len)
					{
						$("#menuItems").append("<div class=\"ui-grid-a\"><div class=\"ui-block-a\"><button id=\"item"+j+"\" onClick=\"javascript:app.startNavipre("+results.rows.item(j).id+");\" style=\"height:160px;\"><img src=\"img/favorite_96.png\"><h2>"+results.rows.item(j).itemName+"<\/h2><\/button><\/div><div class=\"ui-block-b\"><button id=\"item"+(j+1)+"\" onClick=\"javascript:app.startNavipre("+results.rows.item(j+1).id+");\"  style=\"height:160px;\"><img src=\"img/favorite_96.png\"><h2>"+results.rows.item(j+1).itemName+"</h2></button></div></div>"); 
						$("#menuItems").trigger("create");
						
						j=j+2;
					}
					else if(j<len&&(j+1)==len)
					{
						$("#menuItems").append("<div class=\"ui-grid-a\"><div class=\"ui-block-a\"><button id=\"item"+j+"\" onClick=\"javascript:app.startNavipre("+results.rows.item(j).id+");\" style=\"height:160px;\"><img src=\"img/favorite_96.png\"><h2>"+results.rows.item(j).itemName+"<\/h2><\/button><\/div><div class=\"ui-block-b\"></div></div>"); 
						$("#menuItems").trigger("create");
						j=j+2;
					}
					
				}
			}
			$("#menuItems").trigger("create");
			},
			app.errorCB);
		}
	,app.errorCB);
		/*db.transaction( function(tx){
		tx.executeSql('SELECT * from userSettings',[],function(tx,results){
			 var len = results.rows.length;
			 $("#menuItems").html(" ");
			 $("#menuItems").append("<div class=\"ui-grid-a\"><div class=\"ui-block-a\"><button id=\"item0\" onClick=\"javascript:app.startNavi(0);\" style=\"height:160px;\"><img src=\"img/home_96.png\"><h2>"+results.rows.item(0).itemName+"<\/h2><\/button><\/div><div class=\"ui-block-b\"><button id=\"item1\" onClick=\"javascript:app.startNavi(1);\" style=\"height:160px;\"><img src=\"img/market_96.png\"><h2>"+results.rows.item(1).itemName+"</h2></button></div></div>"); 
			 $("#menuItems").append("<div class=\"ui-grid-a\"><div class=\"ui-block-a\"><button id=\"item2\" onClick=\"javascript:app.startNavi(2);\" style=\"height:160px;\"><img src=\"img/shop_96.png\"><h2>"+results.rows.item(2).itemName+"<\/h2><\/button><\/div><div class=\"ui-block-b\"><button id=\"item3\" onClick=\"javascript:app.startNavi(3);\" style=\"height:160px;\"><img src=\"img/parking_96.png\"><h2>"+results.rows.item(3).itemName+"</h2></button></div></div>"); 
			if(len>4)
			{
				var j =4;
				while(j<len)
				{
					if(j<len&&(j+1)<len)
					{
						$("#menuItems").append("<div class=\"ui-grid-a\"><div class=\"ui-block-a\"><button id=\"item"+j+"\" onClick=\"javascript:app.startNavi("+j+");\" style=\"height:160px;\"><img src=\"img/favorite_96.png\"><h2>"+results.rows.item(j).itemName+"<\/h2><\/button><\/div><div class=\"ui-block-b\"><button id=\"item"+(j+1)+"\" onClick=\"javascript:app.startNavi("+(j+1)+");\"  style=\"height:160px;\"><img src=\"img/favorite_96.png\"><h2>"+results.rows.item(j+1).itemName+"</h2></button></div></div>"); 
						$("#menuItems").trigger("create");
						
						j=j+2;
					}
					else if(j<len&&(j+1)==len)
					{
						$("#menuItems").append("<div class=\"ui-grid-a\"><div class=\"ui-block-a\"><button id=\"item"+j+"\" onClick=\"javascript:app.startNavi("+j+");\" style=\"height:160px;\"><img src=\"img/favorite_96.png\"><h2>"+results.rows.item(j).itemName+"<\/h2><\/button><\/div><div class=\"ui-block-b\"></div></div>"); 
						$("#menuItems").trigger("create");
						j=j+2;
					}
					
				}
			}
			$("#menuItems").trigger("create");
			},
			app.errorCB);
		}
	,app.errorCB);*/
		window.location="index.html#home";
	},
	
	
	/*
	navigation fucntion 

	*/
	
	
	/* the middware funciton to get the destination*/
	
	
	startNavipre: function(id)
	{
		db.transaction( function(tx){
		tx.executeSql('SELECT * from userSettings where id ='+(id),[],
		function(tx,results){
			app.startnavi(results.rows.item(0).itemCorrdinate);
			},app.errorCB);}
		,app.errorCB);
	},

	startnavi: function(destination){
		var bounds;
		console.log("=================="+destination+"=====================");
		var res =destination.split(",");
		$("#navi").css("width","100%");
		$("#navi").css("height",$(window).height()/2);
		var map = new google.maps.Map(document.getElementById('navi'),{center: new google.maps.LatLng(app.GPSlat,app.GPSlon),zoom: 8,mapTypeId: google.maps.MapTypeId.ROADMAP});
		var directionsService = new google.maps.DirectionsService();
		var request=
		{	
			origin:new google.maps.LatLng(app.GPSlat,app.GPSlon),
     		destination:new google.maps.LatLng(res[0],res[1]),
			//destination:destination,
      		travelMode: google.maps.TravelMode.WALKING
		};
		directionsService.route(request, function(response, status){
    	if (status == google.maps.DirectionsStatus.OK) {
			// create polyline
			var path={
					path: response.routes[0].overview_path,
					geodesic: true,
					strokeColor: '#FF0000',
					strokeOpacity: 1.0,
					strokeWeight: 2,
			};
			bounds =response.routes[0].bounds;
			var poly = new google.maps.Polyline(path);
			poly.setMap(map);
			app.naviGuide(poly);
			//add markers
			var currentPosition = new google.maps.Marker({
				position: new google.maps.LatLng(app.GPSlat,app.GPSlon),
				map: map,
				icon: "img/bluecircle.png",
				title:"You are here!"
			});
			
			var desti = new google.maps.Marker({
				position: new google.maps.LatLng(res[0],res[1]),
				map: map,
				title:"Destination!"
			});
			
			//app.naviGuide();
				
			}
  		});
		setTimeout(function(){
				google.maps.event.trigger(map,'resize');
				map.fitBounds(bounds);
				//map.fitBounds(response.routes[0].bounds);
				//map.panToBounds(response.routes[0].bounds);
				}, 1000);
		/*
		//var directionsDisplay = new google.maps.DirectionsRenderer();
		//directionsDisplay.setMap(map);
		currentMarker.setOptions({
									position: new google.maps.LatLng(app.GPSlat,app.GPSlon), 
									map: map,
									icon: "img/bluecircle.png",
									title:"You are here!"
								});
								
	
		
		directionsService.route(request, function(response, status){
    	if (status == google.maps.DirectionsStatus.OK) {
			//directionsDisplay1.setDirections(response);
			// create polyline
			var path={
					path: response.routes[0].overview_path,
					geodesic: true,
					strokeColor: '#FF0000',
					strokeOpacity: 1.0,
					strokeWeight: 2
			};
		var poly = new google.maps.Polyline(path);
			
			//app.naviGuide();
			}
  		});*/
		
		window.location="index.html#navigation";
		
		},



		naviGuide:function(poly){
			var stepIndex = 0;
			var polyPath = poly.getPath();
  			var pathSize = polyPath.getLength();
				
			
			naviGuideID =window.setInterval(
			function(){
				
			//detect if arrival
			if(google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(app.GPSlat,app.GPSlon),polyPath.getAt(pathSize-1))<5)
			{
				app.arrvialDetection();
			}
			
			
			
			if(google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(app.GPSlat,app.GPSlon),polyPath.getAt(stepIndex))<2&&stepIndex<pathSize-2)
			{// arrive the step point move to next
				stepIndex =stepIndex +1;
			}	
	
			nextHeading =google.maps.geometry.spherical.computeHeading(new google.maps.LatLng(app.GPSlat,app.GPSlon),polyPath.getAt(stepIndex));
			
			$("#currentGPS").val(app.GPSlat+","+app.GPSlon);
			$("#nheading").val(nextHeading);
			$("#prePoint").val(polyPath.getAt(stepIndex));
			$("#nextPoint").val(polyPath.getAt(stepIndex+1));
				
			app.turnCalculation(currentHeading,nextHeading);	
				
			},
			3000)
		
		},
		
		turnCalculation:function(cHeading,dHeading){
			
			
			dHeading=parseInt(dHeading);
			cHeading=parseInt(cHeading);
			var t =dHeading-cHeading;
			t=parseInt(t);
			if(-45<t&&t<45)
			{
				//keep forward 
				$("#result").val("send forward success");
				//bluetoothSerial.write("F", function(){$("#result").val("send forward success");}, function(){$("#result").val("send forward error");});
			}
			else if(-100<t&&t<-45)
			{
					// turn left
					$("#result").val("send left success");
					bluetoothSerial.write("L", function(){$("#result").val("send left success");}, function(){$("#result").val("send left error");});
			}
			else if(45<t&&t<100)
			{
					// turn right
					$("#result").val("send right success");
					bluetoothSerial.write("R", function(){$("#result").val("send right success");}, function(){$("#result").val("send right error");});
			}else
			{
				// wrong direction cHeading<dHeading-100||cHeading>dHeading+100
				$("#result").val("wrong direction");
					
			}
				
		},
		
		
		
		arrvialDetection: function()
		{
			// end navigation
				app.watchPosition();
				app.watchCompass();
				window.clearInterval(naviGuideID);
				window.location="index.html#home";
		},
		
		initial_setting:function()
		{
			
			$("#addressInfo").html("");
			$("#addressInfo").append("<li><h1 style='font-size:24px; text-align:center;'>address Information</li>");
			//$("#addressInfo").trigger("create");
			db.transaction( function(tx){
			tx.executeSql('SELECT * from userSettings',[],function(tx,results){
			var len = results.rows.length;
			$("#addressInfo").append("<li><a onClick=\"javascript:app.addEdit(0,"+len+");\"><img src=\"img\/home_96.png\">"+results.rows.item(0).itemName+"<h2>"+results.rows.item(0).itemCorrdinate+"</h2><p>"+results.rows.item(0).itemAddress+"</p></a></li>");
			$("#addressInfo").append("<li><a onClick=\"javascript:app.addEdit(1,"+len+");\"><img src=\"img\/market_96.png\">"+results.rows.item(1).itemName+"<h2>"+results.rows.item(1).itemCorrdinate+"</h2><p>"+results.rows.item(1).itemAddress+"</p></a></li>");
			$("#addressInfo").append("<li><a onClick=\"javascript:app.addEdit(2,"+len+");\"><img src=\"img\/shop_96.png\">"+results.rows.item(2).itemName+"<h2>"+results.rows.item(2).itemCorrdinate+"</h2><p>"+results.rows.item(2).itemAddress+"</p></a></li>");
			$("#addressInfo").append("<li><a onClick=\"javascript:app.addEdit(3,"+len+");\"><img src=\"img\/parking_96.png\">"+results.rows.item(3).itemName+"<h2>"+results.rows.item(3).itemCorrdinate+"</h2><p>"+results.rows.item(3).itemAddress+"</p></a></li>");
			
			if(len>4)
			{
				for(var i =4;i<len;i++)
				{
					$("#addressInfo").append("<li><a onClick=\"javascript:app.addEdit("+i+","+len+");\"><img src=\"img\/favorite_96.png\">"+results.rows.item(i).itemName+"<h2>"+results.rows.item(i).itemCorrdinate+"</h2><p>"+results.rows.item(i).itemAddress+"</p></a></li>");
				}
			}
			$("#addressInfo").append("<li><a onClick=\"javascript:app.addEdit(100,"+len+");\"><img src=\"img\/favorite_96.png\"><h1>ADD NEW</h1></a></li>");
			//$("#addressInfo").listview("refresh");
			$("#addressInfo").trigger("create");
			},app.errorCB);
			}
			,app.errorCB,function(){window.location="index.html#setting";});
		
			
			
			//bind the clicklistener
			
		},
		
		
		reload_setting:function()
		{
			
			$("#addressInfo").html("");
			$("#addressInfo").empty();
			$("#addressInfo").append("<li><h1 style='font-size:24px; text-align:center;'>address Information</li>");
			//$("#addressInfo").trigger("create")
			db.transaction( function(tx){
			tx.executeSql('SELECT * from userSettings',[],function(tx,results){
			var len = results.rows.length;
			$("#addressInfo").append("<li><a onClick=\"javascript:app.addEdit("+results.rows.item(0).id+","+len+");\"><img src=\"img\/home_96.png\">"+results.rows.item(0).itemName+"<h2>"+results.rows.item(0).itemCorrdinate+"</h2><p>"+results.rows.item(0).itemAddress+"</p></a></li>");
			$("#addressInfo").append("<li><a onClick=\"javascript:app.addEdit("+results.rows.item(1).id+","+len+");\"><img src=\"img\/market_96.png\">"+results.rows.item(1).itemName+"<h2>"+results.rows.item(1).itemCorrdinate+"</h2><p>"+results.rows.item(1).itemAddress+"</p></a></li>");
			$("#addressInfo").append("<li><a onClick=\"javascript:app.addEdit("+results.rows.item(2).id+","+len+");\"><img src=\"img\/shop_96.png\">"+results.rows.item(2).itemName+"<h2>"+results.rows.item(2).itemCorrdinate+"</h2><p>"+results.rows.item(2).itemAddress+"</p></a></li>");
			$("#addressInfo").append("<li><a onClick=\"javascript:app.addEdit("+results.rows.item(3).id+","+len+");\"><img src=\"img\/parking_96.png\">"+results.rows.item(3).itemName+"<h2>"+results.rows.item(3).itemCorrdinate+"</h2><p>"+results.rows.item(3).itemAddress+"</p></a></li>");
			
			if(len>4)
			{
				for(var i =4;i<len;i++)
				{
					$("#addressInfo").append("<li><a onClick=\"javascript:app.addEdit("+results.rows.item(i).id+","+len+");\"><img src=\"img\/favorite_96.png\">"+results.rows.item(i).itemName+"<h2>"+results.rows.item(i).itemCorrdinate+"</h2><p>"+results.rows.item(i).itemAddress+"</p></a></li>");
				}
			}
			$("#addressInfo").append("<li><a onClick=\"javascript:app.addEdit(100,"+len+");\"><img src=\"img\/favorite_96.png\"><h1>ADD NEW</h1></a></li>");
			if($("#addressInfo").hasClass('ui-listview'))
			{
				$("#addressInfo").listview("refresh");
			}
			else
			{
				$("#addressInfo").trigger("create");
			}
			
			},app.errorCB);
			}
			,app.errorCB,function(){window.location="index.html#setting";});
			
			
			
			//bind the clicklistener
			
		},


		addEdit:function(num,len)
		{
		console.log("----the index number edit"+num+"-------");
		console.log("----the index length edit"+len+"-------");
		if(num==100)
		{
			//create a new point
			 $("#itemName").val("");
			 $("#addDescription").html("");
			 $("#addCorrdinate").val("");
		}
		else
		{
			app.testDatabase2();
			
			
			db.transaction( function(tx){
		tx.executeSql('SELECT * from userSettings where id='+(num),[],function(tx,results){
						 $("#itemName").val(results.rows.item(0).itemName);
						 $("#addDescription").html("");
						 $("#addDescription").append(results.rows.item(0).itemAddress); //textarea use append to add text
						 $("#addCorrdinate").val(results.rows.item(0).itemCorrdinate);
				
				},app.errorCB);
			}
		,app.errorCB);
		}
		$("#saveEdit").off().on("click",function(){app.saveEdit(num,len);});
		//$("#saveEdit").click(function(){app.saveEdit(num,len);});
		//$("#deleteEdit").click(function(){app.deleteEdit(num,len);});
		$("#deleteEdit").off().on("click",function(){app.deleteEdit(num,len);});
		window.location="index.html#addEdit";
		//$("#search").click(function(){ var t =$("#searchText").val();  app.SearchBox(t);});
		$("#search").off().on("click",function(){ var t =$("#searchText").val();  app.SearchBox(t);});
		//$("#search").change(function(){ var t =$("#searchText").val();  app.SearchBox(t);});
		},

		
		deleteEdit: function(num,len){
			if(num==100){
				alert("cant delete new one");
			}else{
			//DELETE aN item
				db.transaction( function(tx){
				tx.executeSql('DELETE FROM userSettings WHERE id='+(num));}
			,app.errorCB, function(){console.log("delete successfully!");});
			
			app.initialMenu();
			}},
		
		SearchBox:function(content)
		{
			 // Create the search box and link it to the UI element.
			 var request = "https://maps.googleapis.com/maps/api/place/autocomplete/json?input="+content+"t&types=geocode&language=En&sensor=true&key=AIzaSyDRbYLl0HVm4BGJWGAxVA24OuKoi9-LLbA";
			 $.ajax({
				 type:"GET",
				 url: request,
				 contentType:"charset=UTF-8",
				 dataType:"json",
				 crossDomain: true,
				 success: function(json){
					 
					 if(json.predictions.length>5){
						 $("#placeSearch").html("");
						 for(var i =0;i <5;i++)
						 {
							 $("#placeSearch").append("<li><a onClick=\"javascript:app.geoSearch('"+json.predictions[i].reference+"');\"><h2>"+json.predictions[i].description+"</h2></a></li>");
						 }
						
					 }else
					 {
						  $("#placeSearch").html("");
						 for(var i =0;i <json.predictions.length;i++)
						 {
							 $("#placeSearch").append("<li><a onClick=\"javascript:app.geoSearch('"+json.predictions[i].reference+"');\"><h2>"+json.predictions[i].description+"</h2></a></li>");
						 }
					  }
					  
					  $("#placeSearch").listview("refresh");
					 $("#placeSearch").trigger("updatelayout");
					 
					 },
				 error: function(){alert("autocomplete errror!");}
				 
			 });
 		
		},
		
		geoSearch:function(re)
		{
		$("#placeSearch").html("");
	
		var request="https://maps.googleapis.com/maps/api/place/details/json?reference="+re+"&sensor=true&key=AIzaSyDRbYLl0HVm4BGJWGAxVA24OuKoi9-LLbA";
		 $.ajax({
					 type:"GET",
					 url: request,
					 contentType:"charset=UTF-8",
					 dataType:"json",
					 crossDomain: true,
					 success: function(json){
					 $("#addDescription").html("");
					 $("#addDescription").append(json.result.formatted_address)
					 $("#addCorrdinate").val(json.result.geometry.location.lat+","+json.result.geometry.location.lng);
					 //app.showRoute(new google.maps.LatLng(json.result.geometry.location.lat,json.result.geometry.location.lng));
					 },
				 error: function(){alert("autocomplete errror!");}
				 
			 });
			
		},
		
		
			
		saveEdit:function(num,len)
		{
			console.log("===== save"+num+"=====");
			console.log("=====save"+len+"=====");
			if(num==100)
			{
				//create a new item
				db.transaction( function(tx){
				tx.executeSql('INSERT INTO userSettings ( itemName, itemCorrdinate, itemAddress) VALUES ("'+$("#itemName").val()+'", "'+$("#addCorrdinate").val()+'", "'+jQuery("textarea#addDescription").val()+'")');}
			,app.errorCB, function(){console.log("create successfully!");});
			app.initialMenu();
			return;
			}
			else
			{
				//edit an old one
				db.transaction( function(tx){
				tx.executeSql('UPDATE userSettings set itemName = "'+$("#itemName").val()+'", itemCorrdinate = "'+$("#addCorrdinate").val()+'", itemAddress ="'+jQuery("textarea#addDescription").val()+'" where id ='+(num));}
			,app.errorCB, function(){console.log("update succesfully");});
			app.initialMenu();
			return;
			}
			
			//$("#addressInfo").trigger("create")
		
			
			/*var name = $("#itemName").val();
			if(name="")
			{
				alert("u need give a name of place :D");
			}
			else
			{
				
			}
			switch(name)
			{
				case "" : alert("u need give a name of place :D");
						  break;
				case "HOME" : homeAdd=jQuery("textarea#addDescription").val();
							  homec=$("#addCorrdinate").val();
							  break;
				case "SuperMarket": marketAdd=jQuery("textarea#addDescription").val();
									marketc = $("#addCorrdinate").val();
									break;
				case "SHOP": shopAdd=jQuery("textarea#addDescription").val();
							 shopc = $("#addCorrdinate").val();
							 break;
				case "PARKING": parkingAdd=jQuery("textarea#addDescription").val();
								parkingc = $("#addCorrdinate").val();
								break;
				default: var tmp = new addressInfo($("#itemName").val(),$("#addCorrdinate").val(),jQuery("textarea#addDescription").val());
						 favourite.push(tmp);
						 break;
			}*/
			
			
		},
		
		
		









	testDatabase :function(){
	db.transaction( function(tx){
		tx.executeSql('INSERT INTO userSettings (id, itemName, itemCorrdinate, itemAddress) VALUES (1, "home", "45.4096947,-75.6569581", "1545 Alta Vista Dr Ottawa, ON K1G 3P4")');}
	,app.errorCB);
	},
	
	testDatabase2 :function(){
	db.transaction( function(tx){
		tx.executeSql('SELECT * from userSettings',[],function(tx,results){
			 var len = results.rows.length;
    console.log("DEMO table: " + len + " rows found.");
    for (var i=0; i<len; i++){
        console.log("Row = " + i + " ID = " + results.rows.item(i).id + " Data =  " + results.rows.item(i).itemAddress);
    }
			
			},app.errorCB);
		}
	,app.errorCB);
	}
//	
///*
//    this runs when the device is ready for user interaction:
//*/
//    onDeviceReady1: function(){
//        // check to see if Bluetooth is turned on.
//        // this function is called only
//        //if isEnabled(), below, returns success:
//		app.initialDatabase();
//		app.watchPosition();
//		app.watchCompass();
//		
//		//initial the map
//		$("#navi").css("width","100%");
//		$("#navi").css("height",$(window).height()/2);
//		$("#addEdt").css("width","100%");
//		$("#addEdt").css("height",$(window).height()/2);
//		var mapOptions=
//			{
//				center: new google.maps.LatLng(app.GPSlat,app.GPSlon),
//				zoom: 8,
//				mapTypeId: google.maps.MapTypeId.ROADMAP
//						
//			};
//		map = new google.maps.Map(document.getElementById('navi'),mapOptions);
//		map2 = new google.maps.Map(document.getElementById('addEdt'),mapOptions);
//		
//         
//    },
//
//	
//	
//
//
//		showRoute:function(destination)
//		{
//			if(directionsDisplay == null) { 
//			directionsDisplay = new google.maps.DirectionsRenderer();
//			directionsDisplay.setMap(map2);
//			}
//			
//			currentMarker.setOptions({
//				position: new google.maps.LatLng(app.GPSlat,app.GPSlon), 
//				map: map2,
//				icon: "img/bluecircle.png",
//				title:"You are here!"
//			});
//			
//			var request=
//			{
//				origin:new google.maps.LatLng(app.GPSlat,app.GPSlon),
//				destination: destination,
//				travelMode: google.maps.TravelMode.WALKING
//			};
//		
//			directionsService.route(request, function(response, status){
//    			if (status == google.maps.DirectionsStatus.OK) {
//					directionsDisplay.setDirections(response);
//					setTimeout(function() {
//						google.maps.event.trigger(map2,'resize');
//						map2.fitBounds(response.routes[0].bounds);
//       			}, 500);
//
//	
//				}});
//				
//		
//		}
//		
	


};      // end of app



//
//
//
//function geoSearch(re)
//{
//	$("#placeSearch").html("");
//	
//	var request="https://maps.googleapis.com/maps/api/place/details/json?reference="+re+"&sensor=true&key=AIzaSyDRbYLl0HVm4BGJWGAxVA24OuKoi9-LLbA";
//	 $.ajax({
//				 type:"GET",
//				 url: request,
//				 contentType:"charset=UTF-8",
//				 dataType:"json",
//				 crossDomain: true,
//				 success: function(json){
//					 $("#addDescription").html("");
//					 $("#addDescription").append(json.result.formatted_address)
//					 $("#addCorrdinate").val(json.result.geometry.location.lat+","+json.result.geometry.location.lng);
//					directionsDisplay.setMap(null);
//					directionsDisplay.setMap(map2);
//					var request=
//					{
//						origin:new google.maps.LatLng(app.GPSlat,app.GPSlon),
//						destination:new google.maps.LatLng(json.result.geometry.location.lat,json.result.geometry.location.lng),
//						travelMode: google.maps.TravelMode.WALKING
//					};
//		
//					directionsService.route(request, function(response, status){
//						if (status == google.maps.DirectionsStatus.OK) {
//							directionsDisplay.setDirections(response);
//							google.maps.event.trigger(map2, 'resize');
//			
//						}});
//					 
//					 
//					 },
//				 error: function(){alert("autocomplete errror!");}
//				 
//			 });
//}
//
//function resize_map(map)
//{
//	
//
//	setTimeout(function() {
//			google.maps.event.trigger(map,'resize');
//			map.setCenter(new google.maps.LatLng(app.GPSlat,app.GPSlon));
//			map.setZoom(8);
//       		}, 500);
//
//				
//}
//
//function initialMap()
//{
//	window.location="index.html#test";
//		 var marker, map, 
//                        myLocation = { 
//                            lat: 50, 
//                            lon: -80 
//                        }, 
//                        mapOptions = { 
//                            zoom: 5, 
//                            mapTypeId: google.maps.MapTypeId.PLAN, 
//                            center: new google.maps.LatLng(myLocation.lat, myLocation.lon) 
//                        }; 
//                    $('#canvas-map').css("height", "200px").css("padding", "0px"); 
//                    map = new google.maps.Map(document.getElementById('canvas-map'), mapOptions); 
//                    marker = new google.maps.Marker({ 
//                        map: map, 
//                        position: new google.maps.LatLng(myLocation.lat, myLocation.lon), 
//                    });     
//		
//}
//
//
//
//function initialSearchBox()
//{
//	
//  // Create the search box and link it to the UI element.
// 		 	var input = document.getElementById("placeSearch");
//  			var searchBox = new google.maps.places.SearchBox(input);
//			
//			
//			
//		  // [START region_getplaces]
//		  // Listen for the event fired when the user selects an item from the
//		  // pick list. Retrieve the matching places for that item.
//		  google.maps.event.addListener(searchBox, 'places_changed', function() {
//			var places = searchBox.getPlaces();
//			
//			for (var i = 0, marker; marker = markers[i]; i++) {
//			  marker.setMap(null);
//			}
//		
//			// For each place, get the icon, place name, and location.
//			markers = [];
//			var bounds = new google.maps.LatLngBounds();
//			for (var i = 0, place; place = places[i]; i++) {
//			  var image = {
//				url: place.icon,
//				size: new google.maps.Size(71, 71),
//				origin: new google.maps.Point(0, 0),
//				anchor: new google.maps.Point(17, 34),
//				scaledSize: new google.maps.Size(25, 25)
//			  };
//		
//			  // Create a marker for each place.
//			  var marker = new google.maps.Marker({
//				map: map2,
//				icon: image,
//				title: place.name,
//				position: place.geometry.location
//			  });
//		
//			  markers.push(marker);
//		
//			  bounds.extend(place.geometry.location);
//			}
//		
//			map2.fitBounds(bounds);
//		  });
//		  // [END region_getplaces]
//		
//		  // Bias the SearchBox results towards places that are within the bounds of the
//		  // current map's viewport.
//		  google.maps.event.addListener(map2, 'bounds_changed', function() {
//			var bounds = map2.getBounds();
//			searchBox.setBounds(bounds);
//		  });
//  
//}
//
//
//
//function bySearch()
//{
//		$("#geocomplete").geocomplete();
//			$("#geocomplete").geocomplete({
//          	map: "#map2",
//          	details: "#searchRs",
//          	detailsAttribute: "data-geo"
//        	});
//        
//			$("#find").click(function(){
//			  $("#geocomplete").trigger("geocode");
//			});
//			
//   
//
//}
//
//
//function callback(results, status) {
//  if (status == google.maps.places.PlacesServiceStatus.OK) {
//    for (var i = 0; i < results.length; i++) {
//      createMarker(results[i]);
//    }
//  }
//}
//
//function createMarker(place) {
//  var placeLoc = place.geometry.location;
//  var marker = new google.maps.Marker({
//    map: map,
//    position: place.geometry.location
//  });
//
//  google.maps.event.addListener(marker, 'click', function() {
//    infowindow.setContent(place.name);
//    infowindow.open(map, this);
//  });
//}
//
//
//function nearByStore(loca)
//{
//	var request={
//		location: loca,
//		radius: 500,
//		types:['store']};
//		
//	var service =  new google.maps.places.PlacesService(map2);
//	service.nearbySearch(request, function(results, status){
//		 if (status == google.maps.places.PlacesServiceStatus.OK) {
//    		for (var i = 0; i < results.length; i++) {
//      			createMarker(results[i]);
//   				 }
//  			}
//		} );
//}
//
//
//function createMarker(place) {
//  var placeLoc = place.geometry.location;
//  var marker = new google.maps.Marker({
//    map: map2,
//    position: place.geometry.location
//  });
//
//  google.maps.event.addListener(marker, 'click', function() {
//    infowindow.setContent(place.name);
//    infowindow.open(map2, this);
//  });
//  }
//
//function getCurrentLocation()
//{
//	if(navigator.geolocation)
//		{
//			var options = { enableHighAccuracy: true };
//			navigator.geolocation.getCurrentPosition(onGetLocationSuccess,onPhoneGapError,options);
//		}
//		else
//		{
//			error("not supported@_@ will try IP search");
//			
//		}
//}
//
//
//function onGetLocationSuccess(position)
//{
//	currentposition.lat =position.coords.latitude;
//	currentposition.lng =position.coords.longitude;
//	
//	
//}

function onPhoneGapError(error) {
        alert('code: '    + error.code    + '\n' +
              'message: ' + error.message + '\n');
}







