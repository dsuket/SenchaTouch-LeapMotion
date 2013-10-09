SenchaTouch-LeapMotion
======================
This library makes it possible to use Leap Motion on Sencha Touch.

You can operate client web page for Leap Motion.

Original: http://www.danielgallo.co.uk/post/using-the-leap-motion-controller-to-interact-with-a-sencha-touch-app/

Usage
-----
define requires. ex app.js
```javascript
requires: [
    "Ext.interaction.LeapMotion"
]
```

Then instantiate it at the launch of the app.
```javascript
launch: function() {
    Ext.create("Ext.interaction.LeapMotion");
}
```


Requirement
-----------
Sencha Touch Complete 2.3.0.
(using Ext.draw.Component)



