Ext.define('Ext.interaction.LeapMotion', {
    requires: [
        'Ext.draw.Component'
    ],
    config: {
        webSocket: null,
        previousScroll: 0,
        pressed: false,
        previouslyPressed: false,
        previousElement: null,
        scroll: 0,
        pointer: null,  // The pointer drawn on screen
        movementThreshold: 40,  // Movement threshold for mousedown events
        
        // The coordinates of the Leap Motion to work with
        centerX: 0,
        minX: -125,
        maxX: 125,
        centerY: 300,
        minY: 200,
        maxY: 400,
        
        eventFiredX: 0,
        eventFiredY: 0,
        
        // Coordinates for centre of the page
        pageCenterX: (document.body.clientWidth / 2),
        pageCenterY: (document.body.clientHeight / 2),
        
        maxPageX: (document.body.clientWidth - 40),
        minPageX: 0,
        minPageY: 0,
        maxPageY: (document.body.clientHeight - 40),
        
        ratioX: 0,
        ratioY: 0,
        newX: 0,
        newY: 0
    },
        
    constructor: function(config) {
        this.initConfig(config);
        
        this.setRatioX(this.getPageCenterX() / this.getMaxX());
        this.setRatioY(this.getMaxPageY() / (this.getMaxY() - this.getMinY()));
                                        
        this.createPointer();
        this.createWebSocket();
    },
    
    createWebSocket: function() {
        var host = location.hostname || "localhost";
        this.setWebSocket(new WebSocket("ws://"+host+":6437/"));
        
        var me = this,          
                webSocket = this.getWebSocket();  
                
        webSocket.onmessage = function(event) {
                        var obj = JSON.parse(event.data);
                        if (obj.pointables && obj.pointables.length > 0)
                        {                       
                                // Leap Motion device coordinates
                                var x = obj.pointables[0].tipPosition[0],
                                        y = obj.pointables[0].tipPosition[1];
                                        
                                me.setPressed(obj.pointables[0].tipPosition[2] < 0);             // Is the user motioning towards the screen, if so, fire events on the underlying element.
        
                                me.getPointer().getSurface("main")._items.items[0].repaint();
                        
                                if (x > 0)
                                        me.setNewX((x * me.getRatioX()) + me.getPageCenterX());
                                else
                                        me.setNewX(me.getPageCenterX() - (x * (me.getRatioX() * -1)));
        
                                me.setNewY((((y - 300) * me.getRatioY()) * -1) + 300);
                                                        
                                if (me.getNewY() < 0)
                                        me.setNewY(0);
                                else if (me.getNewY() > me.getMaxPageY())
                                        me.setNewY(me.getMaxPageY());
                                        
                                if (me.getNewX() < 0)
                                        me.setNewX(0);
                                else if (me.getNewX() > me.getMaxPageX())
                                        me.setNewX(me.getMaxPageX());
        
                                me.getPointer().setLeft(me.getNewX());
                                me.getPointer().setTop(me.getNewY());
        
                                if (me.getPressed())
                                {
                                        if (me.getPreviousElement() != null)
                                        {
                                                var diffX = 0;
                                                var diffY = 0;
                                                
                                                if (me.getEventFiredX() < me.getNewX())
                                                        diffX = me.getNewX() - me.getEventFiredX();
                                                else
                                                        diffX = me.getEventFiredX() - me.getNewX();
                                                        
                                                if (me.getEventFiredY() < me.getNewY())
                                                        diffY = me.getNewY() - me.getEventFiredY();
                                                else
                                                        diffY = me.getEventFiredY() - me.getNewY();
                                                
                                                if (diffX > me.getMovementThreshold() || diffY > me.getMovementThreshold()) {
                                                        if (Ext.os.is.iOS)
                                                                me.firePageEvent(me.getPreviousElement(), 'touchmove');
                                                        else
                                                                me.firePageEvent(me.getPreviousElement(), 'mousemove');
                                                }
                                        }
                                
                                        me.getPointer().getSurface("main")._items.items[0].setAttributes({ fillStyle: "red" });
                                }
                                else
                                {
                                        me.getPointer().getSurface("main")._items.items[0].setAttributes({ fillStyle: "green" });
                                        me.setPreviouslyPressed(false);
                                        
                                        if (me.getPreviousElement() != null)
                                        {
                                                if (Ext.os.is.iOS)
                                                        me.firePageEvent(me.getPreviousElement(), 'touchend');
                                                else
                                                        me.firePageEvent(me.getPreviousElement(), 'mouseup');
                                        }
                                }
        
                                if (me.getPressed() && me.getPreviouslyPressed() === false)
                                {
                                        var element = me.getComponentFromPosition(me.getNewX() - 1, me.getNewY() - 1);
                                
                                        if (Ext.os.is.iOS)
                                                me.firePageEvent(element, "touchstart");
                                        else
                                                me.firePageEvent(element, "mousedown");
                                                                                                        
                                        me.setPreviouslyPressed(true);
                                        me.setPreviousElement(element);
                                        me.setEventFiredX(me.getNewX());
                                        me.setEventFiredY(me.getNewY());
                                }
                        }
                };
        
                webSocket.onclose = function(event) {
                        ws = null;
                };
                
                webSocket.onerror = function(event) {
                        alert("Received error");
                };
    },
    
    firePageEvent: function(element, eventName) {
        if (Ext.os.is.iOS) {
                var touch = document.createTouch(window, element, null, this.getNewX(), this.getNewY(), this.getNewX(), this.getNewY());
                var touches = document.createTouchList(touch);
                var targetTouches = document.createTouchList(touch);
                var changedTouches = document.createTouchList(touch);
                            
                var evt = document.createEvent("TouchEvent");
                evt.initTouchEvent(eventName, true, true, window, null, 0, 0, 0, 0, false, false, false, false, touches, targetTouches, changedTouches, 1, 0);
                var event = element.dispatchEvent(evt);
        }
        else {
                var evt = document.createEvent("MouseEvents");
                evt.initMouseEvent(eventName, true, true, null, null, null, null, this.getNewX(), this.getNewY());
                var event = element.dispatchEvent(evt);
        }
    },
    
    getComponentFromPosition: function(x, y) {
        var el = document.elementFromPoint(x, y);
   
        return el;
    },    
        
    createPointer: function() {
        this.setPointer(new Ext.draw.Component({
                style: 'position: absolute',
                zIndex: 2000,
                top: -100,
                left: -100,
                width: 40,
                height: 40,
                        items: [{
                        type: 'circle',
                        cx: 20,
                        cy: 20,
                        r: 20,
                        fillStyle: 'green'
                        }]
                }));
                
        Ext.Viewport.add(this.getPointer());
    }
});
