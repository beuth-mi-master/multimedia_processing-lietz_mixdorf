# CodeLabs Google WebRTC
## Step 1 - Bonus:
1. Object stream wird in der Konsole ausgegeben 
2. Array of MediaStreamTrack mit dem momentanen Video - FaceTime HD Camera
3. Das Video stoppt und das Bild wird schwarz
4. Abfrage ob Audio erlaubt werden darf und dann ist Audio hörbar
5. video.videoHeight und video.videoWidth
6. Screenshot
## Step 2 - Bonus
1. Screenshot
2. Screenshot
3. Screenshot
4. Das Format sieht aus wie ein Übertragungsprotokoll (Screenshot)
## Step 3 - Bonus
1. Beim Senden von Text ist es wichtig, dass alle Zeichen korrekt ankommen. Beim Video kann auch mal was verloren gehen, da der Gesamtkontext trotzdem erhalten bleibt. Wenn aber statt "Ich glaub an die Bank" der Text "ich raub die Bank" ankommt, kann das verwirren.
2. Screenshot
3. Textarea funktioniert nicht auf iPhone 6 und auch nicht im iOS Simulator auf einem 5s (Screenshot)
## Step 4 - Bonus
1. Es gibt noch HTTP-Streaming, Server-Side-Events und HTTP long-polling. Die Unterstützung für WebSockets in einigen Browsern kann nicht unterstützt sein. Beispielsweise für IE 8/9 (http://caniuse.com/#search=websocket) - hierzu wären Polyfills notwending.
2. Das vertikale Skalieren ist nur möglich, wenn mehrere NodeJS-Server-Instanzen laufen. Diese kommunizieren aber nicht untereinander, sodass es auf jedem Server eigene Räume geben würde. Zusätzlich sind pro Raum nur 3 User maximal zugelassen laut main.js
3. Screenshot
## Step 5 - Bonus
1. Auf dem Server muss der Callbackhandler für "create and join" angepasst werden, sodass dieser mehr als 2 Personen zulässt. Die HTML-Datei sollte das dynamische hinzufügen von Videos umsetzen und die main.js sollte modular aufgebaut werden, sodass mehr als nur die festen 2 Instanzen erstellen kann.
2. Entweder man benutzt wie in der vorherigen Aufgabe einen Eingabedialog, wo der Nutzer den Raum selber angeben kann, oder man macht es auch wie in der vorherigen Aufgabe und splitted die Url beim obersten Ordner und nutzt diesen als Raumnamen.
3. Screenshot: step-5-part1 und step-5-part2
4. Die Frage ist nicht verständlich formuliert. Man kann alles mit der App machen. Falls gemeint ist, was es für Ideen gäbe, die App zu verbessern, so würde ich das Layout anpassen und das ganze mit einem Chat kombinieren.
## Step 6 - Bonus
1. Generell sollte es möglich sein, die Daten müssen nur beim Sender Encodiert werden und die maximale Paketgröße muss eingehalten werden. Der Empfänger muss diese dann wieder dekodieren.
