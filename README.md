# hj-video-intro-animator
Video intro/transition text animation tool I made for my videos using JS.

# Usage

Just open up setup.html and edit the settings to your liking.

# Help

New: Create a new text item.

Remove: Delete the last text item in the list.



#### Text options in order:

* Text: The text to display.

* Size: The size of the text.

* Glow: The radius of glow on the text (0 for none)

* Position: The vertical position of the text.

* Brightness: Brightness of the text (0-255)

* Width: How much space should be between the letters.

* A_time: The amount of time for an individual letter to fade in (0 for instant)

* A_inbetween: The amount of time between letters during fade in animation (0 for all together)

* A_offset: How many frames until fade in animation starts



Font: Select font for text (Recommended: Bebas Neue)



BG Brightness: Set how bright the background gradient should become.

BG Time: How long it should take for the BG to appear.



Curve: The c value of the easing formula. Lower values = more drastic curves (Recommended: 1.5-1.01)

Divider: The h value of the easing formula. Lower values = more extreme curves. (Recommended: 4-6)



#### Event options in order:

* Target: What text item the event should apply to (0 = top item in list, 1 = second item, etc.)

* Start_time: When the event should take place

* Duration: How long the event should last for

* Amount: How much in the Y-axis should the target text be moved in the event



#### Effects in order:

* Flicker: All glow on text randomly changes opacity.

* Dust particles: Random particles fall from top-right to bottom-left of the screen.



#### Particle options in order:

* Amount: How many particles there should be

* Speed: How fast the particles should move (Speed is randomly set for each particle based on this value)

* Size: How large the particles should be (Size is randomly set for each particle based on this value)

* Alpha: What the opacity of the particles should be (Randomly set for each particle based on this value) (Ranges from 0-1)



Length: The length of the animation (In seconds)



Render: Renders the animation. (First pre-renders it, then post-renders, then presents you a video file of the finished product)

Debug: Shows variable values as the animation plays (turn off for render)
