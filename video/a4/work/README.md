# CodeLabs Google WebRTC

Screenshots, die während des CodeLabs gemacht wurden, liegen unter [../screenshots/](../screenshots/).

Zusätzlich sind die beantworteten Bonusfragen hier mit den zugehörigen Screenshots verlinkt.


## Step 1 - Bonus:

###### 1. The stream object passed to getUserMedia() is in global scope, so you can inspect it from the browser console: open the console, type stream and press Return. (To view the console in Chrome, press Ctrl-Shift-J, or Command-Option-J if you're on a Mac.)
Object stream wird in der Konsole ausgegeben

###### 2. What does stream.getVideoTracks() return?
Array of MediaStreamTrack mit dem momentanen Video - FaceTime HD Camera

###### 3. Try calling stream.getVideoTracks()[0].stop().
Das Video stoppt und das Bild wird schwarz

###### 4. Look at the constraints object: what happens when you change it to {audio: true, video: true}?
Abfrage ob Audio erlaubt werden darf und dann ist Audio hörbar

###### 5. What size is the video element? How can you get the video's natural size from JavaScript, as opposed to display size? Use the Chrome Dev Tools to check.
video.videoHeight und video.videoWidth

###### 6. Try adding CSS filters to the video element. For example:
![img](../screenshots/step-1-part4.png)



## Step 2 - Bonus

###### 1. Take a look at chrome://webrtc-internals. This provides WebRTC stats and debugging data. (A full list of Chrome URLs is at chrome://about.)
![img](../screenshots/step-2-part1.png)

###### 2. Style the page with CSS: Put the videos side by side. Make the buttons the same width, with bigger text. Make sure the layout works on mobile.
![img](../screenshots/step-2-part3.png)
![img](../screenshots/step-2-part4.png)


###### 3. From the Chrome Dev Tools console, look at localStream, pc1 and pc2.
![img](../screenshots/step-2-part5.png)
![img](../screenshots/step-2-part6.png)


###### 4. From the console, look at pc1.localDescription. What does SDP format look like?
Das Format sieht aus wie ein Übertragungsprotokoll
![img](../screenshots/step-2-part6.png)


## Step 3 - Bonus

###### 1. With SCTP, the protocol used by WebRTC data channels, reliable and ordered data delivery is on by default. When might RTCDataChannel need to provide reliable delivery of data, and when might performance be more important — even if that means losing some data?
Beim Senden von Text ist es wichtig, dass alle Zeichen korrekt ankommen. Beim Video kann auch mal was verloren gehen, da der Gesamtkontext trotzdem erhalten bleibt. Wenn aber statt "Ich glaub an die Bank" der Text "ich raub die Bank" ankommt, kann das verwirren.

###### 2. Use CSS to improve page layout, and add a placeholder attribute to the "dataChannelReceive" textarea.
![img](../screenshots/step-3-part1.png)
![img](../screenshots/step-3-part2.png)
![img](../screenshots/step-3-part3.png)

###### 3. Test the page on a mobile device.
Textarea funktioniert nicht auf iPhone 6 und auch nicht im iOS Simulator auf einem 5s (Screenshot)


## Step 4 - Bonus

###### 1. What alternative messaging mechanisms might be possible? What problems might we encounter using 'pure' WebSocket?
Es gibt noch HTTP-Streaming, Server-Side-Events und HTTP long-polling. Die Unterstützung für WebSockets in einigen Browsern kann nicht unterstützt sein. Beispielsweise für IE 8/9 (http://caniuse.com/#search=websocket) - hierzu wären Polyfills notwending.

###### 2. What issues might be involved with scaling this application? Can you develop a method for testing thousands or millions of simultaneous room requests?
Das vertikale Skalieren ist nur möglich, wenn mehrere NodeJS-Server-Instanzen laufen. Diese kommunizieren aber nicht untereinander, sodass es auf jedem Server eigene Räume geben würde. Zusätzlich sind pro Raum nur 3 User maximal zugelassen laut main.js

###### 3. This app uses a JavaScript prompt to get a room name. Work out a way to get the room name from the URL. For example localhost:8080/foo would give the room name foo.
![img](../screenshots/step-4-part3.png)
![img](../screenshots/step-4-part4.png)
![img](../screenshots/step-4-part5.png)

## Step 5 - Bonus

###### 1. This application supports only one-to-one video chat. How might you change the design to enable more than one person to share the same video chat room?
Auf dem Server muss der Callbackhandler für "create and join" angepasst werden, sodass dieser mehr als 2 Personen zulässt. Die HTML-Datei sollte das dynamische hinzufügen von Videos umsetzen und die main.js sollte modular aufgebaut werden, sodass mehr als nur die festen 2 Instanzen erstellen kann.

###### 2. The example has the room name foo hard coded. What would be the best way to enable other room names?
Entweder man benutzt wie in der vorherigen Aufgabe einen Eingabedialog, wo der Nutzer den Raum selber angeben kann, oder man macht es auch wie in der vorherigen Aufgabe und splitted die Url beim obersten Ordner und nutzt diesen als Raumnamen.

###### 3. How would users share the room name? Try to build an alternative to sharing room names.
![img](../screenshots/step-5-part1.png)
![img](../screenshots/step-5-part2.png)

###### 4. How could you change the app
Die Frage ist nicht verständlich formuliert. Man kann alles mit der App machen. Falls gemeint ist, was es für Ideen gäbe, die App zu verbessern, so würde ich das Layout anpassen und das ganze mit einem Chat kombinieren.


## Step 6 - Bonus

###### 1. How can you change the code to make it possible to share any file type?
Generell sollte es möglich sein, die Daten müssen nur beim Sender Encodiert werden und die maximale Paketgröße muss eingehalten werden. Der Empfänger muss diese dann wieder dekodieren.
![img](../screenshots/step-6-part0.png)
![img](../screenshots/step-6-part1.png)
