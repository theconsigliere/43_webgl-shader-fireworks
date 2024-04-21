uniform float uSize;
uniform vec2 uResolution;
uniform float uProgress;

attribute float aSize;
attribute float aTimeRandomizer;

#include ./../includes/remap.glsl

void main()
 {

    // for each particle we need to make it slighlty random so effect looks realistic we create this in index.js and pass it accross
    float randomProgress = uProgress * aTimeRandomizer;

    // create new position as we cant edit atribute position
    vec3 newPosition = position;

    // PHASE 1: Exploding
    // remap the progress froom 0.0 beginning to 10% percent in.1
    float explodingProgress = remap(randomProgress, 0.0, .1, 0.0, 1.0);
    // clamp the progress so it doesnt exceed 1
    explodingProgress = clamp(explodingProgress, 0.0, 1.0);
    // use pow to make the explosion more dramatic we need to make it negative to make it start super fast then slow down
    explodingProgress = 1.0 - pow(1.0 - explodingProgress, 3.0);
    // update new position
    newPosition *= explodingProgress;

    //PHASE 2: Falling
    // remap the progress from 10% to 100%
    float fallingProgress = remap(randomProgress, 0.1, 1.0, 0.0, 1.0);
    // Clamp so it doesnt exceed 1
    fallingProgress = clamp(fallingProgress, 0.0, 1.0);
    // we need to use pow to make the falling more dramatic
    fallingProgress = 1.0 - pow(1.0 - fallingProgress, 3.0);
    // move the particles on the y axis
    newPosition.y -= fallingProgress * 0.2;

     // PHASE 3: Scaling up then down
     // remap the progress from 0.0 to 12.5% (scalign up)
     float sizeOpeningProgress = remap(randomProgress, 0.0, 0.125, 0.0, 1.0);
     // remap the progress from 12.5% to 100% (scaling down)
     float sizeClosingProgress = remap(randomProgress, 0.125, 1.0, 1.0, 0.0);
     // Get the minimum of the two using min and save it as sizeProgress:
     float sizeProgress = min(sizeOpeningProgress, sizeClosingProgress);
     // clamp the sizeProgress so it doesnt exceed 1
     sizeProgress = clamp(sizeProgress, 0.0, 1.0);


     // PHASE 4: Twinkle
     // remap the progress from 20% to 80% to start twinkling
    float twinklingProgress = remap(randomProgress, 0.2, 0.8, 0.0, 1.0);
    // clamp the twinklingProgress so it doesnt exceed 1
    twinklingProgress = clamp(twinklingProgress, 0.0, 1.0);
    // tewinkle needs to go up and down so we need to use sin
    // sin goes from -1 to 1 so we need to remap it to 0 to 1
    // multiply by 30 to make it faster
    float sizeTwinkling = sin(randomProgress * 30.0) * 0.5 + 0.5;
    // multiply by the twinklingProgress to make it start and stop
    // invert the twinkling
    sizeTwinkling = 1.0 - sizeTwinkling * twinklingProgress;




    // Final position
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

   //final size
   gl_PointSize = uSize;

   // on vertical resize change the size of the points to keep persepctive
   float verticalPerspective = uSize * uResolution.y;
   // use attribute for random sizing of particles
   gl_PointSize = verticalPerspective * aSize * sizeProgress * sizeTwinkling;
   // Size Attenuation
   gl_PointSize *= 1.0 / - viewPosition.z;


   // windows bug
   if (gl_PointSize < 1.0)
        gl_Position = vec4(9999.9);
    
 }