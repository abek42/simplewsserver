var wsObj = {wsAddress:"ws://localhost:1337", wsClientId:null, wsClientType:null,wsPeer:null, handle:null,msgs:0, lastStatus:null,  timerHnd:null, msgDigested:true};

const ACTION_BROADCAST ="broadcast";
const ACTION_SEND_TO_PEER = "send to peer";
const ACTION_CONNECT = "connect";
const ACTION_RECONNECT = "reconnect";
const ACTION_DISCONNECT = "disconnect";
const ACTION_SET_CLIENT = "set client id";

const CLIENT_IS_LISTENER_BROADCAST ="broadcast listener";
const CLIENT_IS_LISTENER_PEER = "peer listener";
const CLIENT_IS_SENDER_BROADCAST = "broadcast sender";
const CLIENT_IS_SENDER_PEER = "peer sender";
const CLIENT_IS_DUPLEX_BROADCAST = "broadcast sender-listener";
const CLIENT_IS_DUPLEX_PEER = "peer sender-listener";


//handle all the websocket initialization 
function websocketInit(clientInfo){
	if ("WebSocket" in window){//check if browser supports ws
		console.log("INFO: WebSocket is supported by your Browser!");
		if(wsObj.lastStatus==null){
			updateDOM("wsStatus","WS Disconnected");
		}
		
		// Let us open a web socket
		try{
			var ws = new WebSocket(wsObj.wsAddress);
			ws.onerror = function (evt){
				updateDOM("wsStatus","WS Disconnected: "+evt.error);
			}
			ws.onopen = function(){
			// Web Socket is connected, send data using send()
				ws.send(JSON.stringify({"action":ACTION_CONNECT, "type":clientInfo.type,"peer":clientInfo.peer}));
				ws.wsClientType:client.type; //save for future use
				console.log("INFO: WebSocket INIT");
				updateDOM("wsStatus","WS Open");
			};

			ws.onmessage = function (msgEvent){ 
				if(wsObj.msgDigested){
					//when wsObj.msgDigested=true we drop packets if we get them faster than we can process them
					var msgObj = JSON.parse(msgEvent.data);
					
					if(msgObj.action==ACTION_SET_CLIENT){
						wsObj.wsClientId=msgObj.clientId;						
					}
					else{
						if(msgObj.data!=null){
							wsObj.msgDigested = false;
							wsObj.msgs++;
							notifyData(msgObj.data);
							updateDOM("msgCounter",wsObj.msgs);
						}
					}
				}
			};

			ws.onclose = function(){
				// websocket is closed.
				console.log("ERROR: Websocket Connection Closed");
				updateDOM("wsStatus","Disconnected");
				window.setTimeout(function(){
					updateDOM("wsStatus","Reconnecting websocket");
					websocketInit({"action":ACTION_RECONNECT, "type":ws.wsClientType,"peer":ws.wsPeer, "clientId",ws.wsClientId});
				}, 5000);
			};
			wsObj.handle = ws; //reference to the actual websocket			
		}
		catch(e){

		}
	}            
	else{
		// The browser doesn't support WebSocket
		alert("WebSocket NOT supported by your Browser!");
	}
	
	window.onbeforeunload = function(){
		ws.close();
	}
}

function updateDOM(name, details) {//this is a abstracted form of DOM updateCommands
//the event will trigger, but if there are no listeners, it just vaporizes.
	var event = new CustomEvent("DOMUpdate", {
		detail: {"name":name, "details":details}
	});
	document.dispatchEvent(event);
}

function notifyData(data){
	var json = JSON.parse(data);
	var event = new CustomEvent("DataEvent",{
		detail: data
	});
	document.dispatchEvent(event);
	wsObj.msgDigested = true;
}

function setWSEventListener(){//this is meant to encapsulate DOM changes in response to non-DOM events
	document.addEventListener("WSEvent", function(e) {
		processWSEvent(e.detail);//this function should be updated to work on customized changes
	});
}

function processWSEvent(data){
	if(data.action==ACTION_CONNECT){
		websocketInit(data);		
		return;
	}
	
	if((data.action==ACTION_SEND_TO_PEER)||(data.action==ACTION_BROADCAST)){
		wsObj.ws.send(data);
	}
	
}