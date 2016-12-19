var socketio = io.connect();
      var $loginPage = $('.login-page.site'); // The initial login page     
      var $chatPage = $('.chat-page.site');  // The main chat page
      var roomIn = "";
      var myUsername = "";
      var numRooms = 2;
      var iHost = [];
      var oldRoom = "";
      var numPM = 0;

      socketio.on("message_to_room",function(data) {
         //make and append a create room button
         var received = document.createElement("li");//new message
         var message = data["username_from"] + ": " + data["message"];
         received.appendChild(document.createTextNode(message));
         if(data["username_from"] == myUsername){
          received.className = "sent-messages";
         } else {
          received.className = "received-messages";
         }
         document.getElementById("roomThread").appendChild(received);
      });
      //adding an event listener to the create room button
      document.getElementById("create-room-btn").addEventListener("click", createRoom);

      socketio.on("message_to_person", function(data){
         
         var messageLI = document.createElement("li");
        var message = data["username_from"] + ": " + data["message"];
        messageLI.appendChild(document.createTextNode(message));
         if(data["username_from"] == myUsername){
          messageLI.className = "sent-messages";
         } else {
          messageLI.className = "received-messages";
         }
         var privateID= "user" + data["username_from"] + "-msgs";
         if(document.getElementById(privateID)){
          var appendy = "appendChatToHere" + data["username_from"];
          document.getElementById(appendy).appendChild(messageLI);
        } else {
          var chatUL = setupPM(data["username_from"]);
          chatUL.appendChild(messageLI);
        }
        //send a private message
        socketio.on("sent_message_to_person", function(data){
          var privateID= "appendChatToHere" + data["username_to"];
          var messageLI = document.createElement("li");
         var message = data["username_from"] + ": " + data["message"];
         messageLI.appendChild(document.createTextNode(message));
          messageLI.className = "sent-messages";
          document.getElementById(privateID).appendChild(messageLI);
        });
         
      });

      //on successful join, change to chat main page
      socketio.on("successJoin", function(data){
         $loginPage.fadeOut();
         $chatPage.show();
         oldRoom = roomIn;
         roomIn = data["room"];
         myUsername = data["username"];
         var greeting = "Hello, " + data["username"] + "! You're in room: " + roomIn;
         document.getElementById("usernameHeader").innerHTML = greeting;
         while(document.getElementById("roomThread").firstChild){
          document.getElementById("roomThread").removeChild(document.getElementById("roomThread").firstChild);
         }
         //show all the existing rooms and users
         socketio.emit("query_rooms");
          queryUsers();
      });

      socketio.on("rooms", function(data){
        while(document.getElementById("roomlist").firstChild){
          document.getElementById("roomlist").removeChild(document.getElementById("roomlist").firstChild);
        }
        //add rooms buttons to available rooms list
        for(x in data["roomsList"]){
          var newButton = document.createElement("button");
          newButton.innerHTML = data["roomsList"][x];
          newButton.className = "btn btn-primary btn-md room-btn";
          var id = "public-room-btn" + numRooms;
          numRooms++;
          newButton.setAttribute("id", id);
          newButton.addEventListener("click", joinRoom);
          document.getElementById("roomlist").appendChild(newButton);
          document.getElementById("roomlist").appendChild(document.createElement("br"));
          var buttonUL = document.createElement("ul");
          var ulID = "public-room-UL" + data["roomsList"][x];
          buttonUL.setAttribute("id", ulID);
          document.getElementById("roomlist").appendChild(buttonUL);
          document.getElementById("roomlist").appendChild(document.createElement("br"));
        }
      });

      function queryUsers(){
        socketio.emit("query_users", {room: roomIn});
      }

      socketio.on("usersInRoom", function(data){
        var ulToAppend = "public-room-UL" + data["room"];
        var str1 = "public-room-UL";
        var ulToAppendOld = "public-room-UL" + oldRoom
        if(oldRoom != ""){
          while(document.getElementById(ulToAppendOld).firstChild){
           document.getElementById(ulToAppendOld).removeChild(document.getElementById(ulToAppendOld).firstChild);
          }
        }
        while(document.getElementById(ulToAppend).firstChild){
          document.getElementById(ulToAppend).removeChild(document.getElementById(ulToAppend).firstChild);
        }
        //for all users in a room create the sendPM, kick, ban, and makeCohost buttons and addeventlisteners
        for(x in data["users"]){
           var li = document.createElement("li");
           var h4Name= document.createElement("h4");
           h4Name.appendChild(document.createTextNode(data["users"][x]));
           h4Name.className="h4Name";
           li.appendChild(h4Name);
           li.className="roomates";
           li.appendChild(document.createElement("br"));
           var kickButton = document.createElement("button");
           kickButton.className="btn actions-btn";
           var banButton = document.createElement("button");
           banButton.className="btn actions-btn";
           var sendPM = document.createElement("button");
           sendPM.className="btn actions-btn";
           var makeHostButton = document.createElement("button");
           makeHostButton.className="btn actions-btn";
           makeHostButton.appendChild(document.createTextNode("make cohost"));
           makeHostButton.setAttribute("value", data["users"][x]);
           makeHostButton.addEventListener("click", function(event){
              makeHost(event.target.value);
           });
           sendPM.appendChild(document.createTextNode("send PM"));
           sendPM.setAttribute("value", data["users"][x]);
           var textID = "pm-" + data["users"][x] + "-input";
            //sendPM.setAttribute("id", textID);
           sendPM.addEventListener("click", function(event){
            setupPM(event.target.value);
          });
           kickButton.appendChild(document.createTextNode("kick"));
           kickButton.addEventListener("click", kick);
           banButton.appendChild(document.createTextNode("ban"));
           banButton.addEventListener("click", ban);
           banButton.setAttribute("value", data["users"][x]);
           kickButton.setAttribute("value", data["users"][x]);
           li.appendChild(sendPM);
           li.appendChild(makeHostButton);
           li.appendChild(kickButton);
           li.appendChild(banButton);
           
          document.getElementById(ulToAppend).appendChild(li); 
        }
      });
      
      //allow a host to make another user a cohost
      function makeHost(data){
         if(iHost.indexOf(roomIn) == -1){

        } else {
          if(confirm("Are you sure? This gives the user to kick and ban anyone, including you.")){
          socketio.emit("makeHost", {host:data, room:roomIn});
        }
        }
      }

      //alert a user if they have been made a cohost
      socketio.on("you_host", function(data){
        if(iHost.indexOf(roomIn) == -1){
        alert("You have been made a cohost of " + data["room"]);
        iHost.push(data["room"]);
        }

      });

      //create the html infrastructure for a personal message
      function setupPM(data){
        var privateID= "user" + data + "-msgs";
        if(document.getElementById(privateID)){
          document.getElementById(privateID).style.display = "block";
        } else {
         var username
          var chatBlock = document.createElement("div");
          chatBlock.setAttribute("id", privateID);
          chatBlock.className = "chat-block";
          var nameHeader=document.createElement("h3");
          nameHeader.className ="nameHeader";
          nameHeader.appendChild(document.createTextNode(data));
          chatBlock.appendChild(nameHeader);
          var chatUL = document.createElement("ul");
          chatUL.className = "message-thread";
          var something = "appendChatToHere" + data;
          chatUL.setAttribute("id", something);
          chatBlock.appendChild(chatUL);
          var replyArea = document.createElement("div");
          replyArea.className = "reply-private";
          var input = document.createElement("input");
          input.setAttribute("type", "text");
          input.className = "messageInput";
          var textID = "pm-" + data + "-input";
          input.setAttribute("id", textID);
          var sendButton = document.createElement("button");
          sendButton.className = "btn btn-primary btn-md";
          sendButton.addEventListener("click", sendPrivateMessage);
          sendButton.innerHTML = "send";
          sendButton.setAttribute("value", data);
          replyArea.appendChild(input);
          replyArea.appendChild(sendButton);
          chatBlock.appendChild(replyArea);
          document.getElementById("chat-page").appendChild(chatBlock);

          var dropdownShow = document.createElement("li");
          var dropdownHide = document.createElement("li");
          var aShow = document.createElement("a");
          var aHide = document.createElement("a");

          aShow.setAttribute("href", "#");
          aHide.setAttribute("href", "#");
          var show = "show-" + data;
          aShow.setAttribute("id", show);
          var hide = "hide-" + data;
          aHide.setAttribute("id", hide);
          aShow.addEventListener("click", function(){
            document.getElementById(privateID).style.display = "block";
          });
          aHide.addEventListener("click", function(){
            document.getElementById(privateID).style.display = "none";
          });

          aShow.innerHTML = data;
          aHide.innerHTML = data;
          dropdownShow.appendChild(aShow);
          dropdownHide.appendChild(aHide);
          document.getElementById("dropdown-show").appendChild(dropdownShow);
          document.getElementById("dropdown-hide").appendChild(dropdownHide);
          document.getElementById(privateID).style.display = "block";

          return chatUL;
        }
      }

      socketio.on("username_taken", function(){
         alert("that username was taken");
      });

      socketio.on("user_left", function(data){
       // alert("user left");
       queryUsers();
      });

      socketio.on("user_joined", function(data){
        //alert("user joined");
        queryUsers();
      });
      
      document.getElementById("send-btn").onclick = sendMessage();
      
      //sends a message to the current chat room if the text field is not null
      function sendMessage(event){
         var msg = document.getElementById("room_message_input").value;
         if(msg == ""){

         } else {
         var sendToRoom = roomIn;
         socketio.emit("message_to_room", {message:msg, room:sendToRoom});
         document.getElementById("room_message_input").value = "";
         }
      }

      //sends a private message if the input field is not null
      function sendPrivateMessage(event){
        var sendToPerson = event.target.value;//name of person sent to, use this for appendChatToHere
        var textNeeded = "pm-" + sendToPerson + "-input"
         var msg = document.getElementById(textNeeded).value;
        if(msg == ""){

        } else {
         var privateID= "appendChatToHere" + sendToPerson;
         var messageLI = document.createElement("li");
         var message = myUsername + ": " + msg;
         messageLI.appendChild(document.createTextNode(message));
         messageLI.className = "sent-messages";
         document.getElementById(privateID).appendChild(messageLI);
        socketio.emit("send_message_to_person", {message: msg, username_to: sendToPerson});
        document.getElementById(textNeeded).value = "";
        }

      }

      //join a room when the room's button is clicked
      function joinRoom(event){
      	var x = $(event.target).text();
        if(x == roomIn){

        } else {
          socketio.emit("join_room", {roomName:x, password:""});
        }
      }

      document.getElementById("public-room-btn0").addEventListener("click", joinRoom);
      document.getElementById("public-room-btn1").addEventListener("click", joinRoom);

      //if a room has a password
      socketio.on("needRoomPassword", function(data){
        var pw = prompt("Please enter the password for this room.");
        if(pw == null){

        } else {
          socketio.emit("join_room", {roomName:data["roomName"], password:pw});
        }
      });

      //if the incorrect password is given
      socketio.on("wrongPassword", function(data){
        var pw = prompt("Incorrect password. Please check the password and try again.");
        if(pw == null){

        } else {
          socketio.emit("join_room", {roomName:data["roomName"], password:pw});
        }
      });
      

      function createRoom(event){
        var roomN = document.getElementById("createRoomName").value;
        var roomP = document.getElementById("createRoomPass").value;
        socketio.emit("create_room", {roomName:roomN, roomPassword:roomP});
        document.getElementById("createRoomName").value = "";
        document.getElementById("createRoomPass").value = "";
        $('#createModal').modal('toggle');
      }

      socketio.on("roomNameTaken", function(){
        document.getElementById("takenPrompt").innerHTML = "That room name was taken please try another.";
      });

      //html infrastructure for creating a room & its associated button & eventlistener
      socketio.on("room_created", function(data){
        var newButton = document.createElement("button");
        newButton.innerHTML = data["roomName"];
        newButton.className = "btn btn-primary btn-md room-btn";
        var id = "public-room-btn" + numRooms;
        numRooms++;
        newButton.setAttribute("id", id);
        newButton.addEventListener("click", joinRoom);
        if(data["host"] == myUsername){
          iHost.push(data["roomName"]);
        }
        document.getElementById("roomlist").appendChild(newButton);
        document.getElementById("roomlist").appendChild(document.createElement("br"));
        var buttonUL = document.createElement("ul");
        var ulID = "public-room-UL" + data["roomName"];
        buttonUL.setAttribute("id", ulID);
        document.getElementById("roomlist").appendChild(buttonUL);
        document.getElementById("roomlist").appendChild(document.createElement("br"));
      });

      //kick a user out (only works if you're the host)
      function kick(event){
        if(iHost.indexOf(roomIn) == -1){

        } else {
          var x = event.target.value;
          socketio.emit("kick", {userToKick: x});
        }
      }

      //alert if a user has been kicked out
      socketio.on("leaveRoom", function(){
        alert("You were kicked from the room. Bummer, dude.");
        socketio.emit("join_room", {roomName:"public1", password:""});
      });

      //ban a user from a room (only works if you're the host)
      function ban(event){
        if(iHost.indexOf(roomIn) == -1){

        } else {
          var x = event.target.value;
          socketio.emit("ban", {userToBan: x, kickedFrom: roomIn});
        }
      }

      //alert if you're been banned from a room
      socketio.on("banned", function(){
        alert("you were banned from this room");
      });
      
      document.getElementById("usernameInput").onkeypress = function(e){
        var keyCode = e.keyCode || e.which;
        if(keyCode == '13'){
          username();
        }
      }

       document.getElementById("room_message_input").onkeypress = function(e){
        var keyCode = e.keyCode || e.which;
        if(keyCode == '13'){
          sendMessage();
        }
      }

      function username(){
         var un = document.getElementById("usernameInput").value;
         socketio.emit("username", {username:un});
      }
