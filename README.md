# JS_Chat_Room_App
This Chat Room App Utilizes socket.io, ajax, html, and css

Make Cohost:
Each user in any given room has an associated kick, ban, sendPM, and makeCohost button. However, only the host of a room has access to the the kick, ban, and makeCohost button functionality. If another user clicks any of those buttons nothing will happen. But, the host can make any other user a cohost of the room in which case that user is granted all host privileges and can kick, and ban any other user, including the original host. 

Show/Hide Private Message:
A user can initialize a Private Message with another user at any point when they are in the same room. Additionally, we included functionality that ensures there is no limit to the number of private conversations you can have. Also, once the Private Chat is initialized the conversation can be continued even if the users go into different rooms. A list of all the private conversations is kept and the user can choose to show or hide any number of these conversation from zero to all of them via a dropdown menu. A user can hide the conversation, then show it again later without losing previous messages in the conversation.

Styling and Scrolling:
We used a lot of custom styling to improve the usability and intuitive nature of out chat app. The private message div, chat room div, and available rooms div all incorporate the scrolling function so that when the chats fill up with messages, the messages remain contained in the div, and the div gains the ability to scroll.  

This project was completed as part of Wash U's Rapid Prototype Development and Creative Programming course in collaboration with Tyler Reeves.
