uniform sampler2D uTexture;
uniform vec3 uColor;

void main()
 {

   //we don’t access the texture coordinates the same way when it comes to particles and we use gl_PointCoord 
   vec4 textureColor = texture(uTexture, gl_PointCoord);
   // just get the r value as we inly need the alpha value
   float textureAlpha = texture(uTexture, gl_PointCoord).r;


   // Final color
    gl_FragColor = vec4(uColor, textureAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }