# SpeakUP!
## General Info

SpeakUP allows you to create instant videoconference for up to 4 people.
It uses peer-2-peer connection between clients to transmit audio/video (WebRTC protocol).

[Start videoconference](https://speakup.ptdev.pw/)
&bull;
[VK Page](https://vk.com/speakupcf)

## Creating own version
### Dependencies
* [SimpleWebRTC](https://github.com/andyet/SimpleWebRTC)
* [SASS](http://sass-lang.com/)
* [UglifyJS](http://lisperator.net/uglifyjs/)

### Installation
Not available at the moment.

## Version History
### 1.8.12
* Command to clean recent rooms list (`/command clean_rooms`).
* Mini Mode during calls for standalone clients (only Windows).
* Outgoing call UI.
* Embedding Youtube videos by linking in chat.
* Small bugfixes.
* Added robots.txt
* First iteration of updated friends interface.

### 1.8.11
* Confirmation when joining room by link.
* LinkSoft Account Integration.
* Initial implementation of Friend List and Direct Calls.
* Public release of Windows and Linux clients (powered by [electron](https://github.com/electron/electron)).
* Small bugfixes.
* Optimization for smaller screen sizes.
* Fixed random keyboard popout on mobile/tablet devices.
* Updated jQuery library to 3.0.0-rc1.
* Now using SVG icons instead of font icons.

### 1.8.7
* Updated jQuery.

### 1.8.6
* Displaying recent rooms on login screen.
* Fixed volume of new client when pause enabled.

### 1.8.5
* Paused mode overlay.
* Updated jQuery.

### 1.8.4
* Reworked preferences interface.
* Share window integrated in preferences window.
* Ability to change nickname.
* Fixes for mobile/tablet versions.

### 1.8.3
* Updated SimpleWebRTC Library.
* Improved loading time by minifying javascript.
* Fixed inclusion of favicons.
* Option to disable confirmation of tab closing.

### 1.8.2
* Event Logging System.
* Fixes in detection of audio/video devices.
* C# client is now deprecated.
* Updated chat appearance.

### 1.8.1
* Updated style of online timer.
* Added an amount of unread messages in chat on chat button.
* Added confirmation on tab closing if there are still people in conference.

### 1.8.0
* Changed the process of requesting access to webcam/microphone. Now it has to be more stable and also work not only in Chrome.
* Added an indicator which show how long each participant is connected. It's available on hover on any nickname.
* Added handlers for some errors. Some errors are now warning (for example: camera is not available).