## #1
I’ve been working on my portfolio for quite some time now. It’s not just about coding — it also involves design, research, and many other details. Choosing the right color palette, fonts, and sizes turned out to be much harder than I expected.
Even though the planning phase took a while, I’ve finally started coding. So far, I’ve completed the preloader and the hero section.

Preloader
The preloader features a smooth loading bar. Once it fills up, it expands and fades out gracefully, revealing the hero section with a nice fade-in transition.

Hero Section (My Favorite Part!)
This is the section I’m most proud of. I used GSAP for all the text animations and Three.js for the interactive background.
The background combines a dithered Bayer effect with a beautiful liquid flow simulation that reacts to mouse movement. The trailing effect feels incredibly smooth and immersive — it really makes the whole hero section feel special and unique.
I already have plans for the upcoming sections and I’m really excited to bring them to life!

## #2
ok so this section basically ate my whole week lol. like 15 hours for ONE page?? and the crazy part is i wasn’t even doing design, i just kept trying random ideas until one felt right.

the whole thing is based on “The Creation of Adam” (that famous painting with the two hands almost touching). i thought it’d be sick to have two hands slide in from both sides while the hero closes, kinda like the split second before the fingers touch.

i built the hands like 3 times ngl:
- first in 3d with three.js. looked cool but felt way too heavy and kinda too on the nose
- then i did an ascii version where the letters react to your mouse. way more my style but still not it
- and finally pixels, which is the one i kept. each hand is a grid of pixels that twinkle by themselves and light up when you hover, and the pixel sizes give it this little depth thing. this one just clicked

also threw in two lines of giant scrolling text with gsap, hellos on top and a lil manifesto on the bottom, they slide in when the shutter covers the hero.

the one thing killing me rn is the colors. they’re just kinda mid honestly. so i think i’m gonna do some research, and repaint the whole site properly.

## #3
about me section time. i went looking at how other people do theirs and it’s always the same move: a nice portrait photo, big and confident. which is a problem for me because… i don’t have a single cool picture of myself lol. i’m a bit camera shy and every photo i have looks like a hostage situation.

so instead of just taking a better photo like a normal person, my brain went “why not 3d scan your face?”. found out you can do it with just a phone camera, downloaded polycam, walked around my own head like an idiot for 10 minutes and… it looked TERRIBLE. like melted wax figure terrible. i felt genuinely bad about it ngl.

so i did what i always do when i feel bad: dumb scrolling through awwwards sites of the day. and one of them saved me — a site with a 3d face made entirely of particles. no skin, no texture, just points floating in space. that was it. you don’t need a good photo if your face is 40k dots.

plain particles were kinda monotonous though, everything just sat there dead still. so i ran curl noise over the cloud and now the whole surface drifts like it’s breathing. instant life.

of course nothing works first try. my first version had a depth test problem where the BACK of my head was blending through my face, so i had eyes and hair occupying the same pixels :)). ended up going into blender and rendering out a depth image of just the front of my face, then rebuilt the 3d from that depth map instead of the raw scan. each particle samples the portrait for its position, brightness and size, and instead of a real depth-of-field pass i just fade particles the further they sit from a focus plane — looks like bokeh, costs nothing.

the section hooks into the opening sequence from #2: the shutter bar squares up, expands out to the screen edges and opens straight onto the face. dither background fades itself out on the way so the particles get a clean dark void to float in.

honestly might be my favorite part of the site now. camera shy problem: solved with 40,000 dots.

## #4
so the face particles look great on my machine but the second i opened the site on a cheaper laptop my heart sank. it was chugging. like slideshow chugging. and this whole project has one rule i promised myself: silky on high-end, but still actually usable on low-end. so a section that only runs well on my own gpu is basically a broken section.

i tried everything to save it. dropped the particle count way down, then dropped it again. wired up the frameloop so the canvas only renders when it’s actually on screen and pauses when you scroll away or tab out. all of that helped a bit but not enough — it was still the heaviest thing on the page by a mile and the low-end numbers barely moved. at some point you have to admit the effect just wants more gpu than i’m allowed to spend.

so i’m parking the face for now (code’s still there, i’ll come back to it) and building out the tech stack section instead, something that leans on scroll and layout instead of the gpu.

the idea: your logos stream across the screen as you scroll while a big “Techstack” headline sits locked in the center. but they don’t just slide past in a straight line — each card arcs above or below the center line and curves around the headline, like the text has gravity and the logos are in orbit around it. cards on even positions bend one way, odd ones bend the other, so it reads as this constant weave flowing past the title.

the fun part is the math is all cpu, basically free. the row scrolls horizontally on a pinned scrolltrigger, and every frame i just measure where each card is relative to the headline. the closer a card gets to the title, the more it lifts off the center line to clear it (so nothing ever overlaps the text), and it eases back down as it leaves — that’s the orbit curve. i also give cards a little scale bump right as they cross the middle of the screen so there’s a soft focal point in the center. no shaders, no particles, no webgpu. runs smooth everywhere, which is the whole point.


## #5
featured work section: the design is the classic table: four columns — website, category, services, year — with a massive “Featured Work” headline on top. i made the title do a little type trick: “Featured” is just an outline (transparent fill + text-stroke) and “Work” is solid, both bold and stretched to the full width of the screen. cheap to render, looks like i tried way harder than i did.

the fun part is the hover. when you mouse over a row, a preview image of that project fades in and follows your cursor around. i used gsap quickTo for the x/y so the image trails the mouse with this smooth lag instead of being glued to it, and i feed the horizontal mouse velocity into a slight rotation so the card tilts in the direction you’re moving. tiny detail, sells the whole thing. also learned the hard way that you need to snap the preview to the cursor BEFORE the first fade-in, otherwise it flies in from wherever it was last time. one gsap.set and the jank is gone.

the annoying part: this section doesn’t live on the page like a normal section. it sits inside the techstack pin from #4, behind that ink parabola that swallows the screen. so a regular scrolltrigger inside it just fires at the wrong time — the element is pinned at the top of the viewport the entire time, the trigger math is meaningless. took me a minute to accept that the reveal can’t belong to the section at all. it has to be part of the parent timeline. so right after the parabola covers everything, the same scrub that drove the logos now raises the title and cascades the rows in one by one.

projects in the table are mock data with placeholder svgs for now. the site has a featured work section and no actual featured work. next step is filling it with real projects.

